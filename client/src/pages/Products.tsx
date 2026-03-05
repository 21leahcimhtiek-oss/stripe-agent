import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";

function formatCurrency(amount: number | null, currency: string) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Products() {
  const [, setLocation] = useLocation();
  const { data: products, isLoading: productsLoading } = trpc.stripeData.products.useQuery({ limit: 20 });
  const { data: prices, isLoading: pricesLoading } = trpc.stripeData.prices.useQuery({ limit: 50 });

  type StripePrice = NonNullable<typeof prices>["data"][number];
  const pricesByProduct: Record<string, StripePrice[]> = {};
  if (prices?.data) {
    for (const price of prices.data) {
      const pid = typeof price.product === "string" ? price.product : (price.product as { id: string }).id;
      if (!pricesByProduct[pid]) pricesByProduct[pid] = [];
      pricesByProduct[pid]!.push(price);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products & Prices</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your product catalog and pricing</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a new product"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Create via AI
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            {productsLoading ? "Loading..." : `${products?.data?.length ?? 0} products`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {productsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/50 rounded animate-pulse" />)}
            </div>
          ) : products?.data?.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No products yet</p>
              <Button
                variant="outline" size="sm" className="mt-3"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a product called Pro Plan at $29/month"))}
              >
                Create your first product
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {products?.data?.map(product => {
                const productPrices = pricesByProduct[product.id] ?? [];
                return (
                  <div key={product.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{product.name}</p>
                            {product.active ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-400"><CheckCircle className="h-3 w-3" />Active</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="h-3 w-3" />Inactive</span>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">Created {formatDate(product.created)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost" size="sm" className="h-7 text-xs gap-1 shrink-0"
                        onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Show details for product ${product.id}`))}
                      >
                        <MessageSquare className="h-3 w-3" /> Manage
                      </Button>
                    </div>

                    {/* Prices */}
                    {productPrices.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <p className="text-xs text-muted-foreground mb-2">Prices</p>
                        <div className="flex flex-wrap gap-2">
                          {productPrices.map(price => (
                            <div key={price.id} className="flex items-center gap-1.5 bg-muted/40 rounded px-2 py-1">
                              <span className="text-xs font-medium text-foreground">
                                {formatCurrency(price.unit_amount, price.currency)}
                              </span>
                              {price.recurring && (
                                <span className="text-xs text-muted-foreground">
                                  / {price.recurring.interval_count > 1 ? price.recurring.interval_count + " " : ""}{price.recurring.interval}
                                </span>
                              )}
                              {!price.active && <span className="text-xs text-muted-foreground">(inactive)</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
              "Create a product called Starter at $9/month",
              "Create a one-time product for $99",
              "List all active products",
              "Archive a product",
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
