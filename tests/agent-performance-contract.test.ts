import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("stand-up mutations never ask for identity already carried by the session", () => {
  const instructions = readProjectFile("agent/subagents/standup/instructions.md");

  assert.match(
    instructions,
    /Never ask the employee to\s+provide their own Slack ID/i,
  );
  assert.match(
    instructions,
    /Omit `employeeSlackUserId`[\s\S]*authenticated session/i,
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
  assert.match(fastPaths, /call[\s\S]*`create_or_route_issue` immediately/i);
  assert.match(fastPaths, /without repeating intake\s+discovery/i);
});

test("issue intake uses one consolidated discovery and routing action", () => {
  const instructions = readProjectFile(
    "agent/subagents/issue-tracker/instructions.md",
  );
  const intake = instructions.split("# Intake workflow")[1]?.split("# Assignment workflow")[0];
  assert.ok(intake, "intake workflow section");
  assert.match(intake, /call `create_or_route_issue` immediately/i);
  assert.doesNotMatch(intake, /call `search_open_issues`|call `suggest_issue_owners`/i);
  assert.match(intake, /Pulse web reports to `manasijatech\/pulse`/i);
  assert.match(intake, /returns `needs_duplicate_review`[\s\S]*semantically/i);
  assert.equal(
    existsSync("agent/subagents/issue-tracker/tools/search_open_issues.ts"),
    false,
  );
  assert.equal(
    existsSync("agent/subagents/issue-tracker/tools/suggest_issue_owners.ts"),
    false,
  );
});

test("specialists disable reasoning for latency-sensitive tool routing", () => {
  const sharedConfig = readProjectFile("agent/lib/model.ts");
  assert.match(sharedConfig, /reasoning:\s*"none"/u);
  for (const path of [
    "agent/subagents/standup/agent.ts",
    "agent/subagents/issue-tracker/agent.ts",
  ]) {
    assert.match(readProjectFile(path), /latencySensitiveModelConfig/u, path);
  }
});

test("all agents use the low-latency Codex model route", () => {
  const sharedConfig = readProjectFile("agent/lib/model.ts");
  assert.match(sharedConfig, /experimental_chatgpt\("gpt-5\.6-luna"\)/u);
  assert.doesNotMatch(sharedConfig, /openrouter|deepseek/iu);
  for (const path of [
    "agent/agent.ts",
    "agent/subagents/standup/agent.ts",
    "agent/subagents/issue-tracker/agent.ts",
  ]) {
    const config = readProjectFile(path);
    assert.match(config, /latencySensitiveModelConfig/u, path);
  }
});

test("root disables reasoning for latency-sensitive delegation", () => {
  assert.match(readProjectFile("agent/agent.ts"), /latencySensitiveModelConfig/u);
});

test("root delegates simple mutations without narration or identity prompts", () => {
  const instructions = readProjectFile("agent/instructions.md");

  assert.match(instructions, /first response must call `standup`/i);
  assert.match(instructions, /Do not ask for the member's\s+Slack user ID/i);
  assert.match(instructions, /Call `issue-tracker` immediately/i);
});

test("first-person work status stays a stand-up unless issue filing is explicit", () => {
  const instructions = readProjectFile("agent/instructions.md");

  assert.match(
    instructions,
    /First-person work status is a stand-up update[\s\S]*feature,[\s\S]*bug,[\s\S]*issue/i,
  );
  assert.match(
    instructions,
    /only when the member explicitly asks to report, file, or\s+track a concrete product problem/i,
  );
});

test("declared specialists are invoked as tools and never loaded as skills", () => {
  const instructions = readProjectFile("agent/instructions.md");

  assert.match(
    instructions,
    /`standup` and `issue-tracker` are callable specialist tools/i,
  );
  assert.match(instructions, /do not try to load them as skills/i);
});

test("issue assignment is bound to the authenticated Slack thread", () => {
  const assignmentTool = readProjectFile(
    "agent/subagents/issue-tracker/tools/assign_and_announce_issue.ts",
  );

  assert.match(assignmentTool, /slackThreadMarker\(context\)/u);
  assert.match(
    assignmentTool,
    /issue\.body\.includes\(marker\)[\s\S]*issueHasCommentMarker/u,
  );
  assert.match(assignmentTool, /listCollaborators\(input\.repo\)/u);
  assert.match(assignmentTool, /issueUrl: issue\.url/u);
});

test("Slack replies use a terse, result-first interaction contract", () => {
  const root = readProjectFile("agent/instructions.md");
  const issueTracker = readProjectFile(
    "agent/subagents/issue-tracker/instructions.md",
  );
  const standup = readProjectFile("agent/subagents/standup/instructions.md");

  assert.match(root, /one to four short lines/i);
  assert.match(root, /Start with the result/i);
  assert.match(root, /Ask no more than one focused question/i);
  assert.match(root, /refers to the item\s+already established/i);
  assert.match(issueTracker, /Return the outcome first/i);
  assert.match(standup, /Start with the verified finish state/i);
});

test("Slack progress uses teammate language without exposing internals", () => {
  const channel = readProjectFile("agent/channels/slack.ts");

  assert.match(channel, /startTyping\("On it…"\)/u);
  assert.match(channel, /Filing the issue…/u);
  assert.match(channel, /Updating the stand-up…/u);
  assert.match(channel, /"reasoning\.appended"\(\) \{\}/u);
  assert.doesNotMatch(channel, /startTyping\("Thinking…"\)/u);
});

test("stand-up self-service selectors forbid placeholder identities and invented dates", () => {
  const instructions = readProjectFile("agent/subagents/standup/instructions.md");

  assert.match(
    instructions,
    /Never pass a display name,[\s\S]*`authenticated`, `self`, `me`, or a guessed ID/i,
  );
  assert.match(instructions, /Never derive a date from the model clock/i);
  assert.match(
    instructions,
    /explicitly requested all matching[\s\S]*`standup_delete` once for each matched/i,
  );
  assert.match(
    instructions,
    /Authenticated employee \| No \| `self_current`/i,
  );

  const addTool = readProjectFile(
    "agent/subagents/standup/tools/standup_add.ts",
  );
  assert.match(addTool, /literal\("self_current"\)/u);
  assert.match(addTool, /literal\("self_explicit_date"\)/u);
  assert.match(addTool, /literal\("employee_current"\)/u);
  assert.match(addTool, /literal\("employee_explicit_date"\)/u);
  assert.match(addTool, /Expected a real Slack member ID/u);

  const acknowledgeTool = readProjectFile(
    "agent/subagents/standup/tools/standup_acknowledge_empty.ts",
  );
  assert.match(acknowledgeTool, /Omit for requests about me, my/u);
  assert.match(
    acknowledgeTool,
    /Never pass placeholders such as authenticated, self, or me/u,
  );
  assert.match(acknowledgeTool, /Never infer or invent a date/u);

  const listTool = readProjectFile(
    "agent/subagents/standup/tools/standup_list.ts",
  );
  assert.match(listTool, /literal\("self_current"\)/u);
  assert.match(listTool, /literal\("self_explicit_date"\)/u);
  assert.match(listTool, /literal\("employee_current"\)/u);
  assert.match(listTool, /literal\("employee_explicit_date"\)/u);
});

test("stand-up updates classify status, summarize, and clarify vague work", () => {
  const root = readProjectFile("agent/instructions.md");
  const standup = readProjectFile("agent/subagents/standup/instructions.md");

  assert.match(root, /"I'm working on\.\.\."[\s\S]*morning update/i);
  assert.match(root, /"finished\.\.\."[\s\S]*evening update/i);
  assert.match(standup, /`morning` \(ongoing\)[\s\S]*"working on"/i);
  assert.match(standup, /`evening` \(outgoing\/completed\)[\s\S]*"finished"/i);
  assert.match(standup, /Summarize it; do not copy the message verbatim/i);
  assert.match(standup, /unclear reference[\s\S]*ask one focused follow-up/i);
  assert.match(standup, /Never guess the missing work, subject, or result/i);
});

test("stand-up publication delegates authorization and date resolution to the tool", () => {
  const root = readProjectFile("agent/instructions.md");
  const standup = readProjectFile("agent/subagents/standup/instructions.md");

  assert.match(
    root,
    /explicit publish request[\s\S]*delegate immediately[\s\S]*do not pre-check manager/i,
  );
  assert.match(
    standup,
    /any clear request to publish[\s\S]*call `standup_publish`/i,
  );
  assert.match(
    standup,
    /Do not ask the requester to state or prove\s+they are a manager/i,
  );
  assert.match(
    standup,
    /tool authorizes the authenticated Slack user/i,
  );
  assert.match(
    standup,
    /omit `standupDate`[\s\S]*current Asia\/Kolkata date/i,
  );
  assert.match(
    standup,
    /Do not reject\s+an explicit date as historical/i,
  );
});
