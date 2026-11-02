import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  AW2_CACHE_HEADERS,
  AW2_DELIVERY_SECURITY_PROFILE,
  AW2_SECURITY_HEADERS,
  AW2_VERCEL_IGNORE_RULES,
  validateAw2DeliveryConfig,
  validateAw2VercelIgnore,
} from "../../tools/aw2-delivery-contract.mjs"

const config = () => JSON.parse(readFileSync("vercel.json", "utf8"))
const ignore = () => readFileSync(".vercelignore", "utf8")

describe("AW2 static delivery security", () => {
  it("locks the named security profile and current Vercel contract", () => {
    expect(AW2_DELIVERY_SECURITY_PROFILE).toBe("aw2-static-v1")
    expect(validateAw2DeliveryConfig(config())).toEqual([])
    expect(Object.keys(AW2_SECURITY_HEADERS)).toHaveLength(9)
    expect(Object.keys(AW2_CACHE_HEADERS)).toHaveLength(4)
  })

  it("keeps every production build input out of the Vercel ignore set", () => {
    expect(validateAw2VercelIgnore(ignore())).toEqual([])
    expect(AW2_VERCEL_IGNORE_RULES).not.toContain("dev/")
    expect(AW2_VERCEL_IGNORE_RULES).not.toContain("rights/")
    expect(validateAw2VercelIgnore(`${ignore()}dev/\nrights/\n`)).toEqual([
      "Unapproved Vercel ignore rule: dev/",
      "Unapproved Vercel ignore rule: rights/",
    ])
  })

  it.each(Object.keys(AW2_SECURITY_HEADERS))(
    "rejects a missing or weakened %s header",
    (header) => {
      const changed = config()
      const global = changed.headers.find(
        (rule: { source: string }) => rule.source === "/:path*",
      )
      const item = global.headers.find(
        (entry: { key: string }) => entry.key === header,
      )
      item.value = "weakened"
      expect(validateAw2DeliveryConfig(changed)).toContain(
        `Security header mismatch: ${header}`,
      )
    },
  )

  it.each(Object.keys(AW2_CACHE_HEADERS))(
    "rejects cache drift for %s",
    (source) => {
      const changed = config()
      const rule = changed.headers.find(
        (entry: { source: string }) => entry.source === source,
      )
      rule.headers.find(
        (entry: { key: string }) => entry.key === "Cache-Control",
      ).value = "public, max-age=999999"
      expect(validateAw2DeliveryConfig(changed)).toContain(
        `Cache header mismatch: ${source}`,
      )
    },
  )
})
