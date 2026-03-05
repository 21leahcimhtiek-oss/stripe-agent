import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

function formatDate(unix: number | null) {
  if (!unix) return "—";
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

export default function Invoices() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.stripeData.invoices.useQuery({ limit: 20 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track customer invoices</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a new invoice"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Create via AI
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {isLoading ? "Loading..." : `${data?.data?.length ?? 0} invoices`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No invoices found</p>
              <Button variant="outline" size="sm" className="mt-3"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create an invoice for a customer"))}>
                Create an invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoice</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Customer</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Due Date</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map(inv => (
                    <tr key={inv.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{inv.number ?? "Draft"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(inv.created)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={inv.status ?? "draft"} />
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{inv.customer_email ?? "—"}</span>
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">{formatDate(inv.due_date)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(inv.amount_due ?? 0, inv.currency)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                          onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Show details for invoice ${inv.id}`))}>
                          <MessageSquare className="h-3 w-3" /> Manage
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
              "List all open invoices",
              "Finalize a draft invoice",
              "Send an invoice to a customer",
              "Void an invoice",
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
