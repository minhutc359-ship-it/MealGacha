import { createHash } from "node:crypto"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  AW2_CACHE_HEADERS,
  AW2_DELIVERY_SECURITY_PROFILE,
  AW2_SECURITY_HEADERS,
} from "../../tools/aw2-delivery-contract.mjs"
import { readReleaseCandidateReport } from "../../tools/aw2-release-candidate.mjs"

function artifactFixture() {
  const root = mkdtempSync(join(tmpdir(), "aw2-candidate-"))
  const write = (path: string, text: string) => {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, text)
  }
  const asset = (path: string, data: string) => ({
    path,
    bytes: Buffer.byteLength(data),
    sha256: createHash("sha256").update(data).digest("hex"),
  })
  write(
    "dist/index.html",
    '<html><script type="module" src="/assets/game.js"></script></html>',
  )
  write("dist/assets/game.js", 'document.title="Soul of Meal";')
  write("dist/sw.js", 'const CORE_URLS = ["/","/assets/game.js"];')
  write(
    "dist/manifest.webmanifest",
    JSON.stringify({
      start_url: "/",
      scope: "/",
      shortcuts: [{ url: "/" }, { url: "/chest" }],
    }),
  )
  write("dist/assets/aw2/model.webp", "aw2-test-model")
  write(
    "dist/assets/aw2/inventory.json",
    JSON.stringify({
      assets: [asset("model.webp", "aw2-test-model")],
      bytes: 14,
    }),
  )
  write("dist/assets/icon.png", "icon")
  write(
    "dist/assets/production-public-manifest.json",
    JSON.stringify({ files: [asset("assets/icon.png", "icon")], bytes: 4 }),
  )
  write(
    "dist/assets/production-contract.json",
    JSON.stringify({
      defaultSurface: "soul-of-meal-aw2",
      retainedLegacySurfaces: ["chest"],
      legacyPageCount: 1,
      reviewUiModules: 0,
      legacyEntryModules: 0,
    }),
  )
  write(
    "dist/assets/release-identity.json",
    JSON.stringify({
      schema: 1,
      product: "soul-of-meal",
      version: "5.9.23",
      candidate: "aw2-web1-rc-v1",
      source: { provider: "local", revision: null },
      sourcePortable: true,
      deliverySecurityProfile: AW2_DELIVERY_SECURITY_PROFILE,
      surface: {
        defaultSurface: "soul-of-meal-aw2",
        retainedLegacySurfaces: ["chest"],
      },
    }),
  )
  for (const name of [
    "privacy.html",
    "terms.html",
    "rights.html",
    "APP_LICENSE.txt",
    "THIRD_PARTY_LICENSES.txt",
    "NATIVE_SDK_NOTICES.txt",
  ])
    write(`dist/legal/${name}`, "policy")
  write(
    "docs/aw2/ROLLBACK.md",
    "Keep the known good artifact and preserve player saves.",
  )
  write(
    "vercel.json",
    JSON.stringify({
      buildCommand: "pnpm build",
      outputDirectory: "dist",
      headers: [
        ...Object.entries(AW2_CACHE_HEADERS).map(([source, value]) => ({
          source,
          headers: [{ key: "Cache-Control", value }],
        })),
        {
          source: "/:path*",
          headers: Object.entries(AW2_SECURITY_HEADERS).map(([key, value]) => ({
            key,
            value,
          })),
        },
      ],
    }),
  )
  // Deliberately stale, forged measurements must never be used by the candidate.
  write(
    "dev/docs/release/build-size.json",
    JSON.stringify({
      bytes: 1,
      js_gzip: 1,
      leaks: [],
      offlineShell: { bytes: 1 },
    }),
  )
  return { root, write }
}

describe("RC measures the actual artifact", () => {
  it("ignores stale measurements and fingerprints actual bytes", () => {
    const f = artifactFixture()
    const first = readReleaseCandidateReport(f.root)
    expect(first.technicalStatus).toBe("PASS")
    expect(
      first.gates.find((gate) => gate.id === "artifact-size")!.observed,
    ).toBeGreaterThan(1)
    f.write("dist/assets/game.js", 'document.title="Soul of Meal updated";')
    const second = readReleaseCandidateReport(f.root)
    expect(second.artifact.sha256).not.toBe(first.artifact.sha256)
    expect(second.artifact.bytes).toBeGreaterThan(first.artifact.bytes)
  })

  it("fails missing or empty legal output", () => {
    const f = artifactFixture()
    f.write("dist/legal/privacy.html", "")
    expect(
      readReleaseCandidateReport(f.root).gates.find(
        (gate) => gate.id === "legal-artifacts",
      )!.status,
    ).toBe("FAIL")
  })

  it("fails corrupt assets even when a stale report claimed PASS", () => {
    const f = artifactFixture()
    f.write("dist/assets/aw2/model.webp", "corrupted")
    expect(
      readReleaseCandidateReport(f.root).gates.find(
        (gate) => gate.id === "aw2-inventory",
      )!.status,
    ).toBe("FAIL")
  })

  it("fails when old UI or a broken worker is present", () => {
    const f = artifactFixture()
    f.write(
      "dist/assets/production-contract.json",
      JSON.stringify({
        defaultSurface: "legacy",
        retainedLegacySurfaces: ["chest", "adventure"],
      }),
    )
    f.write("dist/sw.js", 'const CORE_URLS = ["/","/missing.js"];')
    const report = readReleaseCandidateReport(f.root)
    expect(report.technicalStatus).toBe("FAIL")
    expect(
      report.gates.find((gate) => gate.id === "build-routing")!.status,
    ).toBe("FAIL")
    expect(
      report.gates.find((gate) => gate.id === "offline-worker")!.status,
    ).toBe("FAIL")
  })

  it("fails a forged identity or weakened delivery header", () => {
    const f = artifactFixture()
    f.write(
      "dist/assets/release-identity.json",
      JSON.stringify({ product: "other", sourcePortable: true }),
    )
    const config = JSON.parse(readFileSync(join(f.root, "vercel.json"), "utf8"))
    config.headers.find(
      (rule: { source: string }) => rule.source === "/:path*",
    ).headers = []
    f.write("vercel.json", JSON.stringify(config))
    const report = readReleaseCandidateReport(f.root)
    expect(
      report.gates.find((gate) => gate.id === "release-identity")!.status,
    ).toBe("FAIL")
    expect(
      report.gates.find((gate) => gate.id === "source-portability")!.status,
    ).toBe("FAIL")
    expect(
      report.gates.find((gate) => gate.id === "delivery-security")!.status,
    ).toBe("FAIL")
  })

  it("rejects an absent artifact", () => {
    const root = mkdtempSync(join(tmpdir(), "aw2-candidate-empty-"))
    expect(readReleaseCandidateReport(root).technicalStatus).toBe("FAIL")
  })
})
