import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { standupDateFor } from "./calendar.js";

const payloadSchema = z.object({
  actorSlackUserId: z.string().min(1),
  rootSessionId: z.string().min(1),
  standupDate: z.iso.date(),
});

export interface StandupDelegationContext {
  actorSlackUserId: string;
  standupDate: string;
}

function secret(): string {
  const value =
    process.env.STANDUP_DELEGATION_SECRET ?? process.env.SLACK_SIGNING_SECRET;
  if (!value) throw new Error("STANDUP_DELEGATION_SECRET is required.");
  return value;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}

export function createStandupDelegation(input: {
  actorSlackUserId: string;
  rootSessionId: string;
  now?: Date;
  standupDate?: string;
}) {
  const now = input.now ?? new Date();
  const context: StandupDelegationContext = {
    actorSlackUserId: input.actorSlackUserId,
    standupDate: input.standupDate ?? standupDateFor(now),
  };
  const encodedPayload = Buffer.from(
    JSON.stringify({ ...context, rootSessionId: input.rootSessionId }),
  ).toString("base64url");
  return { ...context, delegationToken: `${encodedPayload}.${sign(encodedPayload)}` };
}

export function verifyStandupDelegation(
  delegationToken: string,
  expectedRootSessionId: string,
): StandupDelegationContext {
  const [encodedPayload, receivedSignature] = delegationToken.split(".");
  if (!encodedPayload || !receivedSignature) {
    throw new Error("Invalid stand-up delegation token.");
  }
  const expectedSignature = sign(encodedPayload);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error("Invalid stand-up delegation token.");
  }
  const payload = payloadSchema.parse(
    JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")),
  );
  if (payload.rootSessionId !== expectedRootSessionId) {
    throw new Error("Stand-up delegation token belongs to another session.");
  }
  return {
    actorSlackUserId: payload.actorSlackUserId,
    standupDate: payload.standupDate,
  };
}
