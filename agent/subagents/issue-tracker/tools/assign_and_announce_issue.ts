import { defineTool } from "eve/tools";
import { z } from "zod";

import { requireIssueSlackContext } from "../../../lib/issues/delegation.js";
import { slackThreadMarker } from "../../../lib/issues/format.js";
import {
  assignGitHubIssue,
  getGitHubIssue,
  getGitHubUserProfile,
  issueHasCommentMarker,
  listCollaborators,
} from "../../../lib/issues/github.js";
import { rankOwnerMatches } from "../../../lib/issues/owners.js";
import { assertOrganizationRepository } from "../../../lib/issues/repositories.js";
import {
  announceIssueAssignment,
  listSlackIdentities,
} from "../../../lib/issues/slack.js";

const ROUTING_CHANNEL_ID =
  process.env.ISSUE_ROUTING_CHANNEL_ID ?? "C0BPD515TB4";

export default defineTool({
  description:
    "Assign a tracked GitHub issue to one explicitly selected collaborator and announce the completed assignment in Slack.",
  inputSchema: z.object({
    assigneeGithubLogin: z.string().min(1),
    issueNumber: z.number().int().positive(),
    repo: z.string().min(1),
  }),
  async execute(input, ctx) {
    assertOrganizationRepository(input.repo);
    const context = requireIssueSlackContext(ctx.session);
    const marker = slackThreadMarker(context);
    const [issue, collaborators, slackUsers] = await Promise.all([
      getGitHubIssue({ number: input.issueNumber, repo: input.repo }),
      listCollaborators(input.repo),
      listSlackIdentities(),
    ]);
    const belongsToThread =
      issue.body.includes(marker) ||
      (await issueHasCommentMarker({
        marker,
        number: issue.number,
        repo: input.repo,
      }));
    if (!belongsToThread) {
      throw new Error(
        "Refusing to assign an issue that is not tracked by the authenticated Slack thread.",
      );
    }

    const assignee = collaborators.find(
      (login) => login.toLowerCase() === input.assigneeGithubLogin.toLowerCase(),
    );
    if (!assignee) {
      throw new Error(
        `${input.assigneeGithubLogin} is not an assignable collaborator on ${input.repo}.`,
      );
    }
    const owner = rankOwnerMatches(
      [await getGitHubUserProfile(assignee)],
      slackUsers,
    )[0];
    const assignment = await assignGitHubIssue({
      assignee,
      number: issue.number,
      repo: input.repo,
    });
    const announcement = await announceIssueAssignment({
      assigneeGithubLogin: assignee,
      assigneeSlackUserId: owner?.slackUserId,
      idempotencyKey: `issue-assignment:${ctx.callId}`,
      issueUrl: issue.url,
      routingChannelId: ROUTING_CHANNEL_ID,
    });
    return { announcement, assignment };
  },
});
