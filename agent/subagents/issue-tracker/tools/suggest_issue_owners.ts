import { defineTool } from "eve/tools";
import { z } from "zod";

import { requireIssueSlackContext } from "../../../lib/issues/delegation.js";
import {
  getGitHubUserProfile,
  listCollaborators,
} from "../../../lib/issues/github.js";
import { rankOwnerMatches } from "../../../lib/issues/owners.js";
import { issueRepositories } from "../../../lib/issues/repositories.js";
import { listSlackIdentities } from "../../../lib/issues/slack.js";

export default defineTool({
  description:
    "Suggest likely repository contacts by matching inventory contributor signals or writable collaborators to Slack identities. Contacts are not confirmed owners and suggestions never assign.",
  inputSchema: z.object({
    repo: z.string().min(1),
  }),
  async execute(input, ctx) {
    requireIssueSlackContext(ctx.session);
    const [collaborators, slackUsers] = await Promise.all([
      listCollaborators(input.repo),
      listSlackIdentities(),
    ]);
    const registered = issueRepositories.find((repo) => repo.slug === input.repo);
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
      unmatchedGitHubContacts: logins.filter(
        (login) =>
          !matches.some(
            (match) => match.githubLogin === login,
          ),
      ),
    };
  },
});
