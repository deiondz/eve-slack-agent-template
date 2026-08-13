import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

import { standupDateFor } from "../../agent/lib/standup/calendar.js";

export default defineEval({
  description:
    "Uses the Asia/Kolkata calendar day when UTC is still on the previous day.",
  tags: ["standup", "deterministic"],
  test(t) {
    t.check(
      standupDateFor(new Date("2026-08-12T20:00:00.000Z")),
      equals("2026-08-13"),
    );
  },
});
