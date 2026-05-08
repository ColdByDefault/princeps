import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "server-only": path.resolve(rootDir, "tests/stubs/server-only.ts"),
    },
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    environment: "node",
    exclude: ["node_modules", ".next", "prisma/migrations"],
    include: ["tests/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
    restoreMocks: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
