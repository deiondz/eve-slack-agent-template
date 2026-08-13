import { defineTool } from "eve/tools";
import { z } from "zod";

import { issueSlackContextSchema } from "../lib/issues/delegation.js";
import { getIssueDelegationService } from "../lib/issues/delegation-runtime.js";

export default defineTool({
  description:
    "Prepare trusted Slack issue metadata for the issue-tracker specialist. Call this immediately before delegating issue intake or assignment.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const attributes = ctx.session.auth.current?.attributes;
    if (!attributes || ctx.session.auth.current?.authenticator !== "slack-webhook") {
      throw new Error("Issue tracking requires an authenticated Slack member.");
    }
    const context = issueSlackContextSchema.parse({
      actorSlackUserId: attributes.user_id,
      actorDisplayName:
        attributes.full_name ?? attributes.user_name ?? attributes.user_id,
      channelId: attributes.channel_id,
      messageTs: attributes.message_ts,
      teamId: attributes.team_id,
      threadTs: attributes.thread_ts,
    });
    const service = await getIssueDelegationService();
    return service.save(ctx.session.id, context);
  },
});
