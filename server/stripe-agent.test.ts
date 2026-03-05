import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock Stripe
vi.mock("./stripe", () => ({
  default: {
    customers: {
      list: vi.fn().mockResolvedValue({ data: [{ id: "cus_test", email: "test@example.com", name: "Test User", created: 1700000000, phone: null }], has_more: false }),
    },
    subscriptions: {
      list: vi.fn().mockResolvedValue({ data: [], has_more: false }),
    },
    balance: {
      retrieve: vi.fn().mockResolvedValue({ available: [{ amount: 10000, currency: "usd" }] }),
    },
    charges: {
      list: vi.fn().mockResolvedValue({ data: [], has_more: false }),
    },
    invoices: {
      list: vi.fn().mockResolvedValue({ data: [], has_more: false }),
    },
    products: {
      list: vi.fn().mockResolvedValue({ data: [], has_more: false }),
    },
    prices: {
      list: vi.fn().mockResolvedValue({ data: [], has_more: false }),
    },
  },
}));

// Mock DB helpers
vi.mock("./db", () => ({
  getChatSessions: vi.fn().mockResolvedValue([]),
  createChatSession: vi.fn().mockResolvedValue(undefined),
  getChatSession: vi.fn().mockResolvedValue({ id: 1, userId: 1, title: "Test Session" }),
  getChatMessages: vi.fn().mockResolvedValue([]),
  addChatMessage: vi.fn().mockResolvedValue(undefined),
  updateChatSessionTitle: vi.fn().mockResolvedValue(undefined),
  deleteChatSession: vi.fn().mockResolvedValue(undefined),
  getWebhookEvents: vi.fn().mockResolvedValue([]),
  saveWebhookEvent: vi.fn().mockResolvedValue(undefined),
  markWebhookProcessed: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Hello! I can help you manage your Stripe account.", tool_calls: null } }],
  }),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns the current user when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeDefined();
    expect(user?.email).toBe("test@example.com");
  });

  it("returns null when not authenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

describe("chat.getSessions", () => {
  it("returns empty sessions for a new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const sessions = await caller.chat.getSessions();
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBe(0);
  });
});

describe("dashboard.metrics", () => {
  it("returns metrics with balance and customer count", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const metrics = await caller.dashboard.metrics();
    expect(metrics).toBeDefined();
    expect(typeof metrics.mrr).toBe("number");
    expect(typeof metrics.activeSubscriptions).toBe("number");
    expect(Array.isArray(metrics.balance)).toBe(true);
    expect(metrics.balance[0]?.currency).toBe("usd");
    expect(metrics.balance[0]?.amount).toBe(100); // 10000 cents = $100
  });
});

describe("stripeData.customers", () => {
  it("returns customer list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stripeData.customers({ limit: 20 });
    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(1);
    expect(result.data[0]?.email).toBe("test@example.com");
  });
});

describe("dashboard.webhookEvents", () => {
  it("returns empty webhook events list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const events = await caller.dashboard.webhookEvents({ limit: 10 });
    expect(Array.isArray(events)).toBe(true);
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
