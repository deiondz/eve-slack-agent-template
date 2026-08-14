import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { streamText, stepCountIs, tool } from "ai";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";
import { z } from "zod";

import { latencySensitiveModelConfig } from "../../agent/lib/model.js";

const instructions = await readFile(
  resolve(process.cwd(), "agent/instructions.md"),
  "utf8",
);

const delegatedMessageSchema = z.object({ message: z.string() });

export default defineEval({
  description:
    "Routes a vague personal work plan to stand-up without issue clarification.",
  tags: ["routing", "standup", "regression", "latency", "model"],
  async test(t) {
    const observedTools: string[] = [];
    const startedAt = performance.now();
    const result = streamText({
      model: latencySensitiveModelConfig.model,
      system: instructions,
      prompt:
        "Will be testing out furgo, and resolving the issues that Bhaskar was facing with myuki desktop app",
      tools: {
        standup: tool({
          description: "Manage the authenticated employee's stand-up.",
          inputSchema: delegatedMessageSchema,
          execute: async () => {
            observedTools.push("standup");
            return { result: "Saved the morning plan." };
          },
        }),
        "issue-tracker": tool({
          description: "Create, update, and assign concrete product issues.",
          inputSchema: delegatedMessageSchema,
          execute: async () => {
            observedTools.push("issue-tracker");
            return { result: "Asked for concrete issue details." };
          },
        }),
      },
      stopWhen: stepCountIs(2),
    });

    await result.text;
    const elapsedMs = Math.round(performance.now() - startedAt);
    t.log(`Root routing elapsed: ${elapsedMs}ms`);
    t.log(`Observed tools: ${JSON.stringify(observedTools)}`);
    t.check(observedTools, equals(["standup"]));
  },
});
