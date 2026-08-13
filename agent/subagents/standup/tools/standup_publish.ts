import { defineTool } from "eve/tools";
import { z } from "zod";

import { verifyStandupDelegation } from "../../../lib/standup/delegation.js";
import { getStandupRuntime } from "../../../lib/standup/runtime.js";

export default defineTool({
  description:
    "Publish the authoritative morning or evening stand-up digest to the configured daily-updates Slack channel. If it was already published, update the existing message. Only configured stand-up managers may use this tool.",
  inputSchema: z.object({
    delegationToken: z.string().min(1),
    period: z.enum(["morning", "evening"]),
  }),
  async execute(input, ctx) {
    const delegation = verifyStandupDelegation(
      input.delegationToken,
      ctx.session.parent?.rootSessionId ?? "",
    );
    const { workflow } = await getStandupRuntime();
    const message = await workflow.publishDigest(
      delegation.actorSlackUserId,
      delegation.standupDate,
      input.period,
    );
    return {
      published: true,
      standupDate: delegation.standupDate,
      period: input.period,
      channelId: message.channelId,
      messageTs: message.messageTs,
    };
  },
});
