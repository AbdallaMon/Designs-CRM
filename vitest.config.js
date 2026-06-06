import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Root smoke runner for the monorepo. Module agents add their own
    // workspace tests later; this just guarantees a working runner exists.
    include: ["tests/**/*.test.js", "packages/**/*.test.js", "server/**/*.test.js"],
    environment: "node",
  },
});
