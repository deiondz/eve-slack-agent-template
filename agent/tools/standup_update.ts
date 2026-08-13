import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../lib/standup/runtime.js";
import { slackActorFrom } from "../lib/standup/tool-context.js";

export default defineTool({
  description: "Replace the text of one stand-up entry identified by its stable ID.",
  inputSchema: z.object({
    entryId: z.string().min(1),
    text: z.string().min(1),
  }),
  async execute(input, ctx) {
    const { service, workflow } = await getStandupRuntime();
    const updated = await service.updateEntry({
      actorSlackUserId: slackActorFrom(ctx),
      entryId: input.entryId,
      text: input.text,
    });
    await workflow.refreshDigest(updated.standupDate, updated.period);
    return { updated };
  },
});
