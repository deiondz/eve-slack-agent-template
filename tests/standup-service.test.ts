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
