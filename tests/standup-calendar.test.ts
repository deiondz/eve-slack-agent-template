import assert from "node:assert/strict";
import test from "node:test";

import {
  currentPublicationDate,
  standupDateFor,
} from "../agent/lib/standup/calendar.js";

test("stand-up dates use the Asia/Kolkata calendar day", () => {
  assert.equal(standupDateFor(new Date("2026-08-12T20:00:00.000Z")), "2026-08-13");
});

test("current digest publication cannot be backdated by model input", () => {
  assert.equal(
    currentPublicationDate(
      "2025-02-14",
      new Date("2026-08-13T11:10:00.000Z"),
    ),
    "2026-08-13",
  );
});
