import { readFileSync } from "node:fs"
import { expect, it } from "vitest"
// @ts-ignore Node source audit CLI also exposes a read-only verifier.
import { auditAw2Media } from "../../tools/aw2-media-sources.mjs"

it("binds every packaged AW2 media file to original hashes/evidence without awarding legal clearance", async () => {
  const report = await auditAw2Media()
  expect(report).toEqual(
    JSON.parse(readFileSync("rights/aw2/all-media-sources.json", "utf8")),
  )
  expect(report.summary).toEqual({
    runtimeFiles: 171,
    registered: 171,
    imageFiles: 119,
    synthesizedAudioFiles: 52,
    technicalStatus: "PASS",
    humanCleared: 0,
  })
  expect(report.issues).toEqual([])
  expect(report.releaseAuthorized).toBe(false)
  for (const record of report.records) {
    expect(record.evidence.length).toBeGreaterThan(1)
    expect(record.commercialRelease).toBe("NOT_CLEARED")
    if (!record.source) expect(record.audioSourceCode.length).toBeGreaterThan(0)
  }
}, 20000)
