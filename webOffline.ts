import type { Plugin } from "vite"
import { createHash } from "node:crypto"
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

/** Precache code/fonts, then cache media on demand. Never handles player storage. */
export function webOffline(): Plugin {
  let publicDir = ""
  return {
    name: "soul-of-meal-web-offline",
    apply: "build",
    configResolved(config) { publicDir = config.publicDir },
    generateBundle(_, bundle) {
      const hash = createHash("sha256")
      for (const [name, output] of Object.entries(bundle)) {
        hash.update(name).update(output.type === "chunk" ? output.code : output.source)
      }
      const visit = (dir: string) => {
        for (const file of readdirSync(dir).sort()) {
          const full = path.join(dir, file)
          if (statSync(full).isDirectory()) visit(full)
          else hash.update(path.relative(publicDir, full)).update(readFileSync(full))
        }
      }
      visit(publicDir)
      const template = readFileSync(new URL("./web-service-worker.js", import.meta.url), "utf8")
      hash.update(template)
      const version = hash.digest("hex").slice(0, 16)
      const core = ["/", "/index.html", "/manifest.webmanifest", "/favicon.ico",
        ...Object.keys(bundle).filter(name => /\.(js|css)$/.test(name)).map(name => `/${name}`),
        ...readdirSync(path.join(publicDir, "assets/fonts")).filter(name => name.endsWith(".woff2")).map(name => `/assets/fonts/${name}`)]
      this.emitFile({ type: "asset", fileName: "sw.js", source: template.replace("__VERSION__", JSON.stringify(version)).replace("__CORE__", JSON.stringify(core)) })
    },
  }
}
