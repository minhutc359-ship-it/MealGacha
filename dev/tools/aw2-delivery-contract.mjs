export const AW2_DELIVERY_SECURITY_PROFILE = "aw2-static-v1"

export const AW2_SECURITY_HEADERS = Object.freeze({
  "Content-Security-Policy":
    "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; frame-src 'none'; img-src 'self' data: blob:; manifest-src 'self'; media-src 'self' blob:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow",
})

export const AW2_CACHE_HEADERS = Object.freeze({
  "/assets/:path*": "public, max-age=3600, must-revalidate",
  "/index.html": "public, max-age=0, must-revalidate",
  "/legal/:path*": "public, max-age=0, must-revalidate",
  "/sw.js": "public, max-age=0, must-revalidate",
})

export const AW2_VERCEL_IGNORE_RULES = Object.freeze([
  "node_modules/",
  "dist/",
  "dist-aw2/",
  ".asset-work/",
  "*.log",
  "*.tsbuildinfo",
])

function headerMap(rule) {
  if (!Array.isArray(rule?.headers)) return new Map()
  return new Map(rule.headers.map(({ key, value }) => [key, value]))
}

export function validateAw2DeliveryConfig(config) {
  const issues = []
  if (!config || !Array.isArray(config.headers))
    return ["Vercel headers are missing"]
  const bySource = new Map(config.headers.map((rule) => [rule.source, rule]))
  const global = headerMap(bySource.get("/:path*"))
  for (const [key, value] of Object.entries(AW2_SECURITY_HEADERS))
    if (global.get(key) !== value)
      issues.push(`Security header mismatch: ${key}`)
  for (const [source, value] of Object.entries(AW2_CACHE_HEADERS)) {
    const actual = headerMap(bySource.get(source)).get("Cache-Control")
    if (actual !== value) issues.push(`Cache header mismatch: ${source}`)
  }
  return issues
}

export function validateAw2VercelIgnore(source) {
  if (typeof source !== "string") return ["Vercel ignore contract is missing"]
  const rules = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
  const issues = []
  const unique = new Set(rules)
  if (unique.size !== rules.length)
    issues.push("Vercel ignore contract contains duplicate rules")
  for (const rule of rules)
    if (!AW2_VERCEL_IGNORE_RULES.includes(rule))
      issues.push(`Unapproved Vercel ignore rule: ${rule}`)
  for (const rule of AW2_VERCEL_IGNORE_RULES)
    if (!unique.has(rule)) issues.push(`Missing Vercel ignore rule: ${rule}`)
  return issues
}
