import { webOffline } from "./webOffline"
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
  plugins: [react(), tailwindcss(), appMetadata(), productionDevPanel(), webOffline()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    sourcemap: false, minify: true, emptyOutDir: true,
    // Let shared engines coalesce with their consumers to avoid duplicate compression dictionaries.
    // Pixi is still imported on demand; one renderer chunk avoids repeated helpers.
    rolldownOptions: {
      // Our two Pixi consumers draw Graphics onto aria-hidden canvases. Input,
      // accessibility, assets and filters belong to the surrounding DOM / shared
      // image renderer, so these automatic feature registrations have no consumer.
      // Keep Pixi's application, graphics, texture and renderer registrations.
      treeshake: { moduleSideEffects(id) {
        if (/[\\/]pixi\.js[\\/]lib[\\/](accessibility|dom|events|spritesheet|filters)[\\/]init\.mjs$/.test(id)) return false
        return undefined
      } },
      output: { codeSplitting: { groups: [
      { name: "rpg-presentation", test: /[\/]src[\/](domain[\/]|game[\/](?!spiritArena|battleVfx)|infrastructure[\/](assets[\/]characterSprites|audio[\/]gameAudio))|[\/]src[\/](components[\/]game[\/](Rpg|SpiritArt|MangaChronicle|BattleBoard|CombatEffects|BattleVfxCanvas|TrapZone|GameCardView|DuelBasics)|pages[\/](AdventurePage|TCGPage|AutoChessPage))|[\/]src[\/]components[\/]autochess[\/]/, priority: 15 },
      { name: "chest-ui", test: /[\/]src[\/](components[\/]chest[\/]|pages[\/]ChestPage)/, priority: 12 },
      { name: "tcg-ui", test: /[\/]src[\/](components[\/]game[\/](BattleBoard|CombatEffects|BattleVfxCanvas|TrapZone|GameCardView|DuelBasics)|pages[\/]TCGPage)/, priority: 12 },
      { name: "autochess-ui", test: /[\/]src[\/](components[\/]autochess[\/]|pages[\/]AutoChessPage)/, priority: 12 },
      { name: "pixi-renderer", test: /[\/]node_modules[\/].*pixi\.js[\/]/, priority: 10 },
    ] } } },
  },
  server: { host: "0.0.0.0", port: 8443, strictPort: true },
  preview: { host: "0.0.0.0", port: 8443 },
})
