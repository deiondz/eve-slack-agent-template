import { defineSchedule } from "eve/schedules";

import { standupDateFor } from "../lib/standup/calendar.js";
import { getStandupRuntime } from "../lib/standup/runtime.js";
import { createScheduledEmployeePrompter } from "../lib/standup/scheduled-prompter.js";

export default defineSchedule({
  // 10:20 Asia/Kolkata, Monday-Friday. Vercel evaluates cron in UTC.
  cron: "50 4 * * 1-5",
  run({ receive, waitUntil, appAuth }) {
    waitUntil(
      getStandupRuntime().then(({ workflow }) =>
        workflow.runMorningReminder(
          standupDateFor(),
          createScheduledEmployeePrompter(receive, appAuth),
        ),
      ),
    );
  },
});
