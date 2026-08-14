import { experimental_chatgpt } from "eve/models/openai";

export const latencySensitiveModelConfig = {
  model: experimental_chatgpt("gpt-5.6-luna"),
  modelContextWindowTokens: 200_000,
  reasoning: "none" as const,
};
