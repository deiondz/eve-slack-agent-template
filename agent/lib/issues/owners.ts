export interface SlackIdentity {
  displayName: string;
  email?: string;
  realName?: string;
  slackUserId: string;
  username?: string;
}

export interface GitHubIdentity {
  email?: string;
  login: string;
  name?: string;
}

export interface SuggestedIssueOwner {
  githubLogin: string;
  slackUserId?: string;
}

function normalize(value: string | undefined): string {
  return (value ?? "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function emailLocalPart(value: string | undefined): string {
  return normalize(value?.split("@")[0]);
}

function bigrams(value: string): Set<string> {
  const output = new Set<string>();
  for (let index = 0; index < value.length - 1; index += 1) {
    output.add(value.slice(index, index + 2));
  }
  return output;
}

function similarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const a = bigrams(left);
  const b = bigrams(right);
  const intersection = [...a].filter((item) => b.has(item)).length;
  return (2 * intersection) / Math.max(1, a.size + b.size);
}

export function rankOwnerMatches(
  githubUsers: readonly GitHubIdentity[],
  slackUsers: readonly SlackIdentity[],
) {
  return githubUsers
    .map((github) => {
      const githubNames = [normalize(github.login), normalize(github.name)].filter(Boolean);
      const match = slackUsers.map((slack) => {
        const slackNames = [
          normalize(slack.displayName),
          normalize(slack.realName),
          normalize(slack.username),
          emailLocalPart(slack.email),
        ].filter(Boolean);
        const exactEmail =
          github.email && slack.email && github.email.toLowerCase() === slack.email.toLowerCase();
        const exactName = githubNames.some((name) => slackNames.includes(name));
        const fuzzy = Math.max(
          ...githubNames.flatMap((githubName) =>
            slackNames.map((slackName) => similarity(githubName, slackName)),
          ),
          0,
        );
        const score = exactEmail ? 1 : exactName ? 0.95 : fuzzy;
        return {
          githubLogin: github.login,
          slackDisplayName: slack.displayName,
          slackUserId: slack.slackUserId,
          score,
          reason: exactEmail ? "exact email" : exactName ? "exact normalized name" : "fuzzy name",
        };
      })
        .filter((candidate) => candidate.score >= 0.58)
        .sort((left, right) => right.score - left.score)[0];
      return match ?? { githubLogin: github.login };
    })
    .sort((left, right) => (right.score ?? -1) - (left.score ?? -1));
}
