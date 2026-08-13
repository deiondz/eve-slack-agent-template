import assert from "node:assert/strict";
import test from "node:test";

import {
  createInboundIssueContext,
  exchangeIssueDelegation,
  verifyIssueDelegation,
} from "../agent/lib/issues/delegation.js";

const context = {
  actorSlackUserId: "U_REPORTER",
  actorDisplayName: "Gautam Padiyar",
  channelId: "C_PRODUCT",
  messageTs: "1786595030.000200",
  teamId: "T_TEAM",
  threadTs: "1786595000.000100",
};

test("issue delegation binds trusted Slack metadata to the root session", () => {
  process.env.ISSUE_TRACKER_DELEGATION_SECRET =
    "test-issue-secret-with-at-least-32-characters";
  const inboundToken = createInboundIssueContext(context);
  const delegated = exchangeIssueDelegation({
    actorSlackUserId: context.actorSlackUserId,
    inboundToken,
    rootSessionId: "root-session-1",
  });

  assert.deepEqual(
    verifyIssueDelegation(delegated.delegationToken, "root-session-1"),
    context,
  );
});

test("issue delegation rejects another actor, session, and tampering", () => {
  process.env.ISSUE_TRACKER_DELEGATION_SECRET =
    "test-issue-secret-with-at-least-32-characters";
  const inboundToken = createInboundIssueContext(context);
  assert.throws(
    () =>
      exchangeIssueDelegation({
        actorSlackUserId: "U_OTHER",
        inboundToken,
        rootSessionId: "root-session-1",
      }),
    /another Slack member/i,
  );
  const delegated = exchangeIssueDelegation({
    actorSlackUserId: context.actorSlackUserId,
    inboundToken,
    rootSessionId: "root-session-1",
  });
  assert.throws(
    () => verifyIssueDelegation(delegated.delegationToken, "root-session-2"),
    /another session/i,
  );
  assert.throws(
    () =>
      verifyIssueDelegation(
        `${delegated.delegationToken.slice(0, -1)}x`,
        "root-session-1",
      ),
    /invalid/i,
  );
});

