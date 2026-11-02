export interface Aw2SourceCheckoutReport {
  status: "PASS"
  trackedFiles: number
  criticalFiles: number
  criticalBytes: number
  lfsPointers: 0
  symlinks: 0
}

export declare const AW2_CRITICAL_SOURCE_PREFIXES: readonly string[]
export declare const AW2_CRITICAL_SOURCE_FILES: readonly string[]
export declare function isSafeTrackedPath(value: unknown): boolean
export declare function isAw2CriticalSourcePath(value: string): boolean
export declare function isGitLfsPointer(data: Buffer): boolean
export declare function inspectAw2CriticalFiles(
  root: string,
  trackedFiles: string[],
): Aw2SourceCheckoutReport
export declare function verifyAw2SourceCheckout(
  root?: string,
): Aw2SourceCheckoutReport
