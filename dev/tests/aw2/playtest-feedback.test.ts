import { describe, expect, it } from "vitest"
import {
  createPlaytestFeedback,
  frameCadence,
  type FeedbackEnvironment,
  type ReviewBuildInfo,
} from "@/aw2/review/feedback"
import { newWorldProgress } from "@/aw2/world/model"
import { newEconomy } from "@/aw2/economy/model"
import { newCollection } from "@/aw2/collection/model"
import type { SaveSnapshot } from "@/aw2/save/schema"
import { fingerprintReviewInputs } from "../../tools/aw2-review-build"

const build: ReviewBuildInfo = {
  version: 1,
  mode: "compiled",
  baseGitSha: "a".repeat(40),
  sourceDirty: true,
  codeFingerprint: "b".repeat(64),
  inputFiles: 10,
}
const environment: FeedbackEnvironment = {
  userAgent: "QA Browser",
  language: "vi",
  secureContext: true,
  webLocks: true,
  viewport: { width: 390, height: 844, pixelRatio: 3 },
  reducedMotion: false,
  jsHeapBytes: null,
  pageLoadMs: null,
}
const ready: SaveSnapshot = {
  status: "ready",
  raw: "PRIVATE_RAW",
  save: {
    gameId: "adventure-world-2",
    environment: "development",
    schemaVersion: 5,
    saveId: "PRIVATE_ID",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    revision: 9,
    progress: newWorldProgress(),
    economy: newEconomy(),
    collection: newCollection(),
  },
}
const input = () => ({
  build,
  environment,
  snapshot: ready,
  notes: "Bước chạm cửa",
  declaredDevice: "iPhone, người chơi tự khai",
  cadence: null,
  now: "2026-10-24T01:00:00Z",
})
describe("Opt-in playtest reports preserve data boundaries", () => {
  it("exports only safe committed progression and capabilities, never save identity/raw/unknown properties", () => {
    const value = input(),
      before = JSON.stringify(value)
    Object.assign(value.environment, {
      token: "PRIVATE_TOKEN",
      url: "PRIVATE_QUERY",
    })
    const report = createPlaytestFeedback(value),
      serialized = JSON.stringify(report)
    for (const secret of [
      "PRIVATE_RAW",
      "PRIVATE_ID",
      "PRIVATE_TOKEN",
      "PRIVATE_QUERY",
      "createdAt",
      "updatedAt",
      "revision",
    ])
      expect(serialized).not.toContain(secret)
    expect(report.committedProgress).toMatchObject({
      schemaVersion: 5,
      questIndex: 0,
      partySize: 0,
      teamExperience: 0,
    })
    expect(report.acceptance).toEqual({
      independentPlaytest: "NOT_REVIEWED",
      physicalDevice: "NOT_VERIFIED",
      milestone: "NOT_AWARDED",
    })
    expect(before).toContain("PRIVATE_RAW")
    expect(ready.raw).toBe("PRIVATE_RAW")
  })
  it.each(["empty", "invalid", "unsupported", "unavailable"] as const)(
    "reports %s saves without parsing, writing or including their bytes",
    (status) => {
      const snapshot =
        status === "empty"
          ? { status, raw: null }
          : status === "unavailable"
            ? { status }
            : { status, raw: "PRIVATE_RAW" }
      const result = createPlaytestFeedback({ ...input(), snapshot })
      expect(result.committedProgress).toEqual({ status })
      expect(JSON.stringify(result)).not.toContain("PRIVATE_RAW")
    },
  )
  it("keeps absent/nonfinite/nonpositive observations null and cannot infer physical phone from userAgent", () => {
    for (const value of [null, NaN, Infinity, 0, -1]) {
      const report = createPlaytestFeedback({
        ...input(),
        environment: {
          ...environment,
          userAgent: "iPhone Safari",
          jsHeapBytes: value,
          pageLoadMs: value,
        },
      })
      expect(report.observations.jsHeapBytes).toBeNull()
      expect(report.observations.pageLoadMs).toBeNull()
      expect(report.acceptance.physicalDevice).toBe("NOT_VERIFIED")
    }
  })
  it("preserves point-in-time detached summaries and limits free text without changing source", () => {
    const value = input(),
      before = JSON.stringify(value)
    const result = createPlaytestFeedback(value)
    result.environment.viewport.width = 999
    result.build.baseGitSha = "changed"
    expect(JSON.stringify(value)).toBe(before)
    const long = createPlaytestFeedback({
      ...value,
      notes: "x".repeat(5000),
      declaredDevice: "y".repeat(200),
    })
    expect(long.notes).toHaveLength(4000)
    expect(long.declaredDevice).toHaveLength(160)
  })
  it("recomputes cadence from measured count/duration rather than trusting caller's advertised FPS", () => {
    const report = createPlaytestFeedback({
      ...input(),
      cadence: { frames: 180, elapsedMs: 3000, rafHz: 999 },
    })
    expect(report.observations.frameCadence).toEqual({
      frames: 180,
      elapsedMs: 3000,
      rafHz: 60,
    })
    const sample = frameCadence(181, 3000.51)!
    expect(frameCadence(sample.frames, sample.elapsedMs)).toEqual(sample)
  })
  it.each([
    [0, 3000],
    [1, 3000],
    [2, 0],
    [2, 999],
    [2, NaN],
    [NaN, 3000],
    [Infinity, 3000],
    [2, Infinity],
  ])(
    "does not invent a valid sample from %s frames/%s milliseconds",
    (frames, elapsedMs) => {
      expect(frameCadence(frames, elapsedMs)).toBeNull()
    },
  )
})
describe("Review fingerprint identifies actual code/assets/config/dependencies", () => {
  const a = { path: "a.ts", bytes: new Uint8Array([1, 2]) },
    b = { path: "b.webp", bytes: new Uint8Array([3]) }
  it("is deterministic across enumeration order and leaves inputs intact", () => {
    const entries = [b, a],
      before = [...entries]
    expect(fingerprintReviewInputs(entries)).toBe(
      fingerprintReviewInputs([a, b]),
    )
    expect(entries).toEqual(before)
  })
  it("changes on changed content/renamed file/changed boundary despite matching concatenated bytes", () => {
    const hash = fingerprintReviewInputs([a, b])
    expect(
      fingerprintReviewInputs([{ ...a, bytes: new Uint8Array([1, 3]) }, b]),
    ).not.toBe(hash)
    expect(fingerprintReviewInputs([{ ...a, path: "renamed.ts" }, b])).not.toBe(
      hash,
    )
    expect(
      fingerprintReviewInputs([
        { ...a, bytes: new Uint8Array([1]) },
        { ...b, bytes: new Uint8Array([2, 3]) },
      ]),
    ).not.toBe(hash)
  })
  it("rejects empty or duplicate inputs instead of publishing an ambiguous build identity", () => {
    expect(() => fingerprintReviewInputs([])).toThrow()
    expect(() => fingerprintReviewInputs([a, a])).toThrow()
  })
})
