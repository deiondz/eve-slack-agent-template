import assert from "node:assert/strict";
import test from "node:test";

import { parseSlackUserProfile } from "../agent/lib/slack-profile.js";

test("Slack profiles prefer display names and return a mention", () => {
  assert.deepEqual(
    parseSlackUserProfile("U123", {
      ok: true,
      user: {
        id: "U123",
        name: "sam.account",
        real_name: "Sam Account",
        profile: { display_name: "Sam", real_name: "Sam Profile" },
      },
    }),
    { slackUserId: "U123", mention: "<@U123>", displayName: "Sam" },
  );
});

test("Slack profiles fall back through real name, username, and user ID", () => {
  assert.equal(
    parseSlackUserProfile("U_REAL", {
      ok: true,
      user: { id: "U_REAL", profile: { display_name: "", real_name: "Real Name" } },
    }).displayName,
    "Real Name",
  );
  assert.equal(
    parseSlackUserProfile("U_NAME", {
      ok: true,
      user: { id: "U_NAME", name: "username", profile: {} },
    }).displayName,
    "username",
  );
  assert.equal(
    parseSlackUserProfile("U_ID", { ok: true, user: { id: "U_ID", profile: {} } })
      .displayName,
    "U_ID",
  );
});

test("Slack profile errors include missing scope guidance", () => {
  assert.throws(
    () =>
      parseSlackUserProfile("U123", {
        ok: false,
        error: "missing_scope",
        needed: "users:read",
      }),
    /required scope: users:read/,
  );
});
