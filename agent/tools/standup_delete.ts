import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../lib/standup/runtime.js";
import { slackActorFrom } from "../lib/standup/tool-context.js";

export default defineTool({
  description: "Delete one stand-up entry identified by its stable ID.",
  inputSchema: z.object({ entryId: z.string().min(1) }),
  async execute({ entryId }, ctx) {
    const { service, workflow } = await getStandupRuntime();
    const deleted = await service.deleteEntry({
      actorSlackUserId: slackActorFrom(ctx),
      entryId,
    });
    await workflow.refreshDigest(deleted.standupDate, deleted.period);
    return { deleted };
  },
});
