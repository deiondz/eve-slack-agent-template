import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../../../lib/standup/runtime.js";
import { requireDelegatedSlackActor } from "../../../lib/slack-session.js";

export default defineTool({
  description:
    "Record an explicit response that there are no morning plans or evening accomplishments to report.",
  inputSchema: z.object({
    period: z.enum(["morning", "evening"]),
    employeeSlackUserId: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Omit for requests about me, my, or the authenticated employee. Never pass placeholders such as authenticated, self, or me. Supply only a real Slack user ID when a manager explicitly names a different employee.",
      ),
    standupDate: z
      .iso.date()
      .optional()
      .describe(
        "Omit unless the employee explicitly requested a calendar date. Never infer or invent a date; omission selects the current stand-up day.",
      ),
  }),
  async execute(input, ctx) {
    const actorSlackUserId = requireDelegatedSlackActor(ctx.session);
    const { service, workflow } = await getStandupRuntime();
    const standupDate = await service.acknowledgeEmpty({
      actorSlackUserId,
      employeeSlackUserId: input.employeeSlackUserId,
      period: input.period,
      standupDate: input.standupDate,
      idempotencyKey: ctx.callId,
    });
    await workflow.refreshDigest(standupDate, input.period);
    return { acknowledged: true, standupDate, period: input.period };
  },
});
