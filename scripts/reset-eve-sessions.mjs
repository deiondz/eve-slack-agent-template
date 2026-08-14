import { randomUUID } from "node:crypto";
import { access, readdir, rename, rm } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function resolveLocalWorkflowStore(appRoot) {
  const root = resolve(appRoot);
  const eveDirectory = resolve(root, ".eve");
  const store = resolve(eveDirectory, ".workflow-data");
  if (dirname(store) !== eveDirectory || basename(store) !== ".workflow-data") {
    throw new Error("Refusing to reset an unexpected workflow-store path.");
  }
  return { eveDirectory, store };
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function countRunRecords(store) {
  const runs = resolve(store, "runs");
  if (!(await exists(runs))) return 0;
  return (await readdir(runs)).filter((name) => name.endsWith(".json")).length;
}

export async function resetLocalWorkflowSessions(appRoot = process.cwd()) {
  const { eveDirectory, store } = resolveLocalWorkflowStore(appRoot);
  if (!(await exists(store))) return { deletedRuns: 0, reset: false, store };

  const deletedRuns = await countRunRecords(store);
  const retiredStore = resolve(
    eveDirectory,
    `.workflow-data.retired-${process.pid}-${randomUUID()}`,
  );
  await rename(store, retiredStore);
  await rm(retiredStore, { force: true, maxRetries: 3, recursive: true });
  return { deletedRuns, reset: true, store };
}

async function main() {
  const rootIndex = process.argv.indexOf("--root");
  const appRoot = rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd();
  if (!appRoot) throw new Error("--root requires a directory.");
  const result = await resetLocalWorkflowSessions(appRoot);
  console.log(JSON.stringify(result));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
