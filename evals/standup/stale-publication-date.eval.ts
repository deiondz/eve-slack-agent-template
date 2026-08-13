import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

import { currentPublicationDate } from "../../agent/lib/standup/calendar.js";

export default defineEval({
  description:
    "Prevents a stale model-supplied date from backdating a canonical digest.",
  tags: ["standup", "deterministic", "regression"],
  test(t) {
    t.check(
      currentPublicationDate(
        "2025-02-14",
        new Date("2026-08-13T11:10:00.000Z"),
      ),
      equals("2026-08-13"),
    );
  },
});
