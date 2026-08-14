import assert from "node:assert/strict";
import test from "node:test";

import { requireDelegatedSlackActor } from "../agent/lib/slack-session.js";
import { standupAddInputSchema } from "../agent/subagents/standup/tools/standup_add.js";

test("stand-up add structurally separates self updates from manager targets", () => {
  const entries = [{ period: "morning" as const, text: "Test Furgo" }];

  assert.equal(
    standupAddInputSchema.safeParse({ scope: "self_current", entries }).success,
    true,
  );
  assert.equal(
    standupAddInputSchema.safeParse({
      entries,
      employeeSlackUserId: "authenticated",
      standupDate: "2025-02-14",
    }).success,
    false,
  );
  assert.equal(
    standupAddInputSchema.safeParse({
      scope: "employee_current",
      entries,
      employeeSlackUserId: "Bhaskar",
    }).success,
    false,
  );
});

test("stand-up specialist recovers the authenticated actor from child-session auth", () => {
  assert.equal(
    requireDelegatedSlackActor({
      auth: {
        current: {
          authenticator: "slack-webhook",
          attributes: { user_id: "U_ALICE" },
        },
        initiator: null,
      },
      parent: { rootSessionId: "root-session-1" },
    } as never),
    "U_ALICE",
  );
});

test("stand-up actor recovery rejects untrusted execution contexts", () => {
  assert.throws(
    () =>
      requireDelegatedSlackActor({
        auth: {
          current: {
            authenticator: "slack-webhook",
            attributes: { user_id: "U_ALICE" },
          },
          initiator: null,
        },
      } as never),
    /delegated specialist/i,
  );
  assert.throws(
    () =>
      requireDelegatedSlackActor({
        auth: { current: null, initiator: null },
        parent: { rootSessionId: "root-session-1" },
      } as never),
    /authenticated Slack member/i,
  );
});
