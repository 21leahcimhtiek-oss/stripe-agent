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
});

export type AppRouter = typeof appRouter;
