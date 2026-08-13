import { defineTool } from "eve/tools";
import { z } from "zod";

import { verifyIssueDelegation } from "../../../lib/issues/delegation.js";
import { routeIssueToSlack } from "../../../lib/issues/slack.js";

const ROUTING_CHANNEL_ID =
  process.env.ISSUE_ROUTING_CHANNEL_ID ?? "C0BPD515TB4";

export default defineTool({
  description:
    "Idempotently route a created or reused issue to the engineering issue channel with reporter, source, summary, and suggested owners.",
  inputSchema: z.object({
    delegationToken: z.string().min(1),
    issueType: z.enum(["bug", "enhancement"]),
    issueUrl: z.url(),
    originalThreadPermalink: z.url(),
    repo: z.string().min(1),
    summary: z.string().min(1).max(500),
    title: z.string().min(1).max(140),
    suggestedOwners: z
      .array(
        z.object({
          githubLogin: z.string().min(1),
          slackUserId: z.string().min(1).optional(),
        }),
      )
      .max(10),
  }),
  async execute(input, ctx) {
    const context = verifyIssueDelegation(
      input.delegationToken,
      ctx.session.parent?.rootSessionId ?? "",
    );
    return routeIssueToSlack({
      ...input,
      reporterSlackUserId: context.actorSlackUserId,
      routingChannelId: ROUTING_CHANNEL_ID,
    });
  },
});
