import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors web/jsconfig.json's "@/*" -> "./src/*" so tests under web/ that
      // import real app modules (which use the "@/..." alias internally) resolve
      // the same way Next.js resolves them at build/runtime.
      "@": fileURLToPath(new URL("./web/src", import.meta.url)),
    },
  },
  test: {
    // Root smoke runner for the monorepo. Module agents add their own
    // workspace tests later; this just guarantees a working runner exists.
    include: [
      "tests/**/*.test.js",
      "packages/**/*.test.js",
      "server/**/*.test.js",
      "web/**/*.test.js",
      "courses-web/**/*.test.js",
    ],
    environment: "node",
  },
});
