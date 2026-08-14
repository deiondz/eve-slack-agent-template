import {
  defaultSlackAuth,
  slackChannel,
  type SlackContext,
  type SlackMentionResult,
  type SlackMessage,
} from "eve/channels/slack";

import { slackCredentials } from "../lib/slack-credentials.js";

type RequestedAction =
  | { kind: "subagent-call"; subagentName: string }
  | { kind: "remote-agent-call"; remoteAgentName: string }
  | { kind: "tool-call"; toolName: string }
  | { kind: "load-skill" };

export function teammateStatus(actions: readonly RequestedAction[]): string {
  const action = actions[0];
  if (!action) return "Working…";
  if (action.kind === "subagent-call") {
    if (action.subagentName === "issue-tracker") return "Filing the issue…";
    if (action.subagentName === "standup") return "Updating the stand-up…";
  }
  if (action.kind === "tool-call") {
    if (action.toolName.includes("standup")) return "Updating the stand-up…";
    if (action.toolName.includes("issue")) return "Updating the issue…";
  }
  return "Working…";
}

export async function dispatchWithTrustedIssueContext(
  ctx: SlackContext,
  message: SlackMessage,
): Promise<SlackMentionResult> {
  if (!message.author) return null;
  await ctx.thread.startTyping("On it…");
  const auth = defaultSlackAuth(message, ctx);
  if (!auth) return null;
  return {
    auth: {
      ...auth,
      attributes: {
        ...auth.attributes,
        message_ts: message.ts,
      },
    },
  };
}

export default slackChannel({
  credentials: slackCredentials,
  onAppMention: dispatchWithTrustedIssueContext,
  onDirectMessage: dispatchWithTrustedIssueContext,
  threadContext: { since: "last-agent-reply" },
  events: {
    "actions.requested"(eventData, channel) {
      return channel.thread.startTyping(teammateStatus(eventData.actions));
    },
    // Keep private chain-of-thought out of Slack's public status indicator.
    "reasoning.appended"() {},
  },
});
