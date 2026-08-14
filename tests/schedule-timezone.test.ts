import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
};

test("production Eve processes evaluate UTC cron expressions in UTC", () => {
  for (const scriptName of ["start", "start:socket"]) {
    assert.match(
      packageJson.scripts?.[scriptName] ?? "",
      /^TZ=UTC\s/,
      `${scriptName} must set TZ=UTC before starting Eve`,
    );
  }
});
