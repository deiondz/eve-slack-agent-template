import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../../../lib/standup/runtime.js";
import { verifyStandupDelegation } from "../../../lib/standup/delegation.js";

export default defineTool({
  description: "Delete one stand-up entry identified by its stable ID.",
  inputSchema: z.object({
    delegationToken: z.string().min(1),
    entryId: z.string().min(1),
  }),
  async execute(input, ctx) {
    const delegation = verifyStandupDelegation(
      input.delegationToken,
      ctx.session.parent?.rootSessionId ?? "",
    );
    const { service, workflow } = await getStandupRuntime();
    const deleted = await service.deleteEntry({
      actorSlackUserId: delegation.actorSlackUserId,
      entryId: input.entryId,
    });
    await workflow.refreshDigest(deleted.standupDate, deleted.period);
    return { deleted };
  },
});
