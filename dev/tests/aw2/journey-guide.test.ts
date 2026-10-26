import { describe, expect, it } from "vitest"
import { journeyDirections } from "@/aw2/world/journey"
import {
  newWorldProgress,
  worldProgressSchema,
  type WorldProgress,
} from "@/aw2/world/model"
import {
  MEMORY_IDS,
  STARTER_TEAM,
  ZONE_IDS,
  KITCHEN_BOSS_ID,
  TABLE_NOTE_ID,
} from "@/aw2/world/ids"
import { canStand, zoneById } from "@/aw2/world/maps"
import { clearPath, findWorldPath } from "@/aw2/world/navigation"
import {
  describeObject,
  INTERACT_RANGE,
  nearestObject,
} from "@/aw2/world/rules"

const villageNpc = "aw2-npc-giu-cho",
  an = "aw2-npc-va-den",
  di = "aw2-npc-gac-bep"
const memoryNpcs = ["aw2-npc-nguoi-ban", "aw2-npc-sua-ghe", "aw2-npc-dem-nuoc"]
const stage = (patch: Partial<WorldProgress>): WorldProgress =>
  worldProgressSchema.parse({ ...newWorldProgress(), ...patch })
const intro = { tableRead: true, partyIds: [...STARTER_TEAM] }
const remembered = {
  ...intro,
  memories: [...MEMORY_IDS],
  threadChoice: "return" as const,
}
const opened = { ...remembered, hintRead: true, puzzleStep: 3 }

// Explicit legal rule fixtures. They are not browser-earned checkpoint evidence.
const stages: [string, WorldProgress, string[]][] = [
  ["accept intro", stage({}), [villageNpc]],
  ["read cloth", stage({ accepted: true }), ["aw2-object-village-table"]],
  [
    "receive starters",
    stage({ accepted: true, tableRead: true }),
    [villageNpc],
  ],
  ["accept memories", stage({ ...intro, questIndex: 1 }), [an]],
  ...Array.from({ length: 8 }, (_, mask): [string, WorldProgress, string[]] => [
    `memory subset ${mask}`,
    stage({
      ...intro,
      questIndex: 1,
      accepted: true,
      memories: MEMORY_IDS.filter((_, i) => mask & (1 << i)),
    }),
    mask === 7 ? [an] : memoryNpcs.filter((_, i) => !(mask & (1 << i))),
  ]),
  ["accept hearth", stage({ ...remembered, questIndex: 2 }), [di]],
  [
    "read hint before puzzle",
    stage({ ...remembered, questIndex: 2, accepted: true }),
    ["aw2-object-hearth-hint"],
  ],
  ...[0, 1, 2].map((puzzleStep): [string, WorldProgress, string[]] => [
    `puzzle next step ${puzzleStep}`,
    stage({
      ...remembered,
      questIndex: 2,
      accepted: true,
      hintRead: true,
      puzzleStep,
    }),
    [`aw2-object-steam-${puzzleStep}`],
  ]),
  ["report hearth", stage({ ...opened, questIndex: 2, accepted: true }), [di]],
  ["accept final quest", stage({ ...opened, questIndex: 3 }), [di]],
  [
    "challenge boss",
    stage({ ...opened, questIndex: 3, accepted: true }),
    [KITCHEN_BOSS_ID],
  ],
  [
    "read earned victory note",
    stage({ ...opened, questIndex: 3, accepted: true, bossDefeated: true }),
    [TABLE_NOTE_ID],
  ],
  [
    "return to Ba",
    stage({
      ...opened,
      questIndex: 3,
      accepted: true,
      bossDefeated: true,
      tableNoteRead: true,
    }),
    [villageNpc],
  ],
  ...(["wait", "share"] as const).map(
    (endingChoice): [string, WorldProgress, string[]] => [
      `completed ${endingChoice}`,
      stage({
        ...opened,
        questIndex: 4,
        bossDefeated: true,
        tableNoteRead: true,
        endingChoice,
      }),
      [],
    ],
  ),
]

