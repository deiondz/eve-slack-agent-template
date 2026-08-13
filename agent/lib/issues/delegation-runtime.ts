import { createClient } from "@libsql/client";

import { createIssueDelegationService } from "./delegation-service.js";

let servicePromise: ReturnType<typeof createService> | undefined;

async function createService() {
  const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:standup.sqlite";
  if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
    throw new Error(
      "TURSO_DATABASE_URL is required on Vercel for durable issue delegation.",
    );
  }
  const client = createClient({
    url: databaseUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const service = createIssueDelegationService({ client });
  await service.initialize();
  return service;
}

export function getIssueDelegationService() {
  servicePromise ??= createService();
  return servicePromise;
}

export async function requireIssueDelegation(
  rootSessionId: string | undefined,
) {
  const service = await getIssueDelegationService();
  return service.get(rootSessionId ?? "");
}
