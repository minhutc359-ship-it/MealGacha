export const AW2_UAT_CONTRACT_ID = "aw2-uat-v1" as const
export type UatStatus = "PASS" | "FAIL" | "NOT_RUN"

export const UAT_SCENARIOS = [
  { id: "onboarding-new-save", name: "Onboarding và bản lưu mới" },
  { id: "full-journey", name: "Bốn nhiệm vụ, boss, kết thúc và reload" },
  { id: "save-recovery", name: "Save, recovery và stale-tab guard" },
  { id: "pwa-lifecycle", name: "Install, offline đã ghé và update" },
  { id: "keyboard-focus", name: "Keyboard, shortcut và focus" },
  { id: "touch-layout", name: "Touch, portrait, landscape và safe area" },
  {
    id: "accessible-presentation",
    name: "Screen reader, motion, contrast và chữ lớn",
  },
  { id: "chest-isolation", name: "Rương original và route isolation" },
] as const
export type UatScenarioId = typeof UAT_SCENARIOS[number]["id"]

const desktopCore: readonly UatScenarioId[] = [
  "onboarding-new-save",
  "full-journey",
  "save-recovery",
  "pwa-lifecycle",
  "keyboard-focus",
  "accessible-presentation",
  "chest-isolation",
]
const mobileCore: readonly UatScenarioId[] = [
  "onboarding-new-save",
  "full-journey",
  "save-recovery",
  "pwa-lifecycle",
  "touch-layout",
  "accessible-presentation",
  "chest-isolation",
]
const assistiveCore: readonly UatScenarioId[] = [
  "onboarding-new-save",
  "full-journey",
  "keyboard-focus",
  "accessible-presentation",
  "chest-isolation",
]

export const UAT_LANES = [
  {
    id: "desktop-chromium",
    name: "Desktop · Chromium",
    scenarios: desktopCore,
  },
  { id: "desktop-firefox", name: "Desktop · Firefox", scenarios: desktopCore },
  { id: "desktop-safari", name: "Desktop · Safari", scenarios: desktopCore },
  { id: "android-chromium", name: "Android · Chromium", scenarios: mobileCore },
  { id: "ios-safari", name: "iOS · Safari", scenarios: mobileCore },
  { id: "nvda-firefox", name: "NVDA · Firefox", scenarios: assistiveCore },
  {
    id: "voiceover-safari",
    name: "VoiceOver · Safari",
    scenarios: assistiveCore,
  },
] as const
export type UatLaneId = typeof UAT_LANES[number]["id"]

export const UAT_BLOCKER_CODES = [
  "STARTUP",
  "PROGRESSION",
  "SAVE_DATA",
  "OFFLINE_UPDATE",
  "INPUT_FOCUS",
  "LAYOUT_TOUCH",
  "ACCESSIBILITY",
  "PERFORMANCE",
  "CHEST_ISOLATION",
  "OTHER_REPRODUCIBLE",
] as const
export type UatBlockerCode = typeof UAT_BLOCKER_CODES[number]

export const AW2_UAT_PUBLIC_SUMMARY = {
  lanes: UAT_LANES.length,
  scenarios: UAT_SCENARIOS.length,
  pass: 0,
  fail: 0,
  notRun: UAT_LANES.length,
  humanAcceptance: "NOT_RUN" as const,
} as const

export interface UatSession {
  format: typeof AW2_UAT_CONTRACT_ID
  sessionId: string
  laneId: UatLaneId
  runNumber: number
  artifactFingerprint: string
  evidence: {
    independentHuman: boolean
    actualDevice: boolean
    automated: boolean
  }
  outcomes: {
    scenarioId: UatScenarioId
    status: Exclude<UatStatus, "NOT_RUN">
  }[]
  blockers: {
    code: UatBlockerCode
    severity: "critical" | "major" | "minor"
    status: "OPEN" | "RESOLVED"
  }[]
}

