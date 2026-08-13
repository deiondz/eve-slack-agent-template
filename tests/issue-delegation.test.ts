import assert from "node:assert/strict";
import test from "node:test";

import { dispatchWithTrustedIssueContext } from "../agent/channels/slack.js";
import { requireIssueSlackContext } from "../agent/lib/issues/delegation.js";

const context = {
  actorSlackUserId: "U_REPORTER",
  actorDisplayName: "Gautam Padiyar",
  channelId: "C_PRODUCT",
  messageTs: "1786595030.000200",
  teamId: "T_TEAM",
  threadTs: "1786595000.000100",
};

test("Slack dispatch carries trusted issue metadata without Eve state", async () => {
  const message = {
    author: {
      fullName: context.actorDisplayName,
      userId: context.actorSlackUserId,
    },
    channelId: context.channelId,
    teamId: context.teamId,
    threadTs: context.threadTs,
    ts: context.messageTs,
  };
  const ctx = {
    slack: {
      channelId: context.channelId,
      teamId: context.teamId,
      threadTs: context.threadTs,
    },
    thread: {
      startTyping: async () => undefined,
    },
  };

  const result = await dispatchWithTrustedIssueContext(
    ctx as never,
    message as never,
  );

  assert.equal(result?.auth?.authenticator, "slack-webhook");
  assert.equal(result?.auth?.attributes.message_ts, context.messageTs);
});

test("specialist recovers trusted issue context directly from child-session auth", () => {
  const session = {
    auth: {
      current: {
        authenticator: "slack-webhook",
        attributes: {
          user_id: context.actorSlackUserId,
          full_name: context.actorDisplayName,
          channel_id: context.channelId,
          message_ts: context.messageTs,
          team_id: context.teamId,
          thread_ts: context.threadTs,
        },
      },
      initiator: null,
    },
    parent: { rootSessionId: "root-session-1" },
  };

  assert.deepEqual(requireIssueSlackContext(session as never), context);
});

test("issue context rejects root sessions and non-Slack callers", () => {
  const slackAuth = {
    authenticator: "slack-webhook",
    attributes: {
      user_id: context.actorSlackUserId,
      full_name: context.actorDisplayName,
      channel_id: context.channelId,
      message_ts: context.messageTs,
      team_id: context.teamId,
      thread_ts: context.threadTs,
    },
  };

  assert.throws(
    () =>
      requireIssueSlackContext({
        auth: { current: slackAuth, initiator: null },
      } as never),
    /delegated specialist/i,
  );
  assert.throws(
    () =>
      requireIssueSlackContext({
        auth: {
          current: { ...slackAuth, authenticator: "http-basic" },
          initiator: null,
        },
        parent: { rootSessionId: "root-session-1" },
      } as never),
    /authenticated Slack member/i,
  );
});
