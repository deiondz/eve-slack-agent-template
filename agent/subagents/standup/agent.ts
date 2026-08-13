import { defineAgent } from "eve";
import { experimental_chatgpt } from "eve/models/openai";

export default defineAgent({
  description:
    "Manage daily stand-up morning plans and evening accomplishments for Slack employees: add, list, update, delete, and acknowledge empty reports.",
  model: experimental_chatgpt("gpt-5.6-luna"),
  modelContextWindowTokens: 200_000,
});
