import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, MessageSquare, Percent, DollarSign, Copy, Infinity } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Promotions() {
  const [, setLocation] = useLocation();
  const { data: couponsData, isLoading: couponsLoading } = trpc.stripeData.coupons.useQuery({});
  const { data: promoData, isLoading: promoLoading } = trpc.stripeData.promotionCodes.useQuery({});

  const coupons = (couponsData as { data?: unknown[] } | undefined)?.data ?? [];
  const promoCodes = (promoData as { data?: unknown[] } | undefined)?.data ?? [];

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}" to clipboard`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Tag className="h-6 w-6 text-orange-400" />
            Promotions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Coupons and promotion codes for discounts</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a 20% off coupon valid for 3 months"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />Create via AI
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-muted-foreground">Total Coupons</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{coupons.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Promo Codes</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{promoCodes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Coupons */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            {couponsLoading ? "Loading coupons..." : `${coupons.length} coupons`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {couponsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8">
              <Percent className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No coupons yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {coupons.map((coupon: unknown) => {
                const c = coupon as { id: string; name: string | null; percent_off: number | null; amount_off: number | null; currency: string | null; duration: string; duration_in_months: number | null; times_redeemed: number; max_redemptions: number | null; valid: boolean; created: number };
                return (
                  <div key={c.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        {c.percent_off ? <Percent className="h-4 w-4 text-orange-400 flex-shrink-0" /> : <DollarSign className="h-4 w-4 text-green-400 flex-shrink-0" />}
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name ?? c.id}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.percent_off ? `${c.percent_off}% off` : c.amount_off ? `$${(c.amount_off / 100).toFixed(2)} off` : "—"} · {c.duration}{c.duration_in_months ? ` (${c.duration_in_months}mo)` : ""} · Created {formatDate(c.created)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {c.times_redeemed} / {c.max_redemptions ?? <Infinity className="h-3 w-3 inline" />} uses
                        </span>
                        <Badge variant="outline" className={`text-xs ${c.valid ? "text-green-400 border-green-500/30" : "text-muted-foreground border-border"}`}>
                          {c.valid ? "Valid" : "Invalid"}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"
                          onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Create a promotion code for coupon ${c.id}`))}>
                          <Tag className="h-3 w-3" />Make Code
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

      {/* Promotion Codes */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {promoLoading ? "Loading promo codes..." : `${promoCodes.length} promotion codes`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {promoLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}</div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No promotion codes yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {promoCodes.map((pc: unknown) => {
                const p = pc as { id: string; code: string; active: boolean; times_redeemed: number; max_redemptions: number | null; expires_at: number | null; created: number };
                return (
                  <div key={p.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-foreground font-mono tracking-wider">{p.code}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.times_redeemed} uses{p.max_redemptions ? ` / ${p.max_redemptions} max` : ""}{p.expires_at ? ` · Expires ${formatDate(p.expires_at)}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${p.active ? "text-green-400 border-green-500/30" : "text-muted-foreground border-border"}`}>
                          {p.active ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => copyCode(p.code)}>
                          <Copy className="h-3 w-3" />Copy
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

      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-foreground">AI Quick Actions</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {["Create a 20% off coupon for 3 months", "Create a $10 off one-time coupon", "Create promo code SAVE20 for 20% off", "List all active promotion codes"].map(p => (
              <Button key={p} variant="outline" size="sm" className="text-xs bg-muted/30 border-border"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(p))}>{p}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
