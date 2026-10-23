import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  TABLE_ROOM_INTERACTIONS as manifest,
  tableRoomInteractionProps,
} from "@/aw2/assets/tableInteractions"
import { zoneById, canStand } from "@/aw2/world/maps"
import { newWorldProgress } from "@/aw2/world/model"
import { TABLE_NOTE_ID, ZONE_IDS } from "@/aw2/world/ids"

describe("WORLD-PROPS-01 authored targets preserve real interaction authority", () => {
  const progress = { ...newWorldProgress(), zoneId: ZONE_IDS[5] }
  it.each(["note", "threshold"] as const)(
    "preserves %s exact sources/runtime/frame/aspect",
    (name) => {
      const asset = manifest.assets[name]
      for (const [path, hash] of [
        [asset.url.slice(1), asset.sha256],
        [asset.source.path, asset.source.sha256],
      ])
        expect(
          createHash("sha256").update(readFileSync(path)).digest("hex"),
        ).toBe(hash)
      expect(readFileSync(asset.url.slice(1)).byteLength).toBe(asset.bytes)
      expect(asset.frame.x).toBeGreaterThanOrEqual(0)
      expect(asset.frame.y).toBeGreaterThanOrEqual(0)
      expect(asset.frame.x + asset.frame.width).toBeLessThanOrEqual(asset.width)
      expect(asset.frame.y + asset.frame.height).toBeLessThanOrEqual(
        asset.height,
      )
      for (const prop of manifest.props.filter((p) => p.asset === name))
        expect(prop.width / prop.height).toBeCloseTo(
          asset.frame.width / asset.frame.height,
          4,
        )
    },
  )
  it("keeps explicit reference/rights status and predeclared byte budgets", () => {
    expect(manifest.fullEnvironmentComplete).toBe(false)
    expect(manifest.provenance.licenseStatus).toBe("REVIEW_REQUIRED")
    expect(manifest.provenance.commercialRelease).toBe("NOT_CLEARED")
    expect(
      Object.values(manifest.assets).reduce((n, a) => n + a.bytes, 0),
    ).toBeLessThanOrEqual(3_000_000)
    expect(
      Object.values(manifest.assets).reduce(
        (n, a) => n + a.width * a.height * 4,
        0,
      ),
    ).toBeLessThanOrEqual(16_000_000)
  })
  it("sources three canonical anchors and flat layer below every traversable actor", () => {
    const props = tableRoomInteractionProps(progress)
    expect(props).toHaveLength(3)
    for (const prop of props) {
      const object = zoneById(progress.zoneId).objects.find(
        (o) => o.id === prop.entityId,
      )!
      expect({ x: prop.x, y: prop.y }).toEqual({ x: object.x, y: object.y })
      expect(canStand(progress.zoneId, prop.x, prop.y)).toBe(true)
      expect(prop.depth).toBeLessThan(16 + 10)
      expect(prop.labelOffsetY).toBeGreaterThanOrEqual(prop.height / 2)
      expect(prop).not.toHaveProperty("action")
      expect(prop).not.toHaveProperty("collision")
    }
    const exits = props.filter((p) => p.asset === "threshold")
    expect(exits).toHaveLength(2)
    expect(new Set(exits.map((p) => p.asset)).size).toBe(1)
    expect(
      tableRoomInteractionProps({ ...progress, zoneId: ZONE_IDS[0] }),
    ).toEqual([])
  })
  it.each([
    {
      bossDefeated: false,
      tableNoteRead: false,
      questIndex: 3 as const,
      note: "locked",
      alpha: 0.55,
      shortcut: 0.4,
    },
    {
      bossDefeated: true,
      tableNoteRead: false,
      questIndex: 3 as const,
      note: "available",
      alpha: 1,
      shortcut: 0.4,
    },
    {
      bossDefeated: true,
      tableNoteRead: true,
      questIndex: 3 as const,
      note: "read",
      alpha: 1,
      shortcut: 0.4,
    },
    {
      bossDefeated: true,
      tableNoteRead: true,
      questIndex: 4 as const,
      note: "read",
      alpha: 1,
      shortcut: 1,
    },
  ])(
    "derives $note/quest$questIndex from live flags without mutations/grants",
    ({ note, alpha, shortcut, ...flags }) => {
      const p = { ...progress, ...flags },
        before = JSON.stringify(p)
      const props = tableRoomInteractionProps(p)
      expect(props.find((p) => p.entityId === TABLE_NOTE_ID)).toMatchObject({
        state: note,
        alpha,
      })
      expect(
        props.find((p) => p.entityId === "aw2-shortcut-table-yard")?.alpha,
      ).toBe(shortcut)
      expect(props.find((p) => p.entityId.endsWith(":exit:west"))?.alpha).toBe(
        1,
      )
      expect(JSON.stringify(p)).toBe(before)
      props[0].alpha = 0
      expect(tableRoomInteractionProps(p)[0].alpha).toBe(alpha)
    },
  )
})
