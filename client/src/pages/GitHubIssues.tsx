import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MessageSquare, ExternalLink, Search, Filter } from "lucide-react";
import { useState } from "react";
import { useLocation, useSearch } from "wouter";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GitHubIssues() {
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
  const { data: issues, isLoading } = trpc.githubData.issues.useQuery(
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
            <AlertCircle className="h-6 w-6" />
            GitHub Issues
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Browse and manage issues across repositories</p>
        </div>
        <Button onClick={() => setLocation("/chat?prompt=" + encodeURIComponent(`Create a new issue in ${owner}/${repo}`))} className="gap-2" disabled={!enabled}>
          <MessageSquare className="h-4 w-4" />Create via AI
        </Button>
      </div>

      {/* Repo Selector */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">Owner</label>
              <Input value={ownerInput} onChange={e => setOwnerInput(e.target.value)} placeholder="e.g. facebook" className="bg-muted/30 border-border" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">Repository</label>
              <Input value={repoInput} onChange={e => setRepoInput(e.target.value)} placeholder="e.g. react" className="bg-muted/30 border-border" onKeyDown={e => e.key === "Enter" && handleSearch()} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="gap-2"><Search className="h-4 w-4" />Load Issues</Button>
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            {(["open", "closed", "all"] as const).map(s => (
              <Button key={s} variant={state === s ? "default" : "outline"} size="sm" onClick={() => setState(s)} className="capitalize">{s}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            {!enabled ? "Enter owner and repo to load issues" : isLoading ? "Loading..." : `${issues?.length ?? 0} ${state} issues in ${owner}/${repo}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!enabled ? (
            <div className="text-center py-12">
              <Filter className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Select a repository to view issues</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />)}</div>
          ) : !issues || issues.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No {state} issues found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {issues.map(issue => (
                <div key={issue.number} className="border border-border/50 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${issue.state === "open" ? "text-green-400" : "text-purple-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-foreground">{issue.title}</p>
                        <a href={issue.html_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">#{issue.number}</span>
                        {issue.user && <span className="text-xs text-muted-foreground">by @{issue.user}</span>}
                        <span className="text-xs text-muted-foreground">{formatDate(issue.created_at)}</span>
                        {(issue.comments ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />{issue.comments}
                          </span>
                        )}
                        {(issue.labels as string[]).filter(Boolean).map(label => (
                          <Badge key={label} variant="outline" className="text-xs px-1.5 py-0 h-4 border-border">{label}</Badge>
                        ))}
                      </div>
                    </div>
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
              enabled && `List all open issues in ${owner}/${repo}`,
              enabled && `Create a bug report issue in ${owner}/${repo}`,
              enabled && `Close issue #1 in ${owner}/${repo}`,
              "Search for issues labeled 'bug' across GitHub",
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
