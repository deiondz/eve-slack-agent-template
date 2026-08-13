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
  commentOnIssue,
  createGitHubIssue,
  findIssueByThreadMarker,
  getGitHubIssue,
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

export default defineTool({
  description:
    "Idempotently create or append a GitHub issue for this Slack thread, then route it to the engineering issue channel.",
  inputSchema: z.object({
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
    existingIssueNumber: z.number().int().positive().optional(),
    suggestedOwners: z.array(suggestedOwnerSchema).max(10),
  }),
  async execute(input, ctx) {
    assertOrganizationRepository(input.repo);
    const rawContext = requireIssueSlackContext(ctx.session);
    const [context, permalink, existing] = await Promise.all([
      enrichIssueSlackContext(rawContext),
      getSlackPermalink(rawContext),
      findIssueByThreadMarker(input.repo, slackThreadMarker(rawContext)),
      verifyWritableRepository(input.repo),
    ]);

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
    } else if (input.existingIssueNumber) {
      const duplicate = await getGitHubIssue({
        repo: input.repo,
        number: input.existingIssueNumber,
      });
      if (duplicate.state !== "OPEN") {
        throw new Error("The selected duplicate issue is not open.");
      }
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
      suggestedOwners: input.suggestedOwners,
      title: result.issue.title,
    });
    return { ...result, routing };
  },
});
