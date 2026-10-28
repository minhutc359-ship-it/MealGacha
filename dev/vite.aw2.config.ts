import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { cp, mkdir, readdir, writeFile } from "node:fs/promises"
import { basename, join } from "node:path"
import { aw2ReviewBuild } from "./tools/aw2-review-build"

const root = fileURLToPath(new URL("../", import.meta.url))
const entries = [
  "index",
  "world",
  "game",
  "battle",
  "starters",
  "than",
  "roster",
]

/** Multi-entry QA artifact; the server production build uses the root config. */
export default defineConfig({
  root,
  publicDir: false,
  plugins: [
    aw2ReviewBuild(),
    react(),
    {
      name: "aw2-preview-runtime-assets",
      transformIndexHtml() {
        return [
          {
            tag: "link",
            attrs: { rel: "icon", href: "data:," },
            injectTo: "head",
          },
        ]
      },
      async closeBundle() {
        const source = join(root, "dev/aw2/assets")
        const destination = join(root, "dist-aw2/dev/aw2/assets")
        await cp(source, destination, {
          recursive: true,
          filter: async (path) =>
            !basename(path).startsWith(".") && !/\.(png)$/i.test(path),
        })
        await mkdir(join(root, "dist-aw2"), { recursive: true })
        await writeFile(
          join(root, "dist-aw2/index.html"),
          '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="data:,"><meta http-equiv="refresh" content="0;url=/dev/aw2/world.html"><title>Soul of Meal RPG · Bản xem thử</title></head><body><a href="/dev/aw2/world.html">Mở hành trình RPG</a></body></html>',
        )
        const check = async (directory: string): Promise<void> => {
          for (const item of await readdir(directory, {
            withFileTypes: true,
          })) {
            const path = join(directory, item.name)
            if (item.isDirectory()) await check(path)
            else if (/\.(png|ts|tsx|zip|map)$/i.test(item.name))
              throw Error(
                `Unexpected authored source/archive in AW2 preview: ${path}`,
              )
          }
        }
        await check(join(root, "dist-aw2"))
      },
    },
  ],
  resolve: { alias: { "@": join(root, "src") } },
  build: {
    outDir: "dist-aw2",
    emptyOutDir: true,
    sourcemap: false,
    rolldownOptions: {
      input: Object.fromEntries(
        entries.map((name) => [name, join(root, `dev/aw2/${name}.html`)]),
      ),
    },
  },
})