export function createUatSessionDraft(
  laneId: UatLaneId,
  artifactFingerprint: string,
) {
  const lane = UAT_LANES.find((candidate) => candidate.id === laneId)
  if (!lane) throw Error("Unknown AW2 UAT lane")
  return {
    format: AW2_UAT_CONTRACT_ID,
    sessionId: "",
    laneId,
    runNumber: 1,
    artifactFingerprint,
    evidence: {
      independentHuman: false,
      actualDevice: false,
      automated: false,
    },
    outcomes: lane.scenarios.map((scenarioId) => ({
      scenarioId,
      status: "NOT_RUN" as const,
    })),
    blockers: [],
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).every((key) => keys.includes(key))

function validateSessionShape(input: unknown): string[] {
  if (!isRecord(input)) return ["UAT session phải là object hữu hạn."]
  const issues: string[] = []
  if (
    !exactKeys(input, [
      "format",
      "sessionId",
      "laneId",
      "runNumber",
      "artifactFingerprint",
      "evidence",
      "outcomes",
      "blockers",
    ])
  )
    issues.push("UAT session có field ngoài allowlist riêng tư.")
  if (
    typeof input.format !== "string" ||
    typeof input.sessionId !== "string" ||
    typeof input.laneId !== "string" ||
    typeof input.runNumber !== "number" ||
    typeof input.artifactFingerprint !== "string" ||
    !isRecord(input.evidence) ||
    !Array.isArray(input.outcomes) ||
    !Array.isArray(input.blockers)
  )
    return [...issues, "UAT session thiếu field có kiểu hợp lệ."]
  if (
    !exactKeys(input.evidence, [
      "independentHuman",
      "actualDevice",
      "automated",
    ]) ||
    Object.values(input.evidence).some((value) => typeof value !== "boolean")
  )
    issues.push("UAT evidence có field ngoài allowlist hoặc sai kiểu.")
  if (
    input.outcomes.some(
      (value) =>
        !isRecord(value) ||
        !exactKeys(value, ["scenarioId", "status"]) ||
        typeof value.scenarioId !== "string" ||
        typeof value.status !== "string",
    )
  )
    issues.push("UAT outcome có field ngoài allowlist hoặc sai kiểu.")
  if (
    input.blockers.some(
      (value) =>
        !isRecord(value) ||
        !exactKeys(value, ["code", "severity", "status"]) ||
        typeof value.code !== "string" ||
        typeof value.severity !== "string" ||
        typeof value.status !== "string",
    )
  )
    issues.push("UAT blocker có field ngoài allowlist hoặc sai kiểu.")
  return issues
}

export function validateUatSession(input: unknown): string[] {
  const shapeIssues = validateSessionShape(input)
  if (shapeIssues.length) return shapeIssues
  const session = input as UatSession
  const issues: string[] = []
  const lane = UAT_LANES.find((candidate) => candidate.id === session.laneId)
  if (session.format !== AW2_UAT_CONTRACT_ID)
    issues.push("UAT format không khớp.")
  if (!/^aw2-uat-[a-z0-9-]{8,64}$/.test(session.sessionId))
    issues.push("UAT session ID không hợp lệ.")
  if (!Number.isSafeInteger(session.runNumber) || session.runNumber < 1)
    issues.push("UAT run number không hợp lệ.")
  if (!/^[a-f0-9]{64}$/.test(session.artifactFingerprint))
    issues.push("UAT artifact fingerprint phải là SHA-256.")
  if (!lane) issues.push("UAT lane không tồn tại.")
  if (
    !session.evidence.independentHuman ||
    !session.evidence.actualDevice ||
    session.evidence.automated
  )
    issues.push(
      "UAT PASS cần independent human trên thiết bị thật, không automation.",
    )
  const actualScenarios = session.outcomes.map((outcome) => outcome.scenarioId)
  if (
    !lane ||
    actualScenarios.length !== lane.scenarios.length ||
    new Set(actualScenarios).size !== actualScenarios.length ||
    actualScenarios.some((id, index) => id !== lane.scenarios[index]) ||
    session.outcomes.some(
      (outcome) => outcome.status !== "PASS" && outcome.status !== "FAIL",
    )
  )
    issues.push(
      "UAT outcomes phải đủ, đúng thứ tự và không trùng scenario của lane.",
    )
  const blockerKeys = session.blockers.map(
    (blocker) => `${blocker.code}:${blocker.severity}`,
  )
  if (
    new Set(blockerKeys).size !== blockerKeys.length ||
    session.blockers.some(
      (blocker) =>
        !UAT_BLOCKER_CODES.includes(blocker.code) ||
        !["critical", "major", "minor"].includes(blocker.severity) ||
        !["OPEN", "RESOLVED"].includes(blocker.status),
    )
  )
    issues.push("UAT blocker code/severity/status không hợp lệ hoặc bị trùng.")
  if (
    session.outcomes.some((outcome) => outcome.status === "FAIL") &&
    !session.blockers.some((blocker) => blocker.status === "OPEN")
  )
    issues.push("UAT outcome FAIL phải có blocker mở.")
  return issues
}

function resultForSession(session: UatSession): Exclude<UatStatus, "NOT_RUN"> {
  return session.outcomes.every((outcome) => outcome.status === "PASS") &&
    session.blockers.every((blocker) => blocker.status === "RESOLVED")
    ? "PASS"
    : "FAIL"
}

/** Invalid evidence never earns a PASS and remains visible in invalidSessions. */
export function uatAcceptanceSnapshot(sessions: readonly UatSession[] = []) {
  const validSessions = sessions.filter(
    (session) => validateUatSession(session).length === 0,
  )
  const invalidSessions = sessions.length - validSessions.length
  const lanes = UAT_LANES.map((lane) => {
    const latest = validSessions
      .filter((session) => session.laneId === lane.id)
      .sort((a, b) => b.runNumber - a.runNumber)[0]
    return {
      id: lane.id,
      name: lane.name,
      requiredScenarios: [...lane.scenarios],
      status: latest ? resultForSession(latest) : "NOT_RUN" as UatStatus,
      sessionId: latest?.sessionId ?? null,
      artifactFingerprint: latest?.artifactFingerprint ?? null,
    }
  })
  const pass = lanes.filter((lane) => lane.status === "PASS").length
  const fail = lanes.filter((lane) => lane.status === "FAIL").length
  const notRun = lanes.filter((lane) => lane.status === "NOT_RUN").length
  const humanAcceptance: UatStatus = fail
    ? "FAIL"
    : pass === lanes.length
      ? "PASS"
      : "NOT_RUN"
  return {
    id: AW2_UAT_CONTRACT_ID,
    lanes,
    summary: {
      lanes: lanes.length,
      scenarios: UAT_SCENARIOS.length,
      pass,
      fail,
      notRun,
      invalidSessions,
      humanAcceptance,
      releaseReady: false,
    },
  }
}

export function serializeUatMatrix() {
  return JSON.stringify({
    id: AW2_UAT_CONTRACT_ID,
    scenarios: UAT_SCENARIOS,
    lanes: UAT_LANES,
    blockerCodes: UAT_BLOCKER_CODES,
  })
}
