import { z } from "zod";

export const issueSlackContextSchema = z.object({
  actorSlackUserId: z.string().min(1),
  actorDisplayName: z.string().min(1),
  channelId: z.string().min(1),
  messageTs: z.string().min(1),
  teamId: z.string().min(1).optional(),
  threadTs: z.string().min(1),
});

export type IssueSlackContext = z.infer<typeof issueSlackContextSchema>;
