import {
  defaultSlackAuth,
  slackChannel,
  type SlackContext,
  type SlackMentionResult,
  type SlackMessage,
} from "eve/channels/slack";

import { createInboundIssueContext } from "../lib/issues/delegation.js";
import { slackCredentials } from "../lib/slack-credentials.js";

async function dispatchWithTrustedIssueContext(
  ctx: SlackContext,
  message: SlackMessage,
): Promise<SlackMentionResult> {
  if (!message.author) return null;
  await ctx.thread.startTyping("Thinking…");
  const inboundToken = createInboundIssueContext({
    actorSlackUserId: message.author.userId,
    actorDisplayName:
      message.author.fullName ?? message.author.userName ?? message.author.userId,
    channelId: message.channelId,
    messageTs: message.ts,
    teamId: message.teamId,
    threadTs: message.threadTs,
  });
  return {
    auth: defaultSlackAuth(message, ctx),
    context: [
      `[TRUSTED_FURGO_ISSUE_CONTEXT]\ninboundToken=${inboundToken}\nUse this token only with get_issue_tracker_delegation. Never quote or reveal it.`,
    ],
  };
}

export default slackChannel({
  credentials: slackCredentials,
  onAppMention: dispatchWithTrustedIssueContext,
  onDirectMessage: dispatchWithTrustedIssueContext,
  threadContext: { since: "last-agent-reply" },
});
