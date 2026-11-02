import { newEconomy, QUEST_REWARDS } from "../economy/model"
import { canStandInRoom, ROOMS } from "./interiorLayout"
import { NPC_LIFE_SCHEDULES } from "./npcLife"
import { newWorldProgress } from "./model"
import { questJournal } from "./questJournal"
import { worldRegistry } from "./registry"
import { QUEST_GRANTS, QUEST_IDS, ROSTER, SPIRIT_IDS, ZONE_IDS } from "./ids"

export const CONTENT_ACCEPTANCE_ID = "aw2-content-acceptance-v1" as const
export const HUMAN_CONTENT_ACCEPTANCE_NOT_RUN = "NOT_RUN" as const
export const CONTENT_ACCEPTANCE_PUBLIC_SUMMARY = {
  zones: 6,
  rooms: 6,
  npcs: 8,
  quests: 4,
  spirits: 12,
  reciprocalPortals: 12,
  placeholderHits: 0,
  humanContentAcceptance: HUMAN_CONTENT_ACCEPTANCE_NOT_RUN,
} as const

const PLACEHOLDER = /\b(?:todo|tbd|fixme|placeholder|coming\s+soon)\b/giu
const entityName = (name: string) => name.split(" · ")[0]
const unique = (values: readonly string[]) =>
  new Set(values).size === values.length

export interface ContentAcceptanceSnapshot {
  id: typeof CONTENT_ACCEPTANCE_ID
  zones: {
    id: string
    name: string
  }[]
  rooms: {
    id: string
    name: string
    zoneId: string
    entranceId: string
    exitId: string
    spawnSafe: boolean
  }[]
  npcs: {
    id: string
    name: string
    entityName: string
    entityPresent: boolean
  }[]
  quests: {
    id: string
    title: string
    objective: string
    grantId: string
    reward: {
      xp: number
      rice: number
      herbs: number
      broth: number
    }
  }[]
  spirits: {
    id: string
    name: string
    recipeAffiliation: string
  }[]
  portals: {
    id: string
    from: string
    destination: string
    spawnId: string
    reversePortalId: string
    returnVerified: boolean
  }[]
  reachableZoneIds: string[]
  copy: {
    source: string
    text: string
  }[]
  placeholderHits: {
    source: string
    token: string
  }[]
  summary: {
    zones: number
    rooms: number
    npcs: number
    quests: number
    spirits: number
    reciprocalPortals: number
    reachableZones: number
    placeholderHits: number
    technicalReady: boolean
    humanContentAcceptance: typeof HUMAN_CONTENT_ACCEPTANCE_NOT_RUN
    releaseReady: boolean
  }
}

function reachableZones(
  start: string,
  portals: ContentAcceptanceSnapshot["portals"],
) {
  const seen = new Set([start])
  const queue = [start]
  while (queue.length) {
    const current = queue.shift()!
    for (const portal of portals.filter((item) => item.from === current)) {
      if (seen.has(portal.destination)) continue
      seen.add(portal.destination)
      queue.push(portal.destination)
    }
  }
  return ZONE_IDS.filter((id) => seen.has(id))
}

function scanPlaceholders(copy: ContentAcceptanceSnapshot["copy"]) {
  return copy.flatMap(({ source, text }) =>
    [...text.matchAll(PLACEHOLDER)].map((match) => ({
      source,
      token: match[0].toLocaleLowerCase("en"),
    })),
  )
}

