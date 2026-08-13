import { defineTool } from "eve/tools";
import { z } from "zod";

import { verifyIssueDelegation } from "../../../lib/issues/delegation.js";
import { assignGitHubIssue } from "../../../lib/issues/github.js";

export default defineTool({
  description:
    "Assign an existing tracked GitHub issue to one explicitly selected repository collaborator.",
  inputSchema: z.object({
    delegationToken: z.string().min(1),
    assignee: z.string().min(1),
    issueNumber: z.number().int().positive(),
    repo: z.string().min(1),
  }),
  async execute(input, ctx) {
    verifyIssueDelegation(
      input.delegationToken,
      ctx.session.parent?.rootSessionId ?? "",
    );
    return assignGitHubIssue({
      assignee: input.assignee,
      number: input.issueNumber,
      repo: input.repo,
    });
  },
});

