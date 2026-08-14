import {
  getGitHubUserProfile,
  listCollaborators,
  listOpenIssues,
  type GitHubIssueSummary,
} from "./github.js";
import { rankOwnerMatches, type SuggestedIssueOwner } from "./owners.js";
import { issueRepositories } from "./repositories.js";
import { listSlackIdentities } from "./slack.js";

interface OwnerSuggestions {
  matches: SuggestedIssueOwner[];
  source: string;
}

interface IntakeDependencies {
  listOpenIssues(repo: string): Promise<GitHubIssueSummary[]>;
  suggestOwners(repo: string): Promise<OwnerSuggestions>;
}

const defaultDependencies: IntakeDependencies = {
  listOpenIssues,
  suggestOwners: suggestIssueOwners,
};

const TITLE_STOP_WORDS = new Set([
  "a",
  "after",
  "an",
  "and",
  "app",
  "for",
  "in",
  "is",
  "of",
  "on",
  "the",
  "to",
  "with",
]);

function titleTerms(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/\bsign[ -]?in\b/gu, "login")
      .split(/[^a-z0-9]+/u)
      .map((term) =>
        ["auth", "authenticate", "authenticated", "authentication"].includes(term)
          ? "login"
          : term,
      )
      .filter((term) => term.length > 1 && !TITLE_STOP_WORDS.has(term)),
  );
}

export function planIssueDiscovery(input: {
  hasConfirmedNewIssue: boolean;
  hasExistingThread: boolean;
  hasSuggestedOwners: boolean;
}) {
  return {
    findDuplicate:
      !input.hasExistingThread &&
      !input.hasConfirmedNewIssue,
    findOwners: !input.hasExistingThread && !input.hasSuggestedOwners,
  };
}

export function resolveDuplicateSelection(input: {
  candidates: readonly GitHubIssueSummary[];
  requestedIssueNumber?: number;
  strongDuplicate?: GitHubIssueSummary;
}):
  | { kind: "invalid"; requestedIssueNumber: number }
  | { kind: "none" }
  | { issue: GitHubIssueSummary; kind: "selected" } {
  if (input.requestedIssueNumber !== undefined) {
    const issue = input.candidates.find(
      (candidate) => candidate.number === input.requestedIssueNumber,
    );
    return issue
      ? { kind: "selected", issue }
      : { kind: "invalid", requestedIssueNumber: input.requestedIssueNumber };
  }
  return input.strongDuplicate
    ? { kind: "selected", issue: input.strongDuplicate }
    : { kind: "none" };
}

export function rankDuplicateCandidates(
  issues: readonly GitHubIssueSummary[],
  report: string,
): GitHubIssueSummary[] {
  return rankDuplicateCandidatesFrom(scoreIssueMatches(issues, report, report));
}

interface IssueMatch {
  issue: GitHubIssueSummary;
  reportMatchedTerms: number;
  reportScore: number;
  titleJaccard: number;
  titleOverlap: number;
  titleSharedTerms: number;
}

function scoreIssueMatches(
  issues: readonly GitHubIssueSummary[],
  title: string,
  report: string,
): IssueMatch[] {
  const reportTitleTerms = titleTerms(title);
  const reportTerms = titleTerms(report);
  return issues.map((issue) => {
    const issueTitleTerms = titleTerms(issue.title);
    const issueContentTerms = titleTerms(`${issue.title}\n${issue.body}`);
    const titleSharedTerms = [...reportTitleTerms].filter((term) =>
      issueTitleTerms.has(term),
    ).length;
    const titleUnion = new Set([...reportTitleTerms, ...issueTitleTerms]).size;
    const smallerTitle = Math.min(reportTitleTerms.size, issueTitleTerms.size);
    const matchedReportTerms = [...reportTerms].filter((term) =>
      issueContentTerms.has(term),
    );
    return {
      issue,
      reportMatchedTerms: matchedReportTerms.length,
      reportScore: matchedReportTerms.reduce(
        (total, term) => total + (issueTitleTerms.has(term) ? 3 : 1),
        0,
      ),
      titleJaccard: titleSharedTerms / Math.max(1, titleUnion),
      titleOverlap: titleSharedTerms / Math.max(1, smallerTitle),
      titleSharedTerms,
    };
  });
}

function rankDuplicateCandidatesFrom(matches: readonly IssueMatch[]) {
  return matches
    .filter(({ reportMatchedTerms }) => reportMatchedTerms >= 2)
    .sort((left, right) => right.reportScore - left.reportScore)
    .slice(0, 8)
    .map(({ issue }) => ({ ...issue, body: issue.body.slice(0, 2_000) }));
}

export function selectStrongDuplicate(
  issues: readonly GitHubIssueSummary[],
  title: string,
): GitHubIssueSummary | undefined {
  const reportTerms = titleTerms(title);
  if (reportTerms.size < 2) return undefined;

  return selectStrongDuplicateFrom(scoreIssueMatches(issues, title, title));
}

function selectStrongDuplicateFrom(matches: readonly IssueMatch[]) {
  return matches
    .filter(
      ({ titleJaccard, titleOverlap, titleSharedTerms }) =>
        (titleSharedTerms >= 3 && titleOverlap >= 0.75 && titleJaccard >= 0.6) ||
        (titleSharedTerms >= 2 && titleOverlap === 1 && titleJaccard >= 2 / 3),
    )
    .sort((left, right) => right.titleJaccard - left.titleJaccard)[0]?.issue;
}

export async function discoverIssueIntake(
  input: {
    findDuplicate: boolean;
    findOwners: boolean;
    repo: string;
    title: string;
    report?: string;
  },
  dependencies: IntakeDependencies = defaultDependencies,
) {
  const [issues, owners] = await Promise.all([
    input.findDuplicate ? dependencies.listOpenIssues(input.repo) : [],
    input.findOwners ? dependencies.suggestOwners(input.repo) : undefined,
  ]);
  const matches = scoreIssueMatches(issues, input.title, input.report ?? input.title);
  return {
    candidates: rankDuplicateCandidatesFrom(matches),
    duplicate: selectStrongDuplicateFrom(matches),
    suggestedOwners: owners?.matches,
    suggestionSource: owners?.source,
  };
}

export async function suggestIssueOwners(repo: string): Promise<OwnerSuggestions> {
  const [collaborators, slackUsers] = await Promise.all([
    listCollaborators(repo),
    listSlackIdentities(),
  ]);
  const registered = issueRepositories.find((candidate) => candidate.slug === repo);
  const logins = registered?.githubContacts.length
    ? registered.githubContacts.filter((contact) => collaborators.includes(contact))
    : collaborators;
  const githubUsers = await Promise.all(
    logins.map((login) => getGitHubUserProfile(login)),
  );
  const matches = rankOwnerMatches(githubUsers, slackUsers);
  return {
    matches: matches.slice(0, 10),
    source: registered?.githubContacts.length
      ? "inventory top-contributor signal; not confirmed ownership"
      : "writable repository collaborators",
  };
}
