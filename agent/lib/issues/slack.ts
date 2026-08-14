import { createHash } from "node:crypto";

import { callSlackApi, type SlackApiResponse } from "eve/channels/slack";

import { slackCredentials } from "../slack-credentials.js";
import { getSlackUserProfiles } from "../slack-profile.js";
import type { IssueSlackContext } from "./delegation.js";
import type { SlackIdentity, SuggestedIssueOwner } from "./owners.js";

const SLACK_IDENTITIES_TTL_MS = 5 * 60 * 1_000;
let slackIdentitiesCache:
  | { expiresAt: number; value: Promise<SlackIdentity[]> }
  | undefined;

function requireSlackResponse(response: SlackApiResponse, operation: string) {
  if (!response.ok) {
    throw new Error(`Slack ${operation} failed: ${String(response.error)}`);
  }
  return response;
}

export async function getSlackPermalink(context: IssueSlackContext): Promise<string> {
  const response = requireSlackResponse(
    await callSlackApi({
      botToken: slackCredentials.botToken,
      operation: "chat.getPermalink",
      body: { channel: context.channelId, message_ts: context.threadTs },
    }),
    "chat.getPermalink",
  );
  if (typeof response.permalink !== "string" || !response.permalink) {
    throw new Error("Slack did not return the original thread permalink.");
  }
  return response.permalink;
}

export async function enrichIssueSlackContext(
  context: IssueSlackContext,
): Promise<IssueSlackContext> {
  const [profile] = await getSlackUserProfiles(slackCredentials.botToken, [
    context.actorSlackUserId,
  ]);
  return profile ? { ...context, actorDisplayName: profile.displayName } : context;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function parseSlackIdentities(response: SlackApiResponse): SlackIdentity[] {
  requireSlackResponse(response, "users.list");
  if (!Array.isArray(response.members)) return [];
  return response.members.flatMap((member) => {
    if (typeof member !== "object" || member === null) return [];
    const user = member as Record<string, unknown>;
    if (user.deleted === true || user.is_bot === true) return [];
    const id = readString(user.id);
    if (!id) return [];
    const profile =
      typeof user.profile === "object" && user.profile !== null
        ? (user.profile as Record<string, unknown>)
        : {};
    const displayName =
      readString(profile.display_name) ??
      readString(profile.real_name) ??
      readString(user.real_name) ??
      readString(user.name) ??
      id;
    return [
      {
        slackUserId: id,
        displayName,
        realName: readString(profile.real_name) ?? readString(user.real_name),
        username: readString(user.name),
        email: readString(profile.email),
      },
    ];
  });
}

export async function listSlackIdentities(): Promise<SlackIdentity[]> {
  if (slackIdentitiesCache && slackIdentitiesCache.expiresAt > Date.now()) {
    return slackIdentitiesCache.value;
  }
  const value = loadSlackIdentities();
  slackIdentitiesCache = {
    expiresAt: Date.now() + SLACK_IDENTITIES_TTL_MS,
    value,
  };
  void value.catch(() => {
    slackIdentitiesCache = undefined;
  });
  return value;
}

async function loadSlackIdentities(): Promise<SlackIdentity[]> {
  const identities: SlackIdentity[] = [];
  let cursor: string | undefined;
  do {
    const response = await callSlackApi({
      botToken: slackCredentials.botToken,
      operation: "users.list",
      body: { limit: 200, ...(cursor ? { cursor } : {}) },
    });
    identities.push(...parseSlackIdentities(response));
    const metadata =
      typeof response.response_metadata === "object" &&
      response.response_metadata !== null
        ? (response.response_metadata as Record<string, unknown>)
        : {};
    cursor = readString(metadata.next_cursor);
  } while (cursor);
  return identities;
}

function idempotencyUuid(value: string): string {
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20)}`;
}

function messageText(message: unknown): string {
  return typeof message === "object" && message !== null && "text" in message
    ? String(message.text)
    : "";
}

export async function findRoutedIssueMessage(channelId: string, issueUrl: string) {
  const response = requireSlackResponse(
    await callSlackApi({
      botToken: slackCredentials.botToken,
      operation: "conversations.history",
      body: { channel: channelId, limit: 100 },
    }),
    "conversations.history",
  );
  if (!Array.isArray(response.messages)) return undefined;
  const match = response.messages.find((message) => messageText(message).includes(issueUrl));
  if (typeof match !== "object" || match === null || !("ts" in match)) return undefined;
  return typeof match.ts === "string" ? match.ts : undefined;
}

export async function routeIssueToSlack(input: {
  issueType: "bug" | "enhancement";
  issueUrl: string;
  originalThreadPermalink: string;
  reporterSlackUserId: string;
  repo: string;
  routingChannelId: string;
  summary: string;
  suggestedOwners: readonly SuggestedIssueOwner[];
  title: string;
}) {
  const existingMessageTs = await findRoutedIssueMessage(
    input.routingChannelId,
    input.issueUrl,
  );
  if (existingMessageTs) return { messageTs: existingMessageTs, reused: true };

  const owners = input.suggestedOwners.length
    ? input.suggestedOwners
        .map((owner) =>
          owner.slackUserId
            ? `<@${owner.slackUserId}> (GitHub: ${owner.githubLogin})`
            : `GitHub: ${owner.githubLogin}`,
        )
        .join(", ")
    : "Owner not resolved";
  const text = [
    `*${input.issueType === "bug" ? "Bug" : "Feature request"}: ${input.title}*`,
    `*Repository:* ${input.repo}`,
    `*GitHub:* ${input.issueUrl}`,
    `*Reporter:* <@${input.reporterSlackUserId}>`,
    `*Summary:* ${input.summary}`,
    `*Original Slack thread:* ${input.originalThreadPermalink}`,
    `*Suggested repository contacts:* ${owners} _(contributor signal; not confirmed ownership)_`,
    "*Assignment:* Unassigned — reply in the original thread with `assign to <name>`.",
  ].join("\n");
  const response = requireSlackResponse(
    await callSlackApi({
      botToken: slackCredentials.botToken,
      operation: "chat.postMessage",
      body: {
        channel: input.routingChannelId,
        client_msg_id: idempotencyUuid(input.issueUrl),
        text,
      },
    }),
    "chat.postMessage",
  );
  const messageTs = typeof response.ts === "string" ? response.ts : "";
  if (!messageTs) throw new Error("Slack did not return a routing message timestamp.");
  return { messageTs, reused: false };
}

export async function announceIssueAssignment(input: {
  assigneeGithubLogin: string;
  assigneeSlackUserId?: string;
  idempotencyKey?: string;
  issueUrl: string;
  routingChannelId: string;
}) {
  const parentTs = await findRoutedIssueMessage(input.routingChannelId, input.issueUrl);
  const assignee = input.assigneeSlackUserId
    ? `<@${input.assigneeSlackUserId}> (${input.assigneeGithubLogin})`
    : input.assigneeGithubLogin;
  const response = requireSlackResponse(
    await callSlackApi({
      botToken: slackCredentials.botToken,
      operation: "chat.postMessage",
      body: {
        channel: input.routingChannelId,
        ...(input.idempotencyKey
          ? { client_msg_id: idempotencyUuid(input.idempotencyKey) }
          : {}),
        ...(parentTs ? { thread_ts: parentTs } : {}),
        text: `Assigned ${input.issueUrl} to ${assignee}.`,
      },
    }),
    "chat.postMessage",
  );
  return { messageTs: typeof response.ts === "string" ? response.ts : "" };
}
