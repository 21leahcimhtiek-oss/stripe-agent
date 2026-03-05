import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Github, Star, GitFork, AlertCircle, Lock, Globe, Search, MessageSquare, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", Java: "#b07219", "C++": "#f34b7d",
  CSS: "#563d7c", HTML: "#e34c26", Shell: "#89e051", Ruby: "#701516",
};

export default function GitHubRepos() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");

  const { data: repos, isLoading } = trpc.githubData.repos.useQuery({});
  const { data: ghUser } = trpc.githubData.currentUser.useQuery();

  const filtered = useMemo(() => {
    if (!repos) return [];
    return repos.filter(r => {
      const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || (filter === "public" && !r.private) || (filter === "private" && r.private);
      return matchesSearch && matchesFilter;
    });
  }, [repos, search, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Github className="h-6 w-6" />
            GitHub Repositories
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ghUser ? `Viewing repos for @${ghUser.login}` : "Browse and manage your GitHub repositories"}
          </p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent("Create a new GitHub repository"))} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Create via AI
        </Button>
      </div>

      {/* GitHub User Card */}
      {ghUser && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <img src={ghUser.avatar_url} alt={ghUser.login} className="h-12 w-12 rounded-full border border-border" />
              <div>
                <p className="font-medium text-foreground">{ghUser.name ?? ghUser.login}</p>
                <p className="text-sm text-muted-foreground">@{ghUser.login}</p>
              </div>
              <div className="ml-auto flex gap-6 text-center">
                <div><p className="text-lg font-semibold text-foreground">{ghUser.public_repos}</p><p className="text-xs text-muted-foreground">Repos</p></div>
                <div><p className="text-lg font-semibold text-foreground">{ghUser.followers}</p><p className="text-xs text-muted-foreground">Followers</p></div>
              </div>
              <a href={ghUser.html_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1"><ExternalLink className="h-3 w-3" />GitHub</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search repositories..." className="pl-9 bg-muted/30 border-border" />
        </div>
        <div className="flex gap-1">
          {(["all", "public", "private"] as const).map(f => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">
              {f === "public" ? <Globe className="h-3 w-3 mr-1" /> : f === "private" ? <Lock className="h-3 w-3 mr-1" /> : null}
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Repos Grid */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Github className="h-4 w-4 text-muted-foreground" />
            {isLoading ? "Loading..." : `${filtered.length} repositories`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-muted/50 rounded animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Github className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No repositories found</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map(repo => (
                <div key={repo.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-primary text-sm truncate">{repo.name}</span>
                        <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${repo.private ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" : "text-green-400 border-green-500/30 bg-green-500/10"}`}>
                          {repo.private ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                          {repo.private ? "Private" : "Public"}
                        </span>
                      </div>
                      {repo.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{repo.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {repo.language && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LANG_COLORS[repo.language] ?? "#888" }} />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3" />{repo.stars}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GitFork className="h-3 w-3" />{repo.forks}
                    </span>
                    {(repo.open_issues_count ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs text-orange-400">
                        <AlertCircle className="h-3 w-3" />{repo.open_issues_count}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">{formatDate(repo.updated_at ?? null)}</span>
                  </div>

                  <div className="flex gap-1 mt-3">
                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 flex-1"
                      onClick={() => setLocation(`/github/issues?owner=${repo.full_name.split("/")[0]}&repo=${repo.name}`)}>
                      <AlertCircle className="h-3 w-3" />Issues
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 flex-1"
                      onClick={() => setLocation(`/github/prs?owner=${repo.full_name.split("/")[0]}&repo=${repo.name}`)}>
                      <GitFork className="h-3 w-3" />PRs
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 flex-1"
                      onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Show me the files in ${repo.full_name}`))}>
                      <MessageSquare className="h-3 w-3" />AI
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">AI Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {[
              "List all my repositories",
              "Create a private repo called my-project",
              "Search GitHub for Stripe TypeScript repos",
              "Show repo stats for a repository",
              "Fork a repository",
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
