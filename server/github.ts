import { Octokit } from "@octokit/rest";

let _octokit: Octokit | null = null;

export function getOctokit(): Octokit {
  if (!_octokit) {
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error("No GitHub token found. Set GH_TOKEN or GITHUB_TOKEN environment variable.");
    }
    _octokit = new Octokit({ auth: token });
  }
  return _octokit;
}

export default getOctokit;