describe("JOURNEY-GUIDE-01 canonical objective directions", () => {
  it.each(stages)(
    "%s points only to actual available quest interactions",
    (_, progress, expected) => {
      const before = JSON.stringify(progress)
      const directions = journeyDirections(progress)
      expect(directions.map((d) => d.targetId)).toEqual(expected)
      for (const d of directions) {
        const object = zoneById(d.targetZone).objects.find(
          (o) => o.id === d.targetId,
        )!
        expect(
          describeObject({ ...progress, zoneId: d.targetZone }, object).actions
            .length,
        ).toBeGreaterThan(0)
      }
      expect(JSON.stringify(progress)).toBe(before)
    },
  )

  it("every legal stage/zone has an open reciprocal route and collision-safe approach to the correct E target", () => {
    let combinations = 0
    for (const [, progress, expected] of stages)
      for (const zoneId of ZONE_IDS) {
        const parsed = worldProgressSchema.safeParse({ ...progress, zoneId })
        if (!parsed.success) continue
        const current = parsed.data,
          directions = journeyDirections(current)
        expect(directions.map((d) => d.targetId)).toEqual(expected)
        for (const direction of directions) {
          combinations++
          expect(direction.zones[0]).toBe(zoneId)
          expect(direction.zones.at(-1)).toBe(direction.targetZone)
          expect(new Set(direction.zones).size).toBe(direction.zones.length)
          for (let i = 1; i < direction.zones.length; i++) {
            const from = direction.zones[i - 1],
              to = direction.zones[i]
            const exit = zoneById(from).objects.find(
              (o) => o.kind === "exit" && o.to === to,
            )!
            expect(
              describeObject({ ...current, zoneId: from }, exit).actions.map(
                (a) => a.id,
              ),
            ).toContain("travel")
            expect(zoneById(to).objects.some((o) => o.to === from)).toBe(true)
          }
          expect(
            canStand(zoneId, direction.approach.x, direction.approach.y),
          ).toBe(true)
          expect(
            Math.hypot(
              direction.next.x - direction.approach.x,
              direction.next.y - direction.approach.y,
            ),
          ).toBeLessThan(INTERACT_RANGE)
          expect(nearestObject({ ...current, ...direction.approach })?.id).toBe(
            direction.next.id,
          )
          for (const origin of [
            { x: 16, y: 16 },
            { x: 576, y: 192 },
            { x: 320, y: 280 },
            { x: 624, y: 368 },
          ]) {
            const path = findWorldPath(zoneId, origin, direction.approach)
            expect(path.at(-1)).toEqual(direction.approach)
            let previous = origin
            for (const next of path) {
              expect(clearPath(zoneId, previous, next)).toBe(true)
              previous = next
            }
          }
        }
      }
    expect(combinations).toBeGreaterThan(100)
  })

  it("keeps unearned shortcut gates closed even on the final return-to-Ba route", () => {
    const progress = stage({
      ...opened,
      questIndex: 3,
      accepted: true,
      bossDefeated: true,
      tableNoteRead: true,
      zoneId: ZONE_IDS[5],
    })
    const direction = journeyDirections(progress)[0]
    expect(direction.zones).toEqual([...ZONE_IDS].reverse())
    expect(direction.next.id).toBe(`${ZONE_IDS[5]}:exit:west`)
    expect(
      describeObject(
        progress,
        zoneById(ZONE_IDS[5]).objects.find(
          (o) => o.id === "aw2-shortcut-table-yard",
        )!,
      ).actions,
    ).toEqual([])
  })

  it("does not expose or mutate canonical maps/arrays through returned directions", () => {
    const progress = stage({}),
      original = JSON.stringify(zoneById(progress.zoneId))
    const a = journeyDirections(progress)
    a[0].next.name = "changed"
    a[0].approach.x = -1
    a[0].zones.reverse()
    expect(JSON.stringify(zoneById(progress.zoneId))).toBe(original)
    expect(journeyDirections(progress)[0].targetName).toBe("Bà Giữ Chỗ")
    expect(journeyDirections(progress)[0].approach.x).toBe(160)
  })
})
