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
  esbuild: {
    // Some pre-existing web/src files contain JSX but keep a plain ".js" extension
    // (Next.js/SWC tolerates this). Vite's default esbuild plugin excludes ".js"
    // from JSX parsing, so tests that transitively import those files need the
    // loader forced to "jsx" for web/src — this is the documented Vite workaround
    // for JSX-in-.js codebases. Scoped to web/src so it doesn't affect server/packages tests.
    loader: "jsx",
    jsx: "automatic",
    include: /web[\\/]src[\\/].*\.jsx?$/,
    exclude: [],
  },
  test: {
    // Root smoke runner for the monorepo. Module agents add their own
    // workspace tests later; this just guarantees a working runner exists.
    include: ["tests/**/*.test.js", "packages/**/*.test.js", "server/**/*.test.js", "web/**/*.test.js"],
    environment: "node",
  },
});
