import { defineSchedule } from "eve/schedules";

import { standupDateFor } from "../lib/standup/calendar.js";
import { getStandupRuntime } from "../lib/standup/runtime.js";
import { createScheduledEmployeePrompter } from "../lib/standup/scheduled-prompter.js";

export default defineSchedule({
  // 09:40 Asia/Kolkata, Monday-Friday. Vercel evaluates cron in UTC.
  cron: "10 4 * * 1-5",
  run({ receive, waitUntil, appAuth }) {
    waitUntil(
      getStandupRuntime().then(({ workflow }) =>
        workflow.runMorning(
          standupDateFor(),
          createScheduledEmployeePrompter(receive, appAuth),
        ),
      ),
    );
  },
});
