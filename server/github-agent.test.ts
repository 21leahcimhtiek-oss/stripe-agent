import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Octokit ────────────────────────────────────────────────────────────

const mockOctokit = {
  rest: {
    repos: {
      listForAuthenticatedUser: vi.fn(),
      listForUser: vi.fn(),
      get: vi.fn(),
      createForAuthenticatedUser: vi.fn(),
      delete: vi.fn(),
      createFork: vi.fn(),
      listBranches: vi.fn(),
      listCommits: vi.fn(),
      getCommit: vi.fn(),
      listReleases: vi.fn(),
      createRelease: vi.fn(),
      getContent: vi.fn(),
      createOrUpdateFileContents: vi.fn(),
      listLanguages: vi.fn(),
      getContributorsStats: vi.fn(),
      getParticipationStats: vi.fn(),
      getPunchCardStats: vi.fn(),
    },
    issues: {
      listForRepo: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      createComment: vi.fn(),
      listLabelsForRepo: vi.fn(),
      createLabel: vi.fn(),
    },
    pulls: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      merge: vi.fn(),
    },
    git: {
      getRef: vi.fn(),
      createRef: vi.fn(),
      deleteRef: vi.fn(),
    },
    search: {
      repos: vi.fn(),
      code: vi.fn(),
      issuesAndPullRequests: vi.fn(),
    },
    users: {
      getAuthenticated: vi.fn(),
    },
    orgs: {
      listForAuthenticatedUser: vi.fn(),
    },
    activity: {
      starRepoForAuthenticatedUser: vi.fn(),
      unstarRepoForAuthenticatedUser: vi.fn(),
    },
  },
};

vi.mock("./github", () => ({
  getOctokit: () => mockOctokit,
  default: () => mockOctokit,
}));

import { executeGitHubTool, GITHUB_TOOLS } from "./githubTools";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GITHUB_TOOLS definition", () => {
  it("exports the correct number of tools", () => {
    expect(GITHUB_TOOLS.length).toBeGreaterThanOrEqual(28);
  });

  it("all tools have required function fields", () => {
    for (const tool of GITHUB_TOOLS) {
      expect(tool.type).toBe("function");
      expect(tool.function.name).toBeTruthy();
      expect(tool.function.description).toBeTruthy();
      expect(tool.function.parameters).toBeTruthy();
    }
  });

  it("all tool names start with github_", () => {
    for (const tool of GITHUB_TOOLS) {
      expect(tool.function.name).toMatch(/^github_/);
    }
  });
});

