import { getOctokit } from "./github";

// ─── Tool Definitions for LLM ────────────────────────────────────────────────

export const GITHUB_TOOLS = [
  // Repos
  {
    type: "function" as const,
    function: {
      name: "github_list_repos",
      description: "List GitHub repositories for the authenticated user or a specific org/user. Use this to browse available repos.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub username or org to list repos for. Defaults to authenticated user." },
          type: { type: "string", enum: ["all", "owner", "public", "private", "member"], description: "Filter repos by type. Default: all" },
          sort: { type: "string", enum: ["created", "updated", "pushed", "full_name"], description: "Sort order. Default: updated" },
          per_page: { type: "number", description: "Number of repos to return (max 100). Default: 30" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_get_repo",
      description: "Get detailed information about a specific GitHub repository including description, stars, forks, language, and topics.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner (username or org)" },
          repo: { type: "string", description: "Repository name" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_create_repo",
      description: "Create a new GitHub repository.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Repository name" },
          description: { type: "string", description: "Short description of the repository" },
          private: { type: "boolean", description: "Whether the repo should be private. Default: true" },
          auto_init: { type: "boolean", description: "Initialize with a README. Default: true" },
          gitignore_template: { type: "string", description: "Gitignore template (e.g. Node, Python)" },
          license_template: { type: "string", description: "License template (e.g. mit, apache-2.0)" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_delete_repo",
      description: "Delete a GitHub repository. This is irreversible — use with caution.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_fork_repo",
      description: "Fork a GitHub repository into the authenticated user's account.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Original repo owner" },
          repo: { type: "string", description: "Original repo name" },
          organization: { type: "string", description: "Optional org to fork into" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_star_repo",
      description: "Star or unstar a GitHub repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          action: { type: "string", enum: ["star", "unstar"], description: "Whether to star or unstar" },
        },
        required: ["owner", "repo", "action"],
      },
    },
  },
  // Issues
  {
    type: "function" as const,
    function: {
      name: "github_list_issues",
      description: "List issues for a repository. Can filter by state, labels, and assignee.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          state: { type: "string", enum: ["open", "closed", "all"], description: "Issue state. Default: open" },
          labels: { type: "string", description: "Comma-separated list of label names" },
          assignee: { type: "string", description: "Filter by assignee username" },
          per_page: { type: "number", description: "Number of issues to return. Default: 20" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_get_issue",
      description: "Get details of a specific issue including body, comments count, labels, and assignees.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          issue_number: { type: "number", description: "Issue number" },
        },
        required: ["owner", "repo", "issue_number"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_create_issue",
      description: "Create a new issue in a repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          title: { type: "string", description: "Issue title" },
          body: { type: "string", description: "Issue body (markdown supported)" },
          labels: { type: "array", items: { type: "string" }, description: "Array of label names" },
          assignees: { type: "array", items: { type: "string" }, description: "Array of usernames to assign" },
        },
        required: ["owner", "repo", "title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_update_issue",
      description: "Update an existing issue — change title, body, state, labels, or assignees.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          issue_number: { type: "number", description: "Issue number" },
          title: { type: "string", description: "New title" },
          body: { type: "string", description: "New body" },
          state: { type: "string", enum: ["open", "closed"], description: "New state" },
          labels: { type: "array", items: { type: "string" }, description: "New labels" },
        },
        required: ["owner", "repo", "issue_number"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_add_issue_comment",
      description: "Add a comment to an existing issue or pull request.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          issue_number: { type: "number", description: "Issue or PR number" },
          body: { type: "string", description: "Comment body (markdown supported)" },
        },
        required: ["owner", "repo", "issue_number", "body"],
      },
    },
  },
  // Pull Requests
  {
    type: "function" as const,
    function: {
      name: "github_list_prs",
      description: "List pull requests for a repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          state: { type: "string", enum: ["open", "closed", "all"], description: "PR state. Default: open" },
          per_page: { type: "number", description: "Number of PRs to return. Default: 20" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_get_pr",
      description: "Get details of a specific pull request including diff stats, reviewers, and merge status.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          pull_number: { type: "number", description: "Pull request number" },
        },
        required: ["owner", "repo", "pull_number"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_create_pr",
      description: "Create a new pull request.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          title: { type: "string", description: "PR title" },
          body: { type: "string", description: "PR description (markdown supported)" },
          head: { type: "string", description: "Branch to merge from (e.g. feature/my-feature)" },
          base: { type: "string", description: "Branch to merge into (e.g. main)" },
          draft: { type: "boolean", description: "Create as draft PR" },
        },
        required: ["owner", "repo", "title", "head", "base"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_merge_pr",
      description: "Merge a pull request.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          pull_number: { type: "number", description: "Pull request number" },
          commit_title: { type: "string", description: "Merge commit title" },
          merge_method: { type: "string", enum: ["merge", "squash", "rebase"], description: "Merge method. Default: merge" },
        },
        required: ["owner", "repo", "pull_number"],
      },
    },
  },
  // Branches
  {
    type: "function" as const,
    function: {
      name: "github_list_branches",
      description: "List branches in a repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          per_page: { type: "number", description: "Number of branches to return. Default: 30" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_create_branch",
      description: "Create a new branch in a repository from an existing branch or commit SHA.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          branch: { type: "string", description: "New branch name" },
          from_branch: { type: "string", description: "Branch to create from. Default: main" },
        },
        required: ["owner", "repo", "branch"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_delete_branch",
      description: "Delete a branch from a repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          branch: { type: "string", description: "Branch name to delete" },
        },
        required: ["owner", "repo", "branch"],
      },
    },
  },
  // Files & Contents
  {
    type: "function" as const,
    function: {
      name: "github_get_file",
      description: "Get the contents of a file in a repository. Returns decoded file content.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          path: { type: "string", description: "File path (e.g. src/index.ts)" },
          ref: { type: "string", description: "Branch, tag, or commit SHA. Default: default branch" },
        },
        required: ["owner", "repo", "path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_list_directory",
      description: "List files and directories at a given path in a repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          path: { type: "string", description: "Directory path. Use empty string or '/' for root." },
          ref: { type: "string", description: "Branch, tag, or commit SHA. Default: default branch" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_create_or_update_file",
      description: "Create a new file or update an existing file in a repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          path: { type: "string", description: "File path" },
          message: { type: "string", description: "Commit message" },
          content: { type: "string", description: "File content (plain text, will be base64 encoded)" },
          branch: { type: "string", description: "Branch to commit to. Default: default branch" },
        },
        required: ["owner", "repo", "path", "message", "content"],
      },
    },
  },
  // Commits
  {
    type: "function" as const,
    function: {
      name: "github_list_commits",
      description: "List commits for a repository or a specific branch/file.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          sha: { type: "string", description: "Branch name or commit SHA to start from" },
          path: { type: "string", description: "Only commits touching this file path" },
          per_page: { type: "number", description: "Number of commits. Default: 20" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_get_commit",
      description: "Get details of a specific commit including files changed and diff stats.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          ref: { type: "string", description: "Commit SHA" },
        },
        required: ["owner", "repo", "ref"],
      },
    },
  },
  // Releases
  {
    type: "function" as const,
    function: {
      name: "github_list_releases",
      description: "List releases for a repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          per_page: { type: "number", description: "Number of releases. Default: 10" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_create_release",
      description: "Create a new release for a repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          tag_name: { type: "string", description: "Tag name for the release (e.g. v1.0.0)" },
          name: { type: "string", description: "Release title" },
          body: { type: "string", description: "Release notes (markdown supported)" },
          draft: { type: "boolean", description: "Create as draft. Default: false" },
          prerelease: { type: "boolean", description: "Mark as pre-release. Default: false" },
          target_commitish: { type: "string", description: "Branch or commit SHA for the tag. Default: default branch" },
        },
        required: ["owner", "repo", "tag_name"],
      },
    },
  },
  // Search
  {
    type: "function" as const,
    function: {
      name: "github_search_repos",
      description: "Search GitHub repositories by keyword, language, stars, or other criteria.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search query (e.g. 'stripe payment language:typescript stars:>100')" },
          sort: { type: "string", enum: ["stars", "forks", "help-wanted-issues", "updated"], description: "Sort by. Default: best match" },
          order: { type: "string", enum: ["asc", "desc"], description: "Sort order. Default: desc" },
          per_page: { type: "number", description: "Number of results. Default: 10" },
        },
        required: ["q"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_search_code",
      description: "Search for code across GitHub repositories.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search query (e.g. 'useState repo:facebook/react')" },
          per_page: { type: "number", description: "Number of results. Default: 10" },
        },
        required: ["q"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_search_issues",
      description: "Search for issues and pull requests across GitHub.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search query (e.g. 'is:open label:bug repo:owner/repo')" },
          per_page: { type: "number", description: "Number of results. Default: 10" },
        },
        required: ["q"],
      },
    },
  },
  // Stats & Info
  {
    type: "function" as const,
    function: {
      name: "github_get_repo_stats",
      description: "Get repository statistics: contributors, commit activity, code frequency, and language breakdown.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          stat: { type: "string", enum: ["contributors", "languages", "participation", "punch_card"], description: "Which stat to retrieve" },
        },
        required: ["owner", "repo", "stat"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_get_authenticated_user",
      description: "Get the profile of the currently authenticated GitHub user.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_list_user_orgs",
      description: "List organizations the authenticated user belongs to.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  // Labels
  {
    type: "function" as const,
    function: {
      name: "github_list_labels",
      description: "List labels for a repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
        },
        required: ["owner", "repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "github_create_label",
      description: "Create a new label in a repository.",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          name: { type: "string", description: "Label name" },
          color: { type: "string", description: "Hex color without # (e.g. ff0000)" },
          description: { type: "string", description: "Label description" },
        },
        required: ["owner", "repo", "name", "color"],
      },
    },
  },
] as const;

