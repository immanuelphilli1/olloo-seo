import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    testTimeout: 90_000,
    hookTimeout: 30_000,
    env: {
      ALLOW_PRIVATE_TARGETS: "true",
      SKIP_PAGESPEED: "true",
      DB_PATH: ":memory:",
      ANTHROPIC_API_KEY: "",
    },
  },
});
