import { describe, expect, it } from "vitest"
import {
  worldRegistry,
  validateWorldRegistry,
  journeyOverview,
  journeyApproach,
} from "@/aw2/world/registry"
import { ZONES, canStand, zoneById } from "@/aw2/world/maps"
import {
  newWorldProgress,
  worldProgressSchema,
  type WorldProgress,
} from "@/aw2/world/model"
import { ZONE_IDS, STARTER_TEAM, MEMORY_IDS } from "@/aw2/world/ids"
import {
  describeObject,
  applyWorldAction,
  INTERACT_RANGE,
  nearestObject,
} from "@/aw2/world/rules"
import { journeyRoute } from "@/aw2/world/journey"
import { findWorldPath } from "@/aw2/world/navigation"

const intro = { tableRead: true, partyIds: [...STARTER_TEAM] }
const memories = {
  ...intro,
  memories: [...MEMORY_IDS],
  threadChoice: "wait" as const,
}
const states: WorldProgress[] = [
  newWorldProgress(),
  { ...newWorldProgress(), ...intro, questIndex: 1 },
  { ...newWorldProgress(), ...memories, questIndex: 2 },
  { ...newWorldProgress(), ...memories, questIndex: 2, accepted: true },
  {
    ...newWorldProgress(),
    ...memories,
    questIndex: 2,
    accepted: true,
    hintRead: true,
    puzzleStep: 2,
  },
  {
    ...newWorldProgress(),
    ...memories,
    questIndex: 3,
    accepted: true,
    hintRead: true,
    puzzleStep: 3,
  },
  {
    ...newWorldProgress(),
    ...memories,
    questIndex: 4,
    hintRead: true,
    puzzleStep: 3,
    bossDefeated: true,
    tableNoteRead: true,
    endingChoice: "wait",
  },
]

