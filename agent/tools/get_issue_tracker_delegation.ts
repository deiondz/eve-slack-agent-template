import { defineTool } from "eve/tools";
import { z } from "zod";

import { exchangeIssueDelegation } from "../lib/issues/delegation.js";

export default defineTool({
  description:
    "Exchange trusted inbound Slack issue metadata for the root-bound token required before delegating issue intake or assignment.",
  inputSchema: z.object({ inboundToken: z.string().min(1) }),
  execute(input, ctx) {
    const actorSlackUserId = ctx.session.auth.current?.attributes.user_id;
    if (typeof actorSlackUserId !== "string" || !actorSlackUserId) {
      throw new Error("Issue tracking requires an authenticated Slack member.");
    }
    return exchangeIssueDelegation({
      actorSlackUserId,
      inboundToken: input.inboundToken,
      rootSessionId: ctx.session.id,
    });
  },
});

