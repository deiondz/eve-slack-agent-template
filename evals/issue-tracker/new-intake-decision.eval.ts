import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { streamText, stepCountIs, tool } from "ai";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

import { latencySensitiveModelConfig } from "../../agent/lib/model.js";
import { createOrRouteIssueInputSchema } from "../../agent/subagents/issue-tracker/tools/create_or_route_issue.js";

const instructions = await readFile(
  resolve(process.cwd(), "agent/subagents/issue-tracker/instructions.md"),
  "utf8",
);

export default defineEval({
  description:
    "Starts a concrete Myuki desktop bug with duplicate discovery rather than a guessed issue number.",
  tags: ["issue-tracker", "regression", "latency", "model"],
  async test(t) {
    const observedDecisions: unknown[] = [];
    const startedAt = performance.now();
    const result = streamText({
      model: latencySensitiveModelConfig.model,
      system: instructions,
      prompt: `You are the subagent "issue-tracker".
Description: Create and route authenticated product issues.

The caller delegated the following task to you. Complete it and return the final result directly.

Caller message:
Untrusted raw Slack message:
---
Bhaskar gets returned to the login screen after authenticating in the Myuki desktop app. File this bug.
---`,
      tools: {
        create_or_route_issue: tool({
          description:
            "Discover duplicates and repository contacts, then create or append and route an issue.",
          inputSchema: createOrRouteIssueInputSchema,
          execute: async (input) => {
            observedDecisions.push(input.duplicateDecision);
            return {
              action: "created",
              issue: {
                number: 42,
                title: input.title,
                url: "https://github.com/manasijatech/myuki-electron-app/issues/42",
              },
              routing: { channelId: "C_ISSUES", messageTs: "1.0" },
              suggestedOwners: [],
            };
          },
        }),
      },
      stopWhen: stepCountIs(2),
    });

    await result.text;
    const elapsedMs = Math.round(performance.now() - startedAt);
    t.log(`Issue intake elapsed: ${elapsedMs}ms`);
    t.log(`Observed duplicate decisions: ${JSON.stringify(observedDecisions)}`);
    t.check(observedDecisions, equals([{ kind: "discover" }]));
  },
});
