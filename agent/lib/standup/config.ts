import { z } from "zod";

import type { RosterMember } from "./service.js";

const rosterSchema = z.array(
  z.object({
    slackUserId: z.string().min(1),
    displayName: z.string().min(1),
    role: z.enum(["employee", "manager"]),
  }),
);

export interface StandupConfig {
  databaseUrl: string;
  databaseAuthToken?: string;
  initialDailyUpdatesChannelId?: string;
  roster: RosterMember[];
}

export function getStandupConfig(): StandupConfig {
  const rosterJson = process.env.STANDUP_ROSTER_JSON;

  const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:standup.sqlite";
  if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
    throw new Error(
      "TURSO_DATABASE_URL is required on Vercel because local SQLite files are ephemeral.",
    );
  }

  return {
    databaseUrl,
    databaseAuthToken: process.env.TURSO_AUTH_TOKEN,
    initialDailyUpdatesChannelId: process.env.SLACK_DAILY_UPDATES_CHANNEL_ID,
    roster: rosterJson ? rosterSchema.parse(JSON.parse(rosterJson)) : [],
  };
}
