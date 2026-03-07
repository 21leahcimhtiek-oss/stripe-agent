import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addChatMessage,
  createChatSession,
  deleteChatSession,
  getChatMessages,
  getChatSession,
  getChatSessions,
  getWebhookEvents,
  updateChatSessionTitle,
} from "./db";
import stripe from "./stripe";
import { STRIPE_TOOLS, executeStripeTool } from "./stripeTools";
import { GITHUB_TOOLS, executeGitHubTool } from "./githubTools";
import { getOctokit } from "./github";

const ALL_TOOLS = [...STRIPE_TOOLS, ...GITHUB_TOOLS] as unknown as Parameters<typeof invokeLLM>[0]["tools"];

const SYSTEM_PROMPT = `You are StripeAgent, a powerful AI assistant that manages both Stripe payment infrastructure AND GitHub repositories through natural language.

## Stripe Capabilities
- Customer management: create, list, search, update, delete customers
- Product & pricing catalog: create products, set one-time or recurring prices
- Subscription lifecycle: create, cancel, pause, resume subscriptions
- Invoice operations: create, finalize, send, void invoices
- Payment tracking: list payment intents, charges, process refunds
- Account balance: check current balance
- Coupons & discounts: create and list coupons

## GitHub Capabilities
- Repository management: list, create, delete, fork, star repos
- Issue tracking: create, list, update, close issues; add comments
- Pull requests: list, create, review, merge PRs
- Branch management: list, create, delete branches
- File operations: read files, list directories, create/update files with commits
- Commit history: list commits, inspect specific commits with diffs
- Releases & tags: list and create releases
- Search: search repos, code, and issues across GitHub
- Statistics: contributors, language breakdown, participation stats
- Labels: list and create labels

## Guidelines
- Always confirm destructive actions (delete repo, cancel subscription, void invoice) before executing
- Present monetary amounts in human-readable format (e.g., $9.99 not 999)
- Format lists as clean tables or structured markdown
- If an operation fails, explain the error clearly and suggest alternatives
- For IDs and SHAs, always show them so users can reference them in follow-up commands
- Be proactive: after creating a resource, offer logical next steps
- When working with GitHub, infer the owner from context or ask if ambiguous
- Keep responses concise but complete`;

const agentRouter = router({
  chat: protectedProcedure
    .input(z.object({ sessionId: z.number(), message: z.string().min(1).max(4000) }))
    .mutation(async ({ ctx, input }) => {
      const session = await getChatSession(input.sessionId, ctx.user.id);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Chat session not found" });

      await addChatMessage(input.sessionId, "user", input.message);
      const history = await getChatMessages(input.sessionId);

      const messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string }> = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role as "user" | "assistant" | "tool", content: m.content })),
      ];

      let iterations = 0;
      const MAX_ITERATIONS = 8;
      let finalResponse = "";
      const toolCallLog: Array<{ name: string; result: unknown }> = [];

      while (iterations < MAX_ITERATIONS) {
        iterations++;
        const response = await invokeLLM({
          messages,
          tools: ALL_TOOLS,
          tool_choice: "auto",
        });

        const choice = response.choices?.[0];
        if (!choice) break;
        const msg = choice.message;

        if (!msg.tool_calls || msg.tool_calls.length === 0) {
          finalResponse = typeof msg.content === "string" ? msg.content : "";
          break;
        }

        messages.push({ role: "assistant", content: JSON.stringify({ tool_calls: msg.tool_calls }) });

        for (const toolCall of msg.tool_calls) {
          const toolName = toolCall.function.name;
          let toolArgs: Record<string, unknown> = {};
          try { toolArgs = JSON.parse(toolCall.function.arguments ?? "{}"); } catch { /* ignore */ }

          let toolResult: unknown;
          let toolResultStr: string;
          try {
            if (toolName.startsWith("github_")) {
              toolResult = await executeGitHubTool(toolName, toolArgs);
            } else {
              toolResult = await executeStripeTool(toolName, toolArgs);
            }
            toolResultStr = JSON.stringify(toolResult, null, 2);
            toolCallLog.push({ name: toolName, result: toolResult });
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            toolResult = { error: errMsg };
            toolResultStr = JSON.stringify({ error: errMsg });
          }

          messages.push({ role: "tool", content: toolResultStr });
          await addChatMessage(input.sessionId, "tool", toolResultStr, toolName, toolResult);
        }
      }

      if (finalResponse) {
        await addChatMessage(input.sessionId, "assistant", finalResponse);
      }

      if (session.title === "New Conversation" && history.length <= 1) {
        const titleResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Generate a very short title (3-6 words) for this conversation. Return only the title, no quotes." },
            { role: "user", content: input.message },
          ],
        });
        const rawTitle = titleResponse.choices?.[0]?.message?.content;
        const title = (typeof rawTitle === "string" ? rawTitle.trim() : "") || "Stripe Conversation";
        await updateChatSessionTitle(input.sessionId, title.slice(0, 60));
      }

      return { response: finalResponse, toolCalls: toolCallLog.map((t) => t.name) };
    }),
});

