import assert from "node:assert/strict";
import test from "node:test";

import {
  issueRepositories,
  repositoryCandidatesForModel,
} from "../agent/lib/issues/repositories.js";

test("repository inventory covers every Manasija repository exactly once", () => {
  assert.equal(issueRepositories.length, 38);
  assert.equal(new Set(issueRepositories.map((repo) => repo.slug)).size, 38);
});

test("repository inventory distinguishes the Myuki application surfaces", () => {
  const bySlug = new Map(issueRepositories.map((repo) => [repo.slug, repo]));
  assert.match(bySlug.get("manasijatech/myuki")?.role ?? "", /Web application/);
  assert.match(
    bySlug.get("manasijatech/myuki-electron-app")?.role ?? "",
    /Desktop application/,
  );
  assert.match(
    bySlug.get("manasijatech/pulse-app")?.role ?? "",
    /Mobile application/,
  );
  assert.match(bySlug.get("manasijatech/pulse")?.role ?? "", /web experience/);
});

test("contributor signals are explicitly not represented as ownership", () => {
  const myuki = issueRepositories.find((repo) => repo.slug === "manasijatech/myuki");
  assert.deepEqual(myuki?.githubContacts, ["deiondz"]);
  assert.equal(myuki?.contactBasis, "top contributor signal; not confirmed ownership");
});

test("repository routing returns a focused semantic shortlist", () => {
  const candidates = repositoryCandidatesForModel(
    "The Myuki desktop Electron app crashes during startup",
  );

  assert.equal(candidates[0]?.slug, "manasijatech/myuki-electron-app");
  assert.ok(candidates.length <= 8);
  assert.ok(candidates.every((candidate) => candidate.slug.startsWith("manasijatech/")));
});
