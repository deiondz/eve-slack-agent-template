import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../../../lib/standup/runtime.js";
import { requireDelegatedSlackActor } from "../../../lib/slack-session.js";

export default defineTool({
  description:
    "List stand-up entries, including stable entry IDs needed for precise updates or deletions.",
  inputSchema: z.object({
    employeeSlackUserId: z.string().min(1).optional(),
    period: z.enum(["morning", "evening"]).optional(),
    standupDate: z.iso.date().optional(),
  }),
  async execute(input, ctx) {
    const actorSlackUserId = requireDelegatedSlackActor(ctx.session);
    const { service } = await getStandupRuntime();
    return {
      entries: await service.listEntries({
        actorSlackUserId,
        employeeSlackUserId: input.employeeSlackUserId,
        standupDate: input.standupDate,
        period: input.period,
      }),
    };
  },
});
