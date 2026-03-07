import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GitCommit, ExternalLink, Plus, Minus, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CommitSkeleton() {
  return (
    <div className="flex gap-4 py-4 border-b border-border/50 animate-pulse">
      <div className="h-8 w-8 rounded-full bg-muted/50 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted/50 rounded w-3/4" />
        <div className="h-3 bg-muted/30 rounded w-1/3" />
      </div>
      <div className="h-5 w-20 bg-muted/30 rounded" />
    </div>
  );
}

export default function GitHubCommits() {
  const [, setLocation] = useLocation();
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [ownerInput, setOwnerInput] = useState("");
  const [repoInput, setRepoInput] = useState("");

  const { data: myRepos } = trpc.githubData.repos.useQuery({});
  const { data: branches } = trpc.githubData.branches.useQuery(
    { owner, repo },
    { enabled: !!(owner && repo) }
  );
  const { data: commits, isLoading, error } = trpc.githubData.commits.useQuery(
    { owner, repo, branch, per_page: 20, page },
    { enabled: !!(owner && repo) }
  );

  const repoOptions = useMemo(
    () => (myRepos ?? []).map(r => ({ value: r.full_name, label: r.full_name })),
    [myRepos]
  );

  function handleRepoSelect(fullName: string) {
    const [o, r] = fullName.split("/");
    setOwner(o);
    setRepo(r);
    setBranch(undefined);
    setPage(1);
  }

  function handleManualLoad() {
    if (!ownerInput || !repoInput) return;
    setOwner(ownerInput.trim());
    setRepo(repoInput.trim());
    setBranch(undefined);
    setPage(1);
  }

  const hasRepo = !!(owner && repo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Commit History</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse commits across your GitHub repositories</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setLocation(`/chat?prompt=${encodeURIComponent(`Show me recent commits for ${owner}/${repo}`)}`)}
        >
          <MessageSquare className="h-4 w-4" />
          Ask AI
        </Button>
      </div>

      {/* Repo Selector */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Quick-pick from my repos */}
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1.5">Select from your repos</p>
              <Select onValueChange={handleRepoSelect} value={hasRepo ? `${owner}/${repo}` : ""}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Choose a repository…" />
                </SelectTrigger>
                <SelectContent>
                  {repoOptions.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manual entry */}
            <div className="flex gap-2 items-end">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Owner</p>
                <Input
                  placeholder="owner"
                  value={ownerInput}
                  onChange={e => setOwnerInput(e.target.value)}
                  className="w-32 bg-background border-border"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Repo</p>
                <Input
                  placeholder="repo"
                  value={repoInput}
                  onChange={e => setRepoInput(e.target.value)}
                  className="w-40 bg-background border-border"
                  onKeyDown={e => e.key === "Enter" && handleManualLoad()}
                />
              </div>
              <Button onClick={handleManualLoad} size="sm" className="shrink-0">Load</Button>
            </div>

            {/* Branch selector */}
            {hasRepo && branches && branches.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Branch</p>
                <Select
                  value={branch ?? ""}
                  onValueChange={v => { setBranch(v || undefined); setPage(1); }}
                >
                  <SelectTrigger className="w-40 bg-background border-border">
                    <SelectValue placeholder="Default branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Default branch</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commit Timeline */}
      {!hasRepo ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <GitCommit className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Select a repository to view its commit history</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-muted-foreground" />
                {owner}/{repo}
                {branch && <Badge variant="outline" className="text-xs ml-1">{branch}</Badge>}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-1">Page {page}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={(commits?.length ?? 0) < 20}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {error ? (
              <p className="text-sm text-destructive py-6 text-center">
                {error.message ?? "Failed to load commits"}
              </p>
            ) : isLoading ? (
              <div>
                {[1, 2, 3, 4, 5].map(i => <CommitSkeleton key={i} />)}
              </div>
            ) : !commits?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No commits found</p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border/60" />

                <div className="space-y-0">
                  {commits.map((commit, idx) => (
                    <div key={commit.sha} className="relative flex gap-4 py-4 border-b border-border/40 last:border-0">
                      {/* Avatar on timeline */}
                      <div className="relative z-10 shrink-0">
                        <Avatar className="h-8 w-8 border border-border">
                          {commit.author_avatar && (
                            <AvatarImage src={commit.author_avatar} alt={commit.author} />
                          )}
                          <AvatarFallback className="text-xs bg-muted">
                            {commit.author.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Commit info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug line-clamp-2">
                          {commit.message.split("\n")[0]}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {commit.author_login
                              ? <a href={`https://github.com/${commit.author_login}`} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">{commit.author}</a>
                              : commit.author}
                          </span>
                          <span className="text-xs text-muted-foreground/50">·</span>
                          <span className="text-xs text-muted-foreground">{timeAgo(commit.date)}</span>
                          {commit.additions !== null && (
                            <>
                              <span className="text-xs text-muted-foreground/50">·</span>
                              <span className="text-xs text-green-400 flex items-center gap-0.5">
                                <Plus className="h-2.5 w-2.5" />{commit.additions}
                              </span>
                              <span className="text-xs text-red-400 flex items-center gap-0.5">
                                <Minus className="h-2.5 w-2.5" />{commit.deletions ?? 0}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* SHA + link */}
                      <div className="shrink-0 flex items-start gap-2 mt-0.5">
                        <code className="text-xs text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded font-mono">
                          {commit.short_sha}
                        </code>
                        <a
                          href={commit.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
