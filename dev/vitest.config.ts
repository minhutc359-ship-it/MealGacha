import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  define: { __AW2_PRODUCTION__: false },
  resolve: {
    alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) },
  },
  test: { include: ["dev/tests/**/*.test.ts"] },
})