describe("AW2 compatible map registry", () => {
  it("preserves six maps, eight NPCs, entities and explicit reciprocal portals", () => {
    const registry = worldRegistry()
    expect(registry.maps.map((m) => m.id)).toEqual([...ZONE_IDS])
    expect(
      registry.maps
        .flatMap((m) => m.entities)
        .filter((e) => e.id.startsWith("aw2-npc-")),
    ).toHaveLength(8)
    for (const map of registry.maps) {
      const zone = zoneById(map.id)
      expect([...map.entities, ...map.portals].map((o) => o.id).sort()).toEqual(
        zone.objects.map((o) => o.id).sort(),
      )
      for (const portal of map.portals) {
        const object = zone.objects.find((o) => o.id === portal.id)!
        const destination = registry.maps.find(
          (m) => m.id === portal.destination,
        )!
        const spawn = destination.spawns.find((s) => s.id === portal.spawnId)!
        expect(spawn.position).toEqual({ x: object.spawnX, y: 192 })
        expect(
          canStand(destination.id, spawn.position.x, spawn.position.y),
        ).toBe(true)
        expect(portal.activation).toBe("interact")
      }
    }
  })
  it("is detached from authored geometry and from later snapshots", () => {
    const before = JSON.stringify(ZONES),
      a = worldRegistry(),
      b = worldRegistry()
    a.maps[0].entities[0].position.x = 600
    a.maps[0].walls[0].width = 1
    a.maps[0].spawns[0].position.y = 50
    expect(JSON.stringify(ZONES)).toBe(before)
    expect(b).toEqual(worldRegistry())
  })
  const invalid = [
    [
      "duplicate map",
      (r: ReturnType<typeof worldRegistry>) => {
        r.maps[1].id = r.maps[0].id
      },
    ],
    [
      "duplicate entity",
      (r: ReturnType<typeof worldRegistry>) => {
        r.maps[1].entities[0].id = r.maps[0].entities[0].id
      },
    ],
    [
      "foreign namespace",
      (r: ReturnType<typeof worldRegistry>) => {
        r.maps[0].entities[0].id = "legacy-npc-1"
      },
    ],
    [
      "wrong entity namespace",
      (r: ReturnType<typeof worldRegistry>) => {
        r.maps[0].entities.find((entity) => entity.kind === "npc")!.id = "aw2-object-foreign-npc"
      },
    ],
    [
      "missing region",
      (r: ReturnType<typeof worldRegistry>) => {
        r.maps[0].regionId = "aw2-region-missing"
      },
    ],
    [
      "bad reverse",
      (r: ReturnType<typeof worldRegistry>) => {
        r.maps[0].portals[0].reversePortalId = "aw2-portal-missing"
      },
    ],
    [
      "orphan spawn",
      (r: ReturnType<typeof worldRegistry>) => {
        r.maps[0].spawns[0].sourcePortalId = "aw2-portal-missing"
      },
    ],
    [
      "wall spawn",
      (r: ReturnType<typeof worldRegistry>) => {
        r.maps[0].spawns[0].position = { x: 310, y: 325 }
      },
    ],
    [
      "nonfinite point",
      (r: ReturnType<typeof worldRegistry>) => {
        r.maps[0].entities[0].position.x = NaN
      },
    ],
    [
      "out-of-map wall",
      (r: ReturnType<typeof worldRegistry>) => {
        r.maps[0].walls[0].width = 1000
      },
    ],
  ] as const
  it.each(invalid)("rejects %s", (_name, mutate) => {
    const registry = worldRegistry()
    mutate(registry)
    expect(() => validateWorldRegistry(registry)).toThrow()
  })
  it.each(states.map((state, i) => [i, state] as const))(
    "projects actual gate/travel permissions at stage %s",
    (_i, stage) => {
      for (const zone of ZONE_IDS) {
        const state = { ...stage, zoneId: zone },
          before = JSON.stringify(state)
        for (const map of journeyOverview(state)) {
          for (const door of map.connections) {
            const object = zoneById(map.id).objects.find(
              (o) => o.id === door.id,
            )!
            const local = { ...state, zoneId: map.id, x: object.x, y: object.y }
            expect(door.open).toBe(
              describeObject(local, object).actions.some(
                (a) => a.id === "travel",
              ),
            )
            if (door.open && worldProgressSchema.safeParse(local).success) {
              const next = applyWorldAction(local, object.id, "travel").state
              const spawn = worldRegistry()
                .maps.find((m) => m.id === door.destination)!
                .spawns.find((s) => s.id === door.spawnId)!
              expect({ x: next.x, y: next.y }).toEqual(spawn.position)
            }
          }
          const route = journeyRoute(state, map.id),
            approach = journeyApproach(state, map.id)
          expect(map.route).toEqual(route)
          if (approach) {
            expect(canStand(zone, approach.x, approach.y)).toBe(true)
            expect(
              findWorldPath(zone, { x: 96, y: 192 }, approach).length,
            ).toBeGreaterThan(0)
            const object = nearestObject({ ...state, ...approach })!
            expect(object.kind).toBe("exit")
            expect(object.to).toBe(route![1])
            expect(
              Math.hypot(object.x - approach.x, object.y - approach.y),
            ).toBeLessThanOrEqual(INTERACT_RANGE)
          } else expect(!route || route.length === 1).toBe(true)
        }
        expect(JSON.stringify(state)).toBe(before)
      }
    },
  )
  it("keeps a locked route unselectable and opens the two shortcuts only at completion", () => {
    expect(journeyApproach(states[2], ZONE_IDS[3])).toBeUndefined()
    expect(journeyApproach(states[3], ZONE_IDS[5])).toBeUndefined()
    for (const state of states) {
      const shortcuts = journeyOverview(state)
        .flatMap((m) => m.connections)
        .filter((p) => p.id.startsWith("aw2-shortcut-"))
      expect(shortcuts.map((p) => p.open)).toEqual([
        state.questIndex === 4,
        state.questIndex === 4,
      ])
    }
  })
})
