import { createClient } from "@libsql/client";

import { slackCredentials } from "../slack-credentials.js";
import { getStandupConfig } from "./config.js";
import { createStandupService } from "./service.js";
import { createSlackStandupGateway } from "./slack-gateway.js";
import { createStandupWorkflow } from "./workflow.js";

let runtimePromise: ReturnType<typeof createRuntime> | undefined;

async function createRuntime() {
  const config = getStandupConfig();
  const client = createClient({
    url: config.databaseUrl,
    authToken: config.databaseAuthToken,
  });
  const service = createStandupService({
    client,
    roster: config.roster,
    initialDailyUpdatesChannelId: config.initialDailyUpdatesChannelId,
  });
  await service.initialize();
  const slack = createSlackStandupGateway(slackCredentials.botToken);
  const workflow = createStandupWorkflow({ service, slack });
  return { service, workflow };
}

export function getStandupRuntime() {
  runtimePromise ??= createRuntime();
  return runtimePromise;
}
