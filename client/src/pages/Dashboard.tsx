import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, DollarSign, TrendingUp, CreditCard, FileText, MessageSquare, ArrowRight, Zap } from "lucide-react";
import { useLocation } from "wouter";

function formatCurrency(amount: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount);
}

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border badge-${status}`}>
      {status}
    </span>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: metrics, isLoading: metricsLoading } = trpc.dashboard.metrics.useQuery();
  const { data: invoices, isLoading: invoicesLoading } = trpc.dashboard.recentInvoices.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your Stripe account overview</p>
        </div>
        <Button onClick={() => setLocation("/chat")} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Open AI Agent
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Customers</p>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {metricsLoading ? "—" : (metrics?.totalCustomers ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Subscriptions</p>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {metricsLoading ? "—" : (metrics?.activeSubscriptions ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Monthly Recurring Revenue</p>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {metricsLoading ? "—" : formatCurrency(metrics?.mrr ?? 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Available Balance</p>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {metricsLoading ? "—" : metrics?.balance?.length
                    ? metrics.balance.map(b => formatCurrency(b.amount, b.currency)).join(" · ")
                    : "$0.00"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Agent CTA */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">AI-Powered Stripe Management</p>
                <p className="text-sm text-muted-foreground">Use natural language to manage customers, subscriptions, invoices, and more</p>
              </div>
            </div>
            <Button onClick={() => setLocation("/chat")} variant="default" className="gap-2 shrink-0">
              Start Chatting <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Charges */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Recent Payments
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/payments")} className="text-xs text-muted-foreground h-7">
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {metricsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />)}
              </div>
            ) : metrics?.recentCharges?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent payments</p>
            ) : (
              <div className="space-y-2">
                {metrics?.recentCharges?.map(charge => (
                  <div key={charge.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{charge.customerEmail ?? charge.description ?? charge.id}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(charge.created)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <StatusBadge status={charge.status} />
                      <span className="text-sm font-medium text-foreground">{formatCurrency(charge.amount, charge.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Recent Invoices
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/invoices")} className="text-xs text-muted-foreground h-7">
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {invoicesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />)}
              </div>
            ) : invoices?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No invoices yet</p>
            ) : (
              <div className="space-y-2">
                {invoices?.slice(0, 5).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.customerEmail ?? inv.number ?? inv.id}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.created)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <StatusBadge status={inv.status ?? "draft"} />
                      <span className="text-sm font-medium text-foreground">{formatCurrency(inv.amount, inv.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">Quick Actions via AI</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Create a customer", prompt: "Create a new customer" },
              { label: "List subscriptions", prompt: "List all active subscriptions" },
              { label: "Check balance", prompt: "What is my current Stripe balance?" },
              { label: "Recent invoices", prompt: "Show me the 5 most recent invoices" },
            ].map(action => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="h-auto py-2 px-3 text-xs text-left justify-start bg-muted/30 border-border hover:bg-muted/60"
                onClick={() => setLocation(`/chat?prompt=${encodeURIComponent(action.prompt)}`)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
