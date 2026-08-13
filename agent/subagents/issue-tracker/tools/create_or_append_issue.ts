import { defineTool } from "eve/tools";
import { z } from "zod";

import { verifyIssueDelegation } from "../../../lib/issues/delegation.js";
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
} from "../../../lib/issues/slack.js";

export default defineTool({
  description:
    "Idempotently create a formatted GitHub issue for this Slack thread or append new evidence to its existing issue.",
  inputSchema: z.object({
    delegationToken: z.string().min(1),
    repo: z.string().min(1),
    issueType: z.enum(["bug", "enhancement"]),
    title: z.string().min(8).max(140),
    observed: z.string().min(1),
    expected: z.string().optional(),
    reproduction: z.string().optional(),
    environment: z.string().optional(),
    evidence: z.array(z.string().min(1)).max(20).optional(),
    repositoryRouting: z.string().min(1),
    needsInfo: z.boolean().default(false),
    existingIssueNumber: z.number().int().positive().optional(),
  }),
  async execute(input, ctx) {
    const context = await enrichIssueSlackContext(
      verifyIssueDelegation(
        input.delegationToken,
        ctx.session.parent?.rootSessionId ?? "",
      ),
    );
    await verifyWritableRepository(input.repo);
    const permalink = await getSlackPermalink(context);
    const existing = await findIssueByThreadMarker(
      input.repo,
      slackThreadMarker(context),
    );
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
      return {
        action: alreadyRecorded ? "reused" : "appended",
        issue: { number: existing.number, title: existing.title, url: existing.url },
        originalThreadPermalink: permalink,
      };
    }

    if (input.existingIssueNumber) {
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
      return {
        action: alreadyRecorded ? "reused" : "appended",
        issue: {
          number: duplicate.number,
          title: duplicate.title,
          url: duplicate.url,
        },
        originalThreadPermalink: permalink,
      };
    }

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
    return {
      action: "created",
      issue: { number: created.number, title: input.title, url: created.url },
      labels: created.labels,
      originalThreadPermalink: permalink,
    };
  },
});
