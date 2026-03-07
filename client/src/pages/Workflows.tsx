import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Workflow, Zap, CreditCard, Github, AlertCircle, RefreshCw,
  FileText, ArrowRight, Play, Search, Tag, ShieldAlert,
  Users, GitPullRequest, DollarSign, Bell, CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type WorkflowTemplate = {
  id: string;
  title: string;
  description: string;
  category: "billing" | "devops" | "alerts" | "sync";
  tags: string[];
  icons: React.ElementType[];
  prompt: string;
  complexity: "simple" | "moderate" | "advanced";
};

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // Billing → GitHub
  {
    id: "failed-payments-to-issues",
    title: "Failed Payments → GitHub Issues",
    description: "Create a GitHub issue for every failed Stripe payment in the last 7 days, tagged with customer email and amount.",
    category: "billing",
    tags: ["Stripe", "GitHub", "Payments"],
    icons: [CreditCard, ArrowRight, Github],
    prompt: "Create a GitHub issue for every failed Stripe payment intent in the last 7 days. Include the customer email, amount, and failure reason in each issue body. Tag them with label 'payment-failure'.",
    complexity: "moderate",
  },
  {
    id: "new-customer-to-issue",
    title: "New Customer → Welcome Issue",
    description: "When a new Stripe customer is created, open a GitHub onboarding issue to track their setup.",
    category: "billing",
    tags: ["Stripe", "GitHub", "Customers"],
    icons: [Users, ArrowRight, Github],
    prompt: "List the 5 most recently created Stripe customers, then create a GitHub issue for each one titled 'Onboarding: [customer name]' with their email and customer ID in the body.",
    complexity: "moderate",
  },
  {
    id: "overdue-invoices-to-issues",
    title: "Overdue Invoices → GitHub Issues",
    description: "Find all overdue Stripe invoices and create tracking issues in GitHub.",
    category: "billing",
    tags: ["Stripe", "GitHub", "Invoices"],
    icons: [FileText, ArrowRight, Github],
    prompt: "Find all open Stripe invoices that are past their due date. For each one, create a GitHub issue titled 'Overdue Invoice: [invoice number]' with the customer email, amount due, and due date.",
    complexity: "moderate",
  },
  {
    id: "subscription-cancelled-to-pr",
    title: "Cancelled Subscription → Offboarding PR",
    description: "When a subscription is cancelled, open a GitHub PR to remove the customer's access configuration.",
    category: "billing",
    tags: ["Stripe", "GitHub", "Subscriptions"],
    icons: [RefreshCw, ArrowRight, GitPullRequest],
    prompt: "List all Stripe subscriptions cancelled in the last 30 days. For each one, create a GitHub issue titled 'Offboarding: [customer ID]' describing the cancellation date and plan.",
    complexity: "advanced",
  },
  // GitHub → Stripe
  {
    id: "release-to-product",
    title: "GitHub Release → Stripe Product",
    description: "Create a new Stripe product and price whenever a GitHub release is published.",
    category: "devops",
    tags: ["GitHub", "Stripe", "Releases"],
    icons: [Github, ArrowRight, Tag],
    prompt: "List the latest GitHub releases for a repo I specify, then create a corresponding Stripe product for the latest release with a one-time price of $9.99.",
    complexity: "advanced",
  },
  {
    id: "open-prs-summary",
    title: "Open PRs → Stripe Coupon Campaign",
    description: "Count open PRs and generate a Stripe coupon code to reward contributors.",
    category: "devops",
    tags: ["GitHub", "Stripe", "Coupons"],
    icons: [GitPullRequest, ArrowRight, CreditCard],
    prompt: "Count the open pull requests in my repos, then create a Stripe coupon code 'CONTRIBUTOR10' for 10% off to reward active contributors.",
    complexity: "moderate",
  },
  // Alerts & Monitoring
  {
    id: "dispute-alert",
    title: "Stripe Dispute Alert",
    description: "List all open disputes and create a GitHub issue summary for the team.",
    category: "alerts",
    tags: ["Stripe", "GitHub", "Disputes"],
    icons: [ShieldAlert, ArrowRight, Github],
    prompt: "List all open Stripe disputes. Create a single GitHub issue titled 'Dispute Report — [today's date]' with a table of dispute IDs, amounts, reasons, and statuses.",
    complexity: "simple",
  },
  {
    id: "mrr-report-issue",
    title: "Monthly MRR Report → GitHub Issue",
    description: "Generate a monthly revenue summary and post it as a GitHub issue for the team.",
    category: "alerts",
    tags: ["Stripe", "GitHub", "Revenue"],
    icons: [DollarSign, ArrowRight, Github],
    prompt: "Calculate the total revenue from paid Stripe invoices this month. Then create a GitHub issue titled 'Monthly Revenue Report — [month/year]' with the total, number of invoices, and top 3 customers by spend.",
    complexity: "moderate",
  },
  {
    id: "balance-alert",
    title: "Low Balance Alert",
    description: "Check Stripe balance and create a GitHub issue if it drops below a threshold.",
    category: "alerts",
    tags: ["Stripe", "GitHub", "Balance"],
    icons: [Bell, ArrowRight, AlertCircle],
    prompt: "Check my Stripe available balance. If it is below $1000, create a GitHub issue titled 'Low Balance Alert' with the current balance and a recommendation to review payouts.",
    complexity: "simple",
  },
  // Data Sync
  {
    id: "customer-list-to-readme",
    title: "Top Customers → README Update",
    description: "Update a GitHub README with your top Stripe customers (anonymized).",
    category: "sync",
    tags: ["Stripe", "GitHub", "Customers"],
    icons: [Users, ArrowRight, Github],
    prompt: "List the top 5 Stripe customers by total spend. Then show me the content I should add to a GitHub README to showcase customer stats (anonymized — use customer IDs, not names).",
    complexity: "moderate",
  },
  {
    id: "product-catalog-sync",
    title: "Stripe Products → GitHub Wiki",
    description: "Export your Stripe product catalog as a markdown table for a GitHub wiki page.",
    category: "sync",
    tags: ["Stripe", "GitHub", "Products"],
    icons: [Tag, ArrowRight, Github],
    prompt: "List all active Stripe products with their prices. Format the output as a markdown table with columns: Product Name, Price, Billing Interval, Product ID. This can be pasted into a GitHub wiki.",
    complexity: "simple",
  },
  {
    id: "webhook-health-check",
    title: "Webhook Health Check",
    description: "Verify all Stripe webhook endpoints are active and create a GitHub issue if any are disabled.",
    category: "alerts",
    tags: ["Stripe", "GitHub", "Webhooks"],
    icons: [CheckCircle2, ArrowRight, Github],
    prompt: "List all Stripe webhook endpoints and check their status. If any are disabled or have recent failures, create a GitHub issue titled 'Webhook Health Alert' with details.",
    complexity: "simple",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Workflows" },
  { id: "billing", label: "Billing" },
  { id: "devops", label: "DevOps" },
  { id: "alerts", label: "Alerts" },
  { id: "sync", label: "Data Sync" },
];

