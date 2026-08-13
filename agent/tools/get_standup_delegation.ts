import { defineTool } from "eve/tools";
import { z } from "zod";

import { createStandupDelegation } from "../lib/standup/delegation.js";

export default defineTool({
  description:
    "Create the trusted actor/date envelope required before delegating a Slack stand-up request to the standup specialist.",
  inputSchema: z.object({ standupDate: z.iso.date().optional() }),
  execute(input, ctx) {
    const actorSlackUserId = ctx.session.auth.current?.attributes.user_id;
    if (typeof actorSlackUserId !== "string" || !actorSlackUserId) {
      throw new Error("A stand-up request requires an authenticated Slack member.");
    }
    return createStandupDelegation({
      actorSlackUserId,
      rootSessionId: ctx.session.id,
      standupDate: input.standupDate,
    });
  },
});
