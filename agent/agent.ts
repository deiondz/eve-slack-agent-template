import { openrouter } from "@openrouter/ai-sdk-provider";
import { defineAgent } from "eve";

export default defineAgent({
  model: openrouter("deepseek/deepseek-v4-flash-0731"),
  modelContextWindowTokens: 1_000_000,
  build: {
    externalDependencies: ["@libsql/client"],
  },
});
