import assert from "node:assert/strict";
import test from "node:test";

import { createGitHubIssue, type GhRunner } from "../agent/lib/issues/github.js";

test("issue creation uses gh arguments and silently skips unavailable labels", async () => {
  const calls: string[][] = [];
  const gh: GhRunner = async (args) => {
    calls.push([...args]);
    if (args[0] === "repo") {
      return JSON.stringify({
        nameWithOwner: "manasijatech/myuki",
        isArchived: false,
        viewerPermission: "WRITE",
        url: "https://github.com/manasijatech/myuki",
      });
    }
    if (args[0] === "label") return JSON.stringify([{ name: "bug" }]);
    return "https://github.com/manasijatech/myuki/issues/42";
  };

  const result = await createGitHubIssue(
    {
      repo: "manasijatech/myuki",
      title: "Morning summary is unavailable",
      body: "Formatted issue body",
      labels: ["bug", "needs-triage"],
    },
    gh,
  );

  assert.deepEqual(result, {
    number: 42,
    url: "https://github.com/manasijatech/myuki/issues/42",
    labels: ["bug"],
  });
  const createCall = calls.find((args) => args[0] === "issue" && args[1] === "create");
  assert.ok(createCall);
  assert.deepEqual(createCall.slice(-2), ["--label", "bug"]);
  assert.ok(!createCall.includes("needs-triage"));
});

