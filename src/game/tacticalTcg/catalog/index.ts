import { CARDS } from "../../catalog"
import { AUTO_SCHOOLS, AUTO_UNITS, PROFESSIONS } from "../../autochess/catalog"
import { SPIRIT_POOLS, SPIRIT_RARITY } from "../../../domain/spiritSummons"
import type {
  CanonicalSkill,
  CanonicalSpirit,
  CanonicalTrait,
  TacticalCanonicalCatalog,
} from "./types"
export * from "./types"
export const TACTICAL_CATALOG_VERSION = 1
const AW2_SPIRITS = [
  ["aw2-than", "Than", "N", "Tank"],
  ["aw2-lua", "Lửa Nhỏ", "N", "Striker"],
  ["aw2-lam", "Lam Lam", "N", "Healer"],
  ["aw2-moc-non", "Mộc Non", "R", "Support"],
  ["aw2-suong", "Sương Lành", "R", "Mage"],
  ["aw2-muoi", "Muối Đen", "R", "Debuffer"],
  ["aw2-nhien", "Nhiên", "SR", "Striker"],
  ["aw2-hai", "Hải", "SR", "Tank"],
  ["aw2-lien", "Liên", "SR", "Healer"],
  ["aw2-moc", "Mộc", "SSR", "Mage"],
  ["aw2-bach", "Bách", "SSR", "Tank"],
  ["aw2-van", "Vân", "UR", "Hybrid"],
] as const
const CHEF_TO_AW2: Record<string, string> = {
  "chef-nhien": "aw2-nhien",
  "chef-hai": "aw2-hai",
  "chef-lien": "aw2-lien",
  "chef-moc": "aw2-moc",
  "chef-bach": "aw2-bach",
}
const spiritIdFor = (legacyId: string) => {
  const aw2 =
    CHEF_TO_AW2[legacyId] ?? (legacyId.startsWith("aw2-") ? legacyId : null)
  return aw2 ? `spirit:aw2:${aw2.slice(4)}` : `spirit:food:${legacyId}`
}
const pushUnique = (target: string[], values: readonly string[]) => {
  for (const value of values) if (!target.includes(value)) target.push(value)
}
function addSpirit(map: Map<string, CanonicalSpirit>, value: CanonicalSpirit) {
  const current = map.get(value.id)
  if (!current) return void map.set(value.id, value)
  pushUnique(current.aliases, value.aliases)
  pushUnique(current.sources, value.sources)
  pushUnique(current.traits, value.traits)
  pushUnique(current.skills, value.skills)
  pushUnique(current.art, value.art)
  current.rarity ??= value.rarity
  current.role ??= value.role
}
function buildCatalog(): TacticalCanonicalCatalog {
  const spirits = new Map<string, CanonicalSpirit>()
  for (const legacyId of Object.values(SPIRIT_POOLS).flat())
    addSpirit(spirits, {
      id: spiritIdFor(legacyId),
      name: CARDS.find((card) => card.id === legacyId)?.name ?? legacyId,
      rarity: SPIRIT_RARITY[legacyId] ?? null,
      role: null,
      traits: [],
      skills: [],
      art: [],
      aliases: [`chest:${legacyId}`],
      sources: ["chest"],
    })
  for (const unit of AUTO_UNITS)
    addSpirit(spirits, {
      id: spiritIdFor(unit.id),
      name: unit.spirit,
      rarity: SPIRIT_RARITY[unit.id] ?? null,
      role: unit.profession,
      traits: [
        `trait:school:${unit.school}`,
        `trait:profession:${unit.profession}`,
      ],
      skills: [`skill:autochess:${unit.skill}`],
      art: [unit.art],
      aliases: [`autochess:${unit.id}`],
      sources: ["autochess"],
    })
  for (const [legacyId, name, rarity, role] of AW2_SPIRITS)
    addSpirit(spirits, {
      id: spiritIdFor(legacyId),
      name,
      rarity,
      role,
      traits: [`trait:aw2-role:${role.toLowerCase()}`],
      skills: ["basic", "auto", "passive", "ultimate"].map(
        (slot) => `skill:aw2:${legacyId.slice(4)}:${slot}`,
      ),
      art: [
        `aw2-art:${legacyId}:portrait`,
        `aw2-art:${legacyId}:world`,
        `aw2-art:${legacyId}:battle`,
      ],
      aliases: [`aw2:${legacyId}`],
      sources: ["aw2"],
    })
  const cards = CARDS.map((card) => ({
    id: `card:${card.id}`,
    legacyId: card.id,
    name: card.name,
    school: card.school,
    rarity: card.rarity,
    kind: card.kind,
    art: card.art ?? `tcg-art:${card.id}`,
    spiritId: CHEF_TO_AW2[card.id] ? spiritIdFor(card.id) : null,
    aliases: [`tcg:${card.id}`],
  }))
  const traits: CanonicalTrait[] = [
    ...Object.entries(AUTO_SCHOOLS).map(([id, value]) => ({
      id: `trait:school:${id}`,
      name: value.name,
      aliases: [`autochess-school:${id}`],
    })),
    ...Object.entries(PROFESSIONS).map(([id, value]) => ({
      id: `trait:profession:${id}`,
      name: value.name,
      aliases: [`autochess-profession:${id}`],
    })),
  ]
  const skills: CanonicalSkill[] = [
    ...new Map(AUTO_UNITS.map((unit) => [unit.skill, unit.text])).entries(),
  ].map(([id, name]) => ({
    id: `skill:autochess:${id}`,
    name,
    aliases: [`autochess-skill:${id}`],
  }))
  const aliases: Record<string, string> = {}
  for (const entry of [...cards, ...spirits.values(), ...traits, ...skills])
    for (const alias of entry.aliases) aliases[alias] = entry.id
  return {
    schemaVersion: 1,
    cards,
    spirits: [...spirits.values()],
    traits,
    skills,
    aliases,
  }
}
export function validateCanonicalCatalog(catalog: TacticalCanonicalCatalog) {
  const ids = new Set<string>(),
    aliases = new Set<string>()
  for (const entry of [
    ...catalog.cards,
    ...catalog.spirits,
    ...catalog.traits,
    ...catalog.skills,
  ]) {
    if (ids.has(entry.id)) throw Error(`Duplicate canonical id: ${entry.id}`)
    ids.add(entry.id)
    for (const alias of entry.aliases) {
      if (aliases.has(alias)) throw Error(`Duplicate legacy alias: ${alias}`)
      aliases.add(alias)
      if (catalog.aliases[alias] !== entry.id)
        throw Error(`Broken alias: ${alias}`)
    }
  }
  if (catalog.cards.length !== CARDS.length)
    throw Error("Canonical catalog dropped a TCG card")
  return catalog
}
export const TACTICAL_CATALOG = validateCanonicalCatalog(buildCatalog())
export const resolveCanonicalAlias = (source: string, legacyId: string) =>
  TACTICAL_CATALOG.aliases[`${source}:${legacyId}`] ?? null
export const AW2_LEGACY_SPIRIT_IDS = AW2_SPIRITS.map((spirit) => spirit[0])
