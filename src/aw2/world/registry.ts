import { z } from "zod"
import { ZONE_IDS, type ZoneId } from "./ids"
import { canStand, exitApproach, ZONES, zoneById } from "./maps"
import { describeObject } from "./rules"
import type { WorldProgress } from "./model"
import { journeyRoute } from "./journey"
import { roomById, TEA_ROOM } from "./interiorLayout"

const point = z.strictObject({ x: z.number().finite(), y: z.number().finite() })
const id = z.string().regex(/^aw2-[a-z0-9-]+(?::[a-z0-9-]+)*$/)
const registrySchema = z.strictObject({
  version: z.literal(1),
  regions: z.array(z.strictObject({ id, name: z.string().min(1) })).length(1),
  maps: z
    .array(
      z.strictObject({
        id: z.enum(ZONE_IDS),
        regionId: id,
        name: z.string().min(1),
        bounds: z.strictObject({
          width: z.literal(640),
          height: z.literal(384),
        }),
        walls: z.array(
          z.strictObject({
            x: z.number().finite(),
            y: z.number().finite(),
            width: z.number().positive(),
            height: z.number().positive(),
          }),
        ),
        entities: z.array(
          z.strictObject({
            id,
            name: z.string().min(1),
            kind: z.enum([
              "npc",
              "table",
              "memory",
              "hint",
              "puzzle",
              "boss",
              "note",
              "chest",
              "mode",
              "stock",
              "room",
              "field",
            ]),
            position: point,
          }),
        ),
        portals: z.array(
          z.strictObject({
            id,
            name: z.string().min(1),
            position: point,
            activation: z.enum(["interact", "step"]),
            destination: z.enum(ZONE_IDS),
            spawnId: id,
            reversePortalId: id,
          }),
        ),
        spawns: z.array(
          z.strictObject({ id, position: point, sourcePortalId: id }),
        ),
      }),
    )
    .length(6),
})
export type WorldRegistry = z.infer<typeof registrySchema>

/** Validate data only. This registry never grants permission to move or interact. */
export function validateWorldRegistry(input: unknown): WorldRegistry {
  const registry = registrySchema.parse(input)
  const seen = new Set<string>()
  const unique = (value: string) => {
    if (seen.has(value)) throw Error(`Duplicate AW2 registry ID: ${value}`)
    seen.add(value)
  }
  for (const region of registry.regions) {
    if (!region.id.startsWith("aw2-region-"))
      throw Error("Invalid region namespace")
    unique(region.id)
  }
  for (const map of registry.maps) {
    unique(map.id)
    if (!registry.regions.some((r) => r.id === map.regionId))
      throw Error("Missing region")
    for (const wall of map.walls) {
      if (
        wall.x < 0 ||
        wall.y < 0 ||
        wall.x + wall.width > map.bounds.width ||
        wall.y + wall.height > map.bounds.height
      )
        throw Error("Invalid map wall")
    }
    for (const entity of map.entities) {
      unique(entity.id)
      const expectedPrefix =
        entity.kind === "boss"
          ? "aw2-enemy-"
          : ["npc", "memory", "mode"].includes(entity.kind)
            ? "aw2-npc-"
            : entity.kind === "chest"
              ? "aw2-chest-"
              : "aw2-object-"
      if (
        !entity.id.startsWith(expectedPrefix) ||
        !canStand(map.id, entity.position.x, entity.position.y)
      )
        throw Error("Invalid entity namespace/position")
    }
    for (const spawn of map.spawns) {
      unique(spawn.id)
      if (
        !spawn.id.startsWith("aw2-spawn-") ||
        !canStand(map.id, spawn.position.x, spawn.position.y)
      )
        throw Error("Unsafe destination spawn")
    }
    for (const portal of map.portals) unique(portal.id)
  }
  for (const map of registry.maps) {
    for (const portal of map.portals) {
      if (
        !(
          portal.id.startsWith(`${map.id}:exit:`) ||
          portal.id.startsWith("aw2-shortcut-")
        ) ||
        !canStand(map.id, portal.position.x, portal.position.y)
      )
        throw Error("Invalid portal namespace/position")
      const destination = registry.maps.find((m) => m.id === portal.destination)
      const spawn = destination?.spawns.find((s) => s.id === portal.spawnId)
      const reverse = destination?.portals.find(
        (p) => p.id === portal.reversePortalId,
      )
      if (
        !spawn ||
        spawn.sourcePortalId !== portal.id ||
        !reverse ||
        reverse.destination !== map.id ||
        reverse.reversePortalId !== portal.id
      )
        throw Error("Broken portal/spawn/reciprocal link")
    }
    for (const spawn of map.spawns) {
      if (
        !registry.maps.some((source) =>
          source.portals.some(
            (p) =>
              p.id === spawn.sourcePortalId &&
              p.destination === map.id &&
              p.spawnId === spawn.id,
          ),
        )
      )
        throw Error("Orphan spawn")
    }
  }
  return registry
}

