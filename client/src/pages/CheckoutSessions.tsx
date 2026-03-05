import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, MessageSquare, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open:     { label: "Open",     color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", icon: Clock },
  complete: { label: "Complete", color: "text-green-400 border-green-500/30 bg-green-500/10",   icon: CheckCircle },
  expired:  { label: "Expired",  color: "text-muted-foreground border-border",                   icon: XCircle },
};

export default function CheckoutSessions() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.stripeData.checkoutSessions.useQuery({});
  const sessions = (data as { data?: unknown[] } | undefined)?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-purple-400" />
            Checkout Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track Stripe Checkout session activity</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a checkout session for a product"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />Create via AI
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const Icon = cfg.icon;
          const count = sessions.filter((s: unknown) => (s as { status: string }).status === status).length;
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

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            {isLoading ? "Loading..." : `${sessions.length} sessions`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />)}</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No checkout sessions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session: unknown) => {
                const s = session as { id: string; status: string; mode: string; amount_total: number | null; currency: string; customer_email: string | null; created: number; url: string | null };
                const cfg = STATUS_CONFIG[s.status] ?? { label: s.status, color: "text-muted-foreground border-border", icon: Clock };
                const Icon = cfg.icon;
                return (
                  <div key={s.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 flex-shrink-0 ${cfg.color.split(" ")[0]}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground font-mono">{s.id}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {s.customer_email ?? "No email"} · Mode: {s.mode} · {formatDate(s.created)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {s.amount_total != null && (
                          <span className="text-sm font-semibold text-foreground">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: s.currency?.toUpperCase() ?? "USD" }).format(s.amount_total / 100)}
                          </span>
                        )}
                        <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                        {s.url && s.status === "open" && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                              <ExternalLink className="h-3 w-3" />Open
                            </Button>
                          </a>
                        )}
                        {s.status === "open" && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs text-red-400"
                            onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Expire checkout session ${s.id}`))}>
                            Expire
                          </Button>
                        )}
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
            {["Create a checkout session for a $49 one-time payment", "Show all open checkout sessions", "Expire all open checkout sessions older than 24 hours", "Create a subscription checkout for $19/month"].map(p => (
              <Button key={p} variant="outline" size="sm" className="text-xs bg-muted/30 border-border"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(p))}>{p}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
