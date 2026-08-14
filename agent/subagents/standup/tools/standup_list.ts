import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../../../lib/standup/runtime.js";
import { requireDelegatedSlackActor } from "../../../lib/slack-session.js";

const periodSchema = z.enum(["morning", "evening"]).optional();

export const standupListInputSchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z
      .literal("self_current")
      .describe("Use for me/my requests with no explicit calendar date."),
    period: periodSchema,
  }),
  z.object({
    scope: z
      .literal("self_explicit_date")
      .describe("Use only when me/my and a calendar date were both explicit."),
    period: periodSchema,
    standupDate: z.iso.date(),
  }),
  z.object({
    scope: z
      .literal("employee_current")
      .describe(
        "Use only when a manager explicitly targeted a different employee and gave no date.",
      ),
    period: periodSchema,
    employeeSlackUserId: z.string().min(1),
  }),
  z.object({
    scope: z
      .literal("employee_explicit_date")
      .describe(
        "Use only when a manager explicitly targeted a different employee and calendar date.",
      ),
    period: periodSchema,
    employeeSlackUserId: z.string().min(1),
    standupDate: z.iso.date(),
  }),
]);

export default defineTool({
  description:
    "List stand-up entries, including stable entry IDs needed for precise updates or deletions.",
  inputSchema: standupListInputSchema,
  async execute(input, ctx) {
    const actorSlackUserId = requireDelegatedSlackActor(ctx.session);
    const { service } = await getStandupRuntime();
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
    return {
      entries: await service.listEntries({
        actorSlackUserId,
        employeeSlackUserId,
        standupDate,
        period: input.period,
      }),
    };
  },
});
