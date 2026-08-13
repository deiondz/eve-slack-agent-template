import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { defineAgent } from "eve";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export default defineAgent({
  description:
    "Manage daily stand-up morning plans and evening accomplishments for Slack employees: add, list, update, delete, and acknowledge empty reports.",
  model: openrouter("deepseek/deepseek-v4-flash-0731"),
  modelContextWindowTokens: 1_050_000,
});
