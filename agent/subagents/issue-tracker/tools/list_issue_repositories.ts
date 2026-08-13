import { defineTool } from "eve/tools";
import { z } from "zod";

import { requireIssueSlackContext } from "../../../lib/issues/delegation.js";
import { runGh } from "../../../lib/issues/github.js";
import {
  issueRepositories,
  repositoryCandidatesForModel,
} from "../../../lib/issues/repositories.js";

const REPOSITORY_CACHE_TTL_MS = 5 * 60 * 1_000;
let repositoryCache:
  | { expiresAt: number; value: Promise<readonly WritableRepository[]> }
  | undefined;

interface WritableRepository {
  description?: string;
  isArchived: boolean;
  nameWithOwner: string;
  viewerPermission: string;
}

function listWritableRepositories(): Promise<readonly WritableRepository[]> {
  if (repositoryCache && repositoryCache.expiresAt > Date.now()) {
    return repositoryCache.value;
  }
  const value = runGh([
    "repo",
    "list",
    "manasijatech",
    "--limit",
    "200",
    "--json",
    "nameWithOwner,description,isArchived,viewerPermission",
  ]).then((output) =>
    (JSON.parse(output) as WritableRepository[]).filter(
      (repo) =>
        !repo.isArchived &&
        ["ADMIN", "MAINTAIN", "WRITE"].includes(repo.viewerPermission),
    ),
  );
  repositoryCache = {
    expiresAt: Date.now() + REPOSITORY_CACHE_TTL_MS,
    value,
  };
  void value.catch(() => {
    repositoryCache = undefined;
  });
  return value;
}

export default defineTool({
  description:
    "Find likely issue-routing repositories for a report and verify them against current writable organization repositories.",
  inputSchema: z.object({ query: z.string().min(3) }),
  async execute(input, ctx) {
    requireIssueSlackContext(ctx.session);
    const repositories = await listWritableRepositories();
    const writableNames = new Set(repositories.map((repo) => repo.nameWithOwner));
    const candidates = repositoryCandidatesForModel(input.query).map((repository) => ({
      ...repository,
      currentlyWritable: writableNames.has(repository.slug),
    }));
    const registeredNames = new Set<string>(
      issueRepositories.map((repository) => repository.slug),
    );
    return {
      candidates,
      unregisteredWritableRepositories: repositories
        .map((repo) => repo.nameWithOwner)
        .filter((name) => !registeredNames.has(name)),
    };
  },
});
