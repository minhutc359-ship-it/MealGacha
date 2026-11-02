import type { Plugin } from "vite"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { PRODUCTION_CORE_PUBLIC_FILES } from "./dev/tools/production-public-assets"

interface BundleChunk {
  type: "chunk"
  isEntry?: boolean
  imports?: string[]
  dynamicImports?: string[]
  modules?: Record<string, unknown>
}

function isChunk(value: unknown): value is BundleChunk {
  return Boolean(
    value &&
      typeof value === "object" &&
      "type" in value &&
      value.type === "chunk",
  )
}

/** Entry + the AW2 route's static graph. Scene renderers and chest stay lazy. */
export function offlineCoreBundleNames(bundle: Record<string, unknown>) {
  const selected = new Set<string>()
  const add = (name: string) => {
    if (selected.has(name)) return
    const output = bundle[name]
    if (!isChunk(output)) return
    selected.add(name)
    for (const dependency of output.imports ?? []) add(dependency)
  }
  for (const [name, output] of Object.entries(bundle))
    if (isChunk(output) && output.isEntry) {
      add(name)
      for (const target of output.dynamicImports ?? []) {
        const dynamic = bundle[target]
        if (
          isChunk(dynamic) &&
          Object.keys(dynamic.modules ?? {}).some((id) =>
            /[\\/](?:src[\\/]aw2|dev[\\/]aw2)[\\/]/.test(id),
          )
        )
          add(target)
      }
    }
  for (const name of Object.keys(bundle))
    if (
      name.endsWith(".css") &&
      !/(?:original-chest|OriginalChest|ChestSpirit)/.test(name)
    )
      selected.add(name)
  return [...selected].sort()
}

/** Precache code/fonts, then cache media on demand. Never handles player storage. */
export function webOffline(): Plugin {
  return {
    name: "soul-of-meal-web-offline",
    apply: "build",
    generateBundle(_, bundle) {
      const hash = createHash("sha256")
      for (const [name, output] of Object.entries(bundle).sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        hash
          .update(name)
          .update(output.type === "chunk" ? output.code : output.source)
      }
      const template = readFileSync(
        new URL("./web-service-worker.js", import.meta.url),
        "utf8",
      )
      hash.update(template)
      const version = hash.digest("hex").slice(0, 16)
      const core = [
        "/",
        "/index.html",
        "/manifest.webmanifest",
        "/favicon.ico",
        ...offlineCoreBundleNames(bundle).map((name) => `/${name}`),
        ...PRODUCTION_CORE_PUBLIC_FILES.filter((name) =>
          name.startsWith("assets/"),
        ).map((name) => `/${name}`),
      ]
      const uniqueCore = [...new Set(core)]
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: template
          .replace("__VERSION__", JSON.stringify(version))
          .replace("__CORE__", JSON.stringify(uniqueCore)),
      })
    },
  }
}
