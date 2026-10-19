import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { createHash } from "node:crypto"

const script = JSON.parse(readFileSync("dev/content/intro-manga5918.json", "utf8"))
const records = JSON.parse(readFileSync("dev/docs/web-v5918/asset-provenance.json", "utf8"))
assert.equal(script.chapters.length, 4)
assert.equal(records.length, 12)
const paths = new Set()
for (const chapter of script.chapters) {
  const book = JSON.parse(readFileSync(`public/assets/intro-manga5918/${chapter.id}.json`, "utf8"))
  assert.deepEqual(Object.keys(book.editions), ["base"])
  assert.equal(book.editions.base.length, 3)
  for (const [index, page] of book.editions.base.entries()) {
    const original = chapter.pages[index]
    assert.equal(page.id, original.id)
    assert.equal(page.title, original.title)
    assert.deepEqual(page.lines, original.lines.map(([speaker, text]) => ({ speaker, text })))
    assert.equal(page.fullPage, true)
    assert.equal("frame" in page, false)
    assert.equal(paths.has(page.image), false)
    paths.add(page.image)
    const record = records.find(r => r.id === page.id)
    assert(record)
    assert.deepEqual(page.size, [record.width, record.height])
    assert.equal(record.nativeLettering, true)
    assert.equal(record.tool, "built-in Imagegen")
    const bytes = readFileSync(`public${page.image}`)
    assert.equal(bytes.subarray(0, 4).toString(), "RIFF")
    assert.equal(bytes.subarray(8, 12).toString(), "WEBP")
    assert.equal(bytes.length, record.bytes)
    assert.equal(createHash("sha256").update(bytes).digest("hex"), record.sha256)
  }
}
assert.equal(readdirSync("public/assets/intro-manga5918").length, 16)
console.log(JSON.stringify({ chapters: 4, completePages: paths.size, nativeLettering: true, scriptMatches: true }))
