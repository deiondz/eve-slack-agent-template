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

  async publishMessage(channelId: string, text: string, _idempotencyKey: string) {
    const messageTs = `message-${this.published.length + 1}`;
    this.published.push({ channelId, text, messageTs });
    return { messageTs };
  }

  async updateMessage(channelId: string, messageTs: string, text: string) {
    this.updated.push({ channelId, messageTs, text });
  }

  async sendDirectMessage(slackUserId: string, text: string) {
    this.directMessages.push({ slackUserId, text });
  }
}

test("morning workflow publishes one canonical digest and prompts every employee", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_BOB", displayName: "Bob", role: "employee" },
    ],
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({
    service,
    slack,
    dailyUpdatesChannelId: "C_DAILY",
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

test("evening reminder goes only to employees still awaiting an update", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
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
    dailyUpdatesChannelId: "C_DAILY",
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
});

test("a midday accomplishment waits for the scheduled evening digest", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    roster: [{ slackUserId: "U_ALICE", displayName: "Alice", role: "employee" }],
    now: () => new Date("2026-08-13T08:00:00.000Z"),
  });
  await service.initialize();
  const slack = new FakeSlackGateway();
  const workflow = createStandupWorkflow({
    service,
    slack,
    dailyUpdatesChannelId: "C_DAILY",
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
