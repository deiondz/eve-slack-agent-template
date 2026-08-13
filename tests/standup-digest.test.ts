import assert from "node:assert/strict";
import test from "node:test";

import { renderStandupDigest } from "../agent/lib/standup/digest.js";

test("renders the authoritative morning digest in Slack mention format", () => {
  assert.equal(
    renderStandupDigest({
      standupDate: "2026-08-13",
      period: "morning",
      employees: [
        {
          employeeSlackUserId: "U_ALICE",
          displayName: "Alice",
          response: "submitted",
          entries: [
            {
              id: "entry-1",
              standupDate: "2026-08-13",
              employeeSlackUserId: "U_ALICE",
              period: "morning",
              text: "Ship the onboarding fix",
              createdAt: "2026-08-13T04:15:00.000Z",
              updatedAt: "2026-08-13T04:15:00.000Z",
            },
          ],
        },
        {
          employeeSlackUserId: "U_BOB",
          displayName: "Bob",
          response: "awaiting",
          entries: [],
        },
      ],
    }),
    [
      "Morning stand-up — August 13, 2026",
      "",
      "<@U_ALICE>",
      "• Ship the onboarding fix",
      "",
      "<@U_BOB>",
      "• Awaiting update",
    ].join("\n"),
  );
});

test("renders an explicit empty evening response", () => {
  assert.equal(
    renderStandupDigest({
      standupDate: "2026-08-13",
      period: "evening",
      employees: [
        {
          employeeSlackUserId: "U_ALICE",
          displayName: "Alice",
          response: "empty",
          entries: [],
        },
      ],
    }),
    "Evening stand-up — August 13, 2026\n\n<@U_ALICE>\n• No accomplishments to report",
  );
});
