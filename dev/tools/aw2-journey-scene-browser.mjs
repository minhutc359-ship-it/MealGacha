import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { tapWorldPoint } from "./aw2-world-browser-view.mjs"
const names = ["kitchen-pantry", "lantern-street", "forgotten-kitchen-yard"]
const scenes = await Promise.all(
  names.map(async (n) =>
    JSON.parse(
      await readFile(`src/aw2/assets/${n}.environment-v1.json`, "utf8"),
    ),
  ),
)
export function journeySceneChecks({
  page,
  check,
  raw,
  save,
  go,
  interact,
  travel,
  world,
  out,
  flavor,
  setFault,
  requests,
}) {
  const map = () => page.getByTestId("world-map"),
    canvas = () => map().locator("canvas"),
    props = async () =>
      JSON.parse(await canvas().getAttribute("data-interaction-props")),
    writes = () => page.evaluate(() => window.__demoWrites),
    position = () => page.getByTestId("player-position").textContent()
  const ready = async () => {
    await world()
    await page.waitForFunction(() => {
      const c = document.querySelector('[data-testid="world-map"] canvas'),
        p = JSON.parse(localStorage.getItem("aw2.development.save"))?.progress
      return (
        c?.dataset.sceneId ===
          `aw2-environment-${p.zoneId.replace("aw2-zone-", "")}-v1` &&
        !!c.dataset.worldCamera &&
        !!c.dataset.interactionProps
      )
    })
    await map().locator(".aw2-map-loading").waitFor({ state: "hidden" })
  }
  const arrive = async (x, y) =>
    page.waitForFunction(
      ({ x, y }) => {
        const m = document
          .querySelector('[data-testid="player-position"]')
          ?.textContent.match(/Vị trí (\d+), (\d+)/)
        return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
      },
      { x, y },
    )
  const mode = async (m) => {
    await page
      .getByRole("button", {
        name: m === "follow" ? "Bám nhân vật" : "Toàn cảnh",
        exact: true,
      })
      .click()
    await page.waitForFunction(
      (m) =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .worldCamera,
        ).mode === m,
      m,
    )
  }
  const pointState = async (id, state) =>
    page.waitForFunction(
      ({ id, state }) =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .interactionProps,
        ).some((p) => p.entityId === id && p.state === state),
      { id, state },
    )
  async function previewRegion(name) {
    const scene = scenes.find((s) => s.zoneId === `aw2-zone-${name}`)
    assert.ok(scene)
    await ready()
    check(
      `${name}: authored required assets, all canonical props and one committed leader load`,
      (await canvas().getAttribute("data-scene-id")) === scene.id &&
        (await props()).length === scene.props.length &&
        (await canvas().getAttribute("data-party-ids")) ===
          JSON.stringify([(await save()).progress.partyIds[0]]) &&
        Object.values(scene.assets).every((a) => requests.includes(a.url)),
    )
    const before = await raw(),
      count = await writes(),
      first = scene.props.find((p) => p.asset !== "threshold"),
      actual = (await props()).find((p) => p.entityId === first.entityId)
    await page.getByTestId(`room-waypoint-${first.entityId}`).click()
    await arrive(actual.x, actual.y + 32)
    check(
      `${name}: native destination walks to safe approach and restores map focus without actions/writes`,
      (await map().evaluate((e) => e === document.activeElement)) &&
        (await raw()) === before &&
        (await writes()) === count,
    )
    await go(320, 192)
    await mode("follow")
    await go(360, 208)
    await page.waitForFunction(() => {
      const view = JSON.parse(
        document.querySelector('[data-testid="world-map"] canvas').dataset
          .worldCamera,
      )
      return view.mode === "follow" && Math.abs(view.x - 360) <= 1
    })
    check(
      `${name}: real follow tap inversely projects then camera tracks leader`,
      Math.abs(
        JSON.parse(await canvas().getAttribute("data-world-camera")).x - 360,
      ) < 1 && (await raw()) === before,
    )
    await mode("overview")
    const b = await canvas().boundingBox()
    await page.touchscreen.tap(b.x + 8, b.y + 8)
    await page.waitForTimeout(150)
    await arrive(360, 208)
    check(
      `${name}: scenic apron cannot bypass world boundary or commit data`,
      (await raw()) === before && (await writes()) === count,
    )
    await page
      .getByRole("button", { name: "Bám nhân vật", exact: true })
      .focus()
    const pos = await position()
    await page.keyboard.press("e")
    await page.keyboard.press("ArrowRight")
    check(
      `${name}: native camera control owns keyboard and opens no dialogue`,
      (await position()) === pos &&
        !(await page.getByRole("dialog").isVisible()),
    )
    // The low crate does not cover a standing leader behind its north edge.
    // At the right edge the visible sprite overhang intersects it, while collision stays valid.
    await go(364, 320)
    await page.waitForFunction(
      () =>
        +document.querySelector('[data-testid="world-map"] canvas').dataset
          .foregroundAlpha < 1,
    )
    check(
      `${name}: original crate fades using transformed actor bounds`,
      +(await canvas().getAttribute("data-foreground-alpha")) ===
        scene.obstacle.occludedAlpha,
    )
    await page.evaluate(() => {
      window.__journeyRoute = []
      window.__journeyTimer = setInterval(() => {
        const p = JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .partyPositions,
        )[0]
        window.__journeyRoute.push({ x: p.x, y: p.y - 6 })
      }, 16)
    })
    await go(320, 366)
    const route = await page.evaluate(() => {
      clearInterval(window.__journeyTimer)
      return window.__journeyRoute
    })
    check(
      `${name}: touch route detours around unchanged collider without save writes`,
      route.length > 0 &&
        route.every(
          (p) =>
            !(
              p.x + 10 > 288 &&
              p.x - 10 < 352 &&
              p.y + 10 > 304 &&
              p.y - 10 < 352
            ),
        ) &&
        (await raw()) === before &&
        (await writes()) === count,
    )
    if (scene.foliage.length) {
      await go(72, 366)
      await mode("follow")
      await page.waitForFunction(() =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .foliage,
        ).some((p) => p.frame === "willow" && p.alpha === 0.28),
      )
      await page.emulateMedia({ reducedMotion: "no-preference" })
      await page.waitForFunction(
        () =>
          JSON.parse(
            document.querySelector('[data-testid="world-map"] canvas').dataset
              .foliage,
          )[0].x !== -80,
      )
      check(
        `${name}: actual bounded foreground parallax/fade is presentation only`,
        JSON.parse(await canvas().getAttribute("data-foliage")).every(
          (p, i) =>
            Math.abs(p.x - scene.foliage[i].x) <= 12 &&
            Math.abs(p.y - scene.foliage[i].y) <= 8,
        ) && (await raw()) === before,
      )
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.waitForFunction(
        () =>
          JSON.parse(
            document.querySelector('[data-testid="world-map"] canvas').dataset
              .foliage,
          )[0].x === -80,
      )
    }
    await go(320, 192)
    await mode("follow")
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 960 })
      check(
        `${name}: ${width}px native targets/labels fit and do not obscure bodies`,
        await page.evaluate(
          ({ scene }) => {
            const host = document.querySelector('[data-testid="world-map"]'),
              c = host.querySelector("canvas"),
              b = c.getBoundingClientRect(),
              v = JSON.parse(c.dataset.worldCamera),
              p = JSON.parse(c.dataset.interactionProps)
            const overlap = (a, b) =>
              a.left < b.right - 1 &&
              a.right > b.left + 1 &&
              a.top < b.bottom - 1 &&
              a.bottom > b.top + 1
            const shapes = p.map((o) => {
              const spec = scene.props.find((s) => s.entityId === o.entityId),
                left =
                  b.left +
                  (((o.x - o.width * spec.anchorX - v.x) * v.zoom + 320) /
                    640) *
                    b.width,
                top =
                  b.top +
                  (((o.y - o.height * spec.anchorY - v.y) * v.zoom + 192) /
                    384) *
                    b.height
              return {
                left,
                top,
                right: left + ((o.width * v.zoom) / 640) * b.width,
                bottom: top + ((o.height * v.zoom) / 384) * b.height,
              }
            })
            return (
              document.documentElement.scrollWidth <= innerWidth &&
              [
                ...document.querySelectorAll(
                  '.aw2-room-waypoints button,[aria-label="Góc nhìn khu vực"] button',
                ),
              ].every((b) => b.getBoundingClientRect().height >= 44) &&
              [...host.querySelectorAll(".aw2-world-label")].every((l) => {
                if (getComputedStyle(l).visibility === "hidden") return true
                const r = l.getBoundingClientRect()
                return (
                  r.left >= b.left - 1 &&
                  r.right <= b.right + 1 &&
                  r.top >= b.top - 1 &&
                  r.bottom <= b.bottom + 1 &&
                  !shapes.some((s) => overlap(r, s))
                )
              })
            )
          },
          { scene },
        ),
      )
      await map().screenshot({
        path: `${out}/${flavor}-${name}-follow-${width}.png`,
      })
      await mode("overview")
      await map().screenshot({
        path: `${out}/${flavor}-${name}-overview-${width}.png`,
      })
      check(
        `${name}: overview ${width}px hides map labels and preserves native destinations`,
        (await page.evaluate(() =>
          [...document.querySelectorAll(".aw2-world-label")].every(
            (l) => getComputedStyle(l).visibility === "hidden",
          ),
        )) &&
          (await raw()) === before &&
          (await writes()) === count,
      )
      await mode("follow")
    }
    await page.setViewportSize({ width: 1280, height: 1000 })
  }
  return {
    previewRegion,
    pointState,
    initialLazy: async () =>
      check(
        "Remaining three regions keep runtime images lazy before entry",
        !requests.some((p) =>
          /(kitchen-pantry|lantern-street|forgotten-kitchen-yard)\/v1\/.*\.webp$/.test(
            p,
          ),
        ),
      ),
    yardLocked: async () =>
      check(
        "Yard east/shortcut are disabled by real acceptance/completion gates",
        (await page
          .getByTestId(
            "room-waypoint-aw2-zone-forgotten-kitchen-yard:exit:east",
          )
          .isDisabled()) &&
          (await page
            .getByTestId("room-waypoint-aw2-shortcut-yard-table")
            .isDisabled()),
      ),
    failedChest: async () => {
      const before = await raw(),
        count = await writes()
      await page.evaluate(() => (window.__demoBlock = true))
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Mở rương nguyên liệu", exact: true })
        .click()
      await page
        .getByRole("alert")
        .filter({ hasText: "Chưa lưu được AW2." })
        .first()
        .waitFor()
      check(
        "Failed chest write retains exact bytes/receipt/ready sprite and allows explicit retry",
        (await raw()) === before &&
          (await writes()) === count &&
          (await props()).find((p) => p.entityId === "aw2-chest-pantry")
            .state === "ready" &&
          (await page
            .getByRole("dialog")
            .getByRole("button", { name: "Mở rương nguyên liệu", exact: true })
            .isEnabled()),
      )
      await page.evaluate(() => (window.__demoBlock = false))
    },
    afterJourney: async () => {
      // Continue from the legitimately earned ending yard; no fabricated zone/quest flags.
      await ready()
      const checkpointOrigin = {
          raw: await raw(),
          path: "Current fresh native demo after reciprocal ending shortcut; actual yard",
        },
        checkpoints = []
      for (const name of [
        "forgotten-kitchen-yard",
        "lantern-street",
        "kitchen-pantry",
      ]) {
        if (name === "lantern-street") await travel(24, "Phố Đèn Lồng")
        if (name === "kitchen-pantry") {
          await travel(616, "Sân Bếp Bỏ Quên")
          await travel(616, "Phòng Kho")
        }
        await ready()
        const scene = scenes.find((s) => s.zoneId === `aw2-zone-${name}`),
          earned = await raw()
        checkpoints.push({
          zone: scene.zoneId,
          rawSha256: createHash("sha256").update(earned).digest("hex"),
          source: "Native movement/travel from current earned ending",
        })
        for (const asset of [scene.assets.floor, scene.assets.props]) {
          setFault(asset.url)
          await page.route(`**${asset.url}`, (r) =>
            r.fulfill({ status: 404, body: "expected006HJKmissingasset" }),
          )
          await page.reload()
          await map().getByRole("alert").waitFor()
          const count = await writes()
          check(
            `${name}: missing ${asset.id} is error/no fallback/disabled native/exact save`,
            (await canvas().count()) === 0 &&
              (await page
                .locator(".aw2-room-waypoints button")
                .evaluateAll(
                  (bs) => bs.length > 0 && bs.every((b) => b.disabled),
                )) &&
              (await raw()) === earned &&
              (await writes()) === count,
          )
          await page.unroute(`**${asset.url}`)
          await page.reload()
          await ready()
          setFault("")
          check(
            `${name}: recovered ${asset.id} restores scene with exact bytes/no writes`,
            (await canvas().getAttribute("data-scene-id")) === scene.id &&
              (await raw()) === earned &&
              (await writes()) === 0,
          )
        }
      }
      return {
        checkpointOrigin: {
          ...checkpointOrigin,
          rawSha256: createHash("sha256")
            .update(checkpointOrigin.raw)
            .digest("hex"),
        },
        checkpoints,
      }
    },
  }
}
