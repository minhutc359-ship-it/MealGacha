export declare const CHARACTER_ART_UNITS: string[]
export interface CharacterSourceRecord {
  spiritId: string
  displayName: string
  sourceAudit: string
  providerUse: string
  providerUseBasis: string
  declaredExternalInputs: string[]
  lineage: Array<{
    path: string
    sha256: string
  }>
  media: Array<{
    path: string
    bytes: number
    sha256: string
    origin: string
  }>
  copyrightExclusivity: string
  humanLegalReview: string
  commercialRelease: string
}
export interface CharacterSourceAudit {
  id: string
  audioSourceCode: Array<{
    path: string
    sha256: string
  }>
  providerUseBasis: {
    path: string
    sha256: string
  }
  summary: {
    characters: number
    sourceVerified: number
    runtimeFiles: number
    declaredExternalInputCount: number
    technicalStatus: string
    commercialCleared: number
  }
  copyrightExclusivity: string
  humanLegalReview: string
  releaseAuthorized: boolean
  records: CharacterSourceRecord[]
  issues: Array<{
    spiritId: string
    message: string
  }>
}
export declare function characterEvidenceFile(
  root: string,
  path: string,
): Promise<Buffer>
export declare function auditCharacterSources(options?: {
  root?: string
  units?: string[]
}): Promise<CharacterSourceAudit>
