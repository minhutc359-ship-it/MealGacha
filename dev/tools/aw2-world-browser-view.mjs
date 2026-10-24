/** Tap a world coordinate using the actual rendered view, including village camera. */
export async function tapWorldPoint(page, x, y) {
  const canvas = page.getByTestId("world-map").locator("canvas")
  await canvas.scrollIntoViewIfNeeded()
  let target = await canvas.evaluate(
    (c, p) => {
      const v = c.dataset.worldCamera && JSON.parse(c.dataset.worldCamera)
      return v
        ? { x: (p.x - v.x) * v.zoom + 320, y: (p.y - v.y) * v.zoom + 192 }
        : p
    },
    { x, y },
  )
  if (target.x < 4 || target.x > 636 || target.y < 4 || target.y > 380) {
    await page.getByRole("button", { name: "Toàn cảnh", exact: true }).click()
    await page.waitForFunction(
      () =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .worldCamera,
        ).mode === "overview",
    )
  }
  const point = await canvas.evaluate(
    (c, p) => {
      const v = c.dataset.worldCamera && JSON.parse(c.dataset.worldCamera),
        b = c.getBoundingClientRect()
      const x = v ? (p.x - v.x) * v.zoom + 320 : p.x,
        y = v ? (p.y - v.y) * v.zoom + 192 : p.y
      return { x: b.x + (x / 640) * b.width, y: b.y + (y / 384) * b.height }
    },
    { x, y },
  )
  await page.touchscreen.tap(point.x, point.y)
}