describe("executeGitHubTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("github_list_repos — authenticated user", async () => {
    mockOctokit.rest.repos.listForAuthenticatedUser.mockResolvedValue({
      data: [
        { id: 1, name: "my-repo", full_name: "user/my-repo", description: "A repo", private: false, language: "TypeScript", stargazers_count: 42, forks_count: 5, updated_at: "2024-01-01", html_url: "https://github.com/user/my-repo", open_issues_count: 2 },
      ],
    });

    const result = await executeGitHubTool("github_list_repos", {}) as Array<{ name: string; stars: number }>;
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("my-repo");
    expect(result[0]!.stars).toBe(42);
  });

  it("github_list_repos — specific owner", async () => {
    mockOctokit.rest.repos.listForUser.mockResolvedValue({
      data: [
        { id: 2, name: "their-repo", full_name: "other/their-repo", description: null, private: true, language: "Python", stargazers_count: 0, forks_count: 0, updated_at: "2024-02-01", html_url: "https://github.com/other/their-repo", open_issues_count: 0 },
      ],
    });

    const result = await executeGitHubTool("github_list_repos", { owner: "other" }) as Array<{ name: string }>;
    expect(result[0]!.name).toBe("their-repo");
    expect(mockOctokit.rest.repos.listForUser).toHaveBeenCalledWith(expect.objectContaining({ username: "other" }));
  });

  it("github_get_repo returns repo details", async () => {
    mockOctokit.rest.repos.get.mockResolvedValue({
      data: { name: "stripe-agent", full_name: "user/stripe-agent", description: "Agent", private: true, language: "TypeScript", stargazers_count: 10, forks_count: 1, open_issues_count: 3, default_branch: "main", topics: ["stripe", "ai"], created_at: "2024-01-01", updated_at: "2024-03-01", pushed_at: "2024-03-01", html_url: "https://github.com/user/stripe-agent", clone_url: "https://github.com/user/stripe-agent.git", size: 1024 },
    });

    const result = await executeGitHubTool("github_get_repo", { owner: "user", repo: "stripe-agent" }) as { name: string; default_branch: string };
    expect(result.name).toBe("stripe-agent");
    expect(result.default_branch).toBe("main");
  });

  it("github_create_repo creates a private repo by default", async () => {
    mockOctokit.rest.repos.createForAuthenticatedUser.mockResolvedValue({
      data: { name: "new-repo", full_name: "user/new-repo", html_url: "https://github.com/user/new-repo", clone_url: "https://github.com/user/new-repo.git", private: true },
    });

    const result = await executeGitHubTool("github_create_repo", { name: "new-repo" }) as { name: string; private: boolean };
    expect(result.name).toBe("new-repo");
    expect(result.private).toBe(true);
    expect(mockOctokit.rest.repos.createForAuthenticatedUser).toHaveBeenCalledWith(expect.objectContaining({ name: "new-repo", private: true }));
  });

  it("github_list_issues filters out pull requests", async () => {
    mockOctokit.rest.issues.listForRepo.mockResolvedValue({
      data: [
        { number: 1, title: "Bug fix", state: "open", labels: [{ name: "bug" }], assignees: [], created_at: "2024-01-01", updated_at: "2024-01-02", html_url: "https://github.com/user/repo/issues/1", comments: 2, user: { login: "alice" }, pull_request: undefined },
        { number: 2, title: "PR title", state: "open", labels: [], assignees: [], created_at: "2024-01-01", updated_at: "2024-01-02", html_url: "https://github.com/user/repo/pull/2", comments: 0, user: { login: "bob" }, pull_request: { url: "..." } },
      ],
    });

    const result = await executeGitHubTool("github_list_issues", { owner: "user", repo: "repo" }) as Array<{ number: number; title: string }>;
    expect(result).toHaveLength(1);
    expect(result[0]!.number).toBe(1);
  });

  it("github_create_issue creates with title and body", async () => {
    mockOctokit.rest.issues.create.mockResolvedValue({
      data: { number: 5, title: "New Issue", html_url: "https://github.com/user/repo/issues/5", state: "open" },
    });

    const result = await executeGitHubTool("github_create_issue", { owner: "user", repo: "repo", title: "New Issue", body: "Description here" }) as { number: number; title: string };
    expect(result.number).toBe(5);
    expect(result.title).toBe("New Issue");
  });

  it("github_list_prs returns PR list", async () => {
    mockOctokit.rest.pulls.list.mockResolvedValue({
      data: [
        { number: 10, title: "Feature PR", state: "open", draft: false, head: { ref: "feature/x" }, base: { ref: "main" }, user: { login: "dev" }, created_at: "2024-01-01", updated_at: "2024-01-02", html_url: "https://github.com/user/repo/pull/10" },
      ],
    });

    const result = await executeGitHubTool("github_list_prs", { owner: "user", repo: "repo" }) as Array<{ number: number; head: string }>;
    expect(result).toHaveLength(1);
    expect(result[0]!.head).toBe("feature/x");
  });

  it("github_create_branch creates from default branch", async () => {
    mockOctokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: "abc123" } } });
    mockOctokit.rest.git.createRef.mockResolvedValue({});

    const result = await executeGitHubTool("github_create_branch", { owner: "user", repo: "repo", branch: "feature/new" }) as { success: boolean; branch: string; sha: string };
    expect(result.success).toBe(true);
    expect(result.branch).toBe("feature/new");
    expect(result.sha).toBe("abc123");
  });

  it("github_get_file decodes base64 content", async () => {
    const content = Buffer.from("console.log('hello');").toString("base64");
    mockOctokit.rest.repos.getContent.mockResolvedValue({
      data: { type: "file", name: "index.js", path: "index.js", sha: "def456", size: 21, content, encoding: "base64", html_url: "https://github.com/user/repo/blob/main/index.js" },
    });

    const result = await executeGitHubTool("github_get_file", { owner: "user", repo: "repo", path: "index.js" }) as { content: string; name: string };
    expect(result.name).toBe("index.js");
    expect(result.content).toBe("console.log('hello');");
  });

  it("github_search_repos returns results", async () => {
    mockOctokit.rest.search.repos.mockResolvedValue({
      data: {
        total_count: 1,
        items: [{ name: "stripe-js", full_name: "stripe/stripe-js", description: "Stripe JS SDK", language: "TypeScript", stargazers_count: 5000, forks_count: 300, html_url: "https://github.com/stripe/stripe-js" }],
      },
    });

    const result = await executeGitHubTool("github_search_repos", { q: "stripe typescript" }) as { total_count: number; items: Array<{ name: string }> };
    expect(result.total_count).toBe(1);
    expect(result.items[0]!.name).toBe("stripe-js");
  });

  it("github_get_authenticated_user returns user info", async () => {
    mockOctokit.rest.users.getAuthenticated.mockResolvedValue({
      data: { login: "testuser", name: "Test User", email: "test@example.com", bio: "Developer", public_repos: 20, followers: 100, following: 50, html_url: "https://github.com/testuser", created_at: "2020-01-01" },
    });

    const result = await executeGitHubTool("github_get_authenticated_user", {}) as { login: string; public_repos: number };
    expect(result.login).toBe("testuser");
    expect(result.public_repos).toBe(20);
  });

  it("throws for unknown tool name", async () => {
    await expect(executeGitHubTool("github_unknown_tool", {})).rejects.toThrow("Unknown GitHub tool: github_unknown_tool");
  });
});
