import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../lib/standup/runtime.js";
import { slackActorFrom } from "../lib/standup/tool-context.js";

export default defineTool({
  description:
    "List stand-up entries, including stable entry IDs needed for precise updates or deletions.",
  inputSchema: z.object({
    employeeSlackUserId: z.string().min(1).optional(),
    standupDate: z.iso.date().optional(),
    period: z.enum(["morning", "evening"]).optional(),
  }),
  async execute(input, ctx) {
    const { service } = await getStandupRuntime();
    return {
      entries: await service.listEntries({
        actorSlackUserId: slackActorFrom(ctx),
        ...input,
      }),
    };
  },
});
