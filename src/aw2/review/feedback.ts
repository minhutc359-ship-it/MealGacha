import type { SaveSnapshot } from "../save/schema"

export interface ReviewBuildInfo {
  version: 1
  mode: "source" | "compiled"
  baseGitSha: string
  sourceDirty: boolean
  codeFingerprint: string
  inputFiles: number
}
export interface FrameCadence {
  frames: number
  elapsedMs: number
  rafHz: number
}
export function frameCadence(
  frames: number,
  elapsedMs: number,
): FrameCadence | null {
  if (
    !Number.isInteger(frames) ||
    frames < 2 ||
    !Number.isFinite(elapsedMs) ||
    elapsedMs < 1000
  )
    return null
  const duration = Math.round(elapsedMs)
  return {
    frames,
    elapsedMs: duration,
    rafHz: Math.round((frames * 10000) / duration) / 10,
  }
}
export interface FeedbackEnvironment {
  userAgent: string
  language: string
  secureContext: boolean
  webLocks: boolean
  viewport: { width: number; height: number; pixelRatio: number }
  reducedMotion: boolean
  jsHeapBytes: number | null
  pageLoadMs: number | null
}
const measurement = (n: number | null) =>
  n !== null && Number.isFinite(n) && n > 0 ? Math.round(n) : null

/** Explicit whitelist; never serializes raw saves, identities, legacy data or URLs. */
export function createPlaytestFeedback(input: {
  build: ReviewBuildInfo
  environment: FeedbackEnvironment
  snapshot: SaveSnapshot
  declaredDevice: string
  notes: string
  cadence: FrameCadence | null
  now: string
}) {
  const { snapshot, environment: e, build: b } = input
  return {
    format: "aw2-playtest-feedback-v1",
    capturedAt: input.now,
    build: {
      version: b.version,
      mode: b.mode,
      baseGitSha: b.baseGitSha,
      sourceDirty: b.sourceDirty,
      codeFingerprint: b.codeFingerprint,
      inputFiles: b.inputFiles,
    },
    declaredDevice: input.declaredDevice.trim().slice(0, 160),
    environment: {
      userAgent: e.userAgent.slice(0, 500),
      language: e.language.slice(0, 40),
      secureContext: e.secureContext,
      webLocks: e.webLocks,
      viewport: {
        width: e.viewport.width,
        height: e.viewport.height,
        pixelRatio: e.viewport.pixelRatio,
      },
      reducedMotion: e.reducedMotion,
    },
    observations: {
      pageLoadMs: measurement(e.pageLoadMs),
      jsHeapBytes: measurement(e.jsHeapBytes),
      frameCadence: input.cadence
        ? frameCadence(input.cadence.frames, input.cadence.elapsedMs)
        : null,
      scope:
        "Page load/navigation timing, optional JS heap and visible-page requestAnimationFrame cadence; not cold-load proof, total memory, GPU or game FPS benchmark.",
    },
    committedProgress:
      snapshot.status === "ready"
        ? {
            status: "ready",
            schemaVersion: snapshot.save.schemaVersion,
            zoneId: snapshot.save.progress.zoneId,
            questIndex: snapshot.save.progress.questIndex,
            puzzleStep: snapshot.save.progress.puzzleStep,
            bossDefeated: snapshot.save.progress.bossDefeated,
            endingChoice: snapshot.save.progress.endingChoice,
            partySize: snapshot.save.progress.partyIds.length,
            teamExperience: snapshot.save.economy.teamExperience,
            receiptCount: snapshot.save.economy.receipts.length,
          }
        : { status: snapshot.status },
    notes: input.notes.trim().slice(0, 4000),
    acceptance: {
      independentPlaytest: "NOT_REVIEWED",
      physicalDevice: "NOT_VERIFIED",
      milestone: "NOT_AWARDED",
    },
  }
}
