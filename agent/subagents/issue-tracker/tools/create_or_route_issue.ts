import { defineTool } from "eve/tools";
import { z } from "zod";

import { requireIssueSlackContext } from "../../../lib/issues/delegation.js";
import {
  buildFollowupComment,
  buildIssueBody,
  slackMessageMarker,
  slackThreadMarker,
} from "../../../lib/issues/format.js";
import {
  discoverIssueIntake,
  planIssueDiscovery,
  resolveDuplicateSelection,
} from "../../../lib/issues/intake.js";
import {
  commentOnIssue,
  createGitHubIssue,
  findIssueByThreadMarker,
  issueHasCommentMarker,
  verifyWritableRepository,
} from "../../../lib/issues/github.js";
import {
  enrichIssueSlackContext,
  getSlackPermalink,
  routeIssueToSlack,
} from "../../../lib/issues/slack.js";
import { assertOrganizationRepository } from "../../../lib/issues/repositories.js";

const ROUTING_CHANNEL_ID =
  process.env.ISSUE_ROUTING_CHANNEL_ID ?? "C0BPD515TB4";

const suggestedOwnerSchema = z.object({
  githubLogin: z.string().min(1),
  slackUserId: z.string().min(1).optional(),
});

const duplicateDecisionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("discover") }).strict(),
  z.object({ kind: z.literal("confirmed_new") }).strict(),
  z
    .object({
      kind: z.literal("select_candidate"),
      issueNumber: z.number().int().positive(),
    })
    .strict(),
]);

export const createOrRouteIssueInputSchema = z
  .object({
    repo: z.string().min(1),
    issueType: z.enum(["bug", "enhancement"]),
    title: z.string().min(8).max(140),
    summary: z.string().min(1).max(500),
    observed: z.string().min(1),
    expected: z.string().optional(),
    reproduction: z.string().optional(),
    environment: z.string().optional(),
    evidence: z.array(z.string().min(1)).max(20).optional(),
    repositoryRouting: z.string().min(1),
    needsInfo: z.boolean().default(false),
    duplicateDecision: duplicateDecisionSchema,
    suggestedOwners: z.array(suggestedOwnerSchema).max(10).default([]),
  })
  .strict();

export default defineTool({
  description:
    "In one action, discover strong duplicates and repository contacts, idempotently create or append the GitHub issue for this Slack thread, and route it to the engineering issue channel.",
  inputSchema: createOrRouteIssueInputSchema,
  async execute(input, ctx) {
    assertOrganizationRepository(input.repo);
    const rawContext = requireIssueSlackContext(ctx.session);
    const [context, permalink, existing] = await Promise.all([
      enrichIssueSlackContext(rawContext),
      getSlackPermalink(rawContext),
      findIssueByThreadMarker(input.repo, slackThreadMarker(rawContext)),
      verifyWritableRepository(input.repo),
    ]);

    const discoveryPlan = planIssueDiscovery({
      hasConfirmedNewIssue: input.duplicateDecision.kind === "confirmed_new",
      hasExistingThread: Boolean(existing),
      hasSuggestedOwners: input.suggestedOwners.length > 0,
    });
    const discovery = await discoverIssueIntake({
      ...discoveryPlan,
      repo: input.repo,
      title: input.title,
      report: [input.title, input.summary, input.observed, input.expected]
        .filter(Boolean)
        .join("\n"),
    });
    const suggestedOwners = discovery.suggestedOwners ?? input.suggestedOwners;
    const suggestionSource = discovery.suggestionSource ??
      (suggestedOwners.length ? "supplied from the tracked Slack thread" : undefined);

    const duplicateSelection = resolveDuplicateSelection({
      candidates: discovery.candidates,
      requestedIssueNumber:
        input.duplicateDecision.kind === "select_candidate"
          ? input.duplicateDecision.issueNumber
          : undefined,
      strongDuplicate: discovery.duplicate,
    });

    if (!existing && duplicateSelection.kind === "invalid") {
      return {
        action: "invalid_duplicate_selection" as const,
        requestedIssueNumber: duplicateSelection.requestedIssueNumber,
        candidates: discovery.candidates,
        suggestedOwners,
        ...(suggestionSource ? { suggestionSource } : {}),
      };
    }

    if (
      !existing &&
      duplicateSelection.kind === "none" &&
      discovery.candidates.length > 0
    ) {
      return {
        action: "needs_duplicate_review" as const,
        candidates: discovery.candidates,
        suggestedOwners,
        ...(suggestionSource ? { suggestionSource } : {}),
      };
    }

    let result:
      | {
          action: "appended" | "reused";
          issue: { number: number; title: string; url: string };
          originalThreadPermalink: string;
        }
      | {
          action: "created";
          issue: { number: number; title: string; url: string };
          labels: string[];
          originalThreadPermalink: string;
        };

    if (existing) {
      const messageMarker = slackMessageMarker(context);
      const alreadyRecorded =
        existing.body.includes(messageMarker) ||
        (await issueHasCommentMarker({
          marker: messageMarker,
          number: existing.number,
          repo: input.repo,
        }));
      if (!alreadyRecorded) {
        await commentOnIssue({
          repo: input.repo,
          number: existing.number,
          body: buildFollowupComment({
            context,
            evidence: input.evidence,
            observed: input.observed,
            slackPermalink: permalink,
          }),
        });
      }
      result = {
        action: alreadyRecorded ? "reused" : "appended",
        issue: { number: existing.number, title: existing.title, url: existing.url },
        originalThreadPermalink: permalink,
      };
    } else if (duplicateSelection.kind === "selected") {
      const duplicate = duplicateSelection.issue;
      const messageMarker = slackMessageMarker(context);
      const alreadyRecorded = await issueHasCommentMarker({
        marker: messageMarker,
        number: duplicate.number,
        repo: input.repo,
      });
      if (!alreadyRecorded) {
        await commentOnIssue({
          repo: input.repo,
          number: duplicate.number,
          body: buildFollowupComment({
            context,
            evidence: input.evidence,
            observed: input.observed,
            slackPermalink: permalink,
          }),
        });
      }
      result = {
        action: alreadyRecorded ? "reused" : "appended",
        issue: {
          number: duplicate.number,
          title: duplicate.title,
          url: duplicate.url,
        },
        originalThreadPermalink: permalink,
      };
    } else {
      const labels = [
        input.issueType === "bug" ? "bug" : "enhancement",
        "needs-triage",
        ...(input.needsInfo ? ["needs-info"] : []),
      ];
      const created = await createGitHubIssue({
        repo: input.repo,
        title: input.title,
        labels,
        body: buildIssueBody({
          context,
          evidence: input.evidence,
          environment: input.environment,
          expected: input.expected,
          observed: input.observed,
          reproduction: input.reproduction,
          repositoryRouting: input.repositoryRouting,
          slackPermalink: permalink,
        }),
      });
      result = {
        action: "created",
        issue: { number: created.number, title: input.title, url: created.url },
        labels: created.labels,
        originalThreadPermalink: permalink,
      };
    }

    const routing = await routeIssueToSlack({
      issueType: input.issueType,
      issueUrl: result.issue.url,
      originalThreadPermalink: result.originalThreadPermalink,
      repo: input.repo,
      reporterSlackUserId: context.actorSlackUserId,
      routingChannelId: ROUTING_CHANNEL_ID,
      summary: input.summary,
      suggestedOwners,
      title: result.issue.title,
    });
    return {
      ...result,
      routing,
      suggestedOwners,
      ...(suggestionSource ? { suggestionSource } : {}),
    };
  },
});
