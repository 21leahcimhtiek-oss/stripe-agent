import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GitMerge, GitPullRequest, MessageSquare, ExternalLink, Search, Filter, GitBranch } from "lucide-react";
import { useState } from "react";
import { useLocation, useSearch } from "wouter";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GitHubPRs() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const defaultOwner = params.get("owner") ?? "";
  const defaultRepo = params.get("repo") ?? "";

  const [owner, setOwner] = useState(defaultOwner);
  const [repo, setRepo] = useState(defaultRepo);
  const [state, setState] = useState<"open" | "closed" | "all">("open");
  const [ownerInput, setOwnerInput] = useState(defaultOwner);
  const [repoInput, setRepoInput] = useState(defaultRepo);

  const enabled = !!owner && !!repo;
  const { data: prs, isLoading } = trpc.githubData.prs.useQuery(
    { owner, repo, state },
    { enabled }
  );

  const handleSearch = () => {
    setOwner(ownerInput);
    setRepo(repoInput);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <GitPullRequest className="h-6 w-6" />
            Pull Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage pull requests across repositories</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Create a pull request in ${owner}/${repo}`))} className="gap-2" disabled={!enabled}>
          <MessageSquare className="h-4 w-4" />Create via AI
        </Button>
      </div>

      {/* Repo Selector */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">Owner</label>
              <Input value={ownerInput} onChange={e => setOwnerInput(e.target.value)} placeholder="e.g. vercel" className="bg-muted/30 border-border" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">Repository</label>
              <Input value={repoInput} onChange={e => setRepoInput(e.target.value)} placeholder="e.g. next.js" className="bg-muted/30 border-border" onKeyDown={e => e.key === "Enter" && handleSearch()} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="gap-2"><Search className="h-4 w-4" />Load PRs</Button>
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            {(["open", "closed", "all"] as const).map(s => (
              <Button key={s} variant={state === s ? "default" : "outline"} size="sm" onClick={() => setState(s)} className="capitalize">{s}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PRs List */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
            {!enabled ? "Enter owner and repo to load PRs" : isLoading ? "Loading..." : `${prs?.length ?? 0} ${state} pull requests in ${owner}/${repo}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!enabled ? (
            <div className="text-center py-12">
              <Filter className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Select a repository to view pull requests</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />)}</div>
          ) : !prs || prs.length === 0 ? (
            <div className="text-center py-12">
              <GitPullRequest className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No {state} pull requests found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {prs.map(pr => (
                <div key={pr.number} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 ${pr.state === "open" ? "text-green-400" : pr.state === "closed" ? "text-red-400" : "text-purple-400"}`}>
                      {pr.state === "open" ? <GitPullRequest className="h-4 w-4" /> : <GitMerge className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-foreground">{pr.title}</p>
                          {pr.draft && <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-border text-muted-foreground">Draft</Badge>}
                        </div>
                        <a href={pr.html_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">#{pr.number}</span>
                        {pr.user && <span className="text-xs text-muted-foreground">by @{pr.user}</span>}
                        <span className="text-xs text-muted-foreground">{formatDate(pr.created_at)}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <GitBranch className="h-3 w-3" />{pr.head} → {pr.base}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3 ml-7">
                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"
                      onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Get details of PR #${pr.number} in ${owner}/${repo}`))}>
                      <MessageSquare className="h-3 w-3" />Details via AI
                    </Button>
                    {pr.state === "open" && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-green-400"
                        onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Merge PR #${pr.number} in ${owner}/${repo} using squash`))}>
                        <GitMerge className="h-3 w-3" />Merge via AI
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">AI Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {[
              enabled && `List all open PRs in ${owner}/${repo}`,
              enabled && `Create a PR from feature/my-branch to main in ${owner}/${repo}`,
              enabled && `List branches in ${owner}/${repo}`,
              "Search for open PRs across GitHub",
            ].filter(Boolean).map(prompt => (
              <Button key={prompt as string} variant="outline" size="sm" className="text-xs bg-muted/30 border-border"
                onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(prompt as string))}>
                {prompt}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
