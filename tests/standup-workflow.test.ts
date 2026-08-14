import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@libsql/client";

import { createStandupService } from "../agent/lib/standup/service.js";
import {
  createStandupWorkflow,
  type StandupSlackGateway,
} from "../agent/lib/standup/workflow.js";

class FakeSlackGateway implements StandupSlackGateway {
  published: Array<{ channelId: string; text: string; messageTs: string }> = [];
  updated: Array<{ channelId: string; messageTs: string; text: string }> = [];
  directMessages: Array<{ slackUserId: string; text: string }> = [];
  updateError?: Error;

  async publishMessage(channelId: string, text: string, _idempotencyKey: string) {
    const messageTs = `message-${this.published.length + 1}`;
    this.published.push({ channelId, text, messageTs });
    return { messageTs };
  }

  async updateMessage(channelId: string, messageTs: string, text: string) {
    if (this.updateError) throw this.updateError;
    this.updated.push({ channelId, messageTs, text });
  }

  async sendDirectMessage(slackUserId: string, text: string) {
    this.directMessages.push({ slackUserId, text });
  }
}

test("a deleted canonical Slack message does not fail a saved stand-up update", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_DAILY",
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_MANAGER", displayName: "Mina", role: "manager" },
    ],
    now: () => new Date("2026-08-14T08:00:00.000Z"),
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({ service, slack });

  await workflow.publishDigest("U_MANAGER", "2026-08-14", "morning");
  slack.updateError = new Error("Slack chat.update failed: message_not_found");
  await service.createEntry({
    actorSlackUserId: "U_ALICE",
    period: "morning",
    text: "Test Furgo",
  });

  await assert.doesNotReject(
    workflow.refreshDigest("2026-08-14", "morning"),
  );
  assert.equal(slack.published.length, 2);
  assert.deepEqual(await service.getDigestMessage("2026-08-14", "morning"), {
    channelId: "C_DAILY",
    messageTs: "message-2",
  });
});

test("digest refresh still surfaces non-stale Slack failures", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_DAILY",
    roster: [
      { slackUserId: "U_MANAGER", displayName: "Mina", role: "manager" },
    ],
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({ service, slack });

  await workflow.publishDigest("U_MANAGER", "2026-08-14", "morning");
  slack.updateError = new Error("Slack chat.update failed: invalid_auth");

  await assert.rejects(
    workflow.refreshDigest("2026-08-14", "morning"),
    /invalid_auth/u,
  );
  assert.deepEqual(await service.getDigestMessage("2026-08-14", "morning"), {
    channelId: "C_DAILY",
    messageTs: "message-1",
  });
});

test("morning workflow publishes one canonical digest and prompts every employee", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_DAILY",
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_BOB", displayName: "Bob", role: "employee" },
    ],
    now: () => new Date("2026-08-13T08:00:00.000Z"),
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({
    service,
    slack,
  });

  await workflow.runMorning("2026-08-13", (slackUserId, text) =>
    slack.sendDirectMessage(slackUserId, text),
  );

  assert.equal(slack.published.length, 1);
  assert.match(slack.published[0]?.text ?? "", /^Morning stand-up/);
  assert.deepEqual(
    slack.directMessages.map((message) => message.slackUserId),
    ["U_ALICE", "U_BOB"],
  );

  await service.createEntry({
    actorSlackUserId: "U_ALICE",
    standupDate: "2026-08-13",
    period: "morning",
    text: "Ship the onboarding fix",
  });
  await workflow.refreshDigest("2026-08-13", "morning");

  assert.equal(slack.published.length, 1);
  assert.equal(slack.updated[0]?.messageTs, "message-1");
  assert.match(slack.updated[0]?.text ?? "", /• Ship the onboarding fix/);
});

test("a morning update creates the report when the scheduled report is missing", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_DAILY",
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_BOB", displayName: "Bob", role: "employee" },
    ],
    now: () => new Date("2026-08-14T08:00:00.000Z"),
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({ service, slack });

  await service.createEntry({
    actorSlackUserId: "U_ALICE",
    period: "morning",
    text: "Complete the GitHub issue workflow",
  });
  await workflow.syncDigestAfterMutation("2026-08-14", "morning");

  assert.equal(slack.published.length, 1);
  assert.match(slack.published[0]?.text ?? "", /<@U_ALICE>/);
  assert.match(slack.published[0]?.text ?? "", /Complete the GitHub issue workflow/);
  assert.match(slack.published[0]?.text ?? "", /<@U_BOB>/);
  assert.match(slack.published[0]?.text ?? "", /Awaiting update/);
});

