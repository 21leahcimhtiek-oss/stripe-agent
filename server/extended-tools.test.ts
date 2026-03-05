import { describe, expect, it } from "vitest";

// ─── Stripe extended tools ────────────────────────────────────────────────────

describe("Stripe extended tool definitions", () => {
  it("dispute tool definitions are present", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const names = STRIPE_TOOLS.map((t) => t.function.name);
    expect(names).toContain("list_disputes");
    expect(names).toContain("get_dispute");
    expect(names).toContain("update_dispute");
  });

  it("payment link tool definitions are present", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const names = STRIPE_TOOLS.map((t) => t.function.name);
    expect(names).toContain("create_payment_link");
    expect(names).toContain("list_payment_links");
    expect(names).toContain("update_payment_link");
  });

  it("checkout session tool definitions are present", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const names = STRIPE_TOOLS.map((t) => t.function.name);
    expect(names).toContain("create_checkout_session");
    expect(names).toContain("list_checkout_sessions");
    expect(names).toContain("expire_checkout_session");
  });

  it("promotion code tool definitions are present", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const names = STRIPE_TOOLS.map((t) => t.function.name);
    expect(names).toContain("create_promotion_code");
    expect(names).toContain("list_promotion_codes");
  });

  it("transfer and payout tool definitions are present", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const names = STRIPE_TOOLS.map((t) => t.function.name);
    expect(names).toContain("create_transfer");
    expect(names).toContain("list_transfers");
    expect(names).toContain("list_payouts");
  });

  it("tax rate tool definitions are present", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const names = STRIPE_TOOLS.map((t) => t.function.name);
    expect(names).toContain("create_tax_rate");
    expect(names).toContain("list_tax_rates");
  });

  it("setup intent tool definitions are present", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const names = STRIPE_TOOLS.map((t) => t.function.name);
    expect(names).toContain("create_setup_intent");
    expect(names).toContain("list_setup_intents");
  });

  it("credit note tool definitions are present", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const names = STRIPE_TOOLS.map((t) => t.function.name);
    expect(names).toContain("create_credit_note");
    expect(names).toContain("list_credit_notes");
  });

  it("stripe search tool definition is present", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const names = STRIPE_TOOLS.map((t) => t.function.name);
    expect(names).toContain("search_stripe");
  });

  it("webhook endpoint tool definitions are present", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const names = STRIPE_TOOLS.map((t) => t.function.name);
    expect(names).toContain("create_webhook_endpoint");
    expect(names).toContain("list_webhook_endpoints");
    expect(names).toContain("delete_webhook_endpoint");
  });

  it("billing portal tool definition is present", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const names = STRIPE_TOOLS.map((t) => t.function.name);
    expect(names).toContain("create_billing_portal_session");
  });
});

// ─── GitHub file operations ───────────────────────────────────────────────────

describe("GitHub tool definitions — file operations", () => {
  it("file read/write tool definitions are present", async () => {
    const { GITHUB_TOOLS } = await import("./githubTools");
    const names = GITHUB_TOOLS.map((t) => t.function.name);
    expect(names).toContain("github_get_file");
    expect(names).toContain("github_create_or_update_file");
  });

  it("directory listing tool definition is present", async () => {
    const { GITHUB_TOOLS } = await import("./githubTools");
    const names = GITHUB_TOOLS.map((t) => t.function.name);
    expect(names).toContain("github_list_directory");
  });

  it("repo management tool definitions are present", async () => {
    const { GITHUB_TOOLS } = await import("./githubTools");
    const names = GITHUB_TOOLS.map((t) => t.function.name);
    expect(names).toContain("github_create_repo");
    expect(names).toContain("github_delete_repo");
    expect(names).toContain("github_fork_repo");
  });

  it("branch management tool definitions are present", async () => {
    const { GITHUB_TOOLS } = await import("./githubTools");
    const names = GITHUB_TOOLS.map((t) => t.function.name);
    expect(names).toContain("github_create_branch");
    expect(names).toContain("github_list_branches");
    expect(names).toContain("github_delete_branch");
  });

  it("release management tool definitions are present", async () => {
    const { GITHUB_TOOLS } = await import("./githubTools");
    const names = GITHUB_TOOLS.map((t) => t.function.name);
    expect(names).toContain("github_create_release");
    expect(names).toContain("github_list_releases");
  });

  it("search tool definitions are present", async () => {
    const { GITHUB_TOOLS } = await import("./githubTools");
    const names = GITHUB_TOOLS.map((t) => t.function.name);
    expect(names).toContain("github_search_repos");
    expect(names).toContain("github_search_code");
  });
});

// ─── Tool count sanity check ──────────────────────────────────────────────────

describe("Total tool count", () => {
  it("has at least 40 Stripe tools", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    expect(STRIPE_TOOLS.length).toBeGreaterThanOrEqual(40);
  });

  it("has at least 25 GitHub tools", async () => {
    const { GITHUB_TOOLS } = await import("./githubTools");
    expect(GITHUB_TOOLS.length).toBeGreaterThanOrEqual(25);
  });

  it("combined tool set has no duplicate names", async () => {
    const { STRIPE_TOOLS } = await import("./stripeTools");
    const { GITHUB_TOOLS } = await import("./githubTools");
    const allNames = [...STRIPE_TOOLS, ...GITHUB_TOOLS].map((t) => t.function.name);
    const unique = new Set(allNames);
    expect(unique.size).toBe(allNames.length);
  });
});