/** Detached projection of the existing authored rules; identifiers never replace save IDs. */
export function worldRegistry(): WorldRegistry {
  const spawnId = (portalId: string) =>
    `aw2-spawn-${portalId.replace(/^aw2-/, "").replace(/:/g, "-")}`
  return validateWorldRegistry({
    version: 1,
    regions: [{ id: "aw2-region-lantern-arc", name: "Một chỗ bên bếp" }],
    maps: ZONES.map((zone) => ({
      id: zone.id,
      regionId: "aw2-region-lantern-arc",
      name: zone.name,
      bounds: { width: 640, height: 384 },
      walls: zone.walls.map((w) => ({ ...w })),
      entities: zone.objects
        .filter((o) => o.kind !== "exit")
        .map((o) => ({
          id: o.id,
          name: o.name,
          kind: o.kind,
          position: { x: o.x, y: o.y },
        })),
      portals: zone.objects
        .filter((o) => o.kind === "exit")
        .map((o) => ({
          id: o.id,
          name: o.name,
          position: { x: o.x, y: o.y },
          activation: o.activation ?? "interact",
          destination: o.to,
          spawnId: spawnId(o.id),
          reversePortalId: zoneById(o.to!).objects.find(
            (reverse) =>
              reverse.kind === "exit" &&
              reverse.to === zone.id &&
              !!reverse.requiresCompleted === !!o.requiresCompleted,
          )!.id,
        })),
      spawns: ZONES.flatMap((source) =>
        source.objects
          .filter((o) => o.kind === "exit" && o.to === zone.id)
          .map((o) => ({
            id: spawnId(o.id),
            sourcePortalId: o.id,
            position: { x: o.spawnX, y: o.spawnY ?? 192 },
          })),
      ),
    })),
  })
}

/** UI snapshot: every gate is described by current rules, not copied unlock predicates. */
export function journeyOverview(world: WorldProgress) {
  return worldRegistry().maps.map((map) => ({
    ...map,
    current: map.id === world.zoneId,
    route: journeyRoute(world, map.id),
    connections: map.portals.map((portal) => {
      const object = zoneById(map.id).objects.find((o) => o.id === portal.id)!
      const description = describeObject({ ...world, zoneId: map.id }, object)
      return {
        ...portal,
        open: description.actions.some((a) => a.id === "travel"),
        reason: description.text,
      }
    }),
  }))
}

/** Only a local walking destination. It never crosses a portal or saves the world. */
export function journeyApproach(world: WorldProgress, destination: ZoneId) {
  if (world.interior)
    return {
      x: 48,
      y: 192,
      entityId: roomById(world.interior.roomId).objects[0].id,
    }
  const route = journeyRoute(world, destination)
  if (!route || route.length < 2) return undefined
  const portal = zoneById(world.zoneId).objects.find(
    (o) =>
      o.kind === "exit" &&
      o.to === route[1] &&
      describeObject(world, o).actions.some((a) => a.id === "travel"),
  )!
  return exitApproach(portal)
}
