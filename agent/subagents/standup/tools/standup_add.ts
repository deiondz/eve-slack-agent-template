import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../../../lib/standup/runtime.js";
import { verifyStandupDelegation } from "../../../lib/standup/delegation.js";

export default defineTool({
  description:
    "Append one or more morning plans or evening accomplishments. Use one call for mixed updates.",
  inputSchema: z.object({
    delegationToken: z.string().min(1),
    entries: z
      .array(
        z.object({
          period: z.enum(["morning", "evening"]),
          text: z.string().min(1),
        }),
      )
      .min(1)
      .max(20),
    employeeSlackUserId: z.string().min(1).optional(),
  }),
  async execute(input, ctx) {
    const delegation = verifyStandupDelegation(
      input.delegationToken,
      ctx.session.parent?.rootSessionId ?? "",
    );
    const { service, workflow } = await getStandupRuntime();
    const created = await service.createEntries(
      input.entries.map((entry, index) => ({
        actorSlackUserId: delegation.actorSlackUserId,
        employeeSlackUserId: input.employeeSlackUserId,
        standupDate: delegation.standupDate,
        period: entry.period,
        text: entry.text,
        idempotencyKey: `${ctx.callId}:${index}`,
      })),
    );
    const affected = new Set(
      created.map((entry) => `${entry.standupDate}:${entry.period}`),
    );
    for (const key of affected) {
      const [standupDate, period] = key.split(":") as [
        string,
        "morning" | "evening",
      ];
      await workflow.refreshDigest(standupDate, period);
    }
    return { created };
  },
});