// ─── Tool Executor ────────────────────────────────────────────────────────────

export async function executeGitHubTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const octokit = getOctokit();

  switch (name) {
    // ── Repos ──────────────────────────────────────────────────────────────
    case "github_list_repos": {
      const owner = args.owner as string | undefined;
      if (owner) {
        const res = await octokit.rest.repos.listForUser({
          username: owner,
          type: (args.type as "all" | "owner" | "member") || "all",
          sort: (args.sort as "created" | "updated" | "pushed" | "full_name") || "updated",
          per_page: (args.per_page as number) || 30,
        });
        return res.data.map(r => ({ id: r.id, name: r.name, full_name: r.full_name, description: r.description, private: r.private, language: r.language, stars: r.stargazers_count, forks: r.forks_count, updated_at: r.updated_at, html_url: r.html_url }));
      } else {
        const res = await octokit.rest.repos.listForAuthenticatedUser({
          type: (args.type as "all" | "owner" | "public" | "private" | "member") || "all",
          sort: (args.sort as "created" | "updated" | "pushed" | "full_name") || "updated",
          per_page: (args.per_page as number) || 30,
        });
        return res.data.map(r => ({ id: r.id, name: r.name, full_name: r.full_name, description: r.description, private: r.private, language: r.language, stars: r.stargazers_count, forks: r.forks_count, updated_at: r.updated_at, html_url: r.html_url }));
      }
    }

    case "github_get_repo": {
      const res = await octokit.rest.repos.get({ owner: args.owner as string, repo: args.repo as string });
      const r = res.data;
      return { name: r.name, full_name: r.full_name, description: r.description, private: r.private, language: r.language, stars: r.stargazers_count, forks: r.forks_count, open_issues: r.open_issues_count, default_branch: r.default_branch, topics: r.topics, created_at: r.created_at, updated_at: r.updated_at, pushed_at: r.pushed_at, html_url: r.html_url, clone_url: r.clone_url, size: r.size };
    }

    case "github_create_repo": {
      const res = await octokit.rest.repos.createForAuthenticatedUser({
        name: args.name as string,
        description: args.description as string | undefined,
        private: args.private !== false,
        auto_init: args.auto_init !== false,
        gitignore_template: args.gitignore_template as string | undefined,
        license_template: args.license_template as string | undefined,
      });
      return { name: res.data.name, full_name: res.data.full_name, html_url: res.data.html_url, clone_url: res.data.clone_url, private: res.data.private };
    }

    case "github_delete_repo": {
      await octokit.rest.repos.delete({ owner: args.owner as string, repo: args.repo as string });
      return { success: true, message: `Repository ${args.owner}/${args.repo} deleted.` };
    }

    case "github_fork_repo": {
      const res = await octokit.rest.repos.createFork({
        owner: args.owner as string,
        repo: args.repo as string,
        organization: args.organization as string | undefined,
      });
      return { name: res.data.name, full_name: res.data.full_name, html_url: res.data.html_url };
    }

    case "github_star_repo": {
      if (args.action === "star") {
        await octokit.rest.activity.starRepoForAuthenticatedUser({ owner: args.owner as string, repo: args.repo as string });
        return { success: true, message: `Starred ${args.owner}/${args.repo}` };
      } else {
        await octokit.rest.activity.unstarRepoForAuthenticatedUser({ owner: args.owner as string, repo: args.repo as string });
        return { success: true, message: `Unstarred ${args.owner}/${args.repo}` };
      }
    }

    // ── Issues ─────────────────────────────────────────────────────────────
    case "github_list_issues": {
      const res = await octokit.rest.issues.listForRepo({
        owner: args.owner as string,
        repo: args.repo as string,
        state: (args.state as "open" | "closed" | "all") || "open",
        labels: args.labels as string | undefined,
        assignee: args.assignee as string | undefined,
        per_page: (args.per_page as number) || 20,
      });
      return res.data
        .filter(i => !i.pull_request)
        .map(i => ({ number: i.number, title: i.title, state: i.state, labels: i.labels.map((l: unknown) => (typeof l === 'string' ? l : (l as { name?: string }).name)), assignees: i.assignees?.map((a: { login: string }) => a.login), created_at: i.created_at, updated_at: i.updated_at, html_url: i.html_url, comments: i.comments }));
    }

    case "github_get_issue": {
      const res = await octokit.rest.issues.get({ owner: args.owner as string, repo: args.repo as string, issue_number: args.issue_number as number });
      const i = res.data;
      return { number: i.number, title: i.title, body: i.body, state: i.state, labels: i.labels.map((l: unknown) => (typeof l === 'string' ? l : (l as { name?: string }).name)), assignees: i.assignees?.map((a: { login: string }) => a.login), created_at: i.created_at, updated_at: i.updated_at, html_url: i.html_url, comments: i.comments };
    }

    case "github_create_issue": {
      const res = await octokit.rest.issues.create({
        owner: args.owner as string,
        repo: args.repo as string,
        title: args.title as string,
        body: args.body as string | undefined,
        labels: args.labels as string[] | undefined,
        assignees: args.assignees as string[] | undefined,
      });
      return { number: res.data.number, title: res.data.title, html_url: res.data.html_url, state: res.data.state };
    }

    case "github_update_issue": {
      const res = await octokit.rest.issues.update({
        owner: args.owner as string,
        repo: args.repo as string,
        issue_number: args.issue_number as number,
        title: args.title as string | undefined,
        body: args.body as string | undefined,
        state: args.state as "open" | "closed" | undefined,
        labels: args.labels as string[] | undefined,
      });
      return { number: res.data.number, title: res.data.title, state: res.data.state, html_url: res.data.html_url };
    }

    case "github_add_issue_comment": {
      const res = await octokit.rest.issues.createComment({
        owner: args.owner as string,
        repo: args.repo as string,
        issue_number: args.issue_number as number,
        body: args.body as string,
      });
      return { id: res.data.id, html_url: res.data.html_url, created_at: res.data.created_at };
    }

    // ── Pull Requests ──────────────────────────────────────────────────────
    case "github_list_prs": {
      const res = await octokit.rest.pulls.list({
        owner: args.owner as string,
        repo: args.repo as string,
        state: (args.state as "open" | "closed" | "all") || "open",
        per_page: (args.per_page as number) || 20,
      });
      return res.data.map(p => ({ number: p.number, title: p.title, state: p.state, draft: p.draft, head: p.head.ref, base: p.base.ref, user: p.user?.login, created_at: p.created_at, updated_at: p.updated_at, html_url: p.html_url }));
    }

    case "github_get_pr": {
      const res = await octokit.rest.pulls.get({ owner: args.owner as string, repo: args.repo as string, pull_number: args.pull_number as number });
      const p = res.data;
      return { number: p.number, title: p.title, body: p.body, state: p.state, draft: p.draft, head: p.head.ref, base: p.base.ref, user: p.user?.login, additions: p.additions, deletions: p.deletions, changed_files: p.changed_files, mergeable: p.mergeable, html_url: p.html_url };
    }

    case "github_create_pr": {
      const res = await octokit.rest.pulls.create({
        owner: args.owner as string,
        repo: args.repo as string,
        title: args.title as string,
        body: args.body as string | undefined,
        head: args.head as string,
        base: args.base as string,
        draft: args.draft as boolean | undefined,
      });
      return { number: res.data.number, title: res.data.title, html_url: res.data.html_url, state: res.data.state };
    }

    case "github_merge_pr": {
      const res = await octokit.rest.pulls.merge({
        owner: args.owner as string,
        repo: args.repo as string,
        pull_number: args.pull_number as number,
        commit_title: args.commit_title as string | undefined,
        merge_method: (args.merge_method as "merge" | "squash" | "rebase") || "merge",
      });
      return { merged: res.data.merged, sha: res.data.sha, message: res.data.message };
    }

    // ── Branches ───────────────────────────────────────────────────────────
    case "github_list_branches": {
      const res = await octokit.rest.repos.listBranches({ owner: args.owner as string, repo: args.repo as string, per_page: (args.per_page as number) || 30 });
      return res.data.map(b => ({ name: b.name, sha: b.commit.sha, protected: b.protected }));
    }

    case "github_create_branch": {
      const fromBranch = (args.from_branch as string) || "main";
      const refRes = await octokit.rest.git.getRef({ owner: args.owner as string, repo: args.repo as string, ref: `heads/${fromBranch}` });
      const sha = refRes.data.object.sha;
      await octokit.rest.git.createRef({ owner: args.owner as string, repo: args.repo as string, ref: `refs/heads/${args.branch}`, sha });
      return { success: true, branch: args.branch, from: fromBranch, sha };
    }

    case "github_delete_branch": {
      await octokit.rest.git.deleteRef({ owner: args.owner as string, repo: args.repo as string, ref: `heads/${args.branch}` });
      return { success: true, message: `Branch ${args.branch} deleted.` };
    }

    // ── Files ──────────────────────────────────────────────────────────────
    case "github_get_file": {
      const res = await octokit.rest.repos.getContent({ owner: args.owner as string, repo: args.repo as string, path: args.path as string, ref: args.ref as string | undefined });
      const data = res.data as { type: string; content?: string; encoding?: string; name: string; path: string; sha: string; size: number; html_url: string | null };
      if (data.type !== "file") return { error: "Path is not a file", type: data.type };
      const content = data.content && data.encoding === "base64" ? Buffer.from(data.content, "base64").toString("utf-8") : data.content;
      return { name: data.name, path: data.path, sha: data.sha, size: data.size, content: content?.slice(0, 8000), truncated: (content?.length ?? 0) > 8000, html_url: data.html_url };
    }

    case "github_list_directory": {
      const res = await octokit.rest.repos.getContent({ owner: args.owner as string, repo: args.repo as string, path: (args.path as string) || "", ref: args.ref as string | undefined });
      const items = Array.isArray(res.data) ? res.data : [res.data];
      return items.map((item: { type: string; name: string; path: string; size: number; sha: string }) => ({ type: item.type, name: item.name, path: item.path, size: item.size, sha: item.sha }));
    }

    case "github_create_or_update_file": {
      const owner = args.owner as string;
      const repo = args.repo as string;
      const path = args.path as string;
      const content = Buffer.from(args.content as string).toString("base64");
      // Check if file exists to get SHA for update
      let sha: string | undefined;
      try {
        const existing = await octokit.rest.repos.getContent({ owner, repo, path });
        const data = existing.data as { sha?: string };
        sha = data.sha;
      } catch { /* file doesn't exist, create it */ }
      const res = await octokit.rest.repos.createOrUpdateFileContents({ owner, repo, path, message: args.message as string, content, sha, branch: args.branch as string | undefined });
      return { commit_sha: res.data.commit.sha, html_url: res.data.content?.html_url, action: sha ? "updated" : "created" };
    }

    // ── Commits ────────────────────────────────────────────────────────────
    case "github_list_commits": {
      const res = await octokit.rest.repos.listCommits({
        owner: args.owner as string,
        repo: args.repo as string,
        sha: args.sha as string | undefined,
        path: args.path as string | undefined,
        per_page: (args.per_page as number) || 20,
      });
      return res.data.map(c => ({ sha: c.sha.slice(0, 7), message: c.commit.message.split("\n")[0], author: c.commit.author?.name, date: c.commit.author?.date, html_url: c.html_url }));
    }

    case "github_get_commit": {
      const res = await octokit.rest.repos.getCommit({ owner: args.owner as string, repo: args.repo as string, ref: args.ref as string });
      const c = res.data;
      return { sha: c.sha, message: c.commit.message, author: c.commit.author?.name, date: c.commit.author?.date, additions: c.stats?.additions, deletions: c.stats?.deletions, files: c.files?.slice(0, 20).map(f => ({ filename: f.filename, status: f.status, additions: f.additions, deletions: f.deletions })) };
    }

    // ── Releases ───────────────────────────────────────────────────────────
    case "github_list_releases": {
      const res = await octokit.rest.repos.listReleases({ owner: args.owner as string, repo: args.repo as string, per_page: (args.per_page as number) || 10 });
      return res.data.map(r => ({ id: r.id, tag_name: r.tag_name, name: r.name, draft: r.draft, prerelease: r.prerelease, created_at: r.created_at, published_at: r.published_at, html_url: r.html_url }));
    }

    case "github_create_release": {
      const res = await octokit.rest.repos.createRelease({
        owner: args.owner as string,
        repo: args.repo as string,
        tag_name: args.tag_name as string,
        name: args.name as string | undefined,
        body: args.body as string | undefined,
        draft: args.draft as boolean | undefined,
        prerelease: args.prerelease as boolean | undefined,
        target_commitish: args.target_commitish as string | undefined,
      });
      return { id: res.data.id, tag_name: res.data.tag_name, name: res.data.name, html_url: res.data.html_url };
    }

    // ── Search ─────────────────────────────────────────────────────────────
    case "github_search_repos": {
      const res = await octokit.rest.search.repos({
        q: args.q as string,
        sort: args.sort as "stars" | "forks" | "help-wanted-issues" | "updated" | undefined,
        order: args.order as "asc" | "desc" | undefined,
        per_page: (args.per_page as number) || 10,
      });
      return { total_count: res.data.total_count, items: res.data.items.map(r => ({ name: r.name, full_name: r.full_name, description: r.description, language: r.language, stars: r.stargazers_count, forks: r.forks_count, html_url: r.html_url })) };
    }

    case "github_search_code": {
      const res = await octokit.rest.search.code({ q: args.q as string, per_page: (args.per_page as number) || 10 });
      return { total_count: res.data.total_count, items: res.data.items.map(i => ({ name: i.name, path: i.path, repository: i.repository.full_name, html_url: i.html_url })) };
    }

    case "github_search_issues": {
      const res = await octokit.rest.search.issuesAndPullRequests({ q: args.q as string, per_page: (args.per_page as number) || 10 });
      return { total_count: res.data.total_count, items: res.data.items.map(i => ({ number: i.number, title: i.title, state: i.state, repository: i.repository_url.split("/").slice(-2).join("/"), html_url: i.html_url, created_at: i.created_at })) };
    }

    // ── Stats ──────────────────────────────────────────────────────────────
    case "github_get_repo_stats": {
      const owner = args.owner as string;
      const repo = args.repo as string;
      switch (args.stat) {
        case "contributors": { const r = await octokit.rest.repos.getContributorsStats({ owner, repo }); return r.data; }
        case "languages": { const r = await octokit.rest.repos.listLanguages({ owner, repo }); return r.data; }
        case "participation": { const r = await octokit.rest.repos.getParticipationStats({ owner, repo }); return r.data; }
        case "punch_card": { const r = await octokit.rest.repos.getPunchCardStats({ owner, repo }); return r.data; }
        default: return { error: "Unknown stat type" };
      }
    }

    case "github_get_authenticated_user": {
      const res = await octokit.rest.users.getAuthenticated();
      const u = res.data;
      return { login: u.login, name: u.name, email: u.email, bio: u.bio, public_repos: u.public_repos, followers: u.followers, following: u.following, html_url: u.html_url, created_at: u.created_at };
    }

    case "github_list_user_orgs": {
      const res = await octokit.rest.orgs.listForAuthenticatedUser();
      return res.data.map(o => ({ login: o.login, description: o.description }));
    }

    // ── Labels ─────────────────────────────────────────────────────────────
    case "github_list_labels": {
      const res = await octokit.rest.issues.listLabelsForRepo({ owner: args.owner as string, repo: args.repo as string });
      return res.data.map(l => ({ name: l.name, color: l.color, description: l.description }));
    }

    case "github_create_label": {
      const res = await octokit.rest.issues.createLabel({ owner: args.owner as string, repo: args.repo as string, name: args.name as string, color: args.color as string, description: args.description as string | undefined });
      return { name: res.data.name, color: res.data.color, html_url: res.data.url };
    }

    default:
      throw new Error(`Unknown GitHub tool: ${name}`);
  }
}
