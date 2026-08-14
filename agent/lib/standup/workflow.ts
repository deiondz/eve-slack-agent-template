import { renderStandupDigest } from "./digest.js";
import type { StandupPeriod, StandupService } from "./service.js";

export interface StandupSlackGateway {
  publishMessage(
    channelId: string,
    text: string,
    idempotencyKey: string,
  ): Promise<{ messageTs: string }>;
  updateMessage(channelId: string, messageTs: string, text: string): Promise<void>;
}

interface WorkflowOptions {
  service: StandupService;
  slack: StandupSlackGateway;
}

function isSlackMessageNotFound(error: unknown): boolean {
  return error instanceof Error && /\bmessage_not_found\b/u.test(error.message);
}

export function createStandupWorkflow({
  service,
  slack,
}: WorkflowOptions) {
  async function publishNewDigest(
    standupDate: string,
    period: StandupPeriod,
    text: string,
    idempotencyKey = `standup-digest:${standupDate}:${period}`,
  ) {
    const dailyUpdatesChannelId = await service.getDailyUpdatesChannelId();
    const posted = await slack.publishMessage(
      dailyUpdatesChannelId,
      text,
      idempotencyKey,
    );
    const reference = {
      standupDate,
      period,
      channelId: dailyUpdatesChannelId,
      messageTs: posted.messageTs,
    };
    await service.saveDigestMessage(reference);
    return reference;
  }

  async function refreshDigest(standupDate: string, period: StandupPeriod) {
    const employees = await service.getDigest(standupDate, period);
    const text = renderStandupDigest({ standupDate, period, employees });
    const existing = await service.getDigestMessage(standupDate, period);
    if (existing) {
      let candidate = text;
      for (;;) {
        try {
          await slack.updateMessage(
            existing.channelId,
            existing.messageTs,
            candidate,
          );
        } catch (error) {
          if (!isSlackMessageNotFound(error)) throw error;
          const cleared = await service.clearDigestMessage({
            standupDate,
            period,
            channelId: existing.channelId,
            messageTs: existing.messageTs,
          });
          if (!cleared) {
            const replacement = await service.getDigestMessage(
              standupDate,
              period,
            );
            return replacement
              ? { standupDate, period, ...replacement }
              : null;
          }
          return publishNewDigest(
            standupDate,
            period,
            candidate,
            `standup-digest-recovery:${standupDate}:${period}:${existing.messageTs}`,
          );
        }
        const latest = renderStandupDigest({
          standupDate,
          period,
          employees: await service.getDigest(standupDate, period),
        });
        if (latest === candidate) break;
        candidate = latest;
      }
      return { standupDate, period, ...existing };
    }

    return null;
  }

  async function ensureDigest(standupDate: string, period: StandupPeriod) {
    const refreshed = await refreshDigest(standupDate, period);
    if (refreshed) return refreshed;
    const text = renderStandupDigest({
      standupDate,
      period,
      employees: await service.getDigest(standupDate, period),
    });
    return publishNewDigest(standupDate, period, text);
  }

  return {
    ensureDigest,
    refreshDigest,

    async publishDigest(
      actorSlackUserId: string,
      standupDate: string,
      period: StandupPeriod,
    ) {
      await service.getConfiguration(actorSlackUserId);
      return ensureDigest(standupDate, period);
    },

    async runMorning(
      standupDate: string,
      promptEmployee: (slackUserId: string, prompt: string) => Promise<void>,
    ): Promise<void> {
      const employees = await service.getDigest(standupDate, "morning");
      await ensureDigest(standupDate, "morning");
      await Promise.all(
        employees.map((employee) =>
          promptEmployee(
            employee.employeeSlackUserId,
            `Good morning! What are you planning to work on today (${standupDate})? Reply naturally—you can add, change, remove, or review items throughout the day.`,
          ),
        ),
      );
    },

    async runEveningPrompt(
      standupDate: string,
      promptEmployee: (slackUserId: string, prompt: string) => Promise<void>,
    ): Promise<void> {
      const employees = await service.getDigest(standupDate, "evening");
      await ensureDigest(standupDate, "evening");
      await Promise.all(
        employees.map((employee) =>
          promptEmployee(
            employee.employeeSlackUserId,
            `What did you work on today (${standupDate})? Reply naturally with completed or in-progress work. You can also say that there is nothing to report.`,
          ),
        ),
      );
    },

    async runEveningReminder(
      standupDate: string,
      promptEmployee: (slackUserId: string, prompt: string) => Promise<void>,
    ): Promise<void> {
      const pending = await service.listPendingEmployees(standupDate, "evening");
      await Promise.all(
        pending.map((employee) =>
          promptEmployee(
            employee.slackUserId,
            `Reminder: please share what you worked on today (${standupDate}), even if there is nothing to report.`,
          ),
        ),
      );
    },
  };
}

export type StandupWorkflow = ReturnType<typeof createStandupWorkflow>;