/** Detached, read-only projection. It cannot grant progress or approve narrative. */
export function contentAcceptanceSnapshot(): ContentAcceptanceSnapshot {
  const registry = worldRegistry()
  const roomEntities = ROOMS.flatMap((room) => room.objects)
  const worldEntities = registry.maps.flatMap((map) => map.entities)
  const portals = registry.maps.flatMap((map) =>
    map.portals.map((portal) => {
      const destination = registry.maps.find(
        (candidate) => candidate.id === portal.destination,
      )
      const reverse = destination?.portals.find(
        (candidate) => candidate.id === portal.reversePortalId,
      )
      const spawn = destination?.spawns.find(
        (candidate) => candidate.id === portal.spawnId,
      )
      return {
        id: portal.id,
        from: map.id,
        destination: portal.destination,
        spawnId: portal.spawnId,
        reversePortalId: portal.reversePortalId,
        returnVerified:
          reverse?.destination === map.id &&
          reverse.reversePortalId === portal.id &&
          spawn?.sourcePortalId === portal.id,
      }
    }),
  )
  const zones = registry.maps.map(({ id, name }) => ({ id, name }))
  const rooms = ROOMS.map((room) => ({
    id: room.id,
    name: room.name,
    zoneId: room.zoneId,
    entranceId: room.entrance.id,
    exitId: room.objects[0].id,
    spawnSafe: canStandInRoom(room.id, room.spawn.x, room.spawn.y),
  }))
  const npcs = NPC_LIFE_SCHEDULES.map((schedule) => {
    const entity = [...worldEntities, ...roomEntities].find(
      (candidate) => candidate.id === schedule.entityId,
    )
    return {
      id: schedule.entityId,
      name: schedule.name,
      entityName: entity?.name ?? "",
      entityPresent:
        !!entity && entityName(entity.name) === entityName(schedule.name),
    }
  })
  const journal = questJournal(newWorldProgress(), newEconomy())
  const quests = journal.map((quest, index) => ({
    id: quest.id,
    title: quest.title,
    objective: quest.objective,
    grantId: QUEST_GRANTS[index],
    reward: { ...QUEST_REWARDS[index] },
  }))
  const spirits = ROSTER.map((spirit) => ({
    id: spirit.spiritId,
    name: spirit.displayName,
    recipeAffiliation: spirit.recipeAffiliation,
  }))
  const copy = [
    ...zones.map((item) => ({ source: item.id, text: item.name })),
    ...rooms.map((item) => ({ source: item.id, text: item.name })),
    ...npcs.map((item) => ({ source: item.id, text: item.name })),
    ...quests.flatMap((item) => [
      { source: `${item.id}:title`, text: item.title },
      { source: `${item.id}:objective`, text: item.objective },
    ]),
    ...spirits.flatMap((item) => [
      { source: `${item.id}:name`, text: item.name },
      { source: `${item.id}:recipe`, text: item.recipeAffiliation },
    ]),
    ...registry.maps.flatMap((map) =>
      [...map.entities, ...map.portals].map((item) => ({
        source: item.id,
        text: item.name,
      })),
    ),
    ...ROOMS.flatMap((room) =>
      [room.entrance, ...room.objects].map((item) => ({
        source: item.id,
        text: item.name,
      })),
    ),
  ]
  const placeholderHits = scanPlaceholders(copy)
  const reachableZoneIds = reachableZones(ZONE_IDS[0], portals)
  const technicalReady =
    zones.length === CONTENT_ACCEPTANCE_PUBLIC_SUMMARY.zones &&
    rooms.length === CONTENT_ACCEPTANCE_PUBLIC_SUMMARY.rooms &&
    npcs.length === CONTENT_ACCEPTANCE_PUBLIC_SUMMARY.npcs &&
    npcs.every((npc) => npc.entityPresent) &&
    quests.length === CONTENT_ACCEPTANCE_PUBLIC_SUMMARY.quests &&
    spirits.length === CONTENT_ACCEPTANCE_PUBLIC_SUMMARY.spirits &&
    portals.length === CONTENT_ACCEPTANCE_PUBLIC_SUMMARY.reciprocalPortals &&
    portals.every((portal) => portal.returnVerified) &&
    reachableZoneIds.length === ZONE_IDS.length &&
    rooms.every((room) => room.spawnSafe) &&
    placeholderHits.length === 0
  return {
    id: CONTENT_ACCEPTANCE_ID,
    zones,
    rooms,
    npcs,
    quests,
    spirits,
    portals,
    reachableZoneIds,
    copy,
    placeholderHits,
    summary: {
      zones: zones.length,
      rooms: rooms.length,
      npcs: npcs.length,
      quests: quests.length,
      spirits: spirits.length,
      reciprocalPortals: portals.filter((portal) => portal.returnVerified)
        .length,
      reachableZones: reachableZoneIds.length,
      placeholderHits: placeholderHits.length,
      technicalReady,
      humanContentAcceptance: HUMAN_CONTENT_ACCEPTANCE_NOT_RUN,
      releaseReady: false,
    },
  }
}

export function serializeContentAcceptance(
  snapshot: ContentAcceptanceSnapshot = contentAcceptanceSnapshot(),
) {
  return JSON.stringify(snapshot)
}

