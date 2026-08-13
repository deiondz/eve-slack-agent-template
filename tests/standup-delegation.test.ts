import assert from "node:assert/strict";
import test from "node:test";

import {
  createStandupDelegation,
  verifyStandupDelegation,
} from "../agent/lib/standup/delegation.js";

test("signed delegation preserves the authenticated actor and requested day", () => {
  process.env.STANDUP_DELEGATION_SECRET = "test-secret-with-at-least-32-characters";
  const issuedAt = new Date("2026-08-13T12:00:00.000Z");
  const delegation = createStandupDelegation({
    actorSlackUserId: "U_ALICE",
    rootSessionId: "session-1",
    standupDate: "2026-08-12",
    now: issuedAt,
  });

  assert.deepEqual(
    verifyStandupDelegation(
      delegation.delegationToken,
      "session-1",
    ),
    { actorSlackUserId: "U_ALICE", standupDate: "2026-08-12" },
  );
});

test("delegation rejects tampering and use from another root session", () => {
  process.env.STANDUP_DELEGATION_SECRET = "test-secret-with-at-least-32-characters";
  const issuedAt = new Date("2026-08-13T12:00:00.000Z");
  const { delegationToken } = createStandupDelegation({
    actorSlackUserId: "U_ALICE",
    rootSessionId: "session-1",
    now: issuedAt,
  });

  assert.throws(
    () =>
      verifyStandupDelegation(
        `${delegationToken.slice(0, -1)}x`,
        "session-1",
      ),
    /invalid/i,
  );
  assert.throws(
    () =>
      verifyStandupDelegation(delegationToken, "session-2"),
    /another session/i,
  );
});
