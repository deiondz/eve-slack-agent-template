import type { ScheduleHandlerArgs } from "eve/schedules";

import slack from "../../channels/slack.js";
import { slackCredentials } from "../slack-credentials.js";
import { openSlackDirectMessageChannel } from "./slack-gateway.js";

export function createScheduledEmployeePrompter(
  receive: ScheduleHandlerArgs["receive"],
  appAuth: ScheduleHandlerArgs["appAuth"],
) {
  return async (slackUserId: string, prompt: string) => {
    const channelId = await openSlackDirectMessageChannel(
      slackCredentials.botToken,
      slackUserId,
    );
    await receive(slack, {
      message: [
        `Send this stand-up prompt to <@${slackUserId}> exactly once:`,
        prompt,
        "Invite a natural-language reply. Do not delegate in this turn; only send the prompt.",
      ].join("\n"),
      target: { channelId },
      auth: appAuth,
    });
  };
}
