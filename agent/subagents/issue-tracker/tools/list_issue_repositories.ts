import { defineTool } from "eve/tools";
import { z } from "zod";

import { verifyIssueDelegation } from "../../../lib/issues/delegation.js";
import { runGh } from "../../../lib/issues/github.js";
import { repositoryRegistryForModel } from "../../../lib/issues/repositories.js";

export default defineTool({
  description:
    "List the explicit issue-routing registry and current writable organization repositories.",
  inputSchema: z.object({ delegationToken: z.string().min(1) }),
  async execute(input, ctx) {
    verifyIssueDelegation(
      input.delegationToken,
      ctx.session.parent?.rootSessionId ?? "",
    );
    const output = await runGh([
      "repo",
      "list",
      "manasijatech",
      "--limit",
      "200",
      "--json",
      "nameWithOwner,description,isArchived,viewerPermission",
    ]);
    const repositories = (
      JSON.parse(output) as Array<{
        description?: string;
        isArchived: boolean;
        nameWithOwner: string;
        viewerPermission: string;
      }>
    ).filter(
      (repo) =>
        !repo.isArchived && ["ADMIN", "MAINTAIN", "WRITE"].includes(repo.viewerPermission),
    );
    return { registry: repositoryRegistryForModel(), repositories };
  },
});

