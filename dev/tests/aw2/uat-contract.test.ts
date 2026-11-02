import { createHash } from "node:crypto"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { UatDisclosure } from "../../aw2/UatDisclosure"
import {
  AW2_UAT_CONTRACT_ID,
  UAT_LANES,
  UAT_SCENARIOS,
  createUatSessionDraft,
  serializeUatMatrix,
  uatAcceptanceSnapshot,
  validateUatSession,
  type UatSession,
} from "@/aw2/review/uat"

const fingerprint = "a".repeat(64)
function passingSession(
  lane: typeof UAT_LANES[number],
  runNumber = 1,
): UatSession {
  return {
    format: AW2_UAT_CONTRACT_ID,
    sessionId: `aw2-uat-${lane.id}-run-${runNumber}`,
    laneId: lane.id,
    runNumber,
    artifactFingerprint: fingerprint,
    evidence: {
      independentHuman: true,
      actualDevice: true,
      automated: false,
    },
    outcomes: lane.scenarios.map((scenarioId) => ({
      scenarioId,
      status: "PASS",
    })),
    blockers: [],
  }
}

describe("AW2 UAT matrix and session evidence", () => {
  it("publishes seven explicit lanes and eight canonical scenarios", () => {
    expect(UAT_LANES.map((lane) => lane.id)).toEqual([
      "desktop-chromium",
      "desktop-firefox",
      "desktop-safari",
      "android-chromium",
      "ios-safari",
      "nvda-firefox",
      "voiceover-safari",
    ])
    expect(UAT_SCENARIOS).toHaveLength(8)
    expect(new Set(UAT_SCENARIOS.map((scenario) => scenario.id)).size).toBe(8)
    expect(UAT_LANES.every((lane) => lane.scenarios.length >= 5)).toBe(true)
  })

  it("starts with every human/device lane honestly NOT_RUN", () => {
    const snapshot = uatAcceptanceSnapshot()
    expect(snapshot.id).toBe(AW2_UAT_CONTRACT_ID)
    expect(snapshot.lanes.every((lane) => lane.status === "NOT_RUN")).toBe(true)
    expect(snapshot.summary).toEqual({
      lanes: 7,
      scenarios: 8,
      pass: 0,
      fail: 0,
      notRun: 7,
      invalidSessions: 0,
      humanAcceptance: "NOT_RUN",
      releaseReady: false,
    })
  })

  it("creates a privacy-bounded NOT_RUN draft for the selected lane", () => {
    const draft = createUatSessionDraft("ios-safari", fingerprint)
    expect(draft.outcomes).toHaveLength(7)
    expect(
      draft.outcomes.every((outcome) => outcome.status === "NOT_RUN"),
    ).toBe(true)
    expect(draft.evidence).toEqual({
      independentHuman: false,
      actualDevice: false,
      automated: false,
    })
    expect(JSON.stringify(draft)).not.toMatch(/raw|url|query|tester|notes/i)
  })

  it("accepts complete independent evidence and still does not award release", () => {
    const sessions = UAT_LANES.map((lane) => passingSession(lane))
    expect(
      sessions.every((session) => !validateUatSession(session).length),
    ).toBe(true)
    const snapshot = uatAcceptanceSnapshot(sessions)
    expect(snapshot.summary).toMatchObject({
      pass: 7,
      fail: 0,
      notRun: 0,
      humanAcceptance: "PASS",
      releaseReady: false,
    })
  })

  it("rejects automation, fake devices, bad fingerprints and incomplete outcomes independently", () => {
    const changed = structuredClone(passingSession(UAT_LANES[0])) as UatSession
    changed.artifactFingerprint = "version-label"
    changed.evidence.independentHuman = false
    changed.evidence.actualDevice = false
    changed.evidence.automated = true
    changed.outcomes.pop()
    expect(validateUatSession(changed)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("fingerprint"),
        expect.stringContaining("independent human"),
        expect.stringContaining("outcomes"),
      ]),
    )
    expect(uatAcceptanceSnapshot([changed]).summary).toMatchObject({
      pass: 0,
      notRun: 7,
      invalidSessions: 1,
      humanAcceptance: "NOT_RUN",
    })
  })

  it("rejects raw save, URL, identity, notes or any other non-allowlisted field", () => {
    const changed = passingSession(UAT_LANES[0]) as UatSession & {
      rawSave?: string
    }
    changed.rawSave = "PRIVATE_RAW"
    expect(validateUatSession(changed)).toContain(
      "UAT session có field ngoài allowlist riêng tư.",
    )
    expect(validateUatSession(null)).toContain(
      "UAT session phải là object hữu hạn.",
    )
  })

  it("marks an observed failure with an open blocker and lets a later clean run supersede it", () => {
    const failed = passingSession(UAT_LANES[0])
    failed.outcomes[1].status = "FAIL"
    failed.blockers.push({
      code: "PROGRESSION",
      severity: "critical",
      status: "OPEN",
    })
    expect(validateUatSession(failed)).toEqual([])
    expect(uatAcceptanceSnapshot([failed]).summary).toMatchObject({
      fail: 1,
      humanAcceptance: "FAIL",
    })
    const fixed = passingSession(UAT_LANES[0], 2)
    expect(uatAcceptanceSnapshot([failed, fixed]).lanes[0].status).toBe("PASS")
  })

  it("requires an open blocker for every finalized failing session", () => {
    const failed = passingSession(UAT_LANES[4])
    failed.outcomes[0].status = "FAIL"
    expect(validateUatSession(failed)).toContain(
      "UAT outcome FAIL phải có blocker mở.",
    )
  })

  it("locks deterministic matrix serialization", () => {
    expect(
      createHash("sha256").update(serializeUatMatrix()).digest("hex"),
    ).toBe("1f29c21f7acb712e6c34b16f8f5da422e82480d61457651c4a8b4b88a6eab13f")
  })

  it("renders the current external acceptance gap in production copy", () => {
    const html = renderToStaticMarkup(createElement(UatDisclosure))
    expect(html).toContain("7 lane")
    expect(html).toContain("8 scenario")
    expect(html).toContain("NOT_RUN")
    expect(html).toContain("browser automation")
    expect(html).toContain("raw save")
  })
})