const chatRouter = router({
  getSessions: protectedProcedure.query(async ({ ctx }) => getChatSessions(ctx.user.id)),

  createSession: protectedProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await createChatSession(ctx.user.id, input.title);
      const sessions = await getChatSessions(ctx.user.id);
      return sessions[0]!;
    }),

  getMessages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const session = await getChatSession(input.sessionId, ctx.user.id);
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return getChatMessages(input.sessionId);
    }),

  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteChatSession(input.sessionId, ctx.user.id);
      return { success: true };
    }),
});

const dashboardRouter = router({
  metrics: protectedProcedure.query(async () => {
    const [customers, subscriptions, balance, recentCharges] = await Promise.allSettled([
      stripe.customers.list({ limit: 1 }),
      stripe.subscriptions.list({ limit: 100, status: "active" }),
      stripe.balance.retrieve(),
      stripe.charges.list({ limit: 5 }),
    ]);

    let mrr = 0;
    if (subscriptions.status === "fulfilled") {
      for (const sub of subscriptions.value.data) {
        for (const item of sub.items.data) {
          const price = item.price;
          if (price.unit_amount && price.recurring) {
            const amount = price.unit_amount / 100;
            if (price.recurring.interval === "month") mrr += amount;
            else if (price.recurring.interval === "year") mrr += amount / 12;
            else if (price.recurring.interval === "week") mrr += amount * (52 / 12);
            else if (price.recurring.interval === "day") mrr += amount * (365 / 12);
          }
        }
      }
    }

    return {
      totalCustomers: customers.status === "fulfilled" ? ((customers.value as unknown as { total_count?: number }).total_count ?? customers.value.data.length) : 0,
      activeSubscriptions: subscriptions.status === "fulfilled" ? subscriptions.value.data.length : 0,
      mrr: Math.round(mrr * 100) / 100,
      balance: balance.status === "fulfilled" ? balance.value.available.map((b) => ({ amount: b.amount / 100, currency: b.currency })) : [],
      recentCharges: recentCharges.status === "fulfilled"
        ? recentCharges.value.data.map((c) => ({
            id: c.id,
            amount: c.amount / 100,
            currency: c.currency,
            status: c.status,
            description: c.description,
            created: c.created,
            customerEmail: c.billing_details?.email ?? null,
          }))
        : [],
    };
  }),

  recentInvoices: protectedProcedure.query(async () => {
    const invoices = await stripe.invoices.list({ limit: 10 });
    return invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount: (inv.amount_due ?? 0) / 100,
      currency: inv.currency,
      customerEmail: inv.customer_email,
      created: inv.created,
      dueDate: inv.due_date,
    }));
  }),

  webhookEvents: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => getWebhookEvents(input.limit ?? 50)),
});

