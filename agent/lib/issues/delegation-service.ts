import type { Client } from "@libsql/client";

import {
  issueSlackContextSchema,
  type IssueSlackContext,
} from "./delegation.js";

interface DelegationServiceOptions {
  client: Client;
  now?: () => Date;
}

export function createIssueDelegationService({
  client,
  now = () => new Date(),
}: DelegationServiceOptions) {
  return {
    async initialize(): Promise<void> {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS issue_tracker_delegations (
          root_session_id TEXT PRIMARY KEY,
          actor_slack_user_id TEXT NOT NULL,
          actor_display_name TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          message_ts TEXT NOT NULL,
          team_id TEXT,
          thread_ts TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
    },

    async save(
      rootSessionId: string,
      context: IssueSlackContext,
    ): Promise<IssueSlackContext> {
      if (!rootSessionId) throw new Error("A root session is required for issue intake.");
      const trusted = issueSlackContextSchema.parse(context);
      await client.execute({
        sql: `INSERT INTO issue_tracker_delegations
          (root_session_id, actor_slack_user_id, actor_display_name, channel_id,
           message_ts, team_id, thread_ts, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (root_session_id) DO UPDATE SET
            actor_slack_user_id = excluded.actor_slack_user_id,
            actor_display_name = excluded.actor_display_name,
            channel_id = excluded.channel_id,
            message_ts = excluded.message_ts,
            team_id = excluded.team_id,
            thread_ts = excluded.thread_ts,
            updated_at = excluded.updated_at`,
        args: [
          rootSessionId,
          trusted.actorSlackUserId,
          trusted.actorDisplayName,
          trusted.channelId,
          trusted.messageTs,
          trusted.teamId ?? null,
          trusted.threadTs,
          now().toISOString(),
        ],
      });
      return trusted;
    },

    async get(rootSessionId: string): Promise<IssueSlackContext> {
      if (!rootSessionId) {
        throw new Error("Issue tracking must run inside a delegated specialist session.");
      }
      const result = await client.execute({
        sql: `SELECT actor_slack_user_id, actor_display_name, channel_id,
          message_ts, team_id, thread_ts
          FROM issue_tracker_delegations WHERE root_session_id = ?`,
        args: [rootSessionId],
      });
      const row = result.rows[0];
      if (!row) {
        throw new Error("No trusted issue-tracker delegation exists for this session.");
      }
      return issueSlackContextSchema.parse({
        actorSlackUserId: row.actor_slack_user_id,
        actorDisplayName: row.actor_display_name,
        channelId: row.channel_id,
        messageTs: row.message_ts,
        teamId: row.team_id ?? undefined,
        threadTs: row.thread_ts,
      });
    },
  };
}
