import { openrouter } from "@openrouter/ai-sdk-provider";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Manage daily stand-up morning plans and evening accomplishments for Slack employees: add, list, update, delete, and acknowledge empty reports.",
  model: openrouter("deepseek/deepseek-v4-flash-0731"),
  modelContextWindowTokens: 1_000_000,
  reasoning: "none",
});