test("evening reminder goes only to employees still awaiting an update", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_DAILY",
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_BOB", displayName: "Bob", role: "employee" },
      { slackUserId: "U_CARA", displayName: "Cara", role: "employee" },
    ],
    now: () => new Date("2026-08-13T11:15:00.000Z"),
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({
    service,
    slack,
  });

  await workflow.runEveningPrompt("2026-08-13", (slackUserId, text) =>
    slack.sendDirectMessage(slackUserId, text),
  );
  assert.deepEqual(
    slack.directMessages.map((message) => message.slackUserId),
    ["U_ALICE", "U_BOB", "U_CARA"],
  );

  await service.acknowledgeEmpty({
    actorSlackUserId: "U_ALICE",
    period: "evening",
  });
  await service.createEntry({
    actorSlackUserId: "U_CARA",
    period: "evening",
    text: "Finished the API migration",
  });
  slack.directMessages.length = 0;

  await workflow.runEveningReminder("2026-08-13", (slackUserId, text) =>
    slack.sendDirectMessage(slackUserId, text),
  );
  assert.deepEqual(slack.directMessages, [
    {
      slackUserId: "U_BOB",
      text: "Reminder: please share what you worked on today (2026-08-13), even if there is nothing to report.",
    },
  ]);
  assert.equal(slack.published.length, 1);
  assert.match(slack.published[0]?.text ?? "", /^Evening stand-up/u);
});

test("morning reminder publishes a missing report and prompts only pending employees", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_DAILY",
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_BOB", displayName: "Bob", role: "employee" },
    ],
    now: () => new Date("2026-08-14T04:50:00.000Z"),
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({ service, slack });

  await service.createEntry({
    actorSlackUserId: "U_ALICE",
    period: "morning",
    text: "Improve the stand-up scheduler",
  });
  await workflow.runMorningReminder("2026-08-14", (slackUserId, text) =>
    slack.sendDirectMessage(slackUserId, text),
  );

  assert.deepEqual(slack.directMessages.map(({ slackUserId }) => slackUserId), [
    "U_BOB",
  ]);
  assert.equal(slack.published.length, 1);
  assert.match(slack.published[0]?.text ?? "", /Improve the stand-up scheduler/u);
});

test("a midday accomplishment waits for the scheduled evening digest", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_DAILY",
    roster: [{ slackUserId: "U_ALICE", displayName: "Alice", role: "employee" }],
    now: () => new Date("2026-08-13T08:00:00.000Z"),
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({
    service,
    slack,
  });

  await service.createEntry({
    actorSlackUserId: "U_ALICE",
    period: "evening",
    text: "Fixed the production alert",
  });
  await workflow.refreshDigest("2026-08-13", "evening");

  assert.equal(slack.published.length, 0);
  await workflow.runEveningPrompt("2026-08-13", async () => {});
  assert.equal(slack.published.length, 1);
  assert.match(slack.published[0]?.text ?? "", /Fixed the production alert/);
});

test("refreshing today rewrites a digest that was published under a stale date", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_DAILY",
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_MANAGER", displayName: "Mina", role: "manager" },
    ],
    now: () => new Date("2026-08-13T11:37:00.000Z"),
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({ service, slack });

  await workflow.publishDigest("U_MANAGER", "2025-02-14", "evening");
  await service.createEntry({
    actorSlackUserId: "U_ALICE",
    period: "evening",
    text: "Built the issue tracker as a subagent",
  });

  const refreshed = await workflow.refreshDigest("2026-08-13", "evening");

  assert.equal(slack.published.length, 1);
  assert.equal(slack.updated.length, 1);
  assert.equal(refreshed?.standupDate, "2026-08-13");
  assert.match(slack.updated[0]?.text ?? "", /Evening stand-up — August 13, 2026/);
  assert.match(slack.updated[0]?.text ?? "", /Built the issue tracker as a subagent/);
  assert.deepEqual(await service.getDigestMessage("2026-08-13", "evening"), {
    channelId: "C_DAILY",
    messageTs: "message-1",
  });
  assert.equal(await service.getDigestMessage("2025-02-14", "evening"), null);
});

test("refreshing today leaves yesterday's evening digest untouched", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_DAILY",
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_MANAGER", displayName: "Mina", role: "manager" },
    ],
    now: () => new Date("2026-08-13T08:00:00.000Z"),
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({ service, slack });

  await workflow.publishDigest("U_MANAGER", "2026-08-12", "evening");
  await service.createEntry({
    actorSlackUserId: "U_ALICE",
    period: "evening",
    text: "Fixed the production alert",
  });

  const refreshed = await workflow.refreshDigest("2026-08-13", "evening");

  assert.equal(refreshed, null);
  assert.equal(slack.updated.length, 0);
  assert.equal(
    (await service.getDigestMessage("2026-08-12", "evening"))?.messageTs,
    "message-1",
  );
});

test("a manager can explicitly publish a saved morning digest", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_DAILY",
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_MANAGER", displayName: "Mina", role: "manager" },
    ],
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({ service, slack });
  await service.createEntry({
    actorSlackUserId: "U_MANAGER",
    employeeSlackUserId: "U_ALICE",
    standupDate: "2026-08-13",
    period: "morning",
    text: "Ship the manual publishing fix",
  });

  await workflow.publishDigest("U_MANAGER", "2026-08-13", "morning");

  assert.equal(slack.published.length, 1);
  assert.equal(slack.published[0]?.channelId, "C_DAILY");
  assert.match(slack.published[0]?.text ?? "", /Ship the manual publishing fix/);
  await assert.rejects(
    workflow.publishDigest("U_ALICE", "2026-08-13", "morning"),
    /only a configured stand-up manager/i,
  );
});
