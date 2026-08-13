import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@libsql/client";

import { createStandupService } from "../agent/lib/standup/service.js";

test("employee can append a morning plan and read it back", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());

  const service = createStandupService({
    client,
    roster: [{ slackUserId: "U_ALICE", displayName: "Alice", role: "employee" }],
    now: () => new Date("2026-08-13T06:00:00.000Z"),
  });
  await service.initialize();

  const created = await service.createEntry({
    actorSlackUserId: "U_ALICE",
    period: "morning",
    text: "Ship the onboarding fix",
  });

  assert.equal(created.standupDate, "2026-08-13");
  assert.equal(created.employeeSlackUserId, "U_ALICE");
  assert.equal(created.text, "Ship the onboarding fix");
  assert.deepEqual(
    await service.listEntries({
      actorSlackUserId: "U_ALICE",
      period: "morning",
    }),
    [created],
  );
});

test("employees manage only their entries while managers can manage the team", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_BOB", displayName: "Bob", role: "employee" },
      { slackUserId: "U_MANAGER", displayName: "Mina", role: "manager" },
    ],
    now: () => new Date("2026-08-13T06:00:00.000Z"),
  });
  await service.initialize();
  const entry = await service.createEntry({
    actorSlackUserId: "U_ALICE",
    period: "evening",
    text: "Reviewed the release",
  });

  await assert.rejects(
    service.updateEntry({
      actorSlackUserId: "U_BOB",
      entryId: entry.id,
      text: "Changed somebody else's update",
    }),
    /only their own/i,
  );

  const updated = await service.updateEntry({
    actorSlackUserId: "U_MANAGER",
    entryId: entry.id,
    text: "Reviewed and approved the release",
  });
  assert.equal(updated.text, "Reviewed and approved the release");

  await service.deleteEntry({ actorSlackUserId: "U_ALICE", entryId: entry.id });
  await service.deleteEntry({ actorSlackUserId: "U_ALICE", entryId: entry.id });
  assert.deepEqual(
    await service.listEntries({
      actorSlackUserId: "U_ALICE",
      period: "evening",
    }),
    [],
  );
});

test("explicit empty responses are distinct from employees awaiting an update", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_BOB", displayName: "Bob", role: "employee" },
      { slackUserId: "U_MANAGER", displayName: "Mina", role: "manager" },
    ],
    now: () => new Date("2026-08-13T11:15:00.000Z"),
  });
  await service.initialize();

  await service.acknowledgeEmpty({
    actorSlackUserId: "U_ALICE",
    period: "evening",
  });

  assert.deepEqual(await service.getDigest("2026-08-13", "evening"), [
    {
      employeeSlackUserId: "U_ALICE",
      displayName: "Alice",
      response: "empty",
      entries: [],
    },
    {
      employeeSlackUserId: "U_BOB",
      displayName: "Bob",
      response: "awaiting",
      entries: [],
    },
  ]);
  assert.deepEqual(
    (await service.listPendingEmployees("2026-08-13", "evening")).map(
      (employee) => employee.slackUserId,
    ),
    ["U_BOB"],
  );
});

test("replaying the same durable tool call does not duplicate an entry", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    roster: [{ slackUserId: "U_ALICE", displayName: "Alice", role: "employee" }],
    now: () => new Date("2026-08-13T06:00:00.000Z"),
  });
  await service.initialize();

  const first = await service.createEntry({
    actorSlackUserId: "U_ALICE",
    period: "morning",
    text: "Review the migration",
    idempotencyKey: "tool-call-1:0",
  });
  const replay = await service.createEntry({
    actorSlackUserId: "U_ALICE",
    period: "morning",
    text: "Review the migration",
    idempotencyKey: "tool-call-1:0",
  });

  assert.equal(replay.id, first.id);
  assert.equal(
    (
      await service.listEntries({
        actorSlackUserId: "U_ALICE",
        period: "morning",
      })
    ).length,
    1,
  );
});

test("a manager can persist chat-managed channel and roster configuration", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_OLD",
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice", role: "employee" },
      { slackUserId: "U_MANAGER", displayName: "Mina", role: "manager" },
    ],
  });
  await service.initialize();

  const configuration = await service.updateConfiguration({
    actorSlackUserId: "U_MANAGER",
    dailyUpdatesChannelId: "C_NEW",
    roster: [
      { slackUserId: "U_ALICE", displayName: "Alice A.", role: "employee" },
      { slackUserId: "U_BOB", displayName: "Bob", role: "employee" },
      { slackUserId: "U_MANAGER", displayName: "Mina", role: "manager" },
    ],
  });

  assert.equal(configuration.dailyUpdatesChannelId, "C_NEW");
  assert.deepEqual(await service.getConfiguration("U_MANAGER"), configuration);
  assert.deepEqual(
    (await service.getDigest("2026-08-13", "morning")).map(
      (employee) => employee.displayName,
    ),
    ["Alice A.", "Bob"],
  );
});

test("employees cannot change stand-up configuration", async (t) => {
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

  await assert.rejects(
    service.updateConfiguration({
      actorSlackUserId: "U_ALICE",
      dailyUpdatesChannelId: "C_OTHER",
    }),
    /only a configured stand-up manager/i,
  );
});

test("persisted configuration is not overwritten by environment seeds", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const first = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_SEED",
    roster: [{ slackUserId: "U_MANAGER", displayName: "Mina", role: "manager" }],
  });
  await first.initialize();
  await first.updateConfiguration({
    actorSlackUserId: "U_MANAGER",
    dailyUpdatesChannelId: "C_CHAT",
  });

  const restarted = createStandupService({
    client,
    initialDailyUpdatesChannelId: "C_CHANGED_ENV",
    roster: [{ slackUserId: "U_OTHER", displayName: "Other", role: "manager" }],
  });
  await restarted.initialize();

  assert.equal(await restarted.getDailyUpdatesChannelId(), "C_CHAT");
  assert.deepEqual(await restarted.getRoster(), [
    { slackUserId: "U_MANAGER", displayName: "Mina", role: "manager" },
  ]);
});
