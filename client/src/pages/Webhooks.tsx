import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Webhook, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border badge-${status}`}>
      {status}
    </span>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  const parts = type.split(".");
  const category = parts[0] ?? type;
  const colors: Record<string, string> = {
    customer: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    invoice: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    payment_intent: "text-green-400 bg-green-500/10 border-green-500/20",
    charge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  };
  const colorClass = colors[category] ?? "text-muted-foreground bg-muted/30 border-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${colorClass}`}>
      {type}
    </span>
  );
}

export default function Webhooks() {
  const [, setLocation] = useLocation();
  const { data: events, isLoading, refetch } = trpc.dashboard.webhookEvents.useQuery({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Webhook Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time Stripe event log from your webhook endpoint</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Webhook URL Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Webhook className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Webhook Endpoint</p>
              <p className="text-xs text-muted-foreground mt-1">
                Configure this URL in your{" "}
                <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline">Stripe Dashboard → Webhooks</a>
              </p>
              <code className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded mt-2 block">
                {window.location.origin}/api/stripe/webhook
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Webhook className="h-4 w-4 text-muted-foreground" />
            {isLoading ? "Loading..." : `${events?.length ?? 0} events received`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}
            </div>
          ) : events?.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No webhook events received yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Configure your webhook URL in the Stripe Dashboard to start receiving events
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Event Type</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Object ID</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Stripe Event ID</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {events?.map(event => (
                    <tr key={event.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3">
                        <EventTypeBadge type={event.eventType} />
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={event.status} />
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        {event.objectId ? (
                          <code className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                            {event.objectId.slice(0, 20)}…
                          </code>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <code className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          {event.stripeEventId.slice(0, 18)}…
                        </code>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
