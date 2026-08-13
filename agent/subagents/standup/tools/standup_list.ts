import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../../../lib/standup/runtime.js";
import { verifyStandupDelegation } from "../../../lib/standup/delegation.js";

export default defineTool({
  description:
    "List stand-up entries, including stable entry IDs needed for precise updates or deletions.",
  inputSchema: z.object({
    delegationToken: z.string().min(1),
    employeeSlackUserId: z.string().min(1).optional(),
    period: z.enum(["morning", "evening"]).optional(),
  }),
  async execute(input, ctx) {
    const delegation = verifyStandupDelegation(
      input.delegationToken,
      ctx.session.parent?.rootSessionId ?? "",
    );
    const { service } = await getStandupRuntime();
    return {
      entries: await service.listEntries({
        actorSlackUserId: delegation.actorSlackUserId,
        employeeSlackUserId: input.employeeSlackUserId,
        standupDate: delegation.standupDate,
        period: input.period,
      }),
    };
  },
});
