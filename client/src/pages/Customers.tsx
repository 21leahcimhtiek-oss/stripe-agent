import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, MessageSquare, Mail, Phone, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Customers() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  const { data, isLoading, refetch } = trpc.stripeData.customers.useQuery({
    limit: 20,
    email: emailFilter || undefined,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setEmailFilter(search);
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your Stripe customers</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a new customer"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Create via AI
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="pl-9 bg-muted/30 border-border"
          />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
        {emailFilter && (
          <Button type="button" variant="ghost" onClick={() => { setSearch(""); setEmailFilter(""); }}>
            Clear
          </Button>
        )}
      </form>

      {/* Customers Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            {isLoading ? "Loading..." : `${data?.data?.length ?? 0} customers`}
            {data?.has_more && <span className="text-muted-foreground font-normal">(showing first 20)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No customers found</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a new customer"))}
              >
                Create your first customer
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">ID</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Phone</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map(customer => (
                    <tr key={customer.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-primary">
                              {(customer.name ?? customer.email ?? "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{customer.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email ?? "No email"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <code className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{customer.id}</code>
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <span className="text-muted-foreground text-xs">{customer.phone ?? "—"}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-muted-foreground text-xs">{formatDate(customer.created)}</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Show details for customer ${customer.id}`))}
                        >
                          <MessageSquare className="h-3 w-3" />
                          Manage
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

      {/* AI Suggestions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">AI Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {[
              "List all customers",
              "Create a customer with email test@example.com",
              "Find customers with no subscriptions",
              "Update customer description",
            ].map(prompt => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                className="text-xs bg-muted/30 border-border"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(prompt))}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
