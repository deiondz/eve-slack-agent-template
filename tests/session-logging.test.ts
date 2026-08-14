import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@libsql/client";
import type { HookContext } from "eve/hooks";

import { createSessionLogService } from "../agent/lib/session-logging.js";

test("records every generated session once with improvement metadata", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createSessionLogService({
    client,
    now: () => new Date("2026-08-14T10:00:00.000Z"),
  });
  await service.initialize();

  const context = {
    agent: { name: "furgo", nodeId: "issue-tracker" },
    channel: { kind: "subagent" },
    session: {
      id: "session-child",
      auth: { current: null, initiator: null },
      parent: {
        callId: "call-1",
        rootSessionId: "session-parent",
        sessionId: "session-parent",
        turn: { id: "turn_0", sequence: 0 },
      },
      turn: { id: "turn_0", sequence: 0 },
    },
  } as unknown as HookContext;
  const event = {
    type: "session.started" as const,
    data: {
      runtime: {
        agentId: "agent-1",
        eveVersion: "0.24.6",
        modelId: "gpt-5.6-luna",
      },
    },
    meta: { at: "2026-08-14T09:59:59.000Z" },
  };

  const record = service.createRecord("issue-tracker", event, context);
  await service.record(record);
  await service.record(record);

  const result = await client.execute("SELECT * FROM agent_session_logs");
  assert.equal(result.rows.length, 1);
  assert.deepEqual(
    {
      sessionId: result.rows[0]?.session_id,
      scope: result.rows[0]?.scope,
      channelKind: result.rows[0]?.channel_kind,
      parentSessionId: result.rows[0]?.parent_session_id,
      parentTurnId: result.rows[0]?.parent_turn_id,
      parentCallId: result.rows[0]?.parent_call_id,
      subagentName: result.rows[0]?.subagent_name,
      modelId: result.rows[0]?.model_id,
      createdAt: result.rows[0]?.created_at,
    },
    {
      sessionId: "session-child",
      scope: "issue-tracker",
      channelKind: "subagent",
      parentSessionId: "session-parent",
      parentTurnId: "turn_0",
      parentCallId: "call-1",
      subagentName: "issue-tracker",
      modelId: "gpt-5.6-luna",
      createdAt: "2026-08-14T09:59:59.000Z",
    },
  );
});

test("falls back to the local clock when an event has no durable timestamp", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  const service = createSessionLogService({
    client,
    now: () => new Date("2026-08-14T10:00:00.000Z"),
  });
  const context = {
    agent: { name: "furgo" },
    channel: { kind: "slack" },
    session: {
      id: "session-root",
      auth: { current: null, initiator: null },
      turn: { id: "turn_0", sequence: 0 },
    },
  } as unknown as HookContext;

  assert.equal(
    service.createRecord("root", { data: {} }, context).createdAt,
    "2026-08-14T10:00:00.000Z",
  );
});
