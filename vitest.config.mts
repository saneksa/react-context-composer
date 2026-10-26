import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    typecheck: {
      enabled: true,
      include: ["tests/**/*.test-d.{ts,tsx}"],
      tsconfig: "./tsconfig.test.json",
    },
  },
});
