import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Code2, Save, RefreshCw, FolderOpen, GitBranch, AlertTriangle, CheckCircle, FileText, Folder, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";

function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", rb: "ruby", go: "go", rs: "rust", java: "java",
    cs: "csharp", cpp: "cpp", c: "c", php: "php", swift: "swift",
    kt: "kotlin", md: "markdown", json: "json", yaml: "yaml", yml: "yaml",
    toml: "ini", sh: "shell", bash: "shell", zsh: "shell",
    html: "html", css: "css", scss: "scss", sql: "sql", xml: "xml",
  };
  return map[ext] ?? "plaintext";
}

export default function GitHubEditor() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [filePath, setFilePath] = useState("");
  const [dirPath, setDirPath] = useState("");
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [sha, setSha] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const { data: reposData } = trpc.githubData.repos.useQuery({});
  const repos = (reposData ?? []) as Array<{ full_name: string; name: string }>;

  // Directory listing
  const { data: dirData, isLoading: dirLoading, refetch: refetchDir } = trpc.githubData.listDir.useQuery(
    { owner, repo, path: dirPath, ref: branch },
    { enabled: !!(owner && repo) }
  );
  const dirItems = (dirData ?? []) as Array<{ type: string; name: string; path: string; size: number }>;

  // File reading
  const { data: fileData, isLoading: fileLoading, refetch: refetchFile } = trpc.githubData.getFile.useQuery(
    { owner, repo, path: filePath, ref: branch },
    { enabled: false }
  );

  const updateFileMutation = trpc.githubData.updateFile.useMutation({
    onSuccess: (data) => {
      setSha(data.commit.sha ?? sha);
      setOriginalContent(content);
      toast.success(`Committed: ${commitMessage}`);
    },
    onError: () => toast.error("Failed to save. Check permissions."),
  });

  const handleRepoSelect = (fullName: string) => {
    const [o, r] = fullName.split("/");
    setOwner(o);
    setRepo(r);
    setDirPath("");
    setFilePath("");
    setLoaded(false);
    setContent("");
    setError("");
  };

  const loadFile = useCallback(async () => {
    if (!owner || !repo || !filePath) {
      toast.error("Please fill in owner, repo, and file path");
      return;
    }
    setError("");
    try {
      const result = await refetchFile();
      if (result.data) {
        const decoded = result.data.encoding === "base64"
          ? decodeURIComponent(escape(atob(result.data.content.replace(/\n/g, ""))))
          : result.data.content;
        setContent(decoded);
        setOriginalContent(decoded);
        setSha(result.data.sha);
        setLoaded(true);
        setCommitMessage(`Update ${filePath}`);
      }
    } catch {
      setError("Failed to load file. Check the path and permissions.");
    }
  }, [owner, repo, filePath, branch, refetchFile]);

  const handleDirClick = (item: { type: string; name: string; path: string }) => {
    if (item.type === "dir") {
      setDirPath(item.path);
    } else {
      setFilePath(item.path);
    }
  };

  const saveFile = useCallback(() => {
    if (!commitMessage.trim()) { toast.error("Please enter a commit message"); return; }
    try {
      const encoded = btoa(unescape(encodeURIComponent(content)));
      updateFileMutation.mutate({ owner, repo, path: filePath, content: encoded, message: commitMessage, sha, branch });
    } catch {
      toast.error("Failed to encode file content.");
    }
  }, [owner, repo, filePath, content, commitMessage, sha, branch, updateFileMutation]);

  const isDirty = content !== originalContent;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Code2 className="h-6 w-6 text-green-400" />
            File Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Browse and edit GitHub repository files with Monaco</p>
        </div>
        {isDirty && (
          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 gap-1">
            <AlertTriangle className="h-3 w-3" />Unsaved changes
          </Badge>
        )}
        {loaded && !isDirty && (
          <Badge variant="outline" className="text-green-400 border-green-500/30 gap-1">
            <CheckCircle className="h-3 w-3" />Saved
          </Badge>
        )}
      </div>

      {/* Repo & Branch Selector */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            Repository
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Repository</Label>
              <Select onValueChange={handleRepoSelect}>
                <SelectTrigger className="bg-muted/30 border-border text-sm h-9">
                  <SelectValue placeholder="Select repository..." />
                </SelectTrigger>
                <SelectContent>
                  {repos.map(r => (
                    <SelectItem key={r.full_name} value={r.full_name}>{r.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Branch</Label>
              <div className="relative">
                <GitBranch className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input value={branch} onChange={e => setBranch(e.target.value)}
                  className="pl-8 bg-muted/30 border-border text-sm h-9" placeholder="main" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* File Browser */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5" />
                {dirPath ? `/${dirPath}` : "/"}
              </span>
              {dirPath && (
                <Button variant="ghost" size="sm" className="h-5 text-xs px-1"
                  onClick={() => setDirPath(dirPath.split("/").slice(0, -1).join("/"))}>
                  ↑ Up
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-2">
            {!owner || !repo ? (
              <p className="text-xs text-muted-foreground text-center py-6">Select a repo to browse</p>
            ) : dirLoading ? (
              <div className="space-y-1">{[1,2,3,4,5].map(i => <div key={i} className="h-7 bg-muted/50 rounded animate-pulse" />)}</div>
            ) : (
              <div className="space-y-0.5 max-h-80 overflow-y-auto">
                {dirItems.sort((a, b) => {
                  if (a.type === b.type) return a.name.localeCompare(b.name);
                  return a.type === "dir" ? -1 : 1;
                }).map(item => (
                  <button key={item.path}
                    onClick={() => handleDirClick(item)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-muted/30 transition-colors text-left ${filePath === item.path ? "bg-muted/50 text-foreground" : "text-muted-foreground"}`}>
                    {item.type === "dir"
                      ? <><Folder className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" /><span className="truncate">{item.name}</span><ChevronRight className="h-3 w-3 ml-auto" /></>
                      : <><FileText className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" /><span className="truncate">{item.name}</span></>
                    }
                  </button>
                ))}
                {dirItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Empty directory</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor Panel */}
        <Card className="bg-card border-border lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex-1">
                  <FileText className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                  <Input value={filePath} onChange={e => setFilePath(e.target.value)}
                    className="pl-8 bg-muted/30 border-border text-xs h-8 font-mono w-56"
                    placeholder="src/index.ts" onKeyDown={e => e.key === "Enter" && loadFile()} />
                </div>
                <Button onClick={loadFile} disabled={fileLoading || !owner || !repo || !filePath} size="sm" className="gap-1.5 h-8">
                  {fileLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FolderOpen className="h-3.5 w-3.5" />}
                  Open
                </Button>
              </div>
              {loaded && (
                <div className="flex items-center gap-2">
                  <Input value={commitMessage} onChange={e => setCommitMessage(e.target.value)}
                    className="bg-muted/30 border-border text-xs h-8 w-48" placeholder="Commit message..." />
                  <Button onClick={saveFile} disabled={!isDirty || updateFileMutation.isPending} size="sm" className="gap-1.5 h-8">
                    {updateFileMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Commit
                  </Button>
                </div>
              )}
            </div>
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 mt-2">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />{error}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            {loaded ? (
              <div className="rounded-lg overflow-hidden border border-border/50">
                <Editor
                  height="520px"
                  language={getLanguage(filePath)}
                  value={content}
                  onChange={v => setContent(v ?? "")}
                  theme="vs-dark"
                  options={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    lineNumbers: "on",
                    tabSize: 2,
                    insertSpaces: true,
                    automaticLayout: true,
                    padding: { top: 12, bottom: 12 },
                    renderLineHighlight: "line",
                  }}
                />
              </div>
            ) : (
              <div className="h-[520px] flex items-center justify-center border border-dashed border-border/50 rounded-lg">
                <div className="text-center">
                  <Code2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                  <p className="text-muted-foreground">Browse the file tree or type a path and click Open</p>
                  <p className="text-xs text-muted-foreground mt-1">TypeScript, Python, Go, Rust, Markdown, JSON, and 30+ languages</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
