import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, MessageSquare, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}
function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  needs_response: { label: "Needs Response", color: "text-red-400 border-red-500/30 bg-red-500/10", icon: AlertTriangle },
  under_review: { label: "Under Review", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", icon: Clock },
  charge_refunded: { label: "Refunded", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", icon: CheckCircle },
  won: { label: "Won", color: "text-green-400 border-green-500/30 bg-green-500/10", icon: CheckCircle },
  lost: { label: "Lost", color: "text-red-400 border-red-500/30 bg-red-500/10", icon: XCircle },
  warning_needs_response: { label: "Warning: Needs Response", color: "text-orange-400 border-orange-500/30 bg-orange-500/10", icon: AlertTriangle },
  warning_under_review: { label: "Warning: Under Review", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", icon: Clock },
  warning_closed: { label: "Warning Closed", color: "text-muted-foreground border-border", icon: CheckCircle },
};

export default function Disputes() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.stripeData.disputes.useQuery({});

  const disputes = (data as { data?: unknown[] } | undefined)?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-400" />
            Disputes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage chargebacks and dispute evidence</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("List all disputes that need a response"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />Manage via AI
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).slice(0, 4).map(([status, cfg]) => {
          const Icon = cfg.icon;
          const count = disputes.filter((d: unknown) => (d as { status: string }).status === status).length;
          return (
            <Card key={status} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${cfg.color.split(" ")[0]}`} />
                  <span className="text-xs text-muted-foreground">{cfg.label}</span>
                </div>
                <p className="text-2xl font-semibold text-foreground">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disputes Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            {isLoading ? "Loading..." : `${disputes.length} disputes`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />)}</div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-12">
              <ShieldAlert className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No disputes found</p>
              <p className="text-xs text-muted-foreground mt-1">Disputes appear here when customers contest charges</p>
            </div>
          ) : (
            <div className="space-y-2">
              {disputes.map((dispute: unknown) => {
                const d = dispute as { id: string; status: string; amount: number; currency: string; created: number; reason: string; charge: string };
                const cfg = STATUS_CONFIG[d.status] ?? { label: d.status, color: "text-muted-foreground border-border", icon: AlertTriangle };
                const Icon = cfg.icon;
                return (
                  <div key={d.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 flex-shrink-0 ${cfg.color.split(" ")[0]}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground font-mono">{d.id}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Reason: {d.reason?.replace(/_/g, " ") ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-sm font-semibold text-foreground">{formatAmount(d.amount, d.currency)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(d.created)}</span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"
                          onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Get details of dispute ${d.id} and help me respond with evidence`))}>
                          <MessageSquare className="h-3 w-3" />Respond via AI
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-foreground">AI Quick Actions</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {["List all disputes needing a response", "Show me disputes I've won", "Help me write evidence for a dispute", "What's the deadline to respond to disputes?"].map(p => (
              <Button key={p} variant="outline" size="sm" className="text-xs bg-muted/30 border-border"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(p))}>{p}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
