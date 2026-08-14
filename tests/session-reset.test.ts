import assert from "node:assert/strict";
import { access, chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("session reset removes only the exact local Eve workflow store", async () => {
  const root = await mkdtemp(join(tmpdir(), "furgo-session-reset-"));
  try {
    const workflowStore = join(root, ".eve", ".workflow-data");
    await mkdir(join(workflowStore, "runs"), { recursive: true });
    await writeFile(join(workflowStore, "runs", "wrun_one.json"), "{}");
    await writeFile(join(root, ".eve", "keep.txt"), "keep");

    const result = spawnSync(
      process.execPath,
      [resolve("scripts/reset-eve-sessions.mjs"), "--root", root],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      deletedRuns: 1,
      reset: true,
      store: workflowStore,
    });
    await assert.rejects(readFile(workflowStore), /ENOENT/);
    assert.equal(await readFile(join(root, ".eve", "keep.txt"), "utf8"), "keep");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("the project build resets sessions only after Eve build succeeds", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  const buildScript = await readFile("scripts/build.mjs", "utf8");

  assert.equal(packageJson.scripts.build, "node scripts/build.mjs");
  assert.ok(
    buildScript.indexOf("await runEveBuild()") <
      buildScript.indexOf("await resetLocalWorkflowSessions()"),
  );
});

test("a failed Eve build preserves old sessions", async () => {
  const root = await mkdtemp(join(tmpdir(), "furgo-failed-build-"));
  try {
    const workflowStore = join(root, ".eve", ".workflow-data");
    const fakeBin = join(root, "bin");
    await mkdir(join(workflowStore, "runs"), { recursive: true });
    await mkdir(fakeBin, { recursive: true });
    await writeFile(join(workflowStore, "runs", "wrun_old.json"), "{}");
    const fakeEve = join(fakeBin, "eve");
    await writeFile(fakeEve, "#!/bin/sh\nexit 17\n");
    await chmod(fakeEve, 0o755);

    const result = spawnSync(process.execPath, [resolve("scripts/build.mjs")], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH ?? ""}` },
    });

    assert.notEqual(result.status, 0);
    await access(join(workflowStore, "runs", "wrun_old.json"));
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
