declare module "virtual:aw2-review-build" {
  const build: {
    version: 1
    mode: "source" | "compiled"
    baseGitSha: string
    sourceDirty: boolean
    codeFingerprint: string
    inputFiles: number
  }
  export default build
}
