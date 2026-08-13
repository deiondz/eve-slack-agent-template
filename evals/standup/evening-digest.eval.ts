import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

import { currentPublicationDate } from "../../agent/lib/standup/calendar.js";
import { renderStandupDigest } from "../../agent/lib/standup/digest.js";

const employees = ["U_DEION", "U_SHAUN", "U_JNANESH", "U_SAHAD"].map(
  (employeeSlackUserId) => ({
    employeeSlackUserId,
    displayName: employeeSlackUserId,
    response: "awaiting" as const,
    entries: [],
  }),
);

export default defineEval({
  description:
    "Renders a current evening digest with the correct title, mentions, and awaiting statuses.",
  tags: ["standup", "deterministic", "regression"],
  test(t) {
    const standupDate = currentPublicationDate(
      "2025-02-14",
      new Date("2026-08-13T11:10:00.000Z"),
    );

    t.check(
      renderStandupDigest({ standupDate, period: "evening", employees }),
      equals(
        [
          "Evening stand-up — August 13, 2026",
          "",
          "<@U_DEION>",
          "• Awaiting update",
          "",
          "<@U_SHAUN>",
          "• Awaiting update",
          "",
          "<@U_JNANESH>",
          "• Awaiting update",
          "",
          "<@U_SAHAD>",
          "• Awaiting update",
        ].join("\n"),
      ),
    );
  },
});
