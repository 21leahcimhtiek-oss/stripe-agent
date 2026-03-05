import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

function formatDate(unix: number | null) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(amount: number | null, currency: string) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border badge-${status}`}>
      {status}
    </span>
  );
}

export default function Subscriptions() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.stripeData.subscriptions.useQuery({ limit: 20 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Subscriptions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage recurring billing subscriptions</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a new subscription"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Create via AI
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            {isLoading ? "Loading..." : `${data?.data?.length ?? 0} subscriptions`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />)}
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No subscriptions found</p>
              <Button variant="outline" size="sm" className="mt-3"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a subscription for a customer"))}>
                Create a subscription
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">ID</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Customer</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Current Period</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map(sub => {
                    const item = sub.items.data[0];
                    const price = item?.price;
                    return (
                      <tr key={sub.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-3">
                          <code className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{sub.id.slice(0, 14)}…</code>
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={sub.status} />
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {typeof sub.customer === "string" ? sub.customer : (sub.customer as { email?: string; id?: string })?.email ?? (sub.customer as { id?: string })?.id ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {formatDate((sub as unknown as { current_period_start: number }).current_period_start)} – {formatDate((sub as unknown as { current_period_end: number }).current_period_end)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-sm font-medium text-foreground">
                            {price ? formatCurrency(price.unit_amount, price.currency) : "—"}
                            {price?.recurring && <span className="text-xs text-muted-foreground">/{price.recurring.interval}</span>}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                            onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Show details for subscription ${sub.id}`))}>
                            <MessageSquare className="h-3 w-3" /> Manage
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">AI Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {[
              "List all active subscriptions",
              "Cancel a subscription",
              "Pause a subscription",
              "List past due subscriptions",
            ].map(prompt => (
              <Button key={prompt} variant="outline" size="sm" className="text-xs bg-muted/30 border-border"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(prompt))}>
                {prompt}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
