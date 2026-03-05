import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, MessageSquare, ArrowDownToLine, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}
function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PAYOUT_STATUS: Record<string, string> = {
  paid: "text-green-400 border-green-500/30",
  pending: "text-yellow-400 border-yellow-500/30",
  in_transit: "text-blue-400 border-blue-500/30",
  canceled: "text-muted-foreground border-border",
  failed: "text-red-400 border-red-500/30",
};

export default function Transfers() {
  const [, setLocation] = useLocation();
  const { data: transfersData, isLoading: transfersLoading } = trpc.stripeData.transfers.useQuery({});
  const { data: payoutsData, isLoading: payoutsLoading } = trpc.stripeData.payouts.useQuery({});

  const transfers = (transfersData as { data?: unknown[] } | undefined)?.data ?? [];
  const payouts = (payoutsData as { data?: unknown[] } | undefined)?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-cyan-400" />
            Transfers & Payouts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Money movement to connected accounts and your bank</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Show me my recent payouts and transfers"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />Manage via AI
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-muted-foreground">Transfers</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{transfers.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownToLine className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Payouts</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{payouts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transfers */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            {transfersLoading ? "Loading transfers..." : `${transfers.length} transfers`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {transfersLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}</div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-8">
              <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No transfers found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transfers.map((t: unknown) => {
                const tr = t as { id: string; amount: number; currency: string; destination: string; description: string | null; created: number };
                return (
                  <div key={tr.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-foreground font-mono">{tr.id}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          To: {typeof tr.destination === "string" ? tr.destination : (tr.destination as { id?: string })?.id ?? "—"} · {formatDate(tr.created)}
                          {tr.description ? ` · ${tr.description}` : ""}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-cyan-400">{formatAmount(tr.amount, tr.currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payouts */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
            {payoutsLoading ? "Loading payouts..." : `${payouts.length} payouts`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {payoutsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}</div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-8">
              <ArrowDownToLine className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No payouts found</p>
              <p className="text-xs text-muted-foreground mt-1">Payouts appear here when Stripe sends money to your bank</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.map((p: unknown) => {
                const po = p as { id: string; amount: number; currency: string; status: string; arrival_date: number; description: string | null };
                const statusColor = PAYOUT_STATUS[po.status] ?? "text-muted-foreground border-border";
                return (
                  <div key={po.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-foreground font-mono">{po.id}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Arrives: {formatDate(po.arrival_date)}{po.description ? ` · ${po.description}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${statusColor}`}>
                          {po.status.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-sm font-semibold text-green-400">{formatAmount(po.amount, po.currency)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-foreground">AI Quick Actions</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {["Show all pending payouts", "List recent transfers to connected accounts", "What is my total payout this month?", "Create a transfer to a connected account"].map(p => (
              <Button key={p} variant="outline" size="sm" className="text-xs bg-muted/30 border-border"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(p))}>{p}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
