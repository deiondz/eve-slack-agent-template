import {
  callSlackApi,
  type SlackBotToken,
  type SlackApiResponse,
} from "eve/channels/slack";

import type { StandupSlackGateway } from "./workflow.js";

function requireSlackResponse(
  response: SlackApiResponse,
  operation: string,
): SlackApiResponse {
  if (!response.ok) {
    throw new Error(`Slack ${operation} failed: ${String(response.error)}`);
  }
  return response;
}

export function createSlackStandupGateway(
  botToken: SlackBotToken | undefined,
): StandupSlackGateway {
  return {
    async publishMessage(channelId, text, idempotencyKey) {
      const response = requireSlackResponse(
        await callSlackApi({
          botToken,
          operation: "chat.postMessage",
          body: { channel: channelId, text, client_msg_id: idempotencyKey },
        }),
        "chat.postMessage",
      );
      const messageTs = typeof response.ts === "string" ? response.ts : "";
      if (!messageTs) throw new Error("Slack did not return a message timestamp.");
      return { messageTs };
    },

    async updateMessage(channelId, messageTs, text) {
      requireSlackResponse(
        await callSlackApi({
          botToken,
          operation: "chat.update",
          body: { channel: channelId, ts: messageTs, text },
        }),
        "chat.update",
      );
    },

  };
}

export async function openSlackDirectMessageChannel(
  botToken: SlackBotToken | undefined,
  slackUserId: string,
): Promise<string> {
  const opened = requireSlackResponse(
    await callSlackApi({
      botToken,
      operation: "conversations.open",
      body: { users: slackUserId },
    }),
    "conversations.open",
  );
  const channel = opened.channel;
  const channelId =
    typeof channel === "object" &&
    channel !== null &&
    "id" in channel &&
    typeof channel.id === "string"
      ? channel.id
      : "";
  if (!channelId) throw new Error("Slack did not return a DM channel id.");
  return channelId;
}
