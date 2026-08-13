import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../lib/standup/runtime.js";
import { slackActorFrom } from "../lib/standup/tool-context.js";

export default defineTool({
  description:
    "Record an explicit response that there are no morning plans or evening accomplishments to report.",
  inputSchema: z.object({
    period: z.enum(["morning", "evening"]),
    employeeSlackUserId: z.string().min(1).optional(),
    standupDate: z.iso.date().optional(),
  }),
  async execute(input, ctx) {
    const { service, workflow } = await getStandupRuntime();
    const actorSlackUserId = slackActorFrom(ctx);
    const standupDate = await service.acknowledgeEmpty({
      actorSlackUserId,
      ...input,
      idempotencyKey: ctx.callId,
    });
    await workflow.refreshDigest(standupDate, input.period);
    return { acknowledged: true, standupDate, period: input.period };
  },
});
