import { slackChannel } from "eve/channels/slack";

import { slackCredentials } from "../lib/slack-credentials.js";

export default slackChannel({
  credentials: slackCredentials,
  threadContext: { since: "last-agent-reply" },
});
