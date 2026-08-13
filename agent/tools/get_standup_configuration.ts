import { defineTool } from "eve/tools";
import { z } from "zod";

import { getStandupRuntime } from "../lib/standup/runtime.js";

export default defineTool({
  description:
    "Show the persisted daily-updates Slack channel and stand-up roster. Only configured stand-up managers may use this tool.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const actorSlackUserId = ctx.session.auth.current?.attributes.user_id;
    if (typeof actorSlackUserId !== "string" || !actorSlackUserId) {
      throw new Error("Stand-up configuration requires an authenticated Slack member.");
    }
    const { service } = await getStandupRuntime();
    return service.getConfiguration(actorSlackUserId);
  },
});
