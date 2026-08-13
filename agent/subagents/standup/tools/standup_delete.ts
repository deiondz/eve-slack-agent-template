import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../../../lib/standup/runtime.js";
import { requireDelegatedSlackActor } from "../../../lib/slack-session.js";

export default defineTool({
  description: "Delete one stand-up entry identified by its stable ID.",
  inputSchema: z.object({
    entryId: z.string().min(1),
  }),
  async execute(input, ctx) {
    const actorSlackUserId = requireDelegatedSlackActor(ctx.session);
    const { service, workflow } = await getStandupRuntime();
    const deleted = await service.deleteEntry({
      actorSlackUserId,
      entryId: input.entryId,
    });
    await workflow.refreshDigest(deleted.standupDate, deleted.period);
    return { deleted };
  },
});
