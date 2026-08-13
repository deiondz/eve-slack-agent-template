import { defineTool } from "eve/tools";
import { z } from "zod";

import { verifyIssueDelegation } from "../../../lib/issues/delegation.js";
import { listOpenIssues } from "../../../lib/issues/github.js";

export default defineTool({
  description:
    "List open issues in the selected repository for semantic duplicate comparison before creation.",
  inputSchema: z.object({
    delegationToken: z.string().min(1),
    repo: z.string().min(1),
  }),
  async execute(input, ctx) {
    verifyIssueDelegation(
      input.delegationToken,
      ctx.session.parent?.rootSessionId ?? "",
    );
    const issues = await listOpenIssues(input.repo);
    return {
      issues: issues.map((issue) => ({
        ...issue,
        body: issue.body.slice(0, 2_000),
      })),
    };
  },
});

