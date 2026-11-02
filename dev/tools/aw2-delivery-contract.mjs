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
