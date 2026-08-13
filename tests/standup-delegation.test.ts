import assert from "node:assert/strict";
import test from "node:test";

import { requireDelegatedSlackActor } from "../agent/lib/slack-session.js";

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
