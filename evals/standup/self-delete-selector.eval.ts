import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { streamText, stepCountIs, tool } from "ai";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

import { latencySensitiveModelConfig } from "../../agent/lib/model.js";
import { standupDeleteInputSchema } from "../../agent/subagents/standup/tools/standup_delete.js";
import { standupListInputSchema } from "../../agent/subagents/standup/tools/standup_list.js";

const instructions = await readFile(
  resolve(process.cwd(), "agent/subagents/standup/instructions.md"),
  "utf8",
);

export default defineEval({
  description:
    "Uses authenticated self and the current stand-up day when deleting all of my morning plans.",
  tags: ["standup", "regression", "model"],
  async test(t) {
    const observedInputs: unknown[] = [];
    const deletedEntryIds: string[] = [];
    const result = streamText({
      model: latencySensitiveModelConfig.model,
      system: instructions,
      prompt: `You are the subagent "standup".
Description: Manage daily stand-up morning plans and evening accomplishments for Slack employees: add, list, update, delete, and acknowledge empty reports.

The caller delegated the following task to you. Complete it and return the final result directly.

Caller message:
Untrusted raw Slack message:
---
Delete all my mornign standup
---
Interpret as a request to delete all of the authenticated employee's morning stand-up items/reports. No explicit date provided; determine the applicable scope and execute the deletion if supported. This is a stand-up mutation, not an issue report.`,
      tools: {
        standup_list: tool({
          description:
            "List stand-up entries, including stable entry IDs needed for precise updates or deletions.",
          inputSchema: standupListInputSchema,
          execute: async (input) => {
            observedInputs.push(input);
            return {
              entries: [
                { id: "entry-1", text: "First morning plan" },
                { id: "entry-2", text: "Second morning plan" },
              ],
            };
          },
        }),
        standup_delete: tool({
          description: "Delete one stand-up entry identified by its stable ID.",
          inputSchema: standupDeleteInputSchema,
          execute: async ({ entryId }) => {
            deletedEntryIds.push(entryId);
            return { deleted: { id: entryId } };
          },
        }),
      },
      stopWhen: stepCountIs(4),
    });

    await result.text;
    t.log(`Observed standup_list input: ${JSON.stringify(observedInputs[0])}`);
    t.check(
      observedInputs[0],
      equals({ scope: "self_current", period: "morning" }),
    );
    t.check(deletedEntryIds.sort(), equals(["entry-1", "entry-2"]));
  },
});
