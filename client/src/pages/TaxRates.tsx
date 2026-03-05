import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, MessageSquare, Globe, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TaxRates() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.stripeData.taxRates.useQuery({});
  const taxRates = (data as { data?: unknown[] } | undefined)?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Receipt className="h-6 w-6 text-amber-400" />
            Tax Rates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tax rates applied to invoices and subscriptions</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a 20% VAT tax rate for the UK"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />Create via AI
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Active Rates</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{taxRates.filter((t: unknown) => (t as { active: boolean }).active).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Total Rates</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{taxRates.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            {isLoading ? "Loading..." : `${taxRates.length} tax rates`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}</div>
          ) : taxRates.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No tax rates configured</p>
              <Button className="mt-4 gap-2" onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a 10% sales tax rate for the US"))}>
                <MessageSquare className="h-4 w-4" />Create first tax rate
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {taxRates.map((rate: unknown) => {
                const r = rate as { id: string; display_name: string; percentage: number; inclusive: boolean; active: boolean; country: string | null; description: string | null; created: number };
                return (
                  <div key={r.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <Receipt className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.display_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {r.description ?? r.id} · {r.country ?? "Global"} · Created {formatDate(r.created)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
                          {r.percentage}%
                        </Badge>
                        <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                          {r.inclusive ? "Inclusive" : "Exclusive"}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${r.active ? "text-green-400 border-green-500/30" : "text-muted-foreground border-border"}`}>
                          {r.active ? "Active" : "Archived"}
                        </Badge>
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
            {["Create a 20% VAT tax rate for the UK", "Create a 10% GST for Australia", "List all active tax rates", "Create an inclusive 8.5% sales tax for California"].map(p => (
              <Button key={p} variant="outline" size="sm" className="text-xs bg-muted/30 border-border"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(p))}>{p}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
