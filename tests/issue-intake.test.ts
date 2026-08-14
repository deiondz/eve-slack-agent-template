import assert from "node:assert/strict";
import test from "node:test";

import {
  discoverIssueIntake,
  planIssueDiscovery,
  rankDuplicateCandidates,
  resolveDuplicateSelection,
  selectStrongDuplicate,
} from "../agent/lib/issues/intake.js";
import { createOrRouteIssueInputSchema } from "../agent/subagents/issue-tracker/tools/create_or_route_issue.js";

const issues = [
  {
    body: "The desktop client returns to the sign-in screen after authentication.",
    number: 42,
    title: "Desktop login loop after authentication",
    url: "https://github.com/manasijatech/myuki-electron-app/issues/42",
  },
  {
    body: "The updater does not restart automatically.",
    number: 51,
    title: "Restart after desktop update",
    url: "https://github.com/manasijatech/myuki-electron-app/issues/51",
  },
];

test("issue intake requires an explicit duplicate workflow decision", () => {
  const commonInput = {
    repo: "manasijatech/myuki-electron-app",
    issueType: "bug" as const,
    title: "Desktop login loops after authentication",
    summary: "The desktop app returns to sign-in.",
    observed: "The app returns to sign-in after authentication.",
    repositoryRouting: "Myuki desktop app",
  };

  assert.equal(
    createOrRouteIssueInputSchema.safeParse({
      ...commonInput,
      existingIssueNumber: 1,
    }).success,
    false,
  );
  assert.equal(
    createOrRouteIssueInputSchema.safeParse({
      ...commonInput,
      duplicateDecision: { kind: "discover" },
    }).success,
    true,
  );
  assert.equal(
    createOrRouteIssueInputSchema.safeParse({
      ...commonInput,
      duplicateDecision: { kind: "select_candidate", issueNumber: 42 },
    }).success,
    true,
  );
});

test("issue intake selects only a strong title duplicate", () => {
  assert.equal(
    selectStrongDuplicate(issues, "Desktop app stuck in login loop after authentication")
      ?.number,
    42,
  );
  assert.equal(
    selectStrongDuplicate(issues, "Desktop window opens at the wrong size"),
    undefined,
  );
  assert.equal(selectStrongDuplicate(issues, "Login loop")?.number, 42);
  assert.equal(
    selectStrongDuplicate(issues, "Desktop sign-in loop after auth")?.number,
    42,
  );
});

test("issue intake validates an explicit issue through duplicate discovery", () => {
  assert.deepEqual(
    planIssueDiscovery({
      hasExistingThread: false,
      hasConfirmedNewIssue: false,
      hasSuggestedOwners: false,
    }),
    { findDuplicate: true, findOwners: true },
  );
  assert.deepEqual(
    planIssueDiscovery({
      hasExistingThread: false,
      hasConfirmedNewIssue: false,
      hasSuggestedOwners: true,
    }),
    { findDuplicate: true, findOwners: false },
  );
});

test("issue intake rejects a model-supplied issue number that was not discovered", () => {
  assert.deepEqual(
    resolveDuplicateSelection({
      candidates: issues,
      requestedIssueNumber: 1,
      strongDuplicate: undefined,
    }),
    { kind: "invalid", requestedIssueNumber: 1 },
  );
  assert.deepEqual(
    resolveDuplicateSelection({
      candidates: issues,
      requestedIssueNumber: 42,
      strongDuplicate: undefined,
    }),
    { kind: "selected", issue: issues[0] },
  );
});

test("issue intake preserves ambiguous candidates for semantic review", () => {
  const candidates = rankDuplicateCandidates(
    [
      {
        body: "Password recovery messages are not delivered to the user's inbox.",
        number: 73,
        title: "Forgot-password link is missing",
        url: "https://github.com/manasijatech/myuki/issues/73",
      },
    ],
    "Password recovery email never arrives",
  );

  assert.equal(candidates[0]?.number, 73);
});

test("issue intake discovers duplicates and contacts concurrently", async () => {
  const started = new Set<string>();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  const resultPromise = discoverIssueIntake(
    {
      repo: "manasijatech/myuki-electron-app",
      title: "Desktop app stuck in login loop after authentication",
      findDuplicate: true,
      findOwners: true,
    },
    {
      async listOpenIssues() {
        started.add("issues");
        await gate;
        return issues;
      },
      async suggestOwners() {
        started.add("owners");
        await gate;
        return {
          matches: [{ githubLogin: "deiondz", slackUserId: "U_OWNER" }],
          source: "inventory contributor signal",
        };
      },
    },
  );

  await Promise.resolve();
  assert.deepEqual([...started].sort(), ["issues", "owners"]);
  release();

  assert.deepEqual(await resultPromise, {
    candidates: [issues[0]],
    duplicate: issues[0],
    suggestedOwners: [{ githubLogin: "deiondz", slackUserId: "U_OWNER" }],
    suggestionSource: "inventory contributor signal",
  });
});
