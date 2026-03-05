import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, MessageSquare, ExternalLink, CheckCircle, XCircle, Copy } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function PaymentLinks() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.stripeData.paymentLinks.useQuery({});
  const links = (data as { data?: unknown[] } | undefined)?.data ?? [];

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Link2 className="h-6 w-6 text-blue-400" />
            Payment Links
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Shareable links for one-click payments</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a new payment link for a product"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />Create via AI
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Active Links</p>
            <p className="text-2xl font-semibold text-green-400">{links.filter((l: unknown) => (l as { active: boolean }).active).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Inactive Links</p>
            <p className="text-2xl font-semibold text-muted-foreground">{links.filter((l: unknown) => !(l as { active: boolean }).active).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            {isLoading ? "Loading..." : `${links.length} payment links`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />)}</div>
          ) : links.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No payment links yet</p>
              <Button className="mt-4 gap-2" onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a payment link for $29/month subscription"))}>
                <MessageSquare className="h-4 w-4" />Create your first link
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {links.map((link: unknown) => {
                const l = link as { id: string; active: boolean; url: string; created: number };
                return (
                  <div key={l.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        {l.active
                          ? <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                          : <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground font-mono truncate">{l.id}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{l.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`text-xs ${l.active ? "text-green-400 border-green-500/30" : "text-muted-foreground border-border"}`}>
                          {l.active ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => copyLink(l.url)}>
                          <Copy className="h-3 w-3" />Copy
                        </Button>
                        <a href={l.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                            <ExternalLink className="h-3 w-3" />Open
                          </Button>
                        </a>
                        {l.active && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 gap-1"
                            onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Deactivate payment link ${l.id}`))}>
                            Deactivate
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
            {["Create a payment link for $49 one-time payment", "Create a subscription payment link for $19/month", "List all active payment links", "Deactivate all inactive payment links"].map(p => (
              <Button key={p} variant="outline" size="sm" className="text-xs bg-muted/30 border-border"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(p))}>{p}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
