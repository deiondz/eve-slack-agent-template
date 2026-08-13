import { defineHook } from "eve/hooks";

import { logAgentEvent } from "../../../lib/debug-logging.js";

export default defineHook({
  events: {
    "*"(event, ctx) {
      logAgentEvent("issue-tracker", event, ctx);
    },
  },
});
