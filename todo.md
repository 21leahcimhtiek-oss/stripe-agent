# Stripe Automation Agent - TODO

## Phase 1: Setup
- [x] DB schema: chat_sessions, chat_messages, webhook_events tables
- [x] Install stripe npm package
- [x] STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET auto-configured

## Phase 2: Backend
- [x] Stripe client singleton (server/stripe.ts)
- [x] Stripe tool functions: customers, products, prices, subscriptions, invoices, payments, refunds, balance, coupons
- [x] AI agent tRPC router with multi-step tool-calling loop (up to 8 iterations)
- [x] Dashboard metrics router (MRR, customers, subscriptions, balance, recent charges/invoices)
- [x] Webhook handler endpoint (POST /api/stripe/webhook) with signature verification
- [x] Chat session & message persistence (create, list, get, delete sessions)
- [x] Auto-title generation for new conversations via LLM

## Phase 3: Frontend
- [x] Global theme: dark professional financial design (index.css)
- [x] DashboardLayout with StripeAgent branding and sidebar navigation (Stripe + GitHub sections)
- [x] Dashboard home page with key metrics (MRR, customers, subscriptions, balance, recent activity)
- [x] Chat page with AI conversation interface, session sidebar, quick suggestions
- [x] Customers page with list/search/table view
- [x] Products & Pricing page with price grouping
- [x] Subscriptions page with status badges and period display
- [x] Invoices page with status, amount, due date
- [x] Payments & Refunds page with charge history
- [x] Webhook events log page with event type color coding
- [x] App.tsx routing with all pages

## Phase 4: Polish & Tests
- [x] Vitest tests for agent router (8 tests passing)
- [x] Error handling and loading states on all pages
- [x] Quick AI action buttons on all data pages
- [x] Status badges with color coding across all pages

## GitHub Integration
- [x] Push project to GitHub repository (21leahcimhtiek-oss/stripe-agent)
- [x] GitHub Octokit client singleton (server/github.ts)
- [x] 30 GitHub tool functions: repos, issues, PRs, branches, files, commits, releases, search, labels, stats
- [x] GitHub tools integrated into AI agent router (alongside Stripe tools)
- [x] AI system prompt updated to include GitHub capabilities
- [x] githubData tRPC router (repos, issues, PRs, currentUser)
- [x] GitHub Repos page with user card, filtering, and language colors
- [x] GitHub Issues page with repo selector and state filter
- [x] GitHub Pull Requests page with merge actions
- [x] GitHub section added to sidebar navigation
- [x] GitHub routes registered in App.tsx
- [x] 15 vitest tests for GitHub tools (23 total passing)

## Pending (User Actions Required)
- [ ] Claim Stripe sandbox at https://dashboard.stripe.com/claim_sandbox/...
- [ ] Configure webhook URL in Stripe Dashboard → Webhooks
- [ ] Add live Stripe keys after KYC verification (Settings → Payment)
