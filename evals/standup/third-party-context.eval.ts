import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { streamText, stepCountIs, tool } from "ai";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

import { latencySensitiveModelConfig } from "../../agent/lib/model.js";
import { standupAddInputSchema } from "../../agent/subagents/standup/tools/standup_add.js";

const instructions = await readFile(
  resolve(process.cwd(), "agent/subagents/standup/instructions.md"),
  "utf8",
);

export default defineEval({
  description:
    "Treats another person's name inside a personal work plan as task context, not a target employee.",
  tags: ["standup", "routing", "regression", "model"],
  async test(t) {
    const observedInputs: unknown[] = [];
    const result = streamText({
      model: latencySensitiveModelConfig.model,
      system: instructions,
      prompt: `You are the subagent "standup".
Description: Manage daily stand-up morning plans and evening accomplishments for Slack employees.

The caller delegated the following task to you. Complete it and return the final result directly.

Caller message:
Untrusted raw Slack message:
---
Will be testing out Furgo, and resolving the issues that Bhaskar was facing with Myuki desktop app
---
This is the authenticated employee reporting their own work plan.`,
      tools: {
        standup_add: tool({
          description:
            "Append one or more morning plans or evening accomplishments. Omit employeeSlackUserId for the authenticated employee's own entries.",
          inputSchema: standupAddInputSchema,
          execute: async (input) => {
            observedInputs.push(input);
            return { created: input.entries };
          },
        }),
      },
      stopWhen: stepCountIs(2),
    });

    await result.text;
    t.log(`Observed standup_add input: ${JSON.stringify(observedInputs[0])}`);
    t.check(
      observedInputs.map((input) =>
        input && typeof input === "object" && "scope" in input
          ? (input as { scope?: string }).scope
          : undefined,
      ),
      equals(["self_current"]),
    );
  },
});
