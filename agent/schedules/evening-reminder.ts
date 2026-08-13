import { defineSchedule } from "eve/schedules";

import { standupDateFor } from "../lib/standup/calendar.js";
import { getStandupRuntime } from "../lib/standup/runtime.js";
import { createScheduledEmployeePrompter } from "../lib/standup/scheduled-prompter.js";

export default defineSchedule({
  // 17:00 Asia/Kolkata, Monday-Friday. Vercel evaluates cron in UTC.
  cron: "30 11 * * 1-5",
  run({ receive, waitUntil, appAuth }) {
    waitUntil(
      getStandupRuntime().then(({ workflow }) =>
        workflow.runEveningReminder(
          standupDateFor(),
          createScheduledEmployeePrompter(receive, appAuth),
        ),
      ),
    );
  },
});
