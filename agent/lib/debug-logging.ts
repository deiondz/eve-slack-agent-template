import { inspect } from "node:util";

interface DebugHookContext {
  readonly agent: { readonly name: string; readonly nodeId?: string };
  readonly channel: { readonly kind?: string; readonly continuationToken?: string };
  readonly session: {
    readonly auth?: unknown;
    readonly id: string;
    readonly parent?: unknown;
    readonly turn?: unknown;
  };
}

function debugLogsEnabled(): boolean {
  const configured = process.env.AGENT_DEBUG_LOGS;
  if (configured !== undefined) return configured === "1";
  return process.env.NODE_ENV !== "production";
}

export function logAgentEvent(scope: string, event: unknown, ctx: DebugHookContext): void {
  if (!debugLogsEnabled()) return;

  const eventRecord =
    typeof event === "object" && event !== null
      ? (event as { readonly data?: unknown; readonly type?: unknown })
      : undefined;
  const type = typeof eventRecord?.type === "string" ? eventRecord.type : "unknown";
  const data = compactStreamingData(type, eventRecord?.data);

  const output = inspect(
    {
      scope,
      context: {
        agent: ctx.agent,
        channel: ctx.channel,
        session: {
          auth: ctx.session.auth,
          id: ctx.session.id,
          parent: ctx.session.parent,
          turn: ctx.session.turn,
        },
      },
      event: eventRecord ? { ...eventRecord, data } : event,
    },
    {
      colors: process.stderr.isTTY,
      compact: false,
      depth: null,
      maxArrayLength: null,
      maxStringLength: null,
    },
  );

  console.error(`[agent-debug] ${output}`);
}

function compactStreamingData(type: string, data: unknown): unknown {
  if (typeof data !== "object" || data === null) return data;
  const record = data as Record<string, unknown>;

  if (type === "message.appended") {
    const { messageSoFar: _messageSoFar, ...deltaOnly } = record;
    return deltaOnly;
  }
  if (type === "reasoning.appended") {
    const { reasoningSoFar: _reasoningSoFar, ...deltaOnly } = record;
    return deltaOnly;
  }
  return data;
}