export function validateContentAcceptance(
  snapshot: ContentAcceptanceSnapshot = contentAcceptanceSnapshot(),
): string[] {
  const issues: string[] = []
  const exactIds = (
    actual: string[],
    expected: readonly string[],
    label: string,
  ) => {
    if (
      actual.length !== expected.length ||
      !unique(actual) ||
      actual.some((id, index) => id !== expected[index])
    )
      issues.push(`${label} không khớp canon.`)
  }
  if (snapshot.id !== CONTENT_ACCEPTANCE_ID)
    issues.push("Content acceptance ID không khớp.")
  exactIds(
    snapshot.zones.map((item) => item.id),
    ZONE_IDS,
    "Zone",
  )
  exactIds(
    snapshot.rooms.map((item) => item.id),
    ROOMS.map((room) => room.id),
    "Room",
  )
  exactIds(
    snapshot.npcs.map((item) => item.id),
    NPC_LIFE_SCHEDULES.map((item) => item.entityId),
    "NPC",
  )
  exactIds(
    snapshot.quests.map((item) => item.id),
    QUEST_IDS,
    "Quest",
  )
  exactIds(
    snapshot.spirits.map((item) => item.id),
    SPIRIT_IDS,
    "Vị Linh",
  )
  for (const room of snapshot.rooms) {
    if (
      !snapshot.zones.some((zone) => zone.id === room.zoneId) ||
      !room.entranceId ||
      !room.exitId ||
      !room.spawnSafe
    )
      issues.push(`${room.id} thiếu entrance/exit/spawn an toàn.`)
  }
  for (const npc of snapshot.npcs)
    if (
      !npc.entityPresent ||
      entityName(npc.name) !== entityName(npc.entityName)
    )
      issues.push(`${npc.id} không khớp entity NPC.`)
  snapshot.quests.forEach((quest, index) => {
    if (
      !quest.title.trim() ||
      !quest.objective.trim() ||
      quest.grantId !== QUEST_GRANTS[index] ||
      Object.values(quest.reward).some(
        (value) => !Number.isSafeInteger(value) || value < 0,
      )
    )
      issues.push(`${quest.id} thiếu copy/grant/reward hợp lệ.`)
  })
  for (const spirit of snapshot.spirits)
    if (!spirit.name.trim() || !spirit.recipeAffiliation.trim())
      issues.push(`${spirit.id} thiếu identity/recipe canon.`)
  if (!unique(snapshot.portals.map((portal) => portal.id)))
    issues.push("Portal ID bị trùng.")
  for (const portal of snapshot.portals)
    if (
      !portal.returnVerified ||
      !snapshot.zones.some((zone) => zone.id === portal.from) ||
      !snapshot.zones.some((zone) => zone.id === portal.destination) ||
      !portal.spawnId ||
      !portal.reversePortalId
    )
      issues.push(`${portal.id} thiếu reciprocal return route.`)
  exactIds(snapshot.reachableZoneIds, ZONE_IDS, "Reachable zone")
  const placeholderHits = scanPlaceholders(snapshot.copy)
  if (
    placeholderHits.length !== snapshot.placeholderHits.length ||
    placeholderHits.some(
      (hit, index) =>
        hit.source !== snapshot.placeholderHits[index]?.source ||
        hit.token !== snapshot.placeholderHits[index]?.token,
    ) ||
    placeholderHits.length > 0
  )
    issues.push("Player-facing copy còn placeholder hoặc scan bị drift.")
  const expectedSummary = {
    zones: snapshot.zones.length,
    rooms: snapshot.rooms.length,
    npcs: snapshot.npcs.length,
    quests: snapshot.quests.length,
    spirits: snapshot.spirits.length,
    reciprocalPortals: snapshot.portals.filter(
      (portal) => portal.returnVerified,
    ).length,
    reachableZones: snapshot.reachableZoneIds.length,
    placeholderHits: placeholderHits.length,
  }
  for (const [key, value] of Object.entries(expectedSummary))
    if (snapshot.summary[(key as keyof typeof expectedSummary)] !== value)
      issues.push(`Summary ${key} không khớp contract.`)
  if (!snapshot.summary.technicalReady)
    issues.push("Technical content contract chưa PASS.")
  if (
    snapshot.summary.humanContentAcceptance !== HUMAN_CONTENT_ACCEPTANCE_NOT_RUN
  )
    issues.push("Human content acceptance không có evidence hợp lệ.")
  if (snapshot.summary.releaseReady)
    issues.push("Không được nâng release-ready khi human acceptance NOT_RUN.")
  return issues
}
