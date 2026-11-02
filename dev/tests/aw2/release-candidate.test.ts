import { createHash } from "node:crypto"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ReleaseCandidateDisclosure } from "../../aw2/ReleaseCandidateDisclosure"
import {
  AW2_RELEASE_CANDIDATE_ID,
  CURRENT_RC_PUBLIC_SUMMARY,
  RC_EXTERNAL_GATE_IDS,
  RC_TECHNICAL_GATE_IDS,
  releaseCandidateDecision,
  serializeReleaseCandidateDecision,
} from "@/aw2/release/candidate"
import {
  EXTERNAL_GATE_IDS,
  REQUIRED_PATHS,
  TECHNICAL_GATE_IDS,
  candidateExitCode,
  createReleaseCandidateReport,
} from "../../tools/aw2-release-candidate.mjs"

const allPaths = new Set(Object.values(REQUIRED_PATHS).flat())
const buildSize = {
  bytes: 141_470_404,
  js_gzip: 703_903,
  leaks: [],
  sourcePortable: true,
  deliverySecurity: true,
  offlineShell: { bytes: 1_471_880 },
}

describe("AW2 technical release candidate", () => {
  it("keeps CLI and product gate IDs exactly aligned", () => {
    expect(TECHNICAL_GATE_IDS).toEqual(RC_TECHNICAL_GATE_IDS)
    expect(EXTERNAL_GATE_IDS).toEqual(RC_EXTERNAL_GATE_IDS)
    expect(RC_TECHNICAL_GATE_IDS).toHaveLength(15)
    expect(RC_EXTERNAL_GATE_IDS).toHaveLength(7)
  })

  it("passes the local technical artifact but remains externally blocked", () => {
    const report = createReleaseCandidateReport({
      buildSize,
      presentPaths: allPaths,
    })
    expect(report).toMatchObject({
      id: AW2_RELEASE_CANDIDATE_ID,
      technicalStatus: "PASS",
      overallStatus: "BLOCKED_EXTERNAL",
      releaseAuthorized: false,
      deployAuthorized: false,
      summary: {
        technicalPass: 15,
        technicalTotal: 15,
        externalPass: 0,
        externalTotal: 7,
      },
    })
    expect(report.external.every((gate) => gate.status === "OPEN")).toBe(true)
    expect(candidateExitCode(report)).toBe(0)
    expect(candidateExitCode(report, true)).toBe(2)
  })

  it.each([
    ["negative bytes", { ...buildSize, bytes: -1 }, allPaths],
    ["empty build", { ...buildSize, bytes: 0 }, allPaths],
    ["nonfinite JS", { ...buildSize, js_gzip: Infinity }, allPaths],
    ["artifact bytes", { ...buildSize, bytes: 320_000_001 }, allPaths],
    [
      "offline bytes",
      { ...buildSize, offlineShell: { bytes: 12_000_001 } },
      allPaths,
    ],
    ["JS gzip", { ...buildSize, js_gzip: 710_001 }, allPaths],
    ["leaks", { ...buildSize, leaks: ["secret.env"] }, allPaths],
    [
      "required output",
      buildSize,
      new Set([...allPaths].filter((path) => path !== "dist/sw.js")),
    ],
  ])("fails technical candidate on %s", (_name, changedSize, paths) => {
    const report = createReleaseCandidateReport({
      buildSize: changedSize,
      presentPaths: paths,
    })
    expect(report.technicalStatus).toBe("FAIL")
    expect(report.overallStatus).toBe("TECHNICAL_FAIL")
    expect(candidateExitCode(report)).toBe(1)
  })

  it("authorizes release only after every technical and external gate passes", () => {
    const current = releaseCandidateDecision({
      technicalPass: RC_TECHNICAL_GATE_IDS,
      externalPass: [],
    })
    expect(current.summary).toEqual(CURRENT_RC_PUBLIC_SUMMARY)
    expect(current.summary).toMatchObject({
      overallStatus: "BLOCKED_EXTERNAL",
      releaseAuthorized: false,
    })
    const ready = releaseCandidateDecision({
      technicalPass: RC_TECHNICAL_GATE_IDS,
      externalPass: RC_EXTERNAL_GATE_IDS,
    })
    expect(ready.summary).toMatchObject({
      overallStatus: "READY",
      releaseAuthorized: true,
    })
    expect(() =>
      releaseCandidateDecision({
        technicalPass: ["made-up-gate" as never],
        externalPass: [],
      }),
    ).toThrow()
  })

  it("locks deterministic blocked-candidate serialization", () => {
    expect(
      createHash("sha256")
        .update(serializeReleaseCandidateDecision())
        .digest("hex"),
    ).toBe("32cabfafc9efa8817096c7d3d5157669ea83375c61ce1feae09311382122bc46")
  })

  it("renders technical success without claiming deploy or release", () => {
    const html = renderToStaticMarkup(createElement(ReleaseCandidateDisclosure))
    expect(html).toContain("15/15 PASS")
    expect(html).toContain("0/7 PASS")
    expect(html).toContain("BLOCKED_EXTERNAL")
    expect(html).toContain("không deploy, promote hoặc release")
  })
})
