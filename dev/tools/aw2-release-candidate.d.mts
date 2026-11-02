export interface CandidateBuildSize {
  bytes: number
  js_gzip: number
  leaks: number | unknown[]
  offlineShell?: {
    bytes: number
  }
}

export interface CandidateGate {
  id: string
  status: "PASS" | "FAIL"
  observed: number | null
  limit: number | null
}

export interface CandidateReport {
  id: string
  technicalStatus: "PASS" | "FAIL"
  overallStatus: "BLOCKED_EXTERNAL" | "TECHNICAL_FAIL" | "READY"
  releaseAuthorized: boolean
  deployAuthorized: boolean
  gates: CandidateGate[]
  external: {
    id: string
    status: "OPEN" | "PASS"
  }[]
  summary: {
    technicalPass: number
    technicalTotal: number
    externalPass: number
    externalTotal: number
  }
}

export interface MeasuredCandidateReport extends CandidateReport {
  artifact: {
    sha256: string
    files: number
    bytes: number
    jsGzipBytes: number
    offlineShellBytes: number
  }
}

export declare const AW2_RELEASE_CANDIDATE_ID: string
export declare const TECHNICAL_GATE_IDS: readonly string[]
export declare const EXTERNAL_GATE_IDS: readonly string[]
export declare const REQUIRED_PATHS: Readonly<Record<string, readonly string[]>>
export function createReleaseCandidateReport(input: {
  buildSize: CandidateBuildSize
  presentPaths: ReadonlySet<string>
  failedChecks?: readonly string[]
}): CandidateReport
export function readReleaseCandidateReport(
  root?: string,
): MeasuredCandidateReport
export function candidateExitCode(
  report: CandidateReport,
  requireReady?: boolean,
): number
