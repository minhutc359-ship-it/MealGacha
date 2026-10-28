import { webOffline } from "./webOffline"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"
import metadata from "./src/appMetadata.json"
import { aw2ReviewBuild } from "./dev/tools/aw2-review-build"
import { aw2ProductionBuild } from "./dev/tools/aw2-production-build"

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")

function appMetadata(): Plugin {
  return {
    name: "soul-of-meal-metadata",
    transformIndexHtml(html) {
      return {
        html: html
          .replace("<!-- figma:lang -->", metadata.language)
          .replace("<!-- figma:title -->", escape(metadata.title))
          .replace(/<!-- figma:[a-z-]+ -->/g, ""),
        tags: [
          {
            tag: "meta",
            attrs: { name: "description", content: metadata.description },
            injectTo: "head",
          },
          {
            tag: "link",
            attrs: { rel: "icon", href: metadata.icons.icon },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: { property: "og:title", content: metadata.title },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: {
              property: "og:description",
              content: metadata.description,
            },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: { property: "og:image", content: metadata.openGraph.image },
            injectTo: "head",
          },
          ...(metadata.robots.index
            ? []
            : [
                {
                  tag: "meta",
                  attrs: { name: "robots", content: "noindex, nofollow" },
                  injectTo: "head" as const,
                },
              ]),
        ],
      }
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: metadata.robots.index
          ? "User-agent: *\nAllow: /\n"
          : "User-agent: *\nDisallow: /\n",
      })
    },
  }
}

export default defineConfig({
  base: "/",
  plugins: [
    aw2ReviewBuild(),
    aw2ProductionBuild(),
    react(),
    tailwindcss(),
    appMetadata(),
    webOffline(),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    sourcemap: false,
    minify: true,
    emptyOutDir: true,
    rolldownOptions: {
      treeshake: {
        moduleSideEffects(id) {
          if (
            /[\\/]pixi\.js[\\/]lib[\\/](accessibility|dom|events|spritesheet|filters)[\\/]init\.mjs$/.test(
              id,
            )
          )
            return false
          return undefined
        },
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: "original-chest",
              test: /[\/]src[\/](OriginalChestApp|production\.css|pages[\/]ChestPage|components[\/]chest[\/])/,
              priority: 20,
            },
            {
              name: "aw2-game",
              test: /[\/](?:src[\/]aw2|dev[\/]aw2)[\/]/,
              priority: 15,
            },
            {
              name: "pixi-renderer",
              test: /[\/]node_modules[\/].*pixi\.js[\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  server: { host: "0.0.0.0", port: 8443, strictPort: true },
  preview: { host: "0.0.0.0", port: 8443 },
})
