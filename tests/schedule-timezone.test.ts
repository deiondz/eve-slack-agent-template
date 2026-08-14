import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
};

test("production Eve processes evaluate UTC cron expressions in UTC", () => {
  assert.match(
    packageJson.scripts?.start ?? "",
    /^TZ=UTC\s/,
    "start must set TZ=UTC before starting Eve",
  );
});

test("weekday stand-up schedules match the Asia/Kolkata prompt and reminder times", () => {
  const schedules = {
    morning: readFileSync("agent/schedules/morning-standup.ts", "utf8"),
    morningReminder: readFileSync("agent/schedules/morning-reminder.ts", "utf8"),
    evening: readFileSync("agent/schedules/evening-standup.ts", "utf8"),
    eveningReminder: readFileSync("agent/schedules/evening-reminder.ts", "utf8"),
  };

  assert.match(schedules.morning, /cron:\s*"10 4 \* \* 1-5"/u);
  assert.match(schedules.morningReminder, /cron:\s*"50 4 \* \* 1-5"/u);
  assert.match(schedules.evening, /cron:\s*"0 11 \* \* 1-5"/u);
  assert.match(schedules.eveningReminder, /cron:\s*"30 11 \* \* 1-5"/u);
  assert.match(schedules.morningReminder, /runMorningReminder/u);
  assert.match(schedules.eveningReminder, /runEveningReminder/u);
});
