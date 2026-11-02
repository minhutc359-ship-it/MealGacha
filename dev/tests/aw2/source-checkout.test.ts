import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  AW2_CRITICAL_SOURCE_FILES,
  AW2_CRITICAL_SOURCE_PREFIXES,
  inspectAw2CriticalFiles,
  isAw2CriticalSourcePath,
  isGitLfsPointer,
  isSafeTrackedPath,
  verifyAw2SourceCheckout,
} from "../../tools/verify-aw2-source-checkout.mjs"

const pointer = Buffer.from(
  "version https://git-lfs.github.com/spec/v1\n" +
    `oid sha256:${"a".repeat(64)}\n` +
    "size 49136\n",
)

function sourceFixture() {
  const root = mkdtempSync(join(tmpdir(), "aw2-source-checkout-"))
  const tracked = [
    ...AW2_CRITICAL_SOURCE_FILES,
    ...AW2_CRITICAL_SOURCE_PREFIXES.map((prefix) => `${prefix}fixture.txt`),
  ]
  for (const path of tracked) {
    const full = join(root, path)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, "real source bytes\n")
  }
  return { root, tracked }
}

describe("AW2 portable source checkout", () => {
  it.each(["", "/absolute", "../escape", "src/../escape", "a\\b"])(
    "rejects unsafe tracked path %j",
    (path) => expect(isSafeTrackedPath(path)).toBe(false),
  )

  it("selects production roots and not unrelated archive paths", () => {
    expect(isAw2CriticalSourcePath("src/aw2/save/schema.ts")).toBe(true)
    expect(isAw2CriticalSourcePath("dev/aw2/assets/than/world.webp")).toBe(true)
    expect(
      isAw2CriticalSourcePath("docs/aw2/evidence/AW2-019B-journal.jpg"),
    ).toBe(true)
    expect(isAw2CriticalSourcePath("dev/archive/legacy.zip")).toBe(false)
  })

  it("recognizes only a complete Git LFS pointer contract", () => {
    expect(isGitLfsPointer(pointer)).toBe(true)
    expect(
      isGitLfsPointer(Buffer.from("version https://git-lfs.github.com")),
    ).toBe(false)
    expect(isGitLfsPointer(Buffer.alloc(2048))).toBe(false)
  })

  it("accepts real files and rejects pointers or symlinks", () => {
    const clean = sourceFixture()
    expect(inspectAw2CriticalFiles(clean.root, clean.tracked)).toMatchObject({
      status: "PASS",
      lfsPointers: 0,
      symlinks: 0,
    })

    const withPointer = sourceFixture()
    const evidence = "docs/aw2/evidence/fixture.txt"
    writeFileSync(join(withPointer.root, evidence), pointer)
    expect(() =>
      inspectAw2CriticalFiles(withPointer.root, withPointer.tracked),
    ).toThrow("Git LFS pointer")

    const withLink = sourceFixture()
    const linked = "src/fixture.txt"
    writeFileSync(join(withLink.root, "outside.txt"), "outside")
    writeFileSync(join(withLink.root, linked), "replace")
    const replacement = `${join(withLink.root, linked)}.link`
    symlinkSync(join(withLink.root, "outside.txt"), replacement)
    const linkTracked = [...withLink.tracked, "src/fixture.txt.link"]
    expect(() => inspectAw2CriticalFiles(withLink.root, linkTracked)).toThrow(
      "symlink",
    )
  })

  it("passes the current tracked checkout with no production pointer", () => {
    expect(verifyAw2SourceCheckout()).toMatchObject({
      status: "PASS",
      lfsPointers: 0,
      symlinks: 0,
    })
  })
})
