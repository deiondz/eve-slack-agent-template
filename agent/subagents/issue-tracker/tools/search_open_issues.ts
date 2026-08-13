import { defineTool } from "eve/tools";
import { z } from "zod";

import { requireIssueSlackContext } from "../../../lib/issues/delegation.js";
import { listOpenIssues } from "../../../lib/issues/github.js";

export default defineTool({
  description:
    "List open issues in the selected repository for semantic duplicate comparison before creation.",
  inputSchema: z.object({
    query: z.string().min(3),
    repo: z.string().min(1),
  }),
  async execute(input, ctx) {
    requireIssueSlackContext(ctx.session);
    const issues = await listOpenIssues(input.repo);
    const terms = new Set(
      input.query
        .toLowerCase()
        .split(/[^a-z0-9]+/u)
        .filter((term) => term.length > 2),
    );
    const candidates = issues
      .map((issue) => {
        const title = issue.title.toLowerCase();
        const body = issue.body.toLowerCase();
        const score = [...terms].reduce(
          (total, term) =>
            total + (title.includes(term) ? 3 : 0) + (body.includes(term) ? 1 : 0),
          0,
        );
        return { issue, score };
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 12);
    return {
      issues: candidates.map(({ issue }) => ({
        ...issue,
        body: issue.body.slice(0, 2_000),
      })),
      searched: issues.length,
    };
  },
});
