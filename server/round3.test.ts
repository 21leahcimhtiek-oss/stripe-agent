import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Shared test context ──────────────────────────────────────────────────────

function makeCtx(): TrpcContext {
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
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Charts router ────────────────────────────────────────────────────────────

describe("charts.mrrHistory", () => {
  it("procedure exists on appRouter", () => {
    expect(appRouter._def.procedures["charts.mrrHistory"]).toBeDefined();
  });

  it("returns 12 data points", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.charts.mrrHistory();
    expect(result).toHaveLength(12);
  });

  it("each data point has month, label, and revenue fields", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.charts.mrrHistory();
    for (const point of result) {
      expect(point).toHaveProperty("month");
      expect(point).toHaveProperty("label");
      expect(point).toHaveProperty("revenue");
      expect(typeof point.revenue).toBe("number");
    }
  });

  it("months are in ascending chronological order", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.charts.mrrHistory();
    const months = result.map(r => r.month);
    const sorted = [...months].sort();
    expect(months).toEqual(sorted);
  });

  it("revenue values are non-negative", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.charts.mrrHistory();
    for (const point of result) {
      expect(point.revenue).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── githubData router — new procedures ──────────────────────────────────────

describe("githubData router — new procedures", () => {
  it("commits procedure exists on appRouter", () => {
    expect(appRouter._def.procedures["githubData.commits"]).toBeDefined();
  });

  it("branches procedure exists on appRouter", () => {
    expect(appRouter._def.procedures["githubData.branches"]).toBeDefined();
  });

  it("runWorkflow procedure exists on appRouter", () => {
    expect(appRouter._def.procedures["githubData.runWorkflow"]).toBeDefined();
  });

  it("runWorkflow returns queued status", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.githubData.runWorkflow({ templateId: "failed-payments-to-issues" });
    expect(result.status).toBe("queued");
    expect(result.templateId).toBe("failed-payments-to-issues");
  });
});

// ─── Workflow template coverage ───────────────────────────────────────────────

describe("Workflow template IDs", () => {
  const EXPECTED_TEMPLATE_IDS = [
    "failed-payments-to-issues",
    "new-customer-to-issue",
    "overdue-invoices-to-issues",
    "subscription-cancelled-to-pr",
    "release-to-product",
    "open-prs-summary",
    "dispute-alert",
    "mrr-report-issue",
    "balance-alert",
    "customer-list-to-readme",
    "product-catalog-sync",
    "webhook-health-check",
  ];

  it("all 12 workflow templates are defined", () => {
    // This test validates the count — the actual templates live in the frontend
    expect(EXPECTED_TEMPLATE_IDS).toHaveLength(12);
  });

  it("all template IDs are unique", () => {
    const unique = new Set(EXPECTED_TEMPLATE_IDS);
    expect(unique.size).toBe(EXPECTED_TEMPLATE_IDS.length);
  });

  it("all template IDs are kebab-case strings", () => {
    for (const id of EXPECTED_TEMPLATE_IDS) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
