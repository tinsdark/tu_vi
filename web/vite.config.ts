import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const kb = fileURLToPath(new URL("../data/knowledge", import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? "/",
  // CSP của server chỉ cho font từ cùng nguồn: không nhúng woff2 thành data: URI
  build: { assetsInlineLimit: (file) => (file.endsWith(".woff2") ? false : undefined) },
  resolve: { alias: { "@kb": kb } },
  server: { fs: { allow: [".."] }, proxy: { "/api": "http://localhost:8787" } },
  test: { globalSetup: ["test/setup.ts"], include: ["test/**/*.test.ts"], testTimeout: 120_000, hookTimeout: 120_000 },
});
