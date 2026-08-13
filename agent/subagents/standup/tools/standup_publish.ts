import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../../../lib/standup/runtime.js";
import { requireDelegatedSlackActor } from "../../../lib/slack-session.js";
import { currentPublicationDate } from "../../../lib/standup/calendar.js";

export default defineTool({
  description:
    "Publish today's authoritative morning or evening stand-up digest to the configured daily-updates Slack channel, using the current Asia/Kolkata calendar date. If it was already published, update the existing message. Only configured stand-up managers may use this tool.",
  inputSchema: z.object({
    period: z.enum(["morning", "evening"]),
    standupDate: z.iso.date().optional(),
  }),
  async execute(input, ctx) {
    const actorSlackUserId = requireDelegatedSlackActor(ctx.session);
    const standupDate = currentPublicationDate(input.standupDate);
    const { workflow } = await getStandupRuntime();
    const message = await workflow.publishDigest(
      actorSlackUserId,
      standupDate,
      input.period,
    );
    return {
      published: true,
      standupDate,
      period: input.period,
      channelId: message.channelId,
      messageTs: message.messageTs,
    };
  },
});