const COMPLEXITY_COLORS: Record<string, string> = {
  simple: "text-green-400 border-green-400/30 bg-green-400/10",
  moderate: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  advanced: "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

export default function Workflows() {
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = WORKFLOW_TEMPLATES.filter(w => {
    const matchCat = category === "all" || w.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q) || w.tags.some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  function runWorkflow(template: WorkflowTemplate) {
    setLocation(`/chat?prompt=${encodeURIComponent(template.prompt)}`);
  }

  function copyPrompt(template: WorkflowTemplate) {
    navigator.clipboard.writeText(template.prompt);
    toast.success("Prompt copied to clipboard");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Workflows</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pre-built cross-platform automations linking Stripe and GitHub through the AI agent
          </p>
        </div>
        <Button
          onClick={() => setLocation("/chat")}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Custom Workflow
        </Button>
      </div>

      {/* How it works */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Workflow className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">How Workflows Work</p>
              <p className="text-sm text-muted-foreground mt-1">
                Each workflow is a pre-crafted AI prompt that chains Stripe and GitHub operations together.
                Click <strong className="text-foreground">Run</strong> to open it in the AI Agent chat, where the agent will
                execute each step automatically using its 60+ built-in tools.
                You can also customize the prompt before running.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              variant={category === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat.id)}
              className={category !== cat.id ? "bg-card border-border" : ""}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{filtered.length} workflow{filtered.length !== 1 ? "s" : ""}</span>
        {search && <span>matching "{search}"</span>}
      </div>

      {/* Workflow Grid */}
      {filtered.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Workflow className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No workflows match your search</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSearch(""); setCategory("all"); }}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(template => (
            <Card
              key={template.id}
              className="bg-card border-border hover:border-border/80 transition-colors flex flex-col"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  {/* Icon chain */}
                  <div className="flex items-center gap-1 shrink-0">
                    {template.icons.map((Icon, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <div className="h-7 w-7 rounded bg-muted/50 flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        {i < template.icons.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                        )}
                      </span>
                    ))}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 shrink-0 ${COMPLEXITY_COLORS[template.complexity]}`}
                  >
                    {template.complexity}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-medium text-foreground leading-snug mt-2">
                  {template.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-0 flex flex-col flex-1">
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {template.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => runWorkflow(template)}
                  >
                    <Play className="h-3 w-3" />
                    Run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs bg-transparent border-border"
                    onClick={() => copyPrompt(template)}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Custom workflow CTA */}
      <Card className="bg-card border-border border-dashed">
        <CardContent className="py-8 text-center">
          <Zap className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Build a custom workflow</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Describe any cross-platform automation in plain English and the AI agent will execute it using all 60+ Stripe and GitHub tools.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
            onClick={() => setLocation("/chat")}
          >
            <MessageSquare className="h-4 w-4" />
            Open AI Agent
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MessageSquare({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
