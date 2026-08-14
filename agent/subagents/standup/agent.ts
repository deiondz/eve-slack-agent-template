import { defineAgent } from "eve";

import { latencySensitiveModelConfig } from "../../lib/model.js";

export default defineAgent({
  description:
    "Manage daily stand-up morning plans and evening accomplishments for Slack employees: add, list, update, delete, and acknowledge empty reports.",
  ...latencySensitiveModelConfig,
});
