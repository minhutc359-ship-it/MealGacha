export const AW2_RELEASE_CANDIDATE_ID = "aw2-web1-rc-v1" as const

export const RC_TECHNICAL_GATE_IDS = [
  "artifact-size",
  "offline-shell",
  "javascript-gzip",
  "leak-scan",
  "production-entry",
  "offline-worker",
  "web-manifest",
  "aw2-inventory",
  "public-inventory",
  "legal-artifacts",
  "rollback-runbook",
  "build-routing",
] as const
export type RcTechnicalGateId = typeof RC_TECHNICAL_GATE_IDS[number]

export const RC_EXTERNAL_GATE_IDS = [
  "character-full-dod",
  "character-rights",
  "independent-art-audio",
  "human-content-acceptance",
  "human-device-uat",
  "device-performance",
  "owner-release-approval",
] as const
export type RcExternalGateId = typeof RC_EXTERNAL_GATE_IDS[number]
export type RcOverallStatus = "TECHNICAL_FAIL" | "BLOCKED_EXTERNAL" | "READY"

const validPassList = <T extends string,>(
  pass: readonly T[],
  allowed: readonly T[],
  label: string,
) => {
  if (
    new Set(pass).size !== pass.length ||
    pass.some((gate) => !allowed.includes(gate))
  )
    throw Error(`Invalid ${label} gate list`)
}

/** Pure decision only. This function performs no deployment or external write. */
export function releaseCandidateDecision(input: {
  technicalPass: readonly RcTechnicalGateId[]
  externalPass: readonly RcExternalGateId[]
}) {
  validPassList(input.technicalPass, RC_TECHNICAL_GATE_IDS, "technical")
  validPassList(input.externalPass, RC_EXTERNAL_GATE_IDS, "external")
  const technical = RC_TECHNICAL_GATE_IDS.map((id) => ({
    id,
    status: input.technicalPass.includes(id)
      ? "PASS" as const
      : "FAIL" as const,
  }))
  const external = RC_EXTERNAL_GATE_IDS.map((id) => ({
    id,
    status: input.externalPass.includes(id) ? "PASS" as const : "OPEN" as const,
  }))
  const technicalPass = technical.filter(
    (gate) => gate.status === "PASS",
  ).length
  const externalPass = external.filter((gate) => gate.status === "PASS").length
  const overallStatus: RcOverallStatus =
    technicalPass !== technical.length
      ? "TECHNICAL_FAIL"
      : externalPass !== external.length
        ? "BLOCKED_EXTERNAL"
        : "READY"
  return {
    id: AW2_RELEASE_CANDIDATE_ID,
    technical,
    external,
    summary: {
      technicalPass,
      technicalTotal: technical.length,
      externalPass,
      externalTotal: external.length,
      overallStatus,
      releaseAuthorized: overallStatus === "READY",
    },
  }
}

export const CURRENT_RC_PUBLIC_SUMMARY = releaseCandidateDecision({
  technicalPass: RC_TECHNICAL_GATE_IDS,
  externalPass: [],
}).summary

export function serializeReleaseCandidateDecision(
  decision = releaseCandidateDecision({
    technicalPass: RC_TECHNICAL_GATE_IDS,
    externalPass: [],
  }),
) {
  return JSON.stringify(decision)
}
