import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  symlink,
  cp,
  readFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  auditCharacterSources,
  characterEvidenceFile,
  CHARACTER_ART_UNITS,
} from "../../tools/aw2-character-rights.mjs"
import { SPIRIT_IDS } from "@/aw2/world/ids"
const temporary: string[] = []
afterEach(async () => {
  await Promise.all(
    temporary
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  )
})

describe("AW2 character source/use-right evidence", () => {
  it("audits every real source/runtime/audio without converting that evidence to legal approval", async () => {
    expect(CHARACTER_ART_UNITS.map((unit: string) => `aw2-${unit}`)).toEqual([
      ...SPIRIT_IDS,
    ])
    const report = await auditCharacterSources()
    expect(report.summary).toMatchObject({
      characters: 12,
      sourceVerified: 12,
      runtimeFiles: 126,
      declaredExternalInputCount: 0,
      technicalStatus: "PASS",
      commercialCleared: 0,
    })
    expect(report.issues).toEqual([])
    expect(report.releaseAuthorized).toBe(false)
    expect(report.copyrightExclusivity).toBe("NOT_ASSERTED")
    expect(
      report.records.every(
        (record: any) =>
          record.commercialRelease === "NOT_CLEARED" &&
          record.lineage.every((file: any) =>
            /^[a-f0-9]{64}$/.test(file.sha256),
          ),
      ),
    ).toBe(true)
  })
  it.each([
    "../secrets",
    "/etc/passwd",
    "dev/../outside",
    "dev\\outside",
    "",
    "./local",
  ])("rejects unsafe source location %s", async (path) => {
    await expect(characterEvidenceFile(process.cwd(), path)).rejects.toThrow(
      "Unsafe evidence",
    )
  })
  it("rejects symlink evidence even when the target remains inside the repository", async () => {
    const root = await mkdtemp(join(tmpdir(), "aw2-rights-"))
    temporary.push(root)
    await writeFile(join(root, "source.txt"), "owned source")
    await symlink(join(root, "source.txt"), join(root, "alias.txt"))
    await expect(characterEvidenceFile(root, "alias.txt")).rejects.toThrow(
      "regular file",
    )
  })
  it("detects a damaged runtime or source instead of trusting their provenance labels", async () => {
    const root = await mkdtemp(join(tmpdir(), "aw2-rights-drift-"))
    temporary.push(root)
    for (const path of [
      "rights/aw2",
      "src/aw2/assets/ultimate-art.v1.json",
      "src/aw2/assets/than.base-v1.json",
      "dev/aw2/assets/than",
      "dev/tools",
    ]) {
      await mkdir(join(root, path, ".."), { recursive: true })
      await cp(path, join(root, path), { recursive: true })
    }
    const runtime = join(root, "dev/aw2/assets/than/ultimate-v1/art.webp")
    const extra = join(
      root,
      "dev/aw2/assets/than/ultimate-v1/unregistered.webp",
    )
    await writeFile(extra, "unreviewed import")
    const unregistered = await auditCharacterSources({ root, units: ["than"] })
    expect(unregistered.issues[0].message).toContain(
      "Unregistered character media",
    )
    await rm(extra)
    const original = await readFile(runtime)
    await writeFile(runtime, "damaged WebP")
    const damaged = await auditCharacterSources({ root, units: ["than"] })
    expect(damaged.summary.technicalStatus).toBe("FAIL")
    expect(damaged.issues[0].message).toContain("Runtime hash/size mismatch")
    await writeFile(runtime, original)
    await writeFile(
      join(root, "dev/aw2/assets/than/ultimate-v1/art.png"),
      "changed source",
    )
    const changed = await auditCharacterSources({ root, units: ["than"] })
    expect(changed.summary.sourceVerified).toBe(0)
    expect(changed.issues[0].message).toContain("Source hash mismatch")
    expect(changed.releaseAuthorized).toBe(false)
  })
  it("refuses a provider document that claims blanket release or exclusive copyright", async () => {
    const root = await mkdtemp(join(tmpdir(), "aw2-rights-"))
    temporary.push(root)
    await mkdir(join(root, "rights/aw2"), { recursive: true })
    await writeFile(
      join(root, "rights/aw2/provider-use.json"),
      JSON.stringify({
        id: "aw2-openai-output-use-2026-11-02",
        releaseAuthorized: true,
        copyrightExclusivity: "CLEARED",
      }),
    )
    await expect(auditCharacterSources({ root })).rejects.toThrow(
      "cannot grant",
    )
  })
})
