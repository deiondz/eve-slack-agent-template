import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { assertOrganizationRepository } from "./repositories.js";

const execFileAsync = promisify(execFile);
const CACHE_TTL_MS = 5 * 60 * 1_000;

interface CacheEntry<T> {
  expiresAt: number;
  value: Promise<T>;
}

const writableRepositoryCache = new Map<string, CacheEntry<unknown>>();
const githubProfileCache = new Map<string, CacheEntry<GitHubUserProfile>>();

function cached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  load: () => Promise<T>,
): Promise<T> {
  const existing = cache.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.value;
  const value = load();
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  void value.catch(() => cache.delete(key));
  return value;
}

export interface GhRunner {
  (args: readonly string[]): Promise<string>;
}

export const runGh: GhRunner = async (args) => {
  try {
    const { stdout } = await execFileAsync("gh", [...args], {
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout.trim();
  } catch (error) {
    const detail =
      typeof error === "object" && error !== null && "stderr" in error
        ? String(error.stderr).trim()
        : String(error);
    throw new Error(
      `gh CLI failed. Ensure gh is installed and GH_TOKEN or gh auth is configured. ${detail}`,
    );
  }
};

export async function verifyWritableRepository(repo: string, gh: GhRunner = runGh) {
  assertOrganizationRepository(repo);
  if (gh === runGh) {
    return cached(writableRepositoryCache, repo, () =>
      verifyWritableRepositoryUncached(repo, gh),
    );
  }
  return verifyWritableRepositoryUncached(repo, gh);
}

async function verifyWritableRepositoryUncached(repo: string, gh: GhRunner) {
  const output = await gh([
    "repo",
    "view",
    repo,
    "--json",
    "nameWithOwner,isArchived,viewerPermission,url",
  ]);
  const parsed = JSON.parse(output) as {
    isArchived?: boolean;
    nameWithOwner?: string;
    url?: string;
    viewerPermission?: string;
  };
  if (parsed.isArchived) throw new Error(`${repo} is archived.`);
  if (!parsed.viewerPermission || !["ADMIN", "MAINTAIN", "WRITE"].includes(parsed.viewerPermission)) {
    throw new Error(`The configured GitHub identity cannot write to ${repo}.`);
  }
  return parsed;
}

export interface GitHubIssueSummary {
  body: string;
  number: number;
  title: string;
  url: string;
}

export async function listOpenIssues(repo: string, gh: GhRunner = runGh) {
  assertOrganizationRepository(repo);
  const [, output] = await Promise.all([
    verifyWritableRepository(repo, gh),
    gh([
      "issue",
      "list",
      "--repo",
      repo,
      "--state",
      "open",
      "--limit",
      "100",
      "--json",
      "number,title,body,url",
    ]),
  ]);
  return JSON.parse(output) as GitHubIssueSummary[];
}

export async function listRepositoryLabels(repo: string, gh: GhRunner = runGh) {
  const output = await gh([
    "label",
    "list",
    "--repo",
    repo,
    "--limit",
    "200",
    "--json",
    "name",
  ]);
  return (JSON.parse(output) as Array<{ name: string }>).map((label) => label.name);
}

export async function findIssueByThreadMarker(
  repo: string,
  marker: string,
  gh: GhRunner = runGh,
): Promise<GitHubIssueSummary | undefined> {
  const output = await gh([
    "issue",
    "list",
    "--repo",
    repo,
    "--state",
    "all",
    "--limit",
    "500",
    "--json",
    "number,title,body,url",
  ]);
  return (JSON.parse(output) as GitHubIssueSummary[]).find((issue) =>
    issue.body.includes(marker),
  );
}

export interface CreateIssueInput {
  body: string;
  labels: readonly string[];
  repo: string;
  title: string;
}

export async function createGitHubIssue(input: CreateIssueInput, gh: GhRunner = runGh) {
  assertOrganizationRepository(input.repo);
  const [, repositoryLabels] = await Promise.all([
    verifyWritableRepository(input.repo, gh),
    listRepositoryLabels(input.repo, gh),
  ]);
  const existingLabels = new Set(repositoryLabels);
  const labels = input.labels.filter((label) => existingLabels.has(label));
  const args = [
    "issue",
    "create",
    "--repo",
    input.repo,
    "--title",
    input.title,
    "--body",
    input.body,
  ];
  for (const label of labels) args.push("--label", label);
  const url = await gh(args);
  const match = /\/issues\/(\d+)(?:\s|$)/.exec(url);
  if (!match) throw new Error(`gh did not return a GitHub issue URL: ${url}`);
  return { number: Number(match[1]), url, labels };
}

export async function commentOnIssue(input: {
  body: string;
  number: number;
  repo: string;
}, gh: GhRunner = runGh) {
  return gh([
    "issue",
    "comment",
    String(input.number),
    "--repo",
    input.repo,
    "--body",
    input.body,
  ]);
}

export async function getGitHubIssue(input: {
  number: number;
  repo: string;
}, gh: GhRunner = runGh): Promise<GitHubIssueSummary & { state: string }> {
  const output = await gh([
    "issue",
    "view",
    String(input.number),
    "--repo",
    input.repo,
    "--json",
    "number,title,body,url,state",
  ]);
  return JSON.parse(output) as GitHubIssueSummary & { state: string };
}

export async function issueHasCommentMarker(input: {
  marker: string;
  number: number;
  repo: string;
}, gh: GhRunner = runGh) {
  const output = await gh([
    "issue",
    "view",
    String(input.number),
    "--repo",
    input.repo,
    "--json",
    "comments",
  ]);
  const parsed = JSON.parse(output) as { comments: Array<{ body: string }> };
  return parsed.comments.some((comment) => comment.body.includes(input.marker));
}

export async function assignGitHubIssue(input: {
  assignee: string;
  number: number;
  repo: string;
}, gh: GhRunner = runGh) {
  assertOrganizationRepository(input.repo);
  await Promise.all([
    verifyWritableRepository(input.repo, gh),
    gh(["api", `repos/${input.repo}/collaborators/${input.assignee}`]),
  ]);
  await gh([
    "issue",
    "edit",
    String(input.number),
    "--repo",
    input.repo,
    "--add-assignee",
    input.assignee,
  ]);
  return { assignee: input.assignee, number: input.number, repo: input.repo };
}

export async function listCollaborators(repo: string, gh: GhRunner = runGh) {
  assertOrganizationRepository(repo);
  const [, output] = await Promise.all([
    verifyWritableRepository(repo, gh),
    gh([
      "api",
      "--paginate",
      `repos/${repo}/collaborators?per_page=100`,
      "--jq",
      ".[] | @json",
    ]),
  ]);
  const users = output
    .split("\n")
    .filter(Boolean)
    .map(
      (line) =>
        JSON.parse(line) as { login: string; permissions?: { push?: boolean } },
    );
  return users.filter((user) => user.permissions?.push).map((user) => user.login);
}

export interface GitHubUserProfile {
  email?: string;
  login: string;
  name?: string;
}

export function getGitHubUserProfile(login: string): Promise<GitHubUserProfile> {
  return cached(githubProfileCache, login, async () => {
    const output = await runGh(["api", `users/${login}`]);
    const profile = JSON.parse(output) as GitHubUserProfile;
    return { login: profile.login, name: profile.name, email: profile.email };
  });
}
