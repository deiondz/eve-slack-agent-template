import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../lib/standup/runtime.js";

const rosterMemberSchema = z.object({
  slackUserId: z.string().min(1),
  displayName: z.string().min(1),
  role: z.enum(["employee", "manager"]),
});

const inputSchema = z
  .object({
    dailyUpdatesChannelId: z
      .string()
      .regex(/^[CG][A-Z0-9_]+$/, "Use a Slack channel ID beginning with C or G.")
      .optional(),
    roster: z.array(rosterMemberSchema).min(1).max(500).optional(),
  })
  .superRefine((input, ctx) => {
    if (input.dailyUpdatesChannelId === undefined && input.roster === undefined) {
      ctx.addIssue({ code: "custom", message: "Provide a channel or roster." });
    }
    if (input.roster) {
      const ids = input.roster.map((member) => member.slackUserId);
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({ code: "custom", message: "Roster Slack user IDs must be unique." });
      }
    }
  });

export default defineTool({
  description:
    "Persist stand-up settings supplied in chat. Set the daily-updates Slack channel, replace the complete employee/manager roster, or do both. Only configured stand-up managers may use this tool.",
  inputSchema,
  async execute(input, ctx) {
    const actorSlackUserId = ctx.session.auth.current?.attributes.user_id;
    if (typeof actorSlackUserId !== "string" || !actorSlackUserId) {
      throw new Error("Stand-up configuration requires an authenticated Slack member.");
    }
    const { service } = await getStandupRuntime();
    return service.updateConfiguration({ actorSlackUserId, ...input });
  },
});
