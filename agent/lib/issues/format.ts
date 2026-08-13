import type { IssueSlackContext } from "./delegation.js";

export function slackThreadMarker(context: IssueSlackContext): string {
  return `<!-- furgo-slack-thread:${context.teamId ?? "unknown"}:${context.channelId}:${context.threadTs} -->`;
}

export function slackMessageMarker(context: IssueSlackContext): string {
  return `<!-- furgo-slack-message:${context.channelId}:${context.messageTs} -->`;
}

function section(title: string, value: string | undefined): string {
  return `## ${title}\n\n${value?.trim() || "Not provided"}`;
}

export interface IssueBodyInput {
  context: IssueSlackContext;
  evidence?: readonly string[];
  environment?: string;
  expected?: string;
  observed: string;
  reproduction?: string;
  repositoryRouting: string;
  slackPermalink: string;
}

export function buildIssueBody(input: IssueBodyInput): string {
  const evidence = input.evidence?.length
    ? input.evidence.map((item) => `- ${item}`).join("\n")
    : undefined;
  return [
    section("Observed behavior", input.observed),
    section("Expected behavior", input.expected),
    section("Reproduction information", input.reproduction),
    section("Environment and timing", input.environment),
    section("Evidence", evidence),
    section(
      "Slack source",
      `Reported by ${input.context.actorDisplayName} (Slack: ${input.context.actorSlackUserId})\n\nOriginal thread: ${input.slackPermalink}`,
    ),
    section("Repository routing", input.repositoryRouting),
    input.context.messageTs === input.context.threadTs
      ? ""
      : `Initial tracked message timestamp: ${input.context.messageTs}`,
    slackThreadMarker(input.context),
    slackMessageMarker(input.context),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildFollowupComment(input: {
  context: IssueSlackContext;
  evidence?: readonly string[];
  observed: string;
  slackPermalink: string;
}): string {
  const evidence = input.evidence?.length
    ? `\n\nEvidence:\n${input.evidence.map((item) => `- ${item}`).join("\n")}`
    : "";
  return `Additional report from ${input.context.actorDisplayName} (Slack: ${input.context.actorSlackUserId}):\n\n${input.observed}${evidence}\n\nSlack thread: ${input.slackPermalink}\n\n${slackThreadMarker(input.context)}\n${slackMessageMarker(input.context)}`;
}
