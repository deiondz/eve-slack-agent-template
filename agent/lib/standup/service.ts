import { randomUUID } from "node:crypto";

import type { Client } from "@libsql/client";

import { standupDateFor } from "./calendar.js";

export type StandupPeriod = "morning" | "evening";

export interface RosterMember {
  slackUserId: string;
  displayName: string;
  role: "employee" | "manager";
}

export interface StandupEntry {
  id: string;
  standupDate: string;
  employeeSlackUserId: string;
  period: StandupPeriod;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface DigestEmployee {
  employeeSlackUserId: string;
  displayName: string;
  response: "awaiting" | "empty" | "submitted";
  entries: StandupEntry[];
}

interface ServiceOptions {
  client: Client;
  roster: readonly RosterMember[];
  now?: () => Date;
}

interface EntrySelector {
  actorSlackUserId: string;
  employeeSlackUserId?: string;
  standupDate?: string;
  period?: StandupPeriod;
}

interface CreateEntryInput extends EntrySelector {
  idempotencyKey?: string;
  period: StandupPeriod;
  text: string;
}

interface AcknowledgeEmptyInput extends EntrySelector {
  idempotencyKey?: string;
  period: StandupPeriod;
}

interface ChangeEntryInput {
  actorSlackUserId: string;
  entryId: string;
}

function rowToEntry(row: Record<string, unknown>): StandupEntry {
  return {
    id: String(row.id),
    standupDate: String(row.standup_date),
    employeeSlackUserId: String(row.employee_slack_user_id),
    period: String(row.period) as StandupPeriod,
    text: String(row.text),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function createStandupService({
  client,
  roster,
  now = () => new Date(),
}: ServiceOptions) {
  const memberById = new Map(roster.map((member) => [member.slackUserId, member]));

  function targetFor(input: EntrySelector): string {
    const actor = memberById.get(input.actorSlackUserId);
    if (!actor) throw new Error("This Slack member is not configured for stand-ups.");
    const target = input.employeeSlackUserId ?? input.actorSlackUserId;
    if (actor.role !== "manager" && target !== input.actorSlackUserId) {
      throw new Error("Employees can manage only their own stand-up entries.");
    }
    if (!memberById.has(target)) throw new Error("The target employee is not configured.");
    return target;
  }

  function dateFor(input: EntrySelector): string {
    const today = standupDateFor(now());
    const requested = input.standupDate ?? today;
    const actor = memberById.get(input.actorSlackUserId);
    if (actor?.role !== "manager" && requested !== today) {
      throw new Error("Employees can manage entries only for the current stand-up day.");
    }
    return requested;
  }

  async function entryForChange(
    input: ChangeEntryInput,
    allowDeleted = false,
    replayText?: string,
  ): Promise<StandupEntry> {
    const result = await client.execute({
      sql: "SELECT * FROM standup_entries WHERE id = ?",
      args: [input.entryId],
    });
    const row = result.rows[0];
    if (!row || (!allowDeleted && row.deleted_at)) {
      throw new Error("Stand-up entry not found.");
    }
    const entry = rowToEntry(row);
    targetFor({
      actorSlackUserId: input.actorSlackUserId,
      employeeSlackUserId: entry.employeeSlackUserId,
    });
    if ((allowDeleted && row.deleted_at) || entry.text === replayText) return entry;
    dateFor({
      actorSlackUserId: input.actorSlackUserId,
      standupDate: entry.standupDate,
    });
    return entry;
  }

  async function createEntries(
    inputs: readonly CreateEntryInput[],
  ): Promise<StandupEntry[]> {
    const prepared = inputs.map((input) => {
      const timestamp = now().toISOString();
      const entry: StandupEntry = {
        id: randomUUID(),
        standupDate: dateFor(input),
        employeeSlackUserId: targetFor(input),
        period: input.period,
        text: input.text.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      if (!entry.text) throw new Error("Stand-up entry text cannot be empty.");
      return { entry, idempotencyKey: input.idempotencyKey };
    });

    await client.batch(
      prepared.map(({ entry, idempotencyKey }) => ({
        sql: `INSERT INTO standup_entries
          (id, standup_date, employee_slack_user_id, period, text, created_at, updated_at, idempotency_key)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (idempotency_key) DO NOTHING`,
        args: [
          entry.id,
          entry.standupDate,
          entry.employeeSlackUserId,
          entry.period,
          entry.text,
          entry.createdAt,
          entry.updatedAt,
          idempotencyKey ?? null,
        ],
      })),
      "write",
    );

    return Promise.all(
      prepared.map(async ({ entry, idempotencyKey }) => {
        if (!idempotencyKey) return entry;
        const stored = await client.execute({
          sql: "SELECT * FROM standup_entries WHERE idempotency_key = ?",
          args: [idempotencyKey],
        });
        if (!stored.rows[0]) throw new Error("Stand-up entry write was not persisted.");
        return rowToEntry(stored.rows[0]);
      }),
    );
  }

  return {
    async initialize() {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS standup_entries (
          id TEXT PRIMARY KEY,
          standup_date TEXT NOT NULL,
          employee_slack_user_id TEXT NOT NULL,
          period TEXT NOT NULL CHECK (period IN ('morning', 'evening')),
          text TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          idempotency_key TEXT,
          deleted_at TEXT
        )
      `);
      const entryColumns = await client.execute("PRAGMA table_info(standup_entries)");
      if (!entryColumns.rows.some((row) => row.name === "idempotency_key")) {
        await client.execute(
          "ALTER TABLE standup_entries ADD COLUMN idempotency_key TEXT",
        );
      }
      if (!entryColumns.rows.some((row) => row.name === "deleted_at")) {
        await client.execute("ALTER TABLE standup_entries ADD COLUMN deleted_at TEXT");
      }
      await client.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS standup_entries_idempotency_key ON standup_entries(idempotency_key)",
      );
      await client.execute(`
        CREATE TABLE IF NOT EXISTS standup_acknowledgements (
          standup_date TEXT NOT NULL,
          employee_slack_user_id TEXT NOT NULL,
          period TEXT NOT NULL CHECK (period IN ('morning', 'evening')),
          created_at TEXT NOT NULL,
          idempotency_key TEXT,
          PRIMARY KEY (standup_date, employee_slack_user_id, period)
        )
      `);
      const acknowledgementColumns = await client.execute(
        "PRAGMA table_info(standup_acknowledgements)",
      );
      if (!acknowledgementColumns.rows.some((row) => row.name === "idempotency_key")) {
        await client.execute(
          "ALTER TABLE standup_acknowledgements ADD COLUMN idempotency_key TEXT",
        );
      }
      await client.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS standup_acknowledgements_idempotency_key ON standup_acknowledgements(idempotency_key)",
      );
      await client.execute(`
        CREATE TABLE IF NOT EXISTS standup_digest_messages (
          standup_date TEXT NOT NULL,
          period TEXT NOT NULL CHECK (period IN ('morning', 'evening')),
          channel_id TEXT NOT NULL,
          message_ts TEXT NOT NULL,
          PRIMARY KEY (standup_date, period)
        )
      `);
    },

    async createEntry(input: CreateEntryInput): Promise<StandupEntry> {
      const [entry] = await createEntries([input]);
      if (!entry) throw new Error("Stand-up entry write was not persisted.");
      return entry;
    },

    createEntries,

    async listEntries(input: EntrySelector): Promise<StandupEntry[]> {
      const employeeSlackUserId = targetFor(input);
      const standupDate = dateFor(input);
      const conditions = [
        "standup_date = ?",
        "employee_slack_user_id = ?",
        "deleted_at IS NULL",
      ];
      const args: string[] = [standupDate, employeeSlackUserId];
      if (input.period) {
        conditions.push("period = ?");
        args.push(input.period);
      }
      const result = await client.execute({
        sql: `SELECT * FROM standup_entries WHERE ${conditions.join(" AND ")}
          ORDER BY created_at ASC, id ASC`,
        args,
      });
      return result.rows.map((row) => rowToEntry(row));
    },

    async updateEntry(
      input: ChangeEntryInput & { text: string },
    ): Promise<StandupEntry> {
      const text = input.text.trim();
      if (!text) throw new Error("Stand-up entry text cannot be empty.");
      const entry = await entryForChange(input, false, text);
      if (entry.text === text) return entry;
      const updatedAt = now().toISOString();
      await client.execute({
        sql: "UPDATE standup_entries SET text = ?, updated_at = ? WHERE id = ?",
        args: [text, updatedAt, entry.id],
      });
      return { ...entry, text, updatedAt };
    },

    async deleteEntry(input: ChangeEntryInput): Promise<StandupEntry> {
      const entry = await entryForChange(input, true);
      await client.execute({
        sql: "UPDATE standup_entries SET deleted_at = COALESCE(deleted_at, ?) WHERE id = ?",
        args: [now().toISOString(), entry.id],
      });
      return entry;
    },

    async acknowledgeEmpty(input: AcknowledgeEmptyInput): Promise<string> {
      if (input.idempotencyKey) {
        const replay = await client.execute({
          sql: `SELECT standup_date FROM standup_acknowledgements
            WHERE idempotency_key = ?`,
          args: [input.idempotencyKey],
        });
        if (replay.rows[0]) return String(replay.rows[0].standup_date);
      }
      const employeeSlackUserId = targetFor(input);
      const standupDate = dateFor(input);
      await client.execute({
        sql: `INSERT INTO standup_acknowledgements
          (standup_date, employee_slack_user_id, period, created_at, idempotency_key)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT (standup_date, employee_slack_user_id, period)
          DO UPDATE SET created_at = excluded.created_at,
            idempotency_key = COALESCE(excluded.idempotency_key, idempotency_key)`,
        args: [
          standupDate,
          employeeSlackUserId,
          input.period,
          now().toISOString(),
          input.idempotencyKey ?? null,
        ],
      });
      return standupDate;
    },

    async getDigest(
      standupDate: string,
      period: StandupPeriod,
    ): Promise<DigestEmployee[]> {
      const [entryResult, acknowledgementResult] = await Promise.all([
        client.execute({
          sql: `SELECT * FROM standup_entries
            WHERE standup_date = ? AND period = ? AND deleted_at IS NULL
            ORDER BY created_at ASC, id ASC`,
          args: [standupDate, period],
        }),
        client.execute({
          sql: `SELECT employee_slack_user_id FROM standup_acknowledgements
            WHERE standup_date = ? AND period = ?`,
          args: [standupDate, period],
        }),
      ]);
      const entries = entryResult.rows.map((row) => rowToEntry(row));
      const acknowledged = new Set(
        acknowledgementResult.rows.map((row) =>
          String(row.employee_slack_user_id),
        ),
      );

      return roster
        .filter((member) => member.role === "employee")
        .map((member) => {
          const employeeEntries = entries.filter(
            (entry) => entry.employeeSlackUserId === member.slackUserId,
          );
          return {
            employeeSlackUserId: member.slackUserId,
            displayName: member.displayName,
            response:
              employeeEntries.length > 0
                ? ("submitted" as const)
                : acknowledged.has(member.slackUserId)
                  ? ("empty" as const)
                  : ("awaiting" as const),
            entries: employeeEntries,
          };
        });
    },

    async listPendingEmployees(
      standupDate: string,
      period: StandupPeriod,
    ): Promise<RosterMember[]> {
      const digest = await this.getDigest(standupDate, period);
      const pendingIds = new Set(
        digest
          .filter((employee) => employee.response === "awaiting")
          .map((employee) => employee.employeeSlackUserId),
      );
      return roster.filter(
        (member) => member.role === "employee" && pendingIds.has(member.slackUserId),
      );
    },

    async getDigestMessage(standupDate: string, period: StandupPeriod) {
      const result = await client.execute({
        sql: `SELECT channel_id, message_ts FROM standup_digest_messages
          WHERE standup_date = ? AND period = ?`,
        args: [standupDate, period],
      });
      const row = result.rows[0];
      return row
        ? { channelId: String(row.channel_id), messageTs: String(row.message_ts) }
        : null;
    },

    async saveDigestMessage(input: {
      standupDate: string;
      period: StandupPeriod;
      channelId: string;
      messageTs: string;
    }): Promise<void> {
      await client.execute({
        sql: `INSERT INTO standup_digest_messages
          (standup_date, period, channel_id, message_ts)
          VALUES (?, ?, ?, ?)
          ON CONFLICT (standup_date, period) DO UPDATE SET
            channel_id = excluded.channel_id,
            message_ts = excluded.message_ts`,
        args: [input.standupDate, input.period, input.channelId, input.messageTs],
      });
    },
  };
}

export type StandupService = ReturnType<typeof createStandupService>;
