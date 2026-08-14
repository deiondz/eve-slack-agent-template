import { defineHook } from "eve/hooks";

import { logGeneratedSession } from "../../../lib/session-logging.js";

export default defineHook({
  events: {
    async "session.started"(event, ctx) {
      await logGeneratedSession("issue-tracker", event, ctx);
    },
  },
});
