import { defineAgent } from "eve";
import { experimental_chatgpt } from "eve/models/openai";

export default defineAgent({
  description:
    "Turn authenticated Slack bug reports and feature requests into clear GitHub issues, route them to the engineering Slack channel, suggest repository owners, and apply explicitly requested assignments.",
  model: experimental_chatgpt("gpt-5.6-luna"),
  modelContextWindowTokens: 200_000,
});
