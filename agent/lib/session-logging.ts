import { createClient, type Client } from "@libsql/client";
import type { HookContext } from "eve/hooks";

interface SessionStartedEvent {
  readonly data: {
    readonly invocation?: {
      readonly name: string;
      readonly parentCallId: string;
      readonly parentSessionId: string;
      readonly parentTurnId: string;
    };
    readonly runtime?: {
      readonly agentId: string;
      readonly eveVersion: string;
      readonly modelId: string;
    };
  };
  readonly meta?: { readonly at: string };
}

export interface SessionLogRecord {
  sessionId: string;
  scope: string;
  agentName: string;
  agentNodeId?: string;
  channelKind?: string;
  parentSessionId?: string;
  parentTurnId?: string;
  parentCallId?: string;
  subagentName?: string;
  runtimeAgentId?: string;
  modelId?: string;
  eveVersion?: string;
  createdAt: string;
}

interface SessionLogServiceOptions {
  client: Client;
  now?: () => Date;
}

export function createSessionLogService({
  client,
  now = () => new Date(),
}: SessionLogServiceOptions) {
  return {
    async initialize(): Promise<void> {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS agent_session_logs (
          session_id TEXT PRIMARY KEY,
          scope TEXT NOT NULL,
          agent_name TEXT NOT NULL,
          agent_node_id TEXT,
          channel_kind TEXT,
          parent_session_id TEXT,
          parent_turn_id TEXT,
          parent_call_id TEXT,
          subagent_name TEXT,
          runtime_agent_id TEXT,
          model_id TEXT,
          eve_version TEXT,
          created_at TEXT NOT NULL
        )
      `);
      await client.execute(`
        CREATE INDEX IF NOT EXISTS agent_session_logs_created_at_idx
        ON agent_session_logs (created_at DESC)
      `);
    },

    async record(record: SessionLogRecord): Promise<void> {
      await client.execute({
        sql: `INSERT INTO agent_session_logs (
          session_id, scope, agent_name, agent_node_id, channel_kind,
          parent_session_id, parent_turn_id, parent_call_id, subagent_name,
          runtime_agent_id, model_id, eve_version, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (session_id) DO NOTHING`,
        args: [
          record.sessionId,
          record.scope,
          record.agentName,
          record.agentNodeId ?? null,
          record.channelKind ?? null,
          record.parentSessionId ?? null,
          record.parentTurnId ?? null,
          record.parentCallId ?? null,
          record.subagentName ?? null,
          record.runtimeAgentId ?? null,
          record.modelId ?? null,
          record.eveVersion ?? null,
          record.createdAt,
        ],
      });
    },

    createRecord(
      scope: string,
      event: SessionStartedEvent,
      ctx: HookContext,
    ): SessionLogRecord {
      const parent = ctx.session.parent;
      return {
        sessionId: ctx.session.id,
        scope,
        agentName: ctx.agent.name,
        agentNodeId: ctx.agent.nodeId,
        channelKind: ctx.channel.kind,
        parentSessionId:
          parent?.sessionId ?? event.data.invocation?.parentSessionId,
        parentTurnId: parent?.turn.id ?? event.data.invocation?.parentTurnId,
        parentCallId: parent?.callId ?? event.data.invocation?.parentCallId,
        subagentName: parent ? scope : event.data.invocation?.name,
        runtimeAgentId: event.data.runtime?.agentId,
        modelId: event.data.runtime?.modelId,
        eveVersion: event.data.runtime?.eveVersion,
        createdAt: event.meta?.at ?? now().toISOString(),
      };
    },
  };
}

let runtimePromise: ReturnType<typeof createRuntime> | undefined;

async function createRuntime() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:standup.sqlite",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const service = createSessionLogService({ client });
  await service.initialize();
  return service;
}

function getRuntime() {
  runtimePromise ??= createRuntime().catch((error) => {
    runtimePromise = undefined;
    throw error;
  });
  return runtimePromise;
}

export async function logGeneratedSession(
  scope: string,
  event: SessionStartedEvent,
  ctx: HookContext,
): Promise<void> {
  try {
    const service = await getRuntime();
    await service.record(service.createRecord(scope, event, ctx));
  } catch (error) {
    console.error("[session-log] Failed to record generated session", {
      error,
      scope,
      sessionId: ctx.session.id,
    });
  }
}
