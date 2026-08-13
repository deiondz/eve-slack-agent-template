import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../../../lib/standup/runtime.js";
import { verifyStandupDelegation } from "../../../lib/standup/delegation.js";

export default defineTool({
  description:
    "Record an explicit response that there are no morning plans or evening accomplishments to report.",
  inputSchema: z.object({
    delegationToken: z.string().min(1),
    period: z.enum(["morning", "evening"]),
    employeeSlackUserId: z.string().min(1).optional(),
  }),
  async execute(input, ctx) {
    const delegation = verifyStandupDelegation(
      input.delegationToken,
      ctx.session.parent?.rootSessionId ?? "",
    );
    const { service, workflow } = await getStandupRuntime();
    const standupDate = await service.acknowledgeEmpty({
      actorSlackUserId: delegation.actorSlackUserId,
      employeeSlackUserId: input.employeeSlackUserId,
      period: input.period,
      standupDate: delegation.standupDate,
      idempotencyKey: ctx.callId,
    });
    await workflow.refreshDigest(standupDate, input.period);
    return { acknowledged: true, standupDate, period: input.period };
  },
});
