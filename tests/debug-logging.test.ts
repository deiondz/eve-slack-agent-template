import assert from "node:assert/strict";
import test from "node:test";

import { logAgentEvent } from "../agent/lib/debug-logging.js";

const context = {
  agent: { name: "test-agent" },
  channel: { kind: "test" },
  session: { id: "test-session" },
};

test("agent event logging is opt-in", () => {
  const originalDebugLogs = process.env.AGENT_DEBUG_LOGS;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalConsoleError = console.error;
  const messages: unknown[][] = [];

  console.error = (...args: unknown[]) => {
    messages.push(args);
  };

  try {
    delete process.env.AGENT_DEBUG_LOGS;
    process.env.NODE_ENV = "development";
    logAgentEvent("test", { type: "session.started", data: {} }, context);
    assert.equal(messages.length, 0);

    process.env.AGENT_DEBUG_LOGS = "1";
    logAgentEvent("test", { type: "session.started", data: {} }, context);
    assert.equal(messages.length, 1);
  } finally {
    console.error = originalConsoleError;
    if (originalDebugLogs === undefined) delete process.env.AGENT_DEBUG_LOGS;
    else process.env.AGENT_DEBUG_LOGS = originalDebugLogs;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});
