import { defineTool } from "eve/tools";
import { z } from "zod";

import { requireIssueSlackContext } from "../../../lib/issues/delegation.js";
import { assignGitHubIssue } from "../../../lib/issues/github.js";
import { announceIssueAssignment } from "../../../lib/issues/slack.js";

const ROUTING_CHANNEL_ID =
  process.env.ISSUE_ROUTING_CHANNEL_ID ?? "C0BPD515TB4";

export default defineTool({
  description:
    "Assign a tracked GitHub issue to one explicitly selected collaborator and announce the completed assignment in Slack.",
  inputSchema: z.object({
    assigneeGithubLogin: z.string().min(1),
    assigneeSlackUserId: z.string().min(1).optional(),
    issueNumber: z.number().int().positive(),
    issueUrl: z.url(),
    repo: z.string().min(1),
  }),
  async execute(input, ctx) {
    requireIssueSlackContext(ctx.session);
    const assignment = await assignGitHubIssue({
      assignee: input.assigneeGithubLogin,
      number: input.issueNumber,
      repo: input.repo,
    });
    const announcement = await announceIssueAssignment({
      assigneeGithubLogin: input.assigneeGithubLogin,
      assigneeSlackUserId: input.assigneeSlackUserId,
      idempotencyKey: `issue-assignment:${ctx.callId}`,
      issueUrl: input.issueUrl,
      routingChannelId: ROUTING_CHANNEL_ID,
    });
    return { announcement, assignment };
  },
});
