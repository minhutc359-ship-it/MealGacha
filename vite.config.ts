import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"
import metadata from "./src/appMetadata.json"

const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")

function appMetadata(): Plugin {
  return {
    name: "soul-of-meal-metadata",
    transformIndexHtml(html) {
      return {
        html: html.replace("<!-- figma:lang -->", metadata.language)
          .replace("<!-- figma:title -->", escape(metadata.title))
          .replace(/<!-- figma:[a-z-]+ -->/g, ""),
        tags: [
          { tag: "meta", attrs: { name: "description", content: metadata.description }, injectTo: "head" },
          { tag: "link", attrs: { rel: "icon", href: metadata.icons.icon }, injectTo: "head" },
          { tag: "meta", attrs: { property: "og:title", content: metadata.title }, injectTo: "head" },
          { tag: "meta", attrs: { property: "og:description", content: metadata.description }, injectTo: "head" },
          { tag: "meta", attrs: { property: "og:image", content: metadata.openGraph.image }, injectTo: "head" },
          ...(metadata.robots.index ? [] : [{ tag: "meta", attrs: { name: "robots", content: "noindex, nofollow" }, injectTo: "head" as const }]),
        ],
      }
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "robots.txt", source: metadata.robots.index ? "User-agent: *\nAllow: /\n" : "User-agent: *\nDisallow: /\n" })
    },
  }
}

// The production build resolves this to an empty module. It never needs dev/.
function productionDevPanel(): Plugin {
  return {
    name: "exclude-development-panel",
    resolveId(id) { if (id === "virtual:dev-content-panel") return "\0virtual:dev-content-panel" },
    load(id) { if (id === "\0virtual:dev-content-panel") return "export const DevContentPanel = () => null" },
  }
}

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), appMetadata(), productionDevPanel()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { sourcemap: false, minify: true, emptyOutDir: true },
  server: { host: "0.0.0.0", port: 8443, strictPort: true },
  preview: { host: "0.0.0.0", port: 8443 },
})
