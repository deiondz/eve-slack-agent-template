import { defineTool } from "eve/tools";
import { z } from "zod";

import { slackCredentials } from "../lib/slack-credentials.js";
import { getSlackUserProfiles } from "../lib/slack-profile.js";

const inputSchema = z.object({
  slackUserIds: z
    .array(z.string().min(1))
    .min(1)
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Slack user IDs must be unique.",
    }),
});

const profileSchema = z.object({
  slackUserId: z.string(),
  mention: z.string(),
  displayName: z.string(),
});

export default defineTool({
  description:
    "Look up Slack members by stable user ID and return each member's Slack mention and current display name. Use this before configuring roster members whose names were not supplied or are stored as raw IDs. Requires the Slack users:read bot scope.",
  inputSchema,
  outputSchema: z.array(profileSchema),
  async execute({ slackUserIds }, ctx) {
    const actorSlackUserId = ctx.session.auth.current?.attributes.user_id;
    if (typeof actorSlackUserId !== "string" || !actorSlackUserId) {
      throw new Error("Slack profile lookup requires an authenticated Slack member.");
    }
    return getSlackUserProfiles(slackCredentials.botToken, slackUserIds);
  },
});
