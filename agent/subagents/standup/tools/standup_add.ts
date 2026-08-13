import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../../../lib/standup/runtime.js";
import { requireDelegatedSlackActor } from "../../../lib/slack-session.js";

export default defineTool({
  description:
    "Append one or more morning plans or evening accomplishments. Use one call for mixed updates.",
  inputSchema: z.object({
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
    standupDate: z.iso.date().optional(),
  }),
  async execute(input, ctx) {
    const actorSlackUserId = requireDelegatedSlackActor(ctx.session);
    const { service, workflow } = await getStandupRuntime();
    const created = await service.createEntries(
      input.entries.map((entry, index) => ({
        actorSlackUserId,
        employeeSlackUserId: input.employeeSlackUserId,
        standupDate: input.standupDate,
        period: entry.period,
        text: entry.text,
        idempotencyKey: `${ctx.callId}:${index}`,
      })),
    );
    const affected = new Set(
      created.map((entry) => `${entry.standupDate}:${entry.period}`),
    );
    await Promise.all(
      [...affected].map((key) => {
        const [standupDate, period] = key.split(":") as [
          string,
          "morning" | "evening",
        ];
        return workflow.refreshDigest(standupDate, period);
      }),
    );
    return { created };
  },
});
