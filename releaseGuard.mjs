import { readdirSync, readFileSync, lstatSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

// The browser bundle is necessarily downloadable. This guard prevents accidental
// publication of authored sources, credentials and development files beside it.
export function inspectRelease(root) {
  const leaks = []
  const walk = directory => {
    for (const name of readdirSync(directory)) {
      const file = path.join(directory, name), relative = path.relative(root, file).split(path.sep).join("/")
      const stat = lstatSync(file)
      if (stat.isSymbolicLink()) { leaks.push(`${relative}: symlink`); continue }
      if (stat.isDirectory()) {
        if (/(^|\/)(?:src|dev|rights|node_modules|\.git|\.github|\.vercel|archive|__qa__)(\/|$)/i.test(relative)) leaks.push(`${relative}: private directory`)
        else walk(file)
        continue
      }
      if (/assets\/rpg\/awakening530\/movies\/.*\.mp4$/i.test(relative)) leaks.push(`${relative}: retired ultimate video`)
      if (/(^|\/)(?:\.env(?:\..*)?|package(?:-lock)?\.json|pnpm-lock\.yaml|vite\.config\..*|tsconfig.*|AGENTS\.md|.*\.(?:zip|tar|gz|tgz|map|tsx?|jsx|pem|key|p12|keystore|jks|log))$/i.test(relative)) leaks.push(`${relative}: source/archive/secret file`)
      if (/\.(?:js|css|html|json|txt|svg|webmanifest)$/i.test(name)) {
        const text = readFileSync(file, "utf8")
        if (text.replace(/\\\//g, "/").toLowerCase().includes("minhutc359-ship-it/mealgacha")) leaks.push(`${relative}: project source link`)
        if (/(?:\/\/[#@]|\/\*[#@])\s*sourceMappingURL\s*=|["']sourcesContent["']\s*:/.test(text)) leaks.push(`${relative}: embedded source map`)
        if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{60,}|AKIA[A-Z0-9]{16})\b/.test(text)) leaks.push(`${relative}: credential pattern`)
      }
    }
  }
  walk(root)
  return leaks
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const leaks = inspectRelease(path.resolve(process.argv[2] || "dist"))
  if (leaks.length) throw Error(`Release refused:\n${leaks.join("\n")}`)
  console.log("Release guard: no authored sources, maps, archives or recognized credentials in dist.")
}
