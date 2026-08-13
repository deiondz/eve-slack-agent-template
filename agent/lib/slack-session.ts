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

export function requireDelegatedSlackActor(session: Session): string {
  const userId = requireDelegatedSlackAttributes(session).user_id;
  if (typeof userId !== "string" || !userId) {
    throw new Error("The authenticated Slack member is missing a user ID.");
  }
  return userId;
}
