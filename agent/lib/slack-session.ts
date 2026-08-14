import type { SessionContext } from "eve/tools";

type Session = SessionContext["session"];

export function requireDelegatedSlackAttributes(
  session: Session,
): Readonly<Record<string, string | readonly string[]>> {
  if (!session.parent) {
    throw new Error("This operation must run inside a delegated specialist session.");
  }
  const auth = session.auth.current;
  if (!auth || auth.authenticator !== "slack-webhook") {
    throw new Error("This operation requires an authenticated Slack member.");
  }
  return auth.attributes;
}

export function requireDelegatedSlackInitiatorAttributes(
  session: Session,
): Readonly<Record<string, string | readonly string[]>> {
  const currentAttributes = requireDelegatedSlackAttributes(session);
  const initiator = session.auth.initiator;
  if (!initiator) return currentAttributes;
  if (initiator.authenticator !== "slack-webhook") {
    throw new Error("This operation requires an authenticated Slack initiator.");
  }
  const currentUserId = currentAttributes.user_id;
  const initiatingUserId = initiator.attributes.user_id;
  if (typeof currentUserId !== "string" || !currentUserId) {
    throw new Error("The authenticated Slack member is missing a user ID.");
  }
  if (typeof initiatingUserId !== "string" || !initiatingUserId) {
    throw new Error("The initiating Slack member is missing a user ID.");
  }
  if (currentUserId !== initiatingUserId) {
    throw new Error("Only the initiating Slack member can resume this operation.");
  }
  return initiator.attributes;
}

export function requireDelegatedSlackActor(session: Session): string {
  const userId = requireDelegatedSlackAttributes(session).user_id;
  if (typeof userId !== "string" || !userId) {
    throw new Error("The authenticated Slack member is missing a user ID.");
  }
  return userId;
}
