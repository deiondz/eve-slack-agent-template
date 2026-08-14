import { defineAgent } from "eve";

import { latencySensitiveModelConfig } from "../../lib/model.js";

export default defineAgent({
  description:
    "Turn authenticated Slack bug reports and feature requests into clear GitHub issues, route them to the engineering Slack channel, suggest repository owners, and apply explicitly requested assignments.",
  ...latencySensitiveModelConfig,
});
