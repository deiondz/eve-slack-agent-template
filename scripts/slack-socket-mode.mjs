import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";

import { LogLevel, SocketModeClient } from "@slack/socket-mode";

const mode = process.argv[2] ?? "dev";
if (mode !== "dev" && mode !== "start") {
  throw new Error(`Expected "dev" or "start", received ${JSON.stringify(mode)}`);
}

const appToken = process.env.SLACK_APP_TOKEN;
const botToken = process.env.SLACK_BOT_TOKEN;
if (!appToken?.startsWith("xapp-")) {
  throw new Error("SLACK_APP_TOKEN must be a Slack app-level token beginning with xapp-");
}
if (!botToken?.startsWith("xoxb-")) {
  throw new Error("SLACK_BOT_TOKEN must be a Slack bot token beginning with xoxb-");
}

const port = process.env.PORT ?? "3000";
const eveSlackUrl = process.env.SLACK_SOCKET_EVE_URL ?? `http://127.0.0.1:${port}/eve/v1/slack`;
const eveHealthUrl = new URL("/eve/v1/health", eveSlackUrl).href;
const internalSecret =
  process.env.SLACK_SOCKET_MODE_INTERNAL_SECRET ?? randomBytes(32).toString("hex");

const eveCommand = process.platform === "win32" ? "eve.cmd" : "eve";
const eve = spawn(eveCommand, [mode, ...process.argv.slice(3)], {
  env: {
    ...process.env,
    SLACK_SOCKET_MODE_INTERNAL_SECRET: internalSecret,
  },
  stdio: "inherit",
});

let eveExit;
const eveExited = new Promise((resolve) => {
  eve.once("exit", (code, signal) => {
    eveExit = { code, signal };
    resolve(eveExit);
  });
});

eve.once("error", (error) => {
  console.error("[slack-socket] Failed to start Eve:", error);
});

async function waitForEve() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline && !eveExit) {
    try {
      const response = await fetch(eveHealthUrl, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      // Eve is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  if (eveExit) {
    throw new Error(`Eve exited before becoming ready (${eveExit.code ?? eveExit.signal})`);
  }
  throw new Error(`Eve did not become healthy at ${eveHealthUrl} within 60 seconds`);
}

async function forwardEnvelope({ type, body }) {
  let contentType;
  let payload;

  if (type === "events_api") {
    contentType = "application/json";
    payload = JSON.stringify(body);
  } else if (type === "interactive") {
    contentType = "application/x-www-form-urlencoded";
    payload = new URLSearchParams({ payload: JSON.stringify(body) }).toString();
  } else {
    return null;
  }

  const response = await fetch(eveSlackUrl, {
    method: "POST",
    headers: {
      "content-type": contentType,
      "x-eve-slack-socket-secret": internalSecret,
    },
    body: payload,
    signal: AbortSignal.timeout(2_500),
  });

  if (!response.ok) {
    throw new Error(`Eve Slack route returned ${response.status}`);
  }

  const responseBody = await response.text();
  if (type !== "interactive" || !responseBody || responseBody === "ok") {
    return { ackPayload: undefined };
  }

  try {
    return { ackPayload: JSON.parse(responseBody) };
  } catch {
    return { ackPayload: responseBody };
  }
}

const socket = new SocketModeClient({
  appToken,
  logLevel: process.env.SLACK_SOCKET_DEBUG === "1" ? LogLevel.DEBUG : LogLevel.INFO,
});
let socketStarted = false;

socket.on("slack_event", async (envelope) => {
  try {
    const forwarded = await forwardEnvelope(envelope);
    await envelope.ack(forwarded?.ackPayload);
    if (forwarded === null) {
      console.warn(`[slack-socket] Ignored unsupported envelope type: ${envelope.type}`);
    }
  } catch (error) {
    // Do not acknowledge failed deliveries; Slack can retry the envelope.
    console.error("[slack-socket] Failed to deliver an envelope to Eve:", error);
  }
});

socket.on("error", (error) => {
  console.error("[slack-socket] Socket Mode error:", error);
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    if (socketStarted) await socket.disconnect();
  } finally {
    if (!eveExit) eve.kill(signal);
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    void shutdown(signal);
  });
}

try {
  await waitForEve();
  await socket.start();
  socketStarted = true;
  if (shuttingDown) {
    await socket.disconnect();
  } else {
    console.log(`[slack-socket] Connected; forwarding Slack envelopes to ${eveSlackUrl}`);
  }
  const result = await eveExited;
  await shutdown("SIGTERM");
  process.exitCode = result.code ?? 1;
} catch (error) {
  console.error("[slack-socket] Startup failed:", error);
  await shutdown("SIGTERM");
  process.exitCode = 1;
}