const stripeDataRouter = router({
  customers: protectedProcedure
    .input(z.object({ limit: z.number().optional(), email: z.string().optional(), starting_after: z.string().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.email) params.email = input.email;
      if (input.starting_after) params.starting_after = input.starting_after;
      const result = await stripe.customers.list(params as Parameters<typeof stripe.customers.list>[0]);
      return { data: result.data, has_more: result.has_more };
    }),

  products: protectedProcedure
    .input(z.object({ limit: z.number().optional(), active: z.boolean().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.active !== undefined) params.active = input.active;
      return stripe.products.list(params as Parameters<typeof stripe.products.list>[0]);
    }),

  prices: protectedProcedure
    .input(z.object({ limit: z.number().optional(), product: z.string().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.product) params.product = input.product;
      return stripe.prices.list(params as Parameters<typeof stripe.prices.list>[0]);
    }),

  subscriptions: protectedProcedure
    .input(z.object({ limit: z.number().optional(), status: z.string().optional(), customer: z.string().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.status) params.status = input.status;
      if (input.customer) params.customer = input.customer;
      return stripe.subscriptions.list(params as Parameters<typeof stripe.subscriptions.list>[0]);
    }),

  invoices: protectedProcedure
    .input(z.object({ limit: z.number().optional(), status: z.string().optional(), customer: z.string().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.status) params.status = input.status;
      if (input.customer) params.customer = input.customer;
      return stripe.invoices.list(params as Parameters<typeof stripe.invoices.list>[0]);
    }),

  payments: protectedProcedure
    .input(z.object({ limit: z.number().optional(), customer: z.string().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.customer) params.customer = input.customer;
      return stripe.charges.list(params as Parameters<typeof stripe.charges.list>[0]);
    }),

  disputes: protectedProcedure
    .input(z.object({ limit: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.status) params.status = input.status;
      return stripe.disputes.list(params as Parameters<typeof stripe.disputes.list>[0]);
    }),

  paymentLinks: protectedProcedure
    .input(z.object({ limit: z.number().optional(), active: z.boolean().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.active !== undefined) params.active = input.active;
      return stripe.paymentLinks.list(params as Parameters<typeof stripe.paymentLinks.list>[0]);
    }),

  checkoutSessions: protectedProcedure
    .input(z.object({ limit: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.status) params.status = input.status;
      return stripe.checkout.sessions.list(params as Parameters<typeof stripe.checkout.sessions.list>[0]);
    }),

  promotionCodes: protectedProcedure
    .input(z.object({ limit: z.number().optional(), active: z.boolean().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.active !== undefined) params.active = input.active;
      return stripe.promotionCodes.list(params as Parameters<typeof stripe.promotionCodes.list>[0]);
    }),

  coupons: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => stripe.coupons.list({ limit: input.limit ?? 20 })),

  transfers: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => stripe.transfers.list({ limit: input.limit ?? 20 })),

  payouts: protectedProcedure
    .input(z.object({ limit: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.status) params.status = input.status;
      return stripe.payouts.list(params as Parameters<typeof stripe.payouts.list>[0]);
    }),

  taxRates: protectedProcedure
    .input(z.object({ limit: z.number().optional(), active: z.boolean().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.active !== undefined) params.active = input.active;
      return stripe.taxRates.list(params as Parameters<typeof stripe.taxRates.list>[0]);
    }),

  setupIntents: protectedProcedure
    .input(z.object({ limit: z.number().optional(), customer: z.string().optional() }))
    .query(async ({ input }) => {
      const params: Record<string, unknown> = { limit: input.limit ?? 20 };
      if (input.customer) params.customer = input.customer;
      return stripe.setupIntents.list(params as Parameters<typeof stripe.setupIntents.list>[0]);
    }),

  webhookEndpoints: protectedProcedure.query(async () =>
    stripe.webhookEndpoints.list({ limit: 20 })
  ),
});

// ─── MRR Chart Router ─────────────────────────────────────────────────────────
const chartRouter = router({
  mrrHistory: protectedProcedure.query(async () => {
    // Fetch paid invoices from the last 12 months
    const twelveMonthsAgo = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365;
    const invoices = await stripe.invoices.list({
      limit: 100,
      status: "paid",
      created: { gte: twelveMonthsAgo },
    });

    // Group by month
    const monthMap: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = 0;
    }

    for (const inv of invoices.data) {
      const d = new Date(inv.created * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthMap) {
        monthMap[key] += (inv.amount_paid ?? 0) / 100;
      }
    }

    return Object.entries(monthMap).map(([month, revenue]) => {
      const [year, m] = month.split("-");
      const label = new Date(Number(year), Number(m) - 1).toLocaleString("default", { month: "short", year: "2-digit" });
      return { month, label, revenue: Math.round(revenue * 100) / 100 };
    });
  }),
});

