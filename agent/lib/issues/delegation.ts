import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

const slackContextSchema = z.object({
  actorSlackUserId: z.string().min(1),
  actorDisplayName: z.string().min(1),
  channelId: z.string().min(1),
  messageTs: z.string().min(1),
  teamId: z.string().min(1).optional(),
  threadTs: z.string().min(1),
});

const delegatedContextSchema = slackContextSchema.extend({
  rootSessionId: z.string().min(1),
});

export type IssueSlackContext = z.infer<typeof slackContextSchema>;

function secret(): string {
  const value =
    process.env.ISSUE_TRACKER_DELEGATION_SECRET ??
    process.env.STANDUP_DELEGATION_SECRET ??
    process.env.SLACK_SIGNING_SECRET;
  if (!value) throw new Error("ISSUE_TRACKER_DELEGATION_SECRET is required.");
  return value;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}

function encode(payload: object): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function decode(token: string): unknown {
  const [encodedPayload, receivedSignature] = token.split(".");
  if (!encodedPayload || !receivedSignature) {
    throw new Error("Invalid issue-tracker delegation token.");
  }
  const expectedSignature = sign(encodedPayload);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error("Invalid issue-tracker delegation token.");
  }
  return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
}

export function createInboundIssueContext(context: IssueSlackContext): string {
  return encode(slackContextSchema.parse(context));
}

export function exchangeIssueDelegation(input: {
  actorSlackUserId: string;
  inboundToken: string;
  rootSessionId: string;
}) {
  const context = slackContextSchema.parse(decode(input.inboundToken));
  if (context.actorSlackUserId !== input.actorSlackUserId) {
    throw new Error("Issue-tracker context belongs to another Slack member.");
  }
  return {
    ...context,
    delegationToken: encode({ ...context, rootSessionId: input.rootSessionId }),
  };
}

export function verifyIssueDelegation(
  delegationToken: string,
  expectedRootSessionId: string,
): IssueSlackContext {
  const payload = delegatedContextSchema.parse(decode(delegationToken));
  if (payload.rootSessionId !== expectedRootSessionId) {
    throw new Error("Issue-tracker delegation token belongs to another session.");
  }
  const { rootSessionId: _rootSessionId, ...context } = payload;
  return context;
}

