import { defineConfig, mergeConfig, type Plugin } from "vite"
import { fileURLToPath } from "node:url"
import production from "../vite.config"
import { devContentWriter } from "./tools/devContentWriter"
import { aw2ReviewBuild } from "./tools/aw2-review-build"

const panel: Plugin = {
  name: "development-content-panel",
  enforce: "pre",
  apply: "serve",
  resolveId(id) {
    if (id === "virtual:dev-content-panel")
      return fileURLToPath(
        new URL("./components/DevContentPanel.tsx", import.meta.url),
      )
  },
  transform(code, id) {
    if (id.endsWith("/src/index.css"))
      return `${code}\n@source "../dev/components";\n`
  },
}

export default defineConfig(
  mergeConfig(production, {
    plugins: [aw2ReviewBuild(), panel, devContentWriter()],
  }),
)
