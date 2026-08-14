import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../../../lib/standup/runtime.js";
import { requireDelegatedSlackActor } from "../../../lib/slack-session.js";

const entriesSchema = z
  .array(
    z.object({
      period: z.enum(["morning", "evening"]),
      text: z.string().min(1),
    }),
  )
  .min(1)
  .max(20);

const slackUserIdSchema = z
  .string()
  .regex(/^[UW][A-Z0-9]{8,}$/u, "Expected a real Slack member ID.");

export const standupAddInputSchema = z.discriminatedUnion("scope", [
  z
    .object({
      scope: z
        .literal("self_current")
        .describe("Use for the authenticated employee's own current-day update."),
      entries: entriesSchema,
    })
    .strict(),
  z
    .object({
      scope: z
        .literal("self_explicit_date")
        .describe("Use only when the employee explicitly supplied a date."),
      entries: entriesSchema,
      standupDate: z.iso.date(),
    })
    .strict(),
  z
    .object({
      scope: z
        .literal("employee_current")
        .describe("Use only when a manager explicitly targets another employee."),
      entries: entriesSchema,
      employeeSlackUserId: slackUserIdSchema,
    })
    .strict(),
  z
    .object({
      scope: z.literal("employee_explicit_date").describe(
        "Use only when a manager explicitly targets another employee and supplies a date.",
      ),
      entries: entriesSchema,
      employeeSlackUserId: slackUserIdSchema,
      standupDate: z.iso.date(),
    })
    .strict(),
]);

export default defineTool({
  description:
    "Append one or more morning plans or evening accomplishments. Use one call for mixed updates.",
  inputSchema: standupAddInputSchema,
  async execute(input, ctx) {
    const actorSlackUserId = requireDelegatedSlackActor(ctx.session);
    const { service, workflow } = await getStandupRuntime();
    const employeeSlackUserId =
      input.scope === "employee_current" ||
      input.scope === "employee_explicit_date"
        ? input.employeeSlackUserId
        : undefined;
    const standupDate =
      input.scope === "self_explicit_date" ||
      input.scope === "employee_explicit_date"
        ? input.standupDate
        : undefined;
    const created = await service.createEntries(
      input.entries.map((entry, index) => ({
        actorSlackUserId,
        employeeSlackUserId,
        standupDate,
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
