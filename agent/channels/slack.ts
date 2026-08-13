import {
  defaultSlackAuth,
  slackChannel,
  type SlackContext,
  type SlackMentionResult,
  type SlackMessage,
} from "eve/channels/slack";

import { slackCredentials } from "../lib/slack-credentials.js";

export async function dispatchWithTrustedIssueContext(
  ctx: SlackContext,
  message: SlackMessage,
): Promise<SlackMentionResult> {
  if (!message.author) return null;
  await ctx.thread.startTyping("Thinking…");
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
    context: [
      "[TRUSTED_FURGO_ISSUE_CONTEXT] Trusted Slack source metadata is available through get_issue_tracker_delegation.",
    ],
  };
}

export default slackChannel({
  credentials: slackCredentials,
  onAppMention: dispatchWithTrustedIssueContext,
  onDirectMessage: dispatchWithTrustedIssueContext,
  threadContext: { since: "last-agent-reply" },
});
