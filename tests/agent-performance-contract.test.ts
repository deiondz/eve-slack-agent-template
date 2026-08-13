import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("stand-up mutations never ask for identity already carried by the session", () => {
  const instructions = readProjectFile("agent/subagents/standup/instructions.md");

  assert.match(
    instructions,
    /never ask\s+the parent or employee for a Slack user ID/i,
  );
  assert.match(
    instructions,
    /omit\s+`employeeSlackUserId`; the tool will use the authenticated actor/i,
  );
});

test("issue follow-ups skip intake discovery when the tracked issue is known", () => {
  const instructions = readProjectFile(
    "agent/subagents/issue-tracker/instructions.md",
  );

  const fastPaths = instructions
    .split("# Follow-up fast paths")[1]
    ?.split("# Intake workflow")[0];
  assert.ok(fastPaths, "follow-up fast-path section");
  assert.match(fastPaths, /do not call[\s\S]*`list_issue_repositories`/i);
  assert.match(fastPaths, /do not call[\s\S]*`search_open_issues`/i);
});

test("specialists disable reasoning for latency-sensitive tool routing", () => {
  for (const path of [
    "agent/subagents/standup/agent.ts",
    "agent/subagents/issue-tracker/agent.ts",
  ]) {
    assert.match(readProjectFile(path), /reasoning:\s*"none"/u, path);
  }
});

test("root delegates simple mutations without narration or identity prompts", () => {
  const instructions = readProjectFile("agent/instructions.md");

  assert.match(instructions, /call `standup` in the first response/i);
  assert.match(instructions, /never ask for the\s+member's Slack user ID/i);
  assert.match(instructions, /call `issue-tracker` in the first response/i);
});
