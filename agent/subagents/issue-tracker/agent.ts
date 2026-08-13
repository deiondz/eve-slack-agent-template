import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { defineAgent } from "eve";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export default defineAgent({
  description:
    "Turn authenticated Slack bug reports and feature requests into clear GitHub issues, route them to the engineering Slack channel, suggest repository owners, and apply explicitly requested assignments.",
  model: openrouter("deepseek/deepseek-v4-flash-0731"),
  modelContextWindowTokens: 1_050_000,
});

