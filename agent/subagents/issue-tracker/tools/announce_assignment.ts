import { defineTool } from "eve/tools";
import { z } from "zod";

import { requireIssueDelegation } from "../../../lib/issues/delegation-runtime.js";
import { announceIssueAssignment } from "../../../lib/issues/slack.js";

const ROUTING_CHANNEL_ID =
  process.env.ISSUE_ROUTING_CHANNEL_ID ?? "C0BPD515TB4";

export default defineTool({
  description:
    "Announce an explicitly completed GitHub assignment under the issue's routing-channel message.",
  inputSchema: z.object({
    assigneeGithubLogin: z.string().min(1),
    assigneeSlackUserId: z.string().min(1).optional(),
    issueUrl: z.url(),
  }),
  async execute(input, ctx) {
    await requireIssueDelegation(ctx.session.parent?.rootSessionId);
    return announceIssueAssignment({
      ...input,
      routingChannelId: ROUTING_CHANNEL_ID,
    });
  },
});
