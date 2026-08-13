import { defineAgent } from "eve";
import { experimental_chatgpt } from "eve/models/openai";

export default defineAgent({
  model: experimental_chatgpt("gpt-5.6-luna"),
  modelContextWindowTokens: 200_000,
});
