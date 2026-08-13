import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@libsql/client";

import { dispatchWithTrustedIssueContext } from "../agent/channels/slack.js";
import { createIssueDelegationService } from "../agent/lib/issues/delegation-service.js";

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

test("specialist recovers trusted context from root lineage without a model-carried token", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createIssueDelegationService({
    client,
    now: () => new Date("2026-08-13T10:45:00.000Z"),
  });
  await service.initialize();

  const prepared = await service.save("root-session-1", context);

  assert.deepEqual(prepared, context);
  assert.equal("delegationToken" in prepared, false);
  assert.deepEqual(await service.get("root-session-1"), context);
});

test("issue delegation cannot be reused from another root session", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createIssueDelegationService({ client });
  await service.initialize();
  await service.save("root-session-1", context);

  await assert.rejects(
    service.get("root-session-2"),
    /no trusted issue-tracker delegation/i,
  );
  await assert.rejects(
    service.get(""),
    /delegated specialist session/i,
  );
});

test("re-preparing a root session refreshes its trusted Slack message context", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createIssueDelegationService({ client });
  await service.initialize();
  await service.save("root-session-1", context);

  const followup = {
    ...context,
    messageTs: "1786595099.000300",
  };
  await service.save("root-session-1", followup);

  assert.deepEqual(await service.get("root-session-1"), followup);
});
