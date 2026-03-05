import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border badge-${status}`}>
      {status}
    </span>
  );
}

export default function Payments() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.stripeData.payments.useQuery({ limit: 20 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">Track charges and process refunds</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Show recent payment intents"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Ask AI Agent
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            {isLoading ? "Loading..." : `${data?.data?.length ?? 0} charges`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Charge ID</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Customer</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Description</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map(charge => (
                    <tr key={charge.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3">
                        <code className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{charge.id.slice(0, 14)}…</code>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={charge.status} />
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{charge.billing_details?.email ?? "—"}</span>
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{charge.description ?? "—"}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-muted-foreground">{formatDate(charge.created)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div>
                          <span className="text-sm font-medium text-foreground">{formatCurrency(charge.amount, charge.currency)}</span>
                          {charge.amount_refunded > 0 && (
                            <p className="text-xs text-orange-400">-{formatCurrency(charge.amount_refunded, charge.currency)} refunded</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                          onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Process a refund for charge ${charge.id}`))}>
                          <MessageSquare className="h-3 w-3" /> Refund
                        </Button>
                      </td>
                    </tr>
                  ))}
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
              "List recent payment intents",
              "Process a refund",
              "Show failed payments",
              "List all charges this month",
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
