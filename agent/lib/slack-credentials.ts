import { timingSafeEqual } from "node:crypto";

import { connectSlackCredentials } from "@vercel/connect/eve";
import type { SlackChannelCredentials } from "eve/channels/slack";

const socketModeInternalSecret = process.env.SLACK_SOCKET_MODE_INTERNAL_SECRET;

function verifySocketModeBridge(request: Request, body: string): string {
  const suppliedSecret = request.headers.get("x-eve-slack-socket-secret");
  if (!socketModeInternalSecret || !suppliedSecret) {
    throw new Error("Missing Socket Mode bridge authentication");
  }

  const expected = Buffer.from(socketModeInternalSecret);
  const supplied = Buffer.from(suppliedSecret);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    throw new Error("Invalid Socket Mode bridge authentication");
  }

  return body;
}

export const slackCredentials: SlackChannelCredentials = socketModeInternalSecret
  ? {
      botToken: process.env.SLACK_BOT_TOKEN,
      webhookVerifier: verifySocketModeBridge,
    }
  : process.env.SLACK_CONNECTOR
    ? connectSlackCredentials(process.env.SLACK_CONNECTOR)
    : {
        botToken: process.env.SLACK_BOT_TOKEN,
        signingSecret: process.env.SLACK_SIGNING_SECRET,
      };
