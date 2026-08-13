import { defineTool } from "eve/tools";
import { z } from "zod";

import { verifyIssueDelegation } from "../../../lib/issues/delegation.js";
import { listCollaborators, runGh } from "../../../lib/issues/github.js";
import { rankOwnerMatches } from "../../../lib/issues/owners.js";
import { issueRepositories } from "../../../lib/issues/repositories.js";
import { listSlackIdentities } from "../../../lib/issues/slack.js";

export default defineTool({
  description:
    "Suggest likely repository contacts by matching inventory contributor signals or writable collaborators to Slack identities. Contacts are not confirmed owners and suggestions never assign.",
  inputSchema: z.object({
    delegationToken: z.string().min(1),
    repo: z.string().min(1),
  }),
  async execute(input, ctx) {
    verifyIssueDelegation(
      input.delegationToken,
      ctx.session.parent?.rootSessionId ?? "",
    );
    const collaborators = await listCollaborators(input.repo);
    const registered = issueRepositories.find((repo) => repo.slug === input.repo);
    const logins = registered?.githubContacts.length
      ? registered.githubContacts.filter((contact) => collaborators.includes(contact))
      : collaborators;
    const githubUsers = await Promise.all(
      logins.map(async (login) => {
        const output = await runGh(["api", `users/${login}`]);
        const profile = JSON.parse(output) as { email?: string; login: string; name?: string };
        return { login: profile.login, name: profile.name, email: profile.email };
      }),
    );
    const slackUsers = await listSlackIdentities();
    return {
      matches: rankOwnerMatches(githubUsers, slackUsers).slice(0, 10),
      source: registered?.githubContacts.length
        ? "inventory top-contributor signal; not confirmed ownership"
        : "writable repository collaborators",
      unmatchedGitHubContacts: logins.filter(
        (login) =>
          !rankOwnerMatches(githubUsers, slackUsers).some(
            (match) => match.githubLogin === login,
          ),
      ),
    };
  },
});