const githubDataRouter = router({
  repos: protectedProcedure
    .input(z.object({ owner: z.string().optional(), type: z.string().optional(), per_page: z.number().optional() }))
    .query(async ({ input }) => {
      const octokit = getOctokit();
      if (input.owner) {
        const res = await octokit.rest.repos.listForUser({ username: input.owner, type: (input.type as "all" | "owner" | "member") || "all", per_page: input.per_page || 30 });
        return res.data.map(r => ({ id: r.id, name: r.name, full_name: r.full_name, description: r.description, private: r.private, language: r.language, stars: r.stargazers_count, forks: r.forks_count, updated_at: r.updated_at, html_url: r.html_url, open_issues_count: r.open_issues_count }));
      }
      const res = await octokit.rest.repos.listForAuthenticatedUser({ type: (input.type as "all" | "owner" | "public" | "private" | "member") || "all", per_page: input.per_page || 30, sort: "updated" });
      return res.data.map(r => ({ id: r.id, name: r.name, full_name: r.full_name, description: r.description, private: r.private, language: r.language, stars: r.stargazers_count, forks: r.forks_count, updated_at: r.updated_at, html_url: r.html_url, open_issues_count: r.open_issues_count }));
    }),

  issues: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string(), state: z.string().optional(), per_page: z.number().optional() }))
    .query(async ({ input }) => {
      const octokit = getOctokit();
      const res = await octokit.rest.issues.listForRepo({ owner: input.owner, repo: input.repo, state: (input.state as "open" | "closed" | "all") || "open", per_page: input.per_page || 20 });
      return res.data.filter(i => !i.pull_request).map(i => ({ number: i.number, title: i.title, state: i.state, labels: i.labels.map((l: unknown) => (typeof l === "string" ? l : (l as { name?: string }).name)), created_at: i.created_at, updated_at: i.updated_at, html_url: i.html_url, comments: i.comments, user: i.user?.login }));
    }),

  prs: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string(), state: z.string().optional(), per_page: z.number().optional() }))
    .query(async ({ input }) => {
      const octokit = getOctokit();
      const res = await octokit.rest.pulls.list({ owner: input.owner, repo: input.repo, state: (input.state as "open" | "closed" | "all") || "open", per_page: input.per_page || 20 });
      return res.data.map(p => ({ number: p.number, title: p.title, state: p.state, draft: p.draft, head: p.head.ref, base: p.base.ref, user: p.user?.login, created_at: p.created_at, updated_at: p.updated_at, html_url: p.html_url }));
    }),

  currentUser: protectedProcedure.query(async () => {
    const octokit = getOctokit();
    const res = await octokit.rest.users.getAuthenticated();
    return { login: res.data.login, name: res.data.name, avatar_url: res.data.avatar_url, public_repos: res.data.public_repos, followers: res.data.followers, html_url: res.data.html_url };
  }),

  getFile: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string(), path: z.string(), ref: z.string().optional() }))
    .query(async ({ input }) => {
      const octokit = getOctokit();
      const res = await octokit.rest.repos.getContent({ owner: input.owner, repo: input.repo, path: input.path, ref: input.ref });
      const data = res.data as { type: string; content?: string; sha: string; encoding?: string; size: number; name: string };
      if (data.type !== "file") throw new Error("Path is not a file");
      return { content: data.content ?? "", sha: data.sha, encoding: data.encoding ?? "base64", size: data.size, name: data.name };
    }),

  updateFile: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string(), path: z.string(), content: z.string(), message: z.string(), sha: z.string(), branch: z.string().optional() }))
    .mutation(async ({ input }) => {
      const octokit = getOctokit();
      const res = await octokit.rest.repos.createOrUpdateFileContents({
        owner: input.owner, repo: input.repo, path: input.path,
        message: input.message, content: input.content, sha: input.sha,
        branch: input.branch,
      });
      return { commit: { sha: res.data.commit.sha, message: res.data.commit.message, html_url: res.data.commit.html_url } };
    }),

  listDir: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string(), path: z.string().optional(), ref: z.string().optional() }))
    .query(async ({ input }) => {
      const octokit = getOctokit();
      const res = await octokit.rest.repos.getContent({ owner: input.owner, repo: input.repo, path: input.path ?? "", ref: input.ref });
      const data = res.data;
      if (!Array.isArray(data)) throw new Error("Path is not a directory");
      return data.map((item: { type: string; name: string; path: string; size: number; sha: string }) => ({ type: item.type, name: item.name, path: item.path, size: item.size, sha: item.sha }));
    }),

  commits: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string(), branch: z.string().optional(), per_page: z.number().optional(), page: z.number().optional() }))
    .query(async ({ input }) => {
      const octokit = getOctokit();
      const res = await octokit.rest.repos.listCommits({
        owner: input.owner,
        repo: input.repo,
        sha: input.branch,
        per_page: input.per_page ?? 30,
        page: input.page ?? 1,
      });
      return res.data.map(c => ({
        sha: c.sha,
        short_sha: c.sha.slice(0, 7),
        message: c.commit.message,
        author: c.commit.author?.name ?? c.author?.login ?? "Unknown",
        author_login: c.author?.login ?? null,
        author_avatar: c.author?.avatar_url ?? null,
        date: c.commit.author?.date ?? null,
        html_url: c.html_url,
        additions: (c.stats as { additions?: number } | undefined)?.additions ?? null,
        deletions: (c.stats as { deletions?: number } | undefined)?.deletions ?? null,
      }));
    }),

  branches: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string() }))
    .query(async ({ input }) => {
      const octokit = getOctokit();
      const res = await octokit.rest.repos.listBranches({ owner: input.owner, repo: input.repo, per_page: 50 });
      return res.data.map(b => ({ name: b.name, sha: b.commit.sha, protected: b.protected }));
    }),

  // Workflow execution: run a cross-platform automation template
  runWorkflow: protectedProcedure
    .input(z.object({ templateId: z.string(), params: z.record(z.string(), z.unknown()).optional() }))
    .mutation(async ({ input }) => {
      // Templates are executed by the AI agent; this records the intent
      return { templateId: input.templateId, params: input.params ?? {}, status: "queued", message: "Workflow dispatched to AI agent" };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  agent: agentRouter,
  chat: chatRouter,
  dashboard: dashboardRouter,
  stripeData: stripeDataRouter,
  githubData: githubDataRouter,
  charts: chartRouter,
});

export type AppRouter = typeof appRouter;
