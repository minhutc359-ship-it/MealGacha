import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { preview } from "vite"
const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const { chromium } = await import(values.playwright),
  port = 8500,
  root = `http://127.0.0.1:${port}`,
  checks = [],
  errors = []
const server = await preview({
  configFile: "dev/vite.aw2.config.ts",
  preview: { host: "127.0.0.1", port, strictPort: true },
})
let browser
try {
  browser = await chromium.launch({
    executablePath: values.chromium,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  const context = await browser.newContext()
  await context.addInitScript(() => {
    localStorage.setItem("aw2.development.save", "original-aw2")
    localStorage.setItem("foodchest.user.v1", "original-user")
  })
  const page = await context.newPage()
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text())
  })
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })
  for (const id of ["muoi", "nhien", "hai", "lien", "moc", "bach", "van"]) {
    await page.goto(`${root}/dev/aw2/roster.html?spirit=aw2-${id}`)
    const link = page.getByRole("link", {
      name: "Mời nhân vật và lưu đội trong hành trình",
      exact: true,
    })
    await link.waitFor()
    assert.equal(await link.getAttribute("href"), "/dev/aw2/world.html")
    assert.equal(
      await page.locator(`a[href="/dev/aw2/battle.html?team=${id}"]`).count(),
      1,
    )
    checks.push(
      `${id} reference links actual practice and current earned collection`,
    )
  }
  assert.ok(
    await page.evaluate(
      () =>
        localStorage.getItem("aw2.development.save") === "original-aw2" &&
        localStorage.getItem("foodchest.user.v1") === "original-user",
    ),
  )
  checks.push("Reference viewers grant nothing and preserve AW2/stable bytes")
  assert.deepEqual(errors, [])
  checks.push("No reference browser/resource/console errors")
  await mkdir(".asset-work/aw2-007l", { recursive: true })
  await writeFile(
    ".asset-work/aw2-007l/references.json",
    JSON.stringify(
      {
        task: "AW2-007L",
        status: "PASS",
        checks,
        errors,
        engine: browser.version(),
      },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", checks: checks.length }))
} finally {
  await browser?.close()
  await server.close()
}
