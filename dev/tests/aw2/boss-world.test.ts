import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  FORGOTTEN_HOST_WORLD as manifest,
  worldBossPresentation,
} from "@/aw2/assets/bossWorld"
import { newWorldProgress } from "@/aw2/world/model"
import { KITCHEN_BOSS_ID, ZONE_IDS } from "@/aw2/world/ids"
import { zoneById } from "@/aw2/world/maps"

describe("WORLD-BOSS-01 original idle reference follows existing world truth", () => {
  const progress = { ...newWorldProgress(), zoneId: ZONE_IDS[5] }
  it("binds actual source/runtime/reference/prompt hashes, budgets and incomplete status", () => {
    const asset = manifest.asset
    for (const [path, hash] of [
      [asset.url.slice(1), asset.sha256],
      [asset.source.path, asset.source.sha256],
      [
        manifest.provenance.reference.path,
        manifest.provenance.reference.sha256,
      ],
      [manifest.provenance.prompts.path, manifest.provenance.prompts.sha256],
    ])
      expect(
        createHash("sha256").update(readFileSync(path)).digest("hex"),
      ).toBe(hash)
    expect(asset.bytes).toBe(readFileSync(asset.url.slice(1)).byteLength)
    expect(asset.bytes).toBeLessThanOrEqual(3_000_000)
    expect(asset.width * asset.height * 4).toBeLessThanOrEqual(20_000_000)
    expect(manifest.entityId).toBe(KITCHEN_BOSS_ID)
    expect(manifest.fullEnemyComplete).toBe(false)
    expect(manifest.worldMotionComplete).toBe(false)
    expect(manifest.animationFrames).toBe(0)
    expect(manifest.provenance.licenseStatus).toBe("REVIEW_REQUIRED")
    expect(manifest.provenance.commercialRelease).toBe("NOT_CLEARED")
    expect(manifest).not.toHaveProperty("spiritId")
    expect(manifest).not.toHaveProperty("rarity")
  })
  it.each(["down", "left", "right", "up"] as const)(
    "keeps %s frame and foot anchor in its own safe cell at one common scale",
    (direction) => {
      const frame =
        manifest.frames[
          manifest.directions[direction] as keyof typeof manifest.frames
        ]
      expect(frame.asset).toBe("world")
      expect(frame.x).toBeGreaterThanOrEqual(0)
      expect(frame.y).toBeGreaterThanOrEqual(0)
      expect(frame.x + frame.width).toBeLessThanOrEqual(manifest.asset.width)
      expect(frame.y + frame.height).toBeLessThanOrEqual(manifest.asset.height)
      expect(frame.anchorX).toBeGreaterThan(0)
      expect(frame.anchorX).toBeLessThan(frame.width)
      expect(frame.anchorY).toBeGreaterThan(0)
      expect(frame.anchorY).toBeLessThan(frame.height)
      expect(Math.floor(frame.x / 627)).toBe(
        Math.floor((frame.x + frame.width) / 627),
      )
      expect(Math.floor(frame.y / 627)).toBe(
        Math.floor((frame.y + frame.height) / 627),
      )
      expect(manifest.display.scale * (frame.height - 8)).toBeLessThanOrEqual(
        52,
      )
    },
  )
  it.each([
    [320, 240, "down"],
    [320, 32, "up"],
    [160, 128, "left"],
    [480, 128, "right"],
    [400, 160, "right"],
    [200, 160, "left"],
    [400, 240, "down"],
    [400, 32, "up"],
    [352, 160, "down"],
    [352, 96, "up"],
    [320, 128, "down"],
  ] as const)(
    "faces player at %i,%i as %s without moving boss",
    (x, y, facing) => {
      const pose = worldBossPresentation({ ...progress, x, y })!
      const boss = zoneById(progress.zoneId).objects.find(
        (o) => o.id === KITCHEN_BOSS_ID,
      )!
      expect(pose).toMatchObject({
        facing,
        frame: manifest.directions[facing],
        x: boss.x,
        y: boss.y + 6,
        depth: boss.y + 10,
      })
    },
  )
  it.each([
    { questIndex: 3 as const, bossDefeated: false, alpha: 1 },
    { questIndex: 3 as const, bossDefeated: true, alpha: 0.6 },
    { questIndex: 4 as const, bossDefeated: true, alpha: 1 },
  ])(
    "uses actual victory/ending state $questIndex/$bossDefeated only for alpha",
    ({ alpha, ...flags }) => {
      expect(worldBossPresentation({ ...progress, ...flags })!.alpha).toBe(
        alpha,
      )
    },
  )
  it("returns detached presentation without mutating state/geometry or inventing actions", () => {
    const before = JSON.stringify(progress),
      map = JSON.stringify(zoneById(progress.zoneId))
    const pose = worldBossPresentation(progress)!
    pose.x = 0
    expect(worldBossPresentation(progress)!.x).toBe(320)
    expect(pose).not.toHaveProperty("action")
    expect(JSON.stringify(progress)).toBe(before)
    expect(JSON.stringify(zoneById(progress.zoneId))).toBe(map)
    expect(
      worldBossPresentation({ ...progress, zoneId: ZONE_IDS[0] }),
    ).toBeNull()
  })
})
