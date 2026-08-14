import { z } from "zod";

import type { SessionContext } from "eve/tools";

import { requireDelegatedSlackInitiatorAttributes } from "../slack-session.js";

export const issueSlackContextSchema = z.object({
  actorSlackUserId: z.string().min(1),
  actorDisplayName: z.string().min(1),
  channelId: z.string().min(1),
  messageTs: z.string().min(1),
  teamId: z.string().min(1).optional(),
  threadTs: z.string().min(1),
});

export type IssueSlackContext = z.infer<typeof issueSlackContextSchema>;

export function requireIssueSlackContext(
  session: SessionContext["session"],
): IssueSlackContext {
  const attributes = requireDelegatedSlackInitiatorAttributes(session);
  return issueSlackContextSchema.parse({
    actorSlackUserId: attributes.user_id,
    actorDisplayName:
      attributes.full_name ?? attributes.user_name ?? attributes.user_id,
    channelId: attributes.channel_id,
    messageTs: attributes.message_ts,
    teamId: attributes.team_id,
    threadTs: attributes.thread_ts,
  });
}
