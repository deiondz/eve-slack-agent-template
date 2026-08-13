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
  dailyUpdatesChannelId: string;
  roster: RosterMember[];
}

export function getStandupConfig(): StandupConfig {
  const rosterJson = process.env.STANDUP_ROSTER_JSON;
  if (!rosterJson) throw new Error("STANDUP_ROSTER_JSON is required.");

  const dailyUpdatesChannelId = process.env.SLACK_DAILY_UPDATES_CHANNEL_ID;
  if (!dailyUpdatesChannelId) {
    throw new Error("SLACK_DAILY_UPDATES_CHANNEL_ID is required.");
  }

  const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:standup.sqlite";
  if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
    throw new Error(
      "TURSO_DATABASE_URL is required on Vercel because local SQLite files are ephemeral.",
    );
  }

  return {
    databaseUrl,
    databaseAuthToken: process.env.TURSO_AUTH_TOKEN,
    dailyUpdatesChannelId,
    roster: rosterSchema.parse(JSON.parse(rosterJson)),
  };
}
