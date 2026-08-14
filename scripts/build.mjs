import { spawn } from "node:child_process";

import { resetLocalWorkflowSessions } from "./reset-eve-sessions.mjs";

function runEveBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn("eve", ["build"], {
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`eve build failed (${signal ?? `exit ${code}`}).`));
    });
  });
}

await runEveBuild();
const result = await resetLocalWorkflowSessions();
console.log(
  result.reset
    ? `[BUILD] deleted ${result.deletedRuns} old local session run(s) from ${result.store}`
    : `[BUILD] no old local sessions found at ${result.store}`,
);
