import assert from "node:assert/strict";
import test from "node:test";

import { rankOwnerMatches } from "../agent/lib/issues/owners.js";

test("owner matching prioritizes exact identity evidence and keeps fuzzy matches suggestions", () => {
  const matches = rankOwnerMatches(
    [
      { login: "padi-g", name: "Gautam Padiyar", email: "gautam@example.com" },
      { login: "Sahad-09", name: "Sahad Pop" },
    ],
    [
      {
        slackUserId: "U_GAUTAM",
        displayName: "Gautam Padiyar",
        email: "gautam@example.com",
      },
      { slackUserId: "U_SAHAD", displayName: "Sahad Pop" },
    ],
  );

  assert.deepEqual(
    matches.map(({ githubLogin, slackUserId, reason }) => ({
      githubLogin,
      slackUserId,
      reason,
    })),
    [
      { githubLogin: "padi-g", slackUserId: "U_GAUTAM", reason: "exact email" },
      {
        githubLogin: "Sahad-09",
        slackUserId: "U_SAHAD",
        reason: "exact normalized name",
      },
    ],
  );
});

