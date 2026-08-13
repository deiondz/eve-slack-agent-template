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
  dailyUpdatesChannelId: string;
}

export function createStandupWorkflow({
  service,
  slack,
  dailyUpdatesChannelId,
}: WorkflowOptions) {
  async function refreshDigest(standupDate: string, period: StandupPeriod) {
    const employees = await service.getDigest(standupDate, period);
    const text = renderStandupDigest({ standupDate, period, employees });
    const existing = await service.getDigestMessage(standupDate, period);
    if (existing) {
      let candidate = text;
      for (;;) {
        await slack.updateMessage(existing.channelId, existing.messageTs, candidate);
        const latest = renderStandupDigest({
          standupDate,
          period,
          employees: await service.getDigest(standupDate, period),
        });
        if (latest === candidate) break;
        candidate = latest;
      }
      return existing;
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
    const posted = await slack.publishMessage(
      dailyUpdatesChannelId,
      text,
      `standup-digest:${standupDate}:${period}`,
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

  return {
    ensureDigest,
    refreshDigest,

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
