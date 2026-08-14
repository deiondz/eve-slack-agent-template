import { defineAgent } from "eve";

import { latencySensitiveModelConfig } from "./lib/model.js";

export default defineAgent({
  ...latencySensitiveModelConfig,
  build: {
    externalDependencies: ["@libsql/client"],
  },
});
