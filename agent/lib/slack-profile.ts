import {
  callSlackApi,
  type SlackApiResponse,
  type SlackBotToken,
} from "eve/channels/slack";

export interface SlackUserProfile {
  slackUserId: string;
  mention: string;
  displayName: string;
}

function readNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function parseSlackUserProfile(
  slackUserId: string,
  response: SlackApiResponse,
): SlackUserProfile {
  if (!response.ok) {
    const requiredScope = readNonEmptyString(response.needed);
    const scopeHint = requiredScope ? `; required scope: ${requiredScope}` : "";
    throw new Error(
      `Slack users.info failed for ${slackUserId}: ${String(response.error)}${scopeHint}`,
    );
  }

  const user =
    typeof response.user === "object" && response.user !== null
      ? (response.user as Record<string, unknown>)
      : {};
  const profile =
    typeof user.profile === "object" && user.profile !== null
      ? (user.profile as Record<string, unknown>)
      : {};
  const resolvedUserId = readNonEmptyString(user.id) ?? slackUserId;
  const displayName =
    readNonEmptyString(profile.display_name) ??
    readNonEmptyString(profile.real_name) ??
    readNonEmptyString(user.real_name) ??
    readNonEmptyString(user.name) ??
    resolvedUserId;

  return {
    slackUserId: resolvedUserId,
    mention: `<@${resolvedUserId}>`,
    displayName,
  };
}

export async function getSlackUserProfiles(
  botToken: SlackBotToken | undefined,
  slackUserIds: readonly string[],
): Promise<SlackUserProfile[]> {
  const profiles: SlackUserProfile[] = [];
  for (const slackUserId of slackUserIds) {
    const response = await callSlackApi({
      botToken,
      operation: "users.info",
      body: { user: slackUserId },
    });
    profiles.push(parseSlackUserProfile(slackUserId, response));
  }
  return profiles;
}
