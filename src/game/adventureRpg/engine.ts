import { awakeningSkills, awakenedKit, RARITY_POWER, type SpiritSkillDetails } from "./awakening"
import { castAwakened, awakeningDamageFactor, awakeningAttack, awakeningTick } from "./awakeningCombat"
import { SPIRIT_RARITY, SPIRIT_THRESHOLDS } from "../../domain/spiritSummons"
import { spiritKit, reactionName } from "./skills"
import { encounterWaves, dungeonScaling, ENEMY_STYLES, BOSS_SKILLS } from "./enemies"
import { CARD_MAP } from "../catalog"
import { UNIT_MAP } from "../autochess/catalog"
import type { GameSave, School } from "../types"
import { RPG_MAPS, rpgStage } from "./content"
import { nearestRpgOpponent } from "./autoTarget"
import type {
  RpgAction,
  RpgActor,
  RpgBattle,
  RpgEnemy,
  RpgHero,
  RpgResources,
  RpgRole,
  RpgSave,
} from "./types"

export const RPG_TICKS_PER_SECOND = 4
export const RPG_LEVEL_CAP = 50
export const RPG_SKILL_CAP = 10
export const RPG_ROLE_NAMES: Record<RpgRole, string> = {
  guardian: "Giữ tuyến",
  striker: "Đột kích",
  mage: "Pháp vị",
  healer: "Hồi phục",
  trickster: "Khống chế",
}
const STARTERS = [
  "com-tam",
  "banh-mi",
  "pho-bo",
  "banh-cuon",
  "goi-cuon-tom-thit",
]
const ENEMIES: Record<School, string[]> = {
  hearth: ["ink-crab", "rival-ladle"],
  ember: ["char-hound", "rival-flute"],
  grove: ["bamboo-wraith", "silk-moth"],
  tide: ["ink-crab", "rival-flute"],
  sugar: ["silk-moth", "rival-ladle"],
}
export function heroRole(cardId: string): RpgRole {
  const def = UNIT_MAP[cardId],
    card = CARD_MAP[cardId]
  if (def?.skill === "heal" || /^(banh-cuon|goi-cuon|chef-moc)/.test(cardId))
    return "healer"
  if (def?.skill === "shield" || def?.profession === "keeper") return "guardian"
  if (def?.skill === "drain" || card?.school === "sugar") return "trickster"
  if (def?.profession === "traveler") return "striker"
  return card?.school === "hearth"
    ? "guardian"
    : card?.school === "ember"
      ? "striker"
      : "mage"
}
export function heroSkills(hero: RpgHero, details?: SpiritSkillDetails | null) { return awakeningSkills(hero, details) }
export const heroXpNext = (level: number) => 70 + level * 20
export function addHeroXp(hero: RpgHero, amount: number) {
  hero.xp += amount
  while (hero.level < RPG_LEVEL_CAP && hero.xp >= heroXpNext(hero.level)) {
    hero.xp -= heroXpNext(hero.level)
    hero.level++
  }
  if (hero.level === RPG_LEVEL_CAP) hero.xp = 0
}
export function heroStats(hero: RpgHero, awakened = true) {
  const card = CARD_MAP[hero.cardId],
    role = heroRole(hero.cardId)
  const passive = (hero.rank >= 2 ? 1 + hero.skills[3] * 0.025 : 1) * (awakened ? RARITY_POWER[SPIRIT_RARITY[hero.cardId]] ?? 1 : 1)
  return {
    hp: Math.round(
      (300 + hero.level * 34 + (card.health ?? 3) * 10 + hero.gear[1] * 35) *
        (1 + (hero.rank - 1) * 0.09) *
        (role === "guardian" ? 1.4 : 1) *
        passive,
    ),
    attack: Math.round(
      (29 + hero.level * 4 + (card.attack ?? 2) * 2 + hero.gear[0] * 6) *
        (1 + (hero.rank - 1) * 0.08) *
        passive,
    ),
    armor: 8 + hero.gear[1] * 3 + (role === "guardian" ? 20 : 0),
    energy: 25 + hero.gear[2] * 3 + (role === "mage" ? 10 : 0),
  }
}
export const heroPower = (hero: RpgHero) => {
  const s = heroStats(hero)
  return Math.round(
    s.hp / 8 +
      s.attack * 3 +
      s.armor * 2 +
      hero.skills.reduce((a, b) => a + b, 0) * 5,
  )
}
function newHero(
  cardId: string,
  uid = `card:${cardId}`,
  level = 1,
  xp = 0,
): RpgHero {
  return {
    uid,
    cardId,
    level,
    xp,
    rank: 1,
    skills: [1, 1, 1, 1],
    gear: [0, 0, 0],
  }
}
export function newRpgSave(
  game: Pick<GameSave, "adventure" | "cards">,
): RpgSave {
  const old = game.adventure
  const roster = [...(old?.team ?? []), ...(old?.reserve ?? [])].map((m) =>
    newHero(m.cardId, m.uid, m.level, m.xp),
  )
  const have = new Set(roster.map((m) => m.cardId))
  for (const id of STARTERS) {
    if (
      !have.has(id) &&
      CARD_MAP[id]?.kind === "unit" &&
      (STARTERS.includes(id) || game.cards[id] > 0)
    ) {
      roster.push(newHero(id))
      have.add(id)
    }
  }
  const formation = roster
    .filter(
      (hero, index) =>
        roster.findIndex((m) => m.cardId === hero.cardId) === index,
    )
    .slice(0, 5)
    .map((m) => m.uid)
  const stars: Record<string, number> = {}
  // Each old badge preserves its regional victory. It does not pay first-clear loot again.
  for (const badge of old?.badges ?? []) {
    const map = RPG_MAPS.find((m) => m.id === badge)
    if (map)
      for (const previous of RPG_MAPS.slice(0, RPG_MAPS.indexOf(map) + 1))
        for (let i = 1; i <= 6; i++) stars[`${previous.id}-${i}`] = 1
  }
  return {
    version: 1,
    roster,
    formation,
    stars,
    choices: {},
    dungeonClears: {},
    run: null,
    serial: 0,
    resources: {
      coins: old?.coins ?? 80,
      experience: 6,
      books: 6,
      ore: 8,
      essence: 2,
      broth: old?.inventory.potion ?? 3,
      leaves: old?.inventory.revive ?? 1,
      seals: old?.aromaSeals ?? 6,
    },
    legacy: {
      imported: !!old?.started,
      badges: [...(old?.badges ?? [])],
      discoveries: old?.discovered.length ?? 0,
      completed: old?.completed ?? false,
    },
  }
}
export function syncRoster(save: RpgSave, cards: Record<string, number>) {
  const have = new Set(save.roster.map((m) => m.cardId))
  for (const [id, count] of Object.entries(cards))
    if (count >= (SPIRIT_THRESHOLDS[SPIRIT_RARITY[id]] ?? Infinity) && CARD_MAP[id]?.kind === "unit" && !have.has(id)) {
      save.roster.push(newHero(id))
      have.add(id)
    }
}
export function stageUnlocked(save: RpgSave, id: string) {
  const stage = rpgStage(id)
  if (!stage) return false
  if (stage.index > 0) return !!save.stars[`${stage.map.id}-${stage.index}`]
  return (
    stage.mapIndex === 0 || !!save.stars[`${RPG_MAPS[stage.mapIndex - 1].id}-6`]
  )
}
export const dungeonTierCap = (save: RpgSave) =>
  Math.min(3, 1 + RPG_MAPS.filter((map) => save.stars[`${map.id}-6`]).length)
function enemyWaves(
  school: School,
  level: number,
  boss?: {
    id: string
    name: string
  },
  count = 2,
): RpgEnemy[][] {
  return Array.from({ length: count }, (_, w) => {
    const units = Array.from({ length: 2 + (level >= 10 ? 1 : 0) }, (_, i) => ({
      uid: `e:${w}:${i}`,
      id: ENEMIES[school][(i + w) % 2],
      name: "Bóng Sương",
      school,
      level: Math.max(1, level - (count - w - 1)),
      boss: false,
    }))
    if (boss && w === count - 1)
      units.push({
        uid: `e:${w}:boss`,
        id: boss.id,
        name: boss.name,
        school,
        level,
        boss: true,
      })
    return units
  })
}
export function createRpgBattle(
  save: RpgSave,
  waves: RpgEnemy[][],
  id: string,
  carried?: Record<string, {
    hp: number
    energy: number
  }>,
  bonus = 0,
  rulesVersion: RpgBattle["rulesVersion"] | null = 530,
): RpgBattle {
  const actors: RpgActor[] = save.formation.map((uid, slot) => {
    const hero = save.roster.find((m) => m.uid === uid)!,
      stats = heroStats(hero, rulesVersion === 530)
    return {
      uid,
      id: hero.cardId,
      name: CARD_MAP[hero.cardId].name,
      side: "ally",
      slot,
      school: CARD_MAP[hero.cardId].school,
      role: heroRole(hero.cardId),
      level: hero.level,
      rank: hero.rank,
      skills: [...hero.skills],
      ...(hero.path ? {path: hero.path} : {}),
      hp: carried?.[uid]?.hp ?? stats.hp,
      maxHp: stats.hp,
      attack: Math.round(stats.attack * (1 + bonus)),
      armor: stats.armor,
      energy: carried?.[uid]?.energy ?? stats.energy,
      shield: 0,
      burn: 0,
      weaken: 0,
      stun: 0,
      nextAttack: 3 + slot,
      nextSkill: 12 + slot * 2,
      nextSupport: 26 + slot * 2,
      boss: false,
      phase: 0,
      motion: "idle",
      motionAt: 0,
    }
  })
  // New battles opt in; snapshots saved by 5.0 retain their original rules.
  const schools = actors.map(a => a.school)
  const diverse = new Set(schools).size >= 3
  for (const a of actors) {
    if (!rulesVersion) continue
    if (diverse && !carried) a.energy = Math.min(100, a.energy + 10)
    if (schools.filter(s => s === a.school).length >= 3) a.armor += 12
  }
  const battle: RpgBattle = {
    rulesVersion: rulesVersion ?? undefined,
    ...(rulesVersion === 530 ? {cinematics: save.cinematics !== false} : {}),
    id,
    tick: 0,
    wave: 0,
    waves,
    actors,
    events: [],
    serial: 0,
    result: null,
    settled: false,
    stars: 0,
    paused: false,
    auto: false,
    speed: 1,
    guardUntil: 0,
    guardReady: 0,
    guardRow: "front",
    warning: null,
    reward: null,
  }
  loadEnemies(battle)
  return battle
}
function loadEnemies(b: RpgBattle) {
  b.actors = b.actors.filter((a) => a.side === "ally")
  b.warning = null
  if (b.rulesVersion === 530) for (const a of b.actors) if (a.traits) a.traits.rescue = 0
  for (const [slot, e] of b.waves[b.wave].entries()) {
    const modern = (b.rulesVersion ?? 0) >= 520
    const hp = modern
      ? Math.round((510 + e.level * 87) * (e.boss ? 12 : e.elite ? 1.65 : 1) * (e.style === "bulwark" ? 1.2 : 1) * (e.strength ?? 1)) * (e.difficultyMultiplier ?? 1)
      : Math.round((140 + e.level * 22) * (e.boss ? 6.8 : 1))
    b.actors.push({
      uid: e.uid,
      id: e.id,
      name: e.name,
      side: "enemy",
      slot,
      school: e.school,
      role: e.boss ? "mage" : "striker",
      level: e.level,
      rank: 1,
      skills: [1, 1, 1, 1],
      hp,
      maxHp: hp,
      attack: modern ? Math.round((16 + e.level * 2.8) * (e.boss ? 1.9 : e.elite ? 1.25 : 1) * Math.sqrt(e.strength ?? 1)) * (e.difficultyMultiplier ?? 1) : Math.round((15 + e.level * 2.5) * (e.boss ? 1.7 : 1)),
      armor: (modern ? e.boss ? 26 : e.style === "bulwark" ? 22 : e.elite ? 14 : 7 : e.boss ? 18 : 5) * (e.difficultyMultiplier ?? 1),
      energy: b.rulesVersion === 530 ? e.boss ? 80 : 60 : 0,
      shield: 0,
      burn: 0,
      weaken: 0,
      stun: 0,
      nextAttack: b.tick + 6 + slot * 2,
      nextSkill: b.tick + (e.boss ? 8 : modern ? 24 + slot * 5 : 36),
      nextSupport: 0,
      boss: e.boss,
      ...(e.style ? {style: e.style} : {}),
      ...(e.elite ? {elite: true} : {}),
      phase: 0,
      motion: "idle",
      motionAt: b.tick,
    })
  }
}
const alive = (b: RpgBattle, side: RpgActor["side"]) =>
  b.actors.filter((a) => a.side === side && a.hp > 0)
const opposing = (a: RpgActor) => (a.side === "ally" ? "enemy" : "ally")
const rowOf = (a: RpgActor) => (a.slot < 2 ? "front" : "back")
function event(
  b: RpgBattle,
  a: RpgActor,
  kind: RpgBattle["events"][number]["kind"],
  targets: RpgActor[],
  value: number,
  text: string,
) {
  b.events.push({
    serial: ++b.serial,
    tick: b.tick,
    kind,
    source: a.uid,
    targets: targets.map((t) => t.uid),
    value: Math.round(value),
    text,
    school: a.school,
  })
  b.events = b.events.slice(-24)
}
function damage(b: RpgBattle, a: RpgActor, target: RpgActor, power: number, attack = false) {
  const beats: Record<School, School> = {
    ember: "grove",
    grove: "tide",
    tide: "ember",
    hearth: "sugar",
    sugar: "hearth",
  }
  let amount = Math.round(
    (a.attack *
      power *
      (b.rulesVersion === 530 ? awakeningDamageFactor(b,a,target,attack) : 1) *
      (a.weaken ? 0.72 : 1) *
      (beats[a.school] === target.school ? 1.18 : 1)) /
      (1 + target.armor * (b.rulesVersion === 530 && target.traits?.fracture ? .65 : 1) / 100),
  )
  if (
    a.side === "enemy" &&
    b.tick < b.guardUntil &&
    rowOf(target) === b.guardRow
  )
    amount = Math.round(amount * 0.35)
  if (b.rulesVersion === 530 && attack && target.side === "ally" && target.rank >= 2 && awakenedKit(target.id).passive === 7 && b.tick >= (target.traits?.vigilReady ?? 0)) {
    target.traits ??= {}; target.traits.vigilReady = b.tick + 48;
    shield(b,target,[target],target.maxHp * .06,"Hộ ước")
  }
  const previouslyAlive = target.hp > 0
  const absorbed = Math.min(target.shield, amount)
  target.shield -= absorbed
  target.hp = Math.max(0, target.hp - amount + absorbed)
  target.energy = Math.min(100, target.energy + 5)
  target.motion = target.hp ? "hit" : "fall"
  target.motionAt = b.tick
  event(b, a, "hit", [target], amount - absorbed, `${a.name} → ${target.name}`)
  if (attack) b.events[b.events.length - 1].animation = "attack"
  if (b.rulesVersion === 530 && previouslyAlive && !target.hp && a.side === "ally" && a.rank >= 2 && awakenedKit(a.id).passive === 6) a.energy = Math.min(100,a.energy + 10)
  if (b.rulesVersion === 530 && attack) awakeningAttack(b,a,target,{damage,heal,shield,event})
}
function heal(
  b: RpgBattle,
  a: RpgActor,
  targets: RpgActor[],
  fraction: number,
  text: string,
) {
  let total = 0
  const values: Record<string, number> = {}
  for (const t of targets) {
    const gain = Math.min(t.maxHp - t.hp, Math.round(t.maxHp * fraction * ((b.rulesVersion ?? 0) >= 520 && t.wither ? .5 : 1)))
    values[t.uid] = gain
    t.hp += gain
    if (b.rulesVersion !== 530) t.burn = 0
    total += gain
  }
  event(b, a, "heal", targets, total, text)
  if (((b.rulesVersion ?? 0) >= 510)) b.events[b.events.length-1].values = values
}
function shield(
  b: RpgBattle,
  a: RpgActor,
  targets: RpgActor[],
  amount: number,
  text: string,
) {
  const values: Record<string, number> = {}
  for (const t of targets) {
    const before = t.shield
    t.shield = Math.min(t.maxHp, t.shield + Math.round(amount))
    values[t.uid] = t.shield - before
  }
  event(b, a, "shield", targets, amount, text)
  if (((b.rulesVersion ?? 0) >= 510)) b.events[b.events.length-1].values = values
}
function targetFor(b: RpgBattle, a: RpgActor, back = false) {
  const enemies = alive(b, opposing(a)).sort((x, y) => x.slot - y.slot)
  const taunt = b.rulesVersion === 530 && a.side === "enemy" ? enemies.find(t=>t.traits?.taunt) : undefined
  const focus = a.side === "ally" && ((b.rulesVersion ?? 0) >= 510) ? enemies.find(e => e.uid === b.focus) : undefined
  return (
    taunt ?? focus ?? (a.side === "ally" && b.rulesVersion === 530 ? nearestRpgOpponent(a, enemies) : undefined) ?? (back ? enemies.find((t) => rowOf(t) === "back") : enemies[0]) ?? enemies[0]
  )
}
function cast(b: RpgBattle, a: RpgActor, burst: boolean, support = false) {
  if (b.rulesVersion === 530 && a.side === "ally") {
    castAwakened(b, a, burst, support, {damage, heal, shield, event});
    if (b.warning && !b.actors.some(t=>t.uid===b.warning!.source && t.hp>0)) b.warning=null
    if (b.focus && !b.actors.some(t=>t.uid===b.focus && t.hp>0)) b.focus=null
    return
  }
  if (((b.rulesVersion ?? 0) >= 510) && a.side === "ally") {castSpirit(b, a, burst, support); return}
  const friends = alive(b, a.side),
    enemies = alive(b, opposing(a)),
    target = targetFor(b, a, a.role === "trickster")
  if (!target) return
  const level = a.skills[burst ? 2 : support ? 1 : 0],
    boost = 1 + (level - 1) * 0.09
  a.motion = "cast"
  a.motionAt = b.tick
  const kit = a.side === "ally" ? spiritKit(a.id, a.role) : null
  const name = kit ? burst ? kit.burst : support ? ["Mái bếp chung","Than hồng","Mùa xanh","Dòng hồi ức","Mộng ngọt"][kit.school] : `${kit.primary} · ${CARD_MAP[a.id].name}` : "Sương phản kích"
  event(b, a, burst ? "burst" : "skill", [target], 0, name)
  if (burst) {
    a.energy = 0
    if (a.role === "healer") {
      heal(b, a, friends, 0.34 * boost, name)
      for (const f of friends) {
        f.stun = 0
        f.weaken = 0
      }
    } else if (a.role === "guardian") {
      shield(b, a, friends, a.maxHp * 0.27 * boost, name)
      for (const e of enemies) damage(b, a, e, 1.8 * boost)
    } else if (a.role === "mage")
      for (const e of enemies) damage(b, a, e, 3.2 * boost)
    else if (a.role === "trickster") {
      damage(b, a, target, 3.5 * boost)
      for (const e of enemies) e.stun = Math.max(e.stun, 6)
    } else {
      const weak = [...enemies].sort((x, y) => x.hp - y.hp)[0]
      damage(b, a, weak, 5 * boost * (weak.burn ? 1.25 : 1))
    }
  } else if (support) {
    if (a.school === "hearth")
      shield(
        b,
        a,
        friends.filter((f) => f.slot < 2),
        a.maxHp * 0.15 * boost,
        name,
      )
    if (a.school === "ember") {
      damage(b, a, target, boost)
      target.burn = 20
    }
    if (a.school === "tide")
      for (const f of friends)
        f.energy = Math.min(100, f.energy + Math.round(14 * boost))
    if (a.school === "grove") heal(b, a, friends, 0.1 * boost, name)
    if (a.school === "sugar") for (const e of enemies) e.weaken = 20
  } else if (a.role === "healer") {
    const weak = [...friends].sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]
    heal(b, a, [weak], 0.25 * boost, name)
  } else if (a.role === "guardian") {
    const weak = [...friends].sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]
    shield(b, a, [...new Set([a, weak])], a.maxHp * 0.18 * boost, name)
    damage(b, a, target, 1.3 * boost)
  } else if (a.role === "mage") {
    for (const e of enemies.filter((e) => e.slot < 2))
      damage(b, a, e, 1.6 * boost)
  } else {
    damage(b, a, target, 2.1 * boost)
    if (a.role === "trickster") {
      target.weaken = 16
      target.stun = 4
    }
    if (a.school === "ember") target.burn = 16
  }
  if (!burst) a.energy = Math.min(100, a.energy + 12)
}
function castSpirit(b: RpgBattle, a: RpgActor, burst: boolean, support: boolean) {
 const friends = alive(b, a.side), enemies = alive(b, opposing(a))
 const target = targetFor(b, a, a.role === "trickster")
 if (!target) return
 const weak = [...friends].sort((x,y) => x.hp/x.maxHp-y.hp/y.maxHp)[0]
 const kit = spiritKit(a.id, a.role)
 let boost = 1 + (a.skills[burst ? 2 : support ? 1 : 0] - 1) * .09
 if (burst) {
  const chain = b.chain
  const count = chain && chain.until >= b.tick && chain.source !== a.uid ? Math.min(3, chain.count + 1) : 1
  b.chain = {source: a.uid, until: b.tick + 12, count}
  boost *= 1 + (count - 1) * .15
  a.energy = 0
 }
 const damageBoost = boost * (kit.variant === 1 ? 1.15 : kit.variant === 2 ? .9 : 1) * (burst && a.path === "assault" ? 1.2 : burst && a.path === "support" ? .85 : 1)
 const care = boost * (kit.variant === 2 ? 1.15 : kit.variant === 1 ? .9 : 1) * (burst && a.path === "support" ? 1.5 : burst && a.path === "assault" ? .85 : 1)
 const name = support ? ["Mái bếp chung", "Than hồng", "Mùa xanh", "Dòng hồi ức", "Mộng ngọt"][kit.school] : burst ? kit.burst : kit.primary
 if (kit.variant === 1 && burst) target.shield = Math.floor(target.shield * .7)
 a.motion = "cast"; a.motionAt = b.tick
 event(b, a, burst ? "burst" : "skill", a.role === "healer" ? burst ? friends : [weak] : a.role === "guardian" ? burst ? friends : [a] : [target], 0, name)
 const cue = b.events[b.events.length - 1]
 cue.animation = burst ? "ultimate" : support ? "support" : "primary"
 if (support) {
  if (a.school === "hearth") shield(b,a,friends.filter(f=>f.slot<2),a.maxHp*.15*care,name)
  if (a.school === "grove") heal(b,a,friends,.1*care,name)
  if (a.school === "tide") for (const f of friends) f.energy = Math.min(100,f.energy+Math.round(14*boost))
  if (a.school === "sugar") for (const e of enemies) e.weaken=20
  if (a.school === "ember") {damage(b,a,target,damageBoost);target.burn=20}
 } else if (a.role === "healer") {
  if (burst && (b.rulesVersion ?? 0) >= 520) for (const f of friends) f.wither = 0
  heal(b,a,burst ? friends : [weak],(burst ? .34 : .25)*care,name)
  if (burst) for (const f of friends) {f.stun=0;f.weaken=0}
 } else if (a.role === "guardian") {
  shield(b,a,burst ? friends : [...new Set([a,weak])],a.maxHp*(burst ? .27 : .18)*care,name)
  for (const e of burst ? enemies : [target]) damage(b,a,e,(burst ? 1.8 : 1.3)*damageBoost)
 } else if (a.role === "mage") {
  // Each element changes the target pattern as well as its secondary effect.
  const targets = burst ? enemies : a.school === "tide" ? enemies.filter(e=>e.slot<2) : a.school === "sugar" ? enemies.filter(e=>e.slot>=2).slice(0,2) : [target]
  for (const e of targets.length ? targets : [target]) damage(b,a,e,(burst ? 3.2 : a.school === "tide" ? 1.6 : 2.4)*damageBoost)
 } else if (a.role === "trickster") {
  damage(b,a,target,(burst ? 3.5 : 2.1)*damageBoost)
  for (const e of burst ? enemies : [target]) {e.stun=burst ? 6 : 4;e.weaken=16}
 } else {
  const victim = burst && !enemies.some(e=>e.uid===b.focus) ? [...enemies].sort((x,y)=>x.hp-y.hp)[0] : target
  damage(b,a,victim,(burst ? 5*(victim.burn ? 1.25 : 1) : 2.1)*damageBoost)
 }
 if (kit.variant === 2 && !support) for (const f of friends.filter(f=>f.uid!==a.uid)) {
  f.energy = Math.min(100,f.energy+6)
  if (burst && f.nextSkill > b.tick) f.nextSkill = Math.max(b.tick+1,f.nextSkill-8)
 }
 if (!support) {
  if (a.school === "hearth") shield(b,a,[weak],weak.maxHp*.12*care,name)
  if (a.school === "ember") target.burn=16
  if (a.school === "grove") heal(b,a,[weak],.08*care,name)
  if (a.school === "tide") for (const f of friends.filter(f=>f.uid!==a.uid)) f.energy=Math.min(100,f.energy+8)
  if (a.school === "sugar") target.weaken=16
 }
 if (target.hp > 0) {
  const reaction = target.mark && target.mark.until >= b.tick ? reactionName(target.mark.school,a.school) : null
  if (reaction) {
   delete target.mark
   if (reaction === "Bốc hơi") damage(b,a,target,.8)
   if (reaction === "Nở rộ") {target.burn=20;target.weaken=20}
   if (reaction === "Sinh trưởng") heal(b,a,friends,.1,reaction)
   if (reaction === "Mộng ấm") for (const f of friends) shield(b,a,[f],f.maxHp*.12,reaction)
   event(b,a,"reaction",[target],0,reaction)
  } else target.mark={school:a.school,until:b.tick+20}
 }
 if (!burst) a.energy=Math.min(100,a.energy+12)
 // Presentation follows the actual recipients, including AoE and support effects.
 const recipients = b.events.filter(e => e.serial > cue.serial && e.source === a.uid && ["hit", "heal", "shield"].includes(e.kind)).flatMap(e => e.targets)
 cue.targets = [...new Set(recipients.length ? recipients : support ? a.school === "sugar" ? enemies.map(e=>e.uid) : friends.map(f=>f.uid) : cue.targets)]
}

function enemySkill(b: RpgBattle, a: RpgActor, row: "front" | "back") {
  const friends = alive(b, "enemy"), foes = alive(b, "ally")
  let targets = foes.filter(t => rowOf(t) === row)
  if (!targets.length) targets = foes
  if (!targets.length) return
  a.motion = "cast"; a.motionAt = b.tick
  const name = a.boss ? BOSS_SKILLS[a.id]?.name ?? "Sương quét tuyến" : ENEMY_STYLES[a.style ?? "raider"].skill
  event(b, a, a.boss ? "boss" : "skill", targets, 0, name)
  const cue = b.events[b.events.length - 1]; cue.animation = "enemy"
  if (a.boss) {
    if (a.id === "v4-tide-lock" && a.phase) targets = foes
    for (const t of targets) {
      if (a.id === "char-hound" && a.phase) t.shield = Math.round(t.shield * .75)
      damage(b, a, t, 2.5 + a.phase * .45)
      if (a.id === "char-hound") t.burn = 20
      if (a.id === "bamboo-wraith") {t.stun = 4; t.wither = 16}
      if (["v4-tide-lock", "boss-lotus"].includes(a.id)) { t.energy = Math.max(0, t.energy - 25); t.weaken = 12; if(a.id === "boss-lotus")t.wither=20 }
    }
    if (a.id === "boss-drum") shield(b, a, friends, a.maxHp * .035, name)
    if (a.id === "bamboo-wraith") heal(b, a, [a], .045, name)
    if (a.id === "boss-lotus") { heal(b, a, friends, .07, name); shield(b, a, friends.filter(f=>!f.boss), a.attack * 1.5, name) }
    if (a.id === "boss-blue-root") { heal(b, a, [a], .05, name); shield(b, a, friends, a.maxHp * .025, name) }
    if (a.id === "boss-mirror-sugar") { const fragile = [...foes].sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0]; if(fragile){damage(b,a,fragile,1.15);fragile.energy=Math.max(0,fragile.energy-20)}; shield(b,a,[a],a.maxHp*.04,name) }
    if (a.id === "boss-char-clock") { for(const t of targets){t.burn=20;t.weaken=16;if(a.phase)damage(b,a,t,.75)} }
    if (a.id === "boss-last-banquet") { for(const t of targets){t.wither=20;t.weaken=16};shield(b,a,friends,a.maxHp*.025,name) }
  } else if (a.style === "bulwark") {
    const weak = [...friends].sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0]
    shield(b,a,[...new Set([a,weak])],a.maxHp * .13,name)
  } else if (a.style === "mender") {
    heal(b,a,[...friends].sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp).slice(0,2),.1,name)
  } else {
    for (const t of targets.slice(0, a.style === "hexer" ? 3 : 2)) {
      damage(b,a,t,a.style === "hexer" ? 1.4 : 1.8)
      if (a.style === "hexer") { t.energy = Math.max(0,t.energy-18); t.weaken=16; t.wither=12 }
      else t.burn = 12
    }
  }
  if (b.difficulty && b.difficulty !== "normal" && (a.elite || a.boss)) {
    const extreme = b.difficulty === "extreme"
    for(const t of targets) { t.energy = Math.max(0,t.energy-(extreme?16:8)); if(extreme)t.weaken=Math.max(t.weaken,12) }
    if(extreme && a.boss && a.phase) shield(b,a,[a],a.maxHp*.025,"Phản ấn cực hạn")
  }
  cue.targets = [...new Set(b.events.filter(e=>e.serial>cue.serial && e.source===a.uid && ["hit","heal","shield"].includes(e.kind)).flatMap(e=>e.targets))]
}

function checkResult(b: RpgBattle) {
  if (((b.rulesVersion ?? 0) >= 510) && b.focus && !alive(b,"enemy").some(a=>a.uid===b.focus)) b.focus = null
  if (b.warning && !b.actors.some(a => a.uid === b.warning!.source && a.hp > 0)) b.warning = null
  if (!alive(b, "ally").length || b.tick >= 720) {
    b.result = "loss"
    b.warning = null
    return
  }
  if (!alive(b, "enemy").length) {
    if (b.wave < b.waves.length - 1) {
      b.wave++
      loadEnemies(b)
      const a = alive(b, "ally")[0]
      event(b, a, "wave", [], b.wave + 1, `Đợt ${b.wave + 1}`)
    } else {
      b.result = "win"
      b.warning = null
      const team = b.actors.filter((a) => a.side === "ally"),
        survivors = team.filter((a) => a.hp > 0)
      b.stars =
        1 +
        Number(survivors.length === team.length) +
        Number(survivors.length === team.length && b.tick <= 360)
      for (const a of survivors) {
        a.motion = "victory"
        a.motionAt = b.tick
      }
    }
  }
}
export function advanceRpgBattle(current: RpgBattle, steps = 1): RpgBattle {
  if (current.result || current.paused || current.cinematic) return current
  const b = structuredClone(current)
  for (
    let step = 0;
    step < Math.max(1, Math.min(8, Math.floor(steps)));
    step++
  ) {
    if (b.result || b.cinematic) break
    const waveAtStepStart = b.wave
    b.tick++
    if (b.warning && b.tick >= b.warning.until) {
      const boss = b.actors.find((a) => a.uid === b.warning!.source)
      if (boss?.hp && !boss.stun && (b.rulesVersion ?? 0) >= 520) {
        if (b.rulesVersion !== 530 || boss.energy >= (boss.boss ? 80 : 60)) { enemySkill(b, boss, b.warning.row); if(b.rulesVersion===530)boss.energy=Math.max(0,boss.energy-(boss.boss?80:60)) }
      }
      else if (boss?.hp && !boss.stun) {
        let targets = alive(b, "ally").filter(
          (a) => rowOf(a) === b.warning!.row,
        )
        if (!targets.length) targets = alive(b, "ally")
        for (const t of targets) damage(b, boss, t, 2.7 + boss.phase * 0.6)
        if (boss.id === "char-hound") for (const t of targets) t.burn = 20
        if (boss.id === "bamboo-wraith") for (const t of targets) t.stun = 4
        if (boss.id === "v4-tide-lock")
          for (const t of targets) t.energy = Math.max(0, t.energy - 30)
        if (boss.id === "boss-drum")
          boss.shield = Math.min(
            boss.maxHp,
            boss.shield + Math.round(boss.maxHp * 0.08),
          )
        event(
          b,
          boss,
          "boss",
          targets,
          0,
          boss.phase ? "Sóng ký ức cuồng nộ" : "Sương quét tuyến",
        )
      }
      b.warning = null
    }
    const turnOrder = [...b.actors]
    for (const a of turnOrder) {
      if (a.hp <= 0 || b.result) continue
      if (a.burn && b.tick % 4 === 0) {
        a.hp = Math.max(0, a.hp - Math.max(3, Math.round(a.maxHp * 0.012)))
        if (!a.hp) {
          a.motion = "fall"
          a.motionAt = b.tick
        }
      }
      a.burn = Math.max(0, a.burn - 1)
      a.weaken = Math.max(0, a.weaken - 1)
      a.stun = Math.max(0, a.stun - 1)
      if ((b.rulesVersion ?? 0) >= 520 && a.wither) a.wither = Math.max(0,a.wither-1)
      if (b.rulesVersion === 530) { awakeningTick(b,a,{damage,heal,shield,event}); if(a.side==="enemy")a.energy=Math.min(100,a.energy+1) }
      if (!a.hp || a.stun) continue
      if (a.side === "enemy" && a.boss) {
        if (a.hp <= a.maxHp / 2 && !a.phase) {
          a.phase = 1
          a.attack = Math.round(a.attack * 1.18)
          event(b, a, "boss", [], 0, "Boss chuyển pha · Nhắm tuyến sau")
        }
        if (b.tick >= a.nextSkill && !b.warning && (b.rulesVersion!==530 || a.energy>=80)) {
          b.warning = {
            until: b.tick + 8,
            source: a.uid,
            row: a.phase ? "back" : "front",
            ...((b.rulesVersion ?? 0) >= 520 ? {skill: BOSS_SKILLS[a.id]?.name ?? "Sương quét tuyến"} : {}),
          }
          a.nextSkill = b.tick + ((b.rulesVersion ?? 0) >= 520 ? a.phase ? 40 : 48 : 40)
          a.motion = "cast"
          a.motionAt = b.tick
          event(
            b,
            a,
            "boss",
            [],
            0,
            `Boss chuẩn bị đánh tuyến ${a.phase ? "sau" : "trước"}`,
          )
        }
      }
      if ((b.rulesVersion ?? 0) >= 520 && a.side === "enemy" && !a.boss && b.tick >= a.nextSkill && (b.rulesVersion!==530 || a.energy>=60)) {
        const row = a.style === "raider" || a.style === "hexer" ? "back" : "front"
        if (a.elite && !b.warning) {
          b.warning = {until: b.tick + 8, source: a.uid, row, skill: ENEMY_STYLES[a.style ?? "raider"].skill}
          a.motion = "cast"; a.motionAt = b.tick
        } else if (!a.elite) {enemySkill(b, a, row);if(b.rulesVersion===530)a.energy=Math.max(0,a.energy-60)}
        else continue
        a.nextSkill = b.tick + 44
      } else if (a.side === "ally" && b.auto && a.energy >= 100) cast(b, a, true)
      else if (a.side === "ally" && a.level >= 5 && b.tick >= a.nextSupport) {
        cast(b, a, false, true)
        if (b.rulesVersion !== 530) a.nextSupport = b.tick + 36
      } else if (a.side === "ally" && b.tick >= a.nextSkill) {
        cast(b, a, false)
        if (b.rulesVersion !== 530) a.nextSkill = b.tick + 28
      } else if (b.tick >= a.nextAttack && !((b.rulesVersion ?? 0) >= 520 && b.warning?.source === a.uid)) {
        const target = targetFor(b, a)
        if (target) {
          damage(b, a, target, 1, true)
          a.motion = a.hp > 0 ? "attack" : "fall"
          a.motionAt = b.tick
          a.energy = Math.min(100, a.energy + 10)
          a.nextAttack = b.tick + ((b.rulesVersion ?? 0) >= 520 && a.side === "enemy" ? 10 : Math.max(3, (a.role === "striker" ? 7 : 9) - (b.rulesVersion === 530 && a.traits?.haste ? 2 : 0)))
        }
      }
      // A completed wave must not load new enemies in the middle of this turn order.
      if (b.cinematic || !alive(b, "ally").length || !alive(b, "enemy").length) break
    }
    if (!b.cinematic) checkResult(b)
    // Stop a batched ×2/slow-tab advance at the wave boundary so the
    // next wave cannot act behind its entrance ceremony.
    if (b.wave !== waveAtStepStart) break
  }
  return b
}
export function upgradeCost(
  hero: RpgHero,
  type: "skill" | "gear" | "rank",
  index = 0,
): Partial<RpgResources> {
  if (type === "skill")
    return {
      coins: 18 + hero.skills[index] * 12,
      books: 1 + Math.floor(hero.skills[index] / 3),
    }
  if (type === "gear")
    return {
      coins: 25 + hero.gear[index] * 15,
      ore: 2 + hero.gear[index],
      ...(hero.gear[index] >= 5 ? { essence: 1 } : {}),
    }
  return { coins: 80 * hero.rank, ore: 6 * hero.rank, essence: 2 * hero.rank }
}
function spend(save: RpgSave, cost: Partial<RpgResources>) {
  if (
    Object.entries(cost).some(
      ([key, amount]) => save.resources[(key as keyof RpgResources)] < amount,
    )
  )
    return false
  for (const [key, amount] of Object.entries(cost))
    save.resources[(key as keyof RpgResources)] -= amount
  return true
}
function reward(save: RpgSave, loot: Partial<RpgResources>) {
  for (const [key, value] of Object.entries(loot))
    save.resources[(key as keyof RpgResources)] = Math.min(
      1_000_000_000,
      save.resources[(key as keyof RpgResources)] + value,
    )
}
export function reduceRpg(
  current: RpgSave | undefined,
  action: RpgAction,
  game: Pick<GameSave, "adventure" | "cards">,
): {
  save: RpgSave
  error?: string
  changed?: boolean
} {
  const save = current ? structuredClone(current) : newRpgSave(game)
  if (action.type === "sync" && action.cards) syncRoster(save, action.cards)
  const error = (message: string) => ({
    save: current ?? save,
    error: message,
    changed: false,
  })
  const run = save.run,
    b = run?.battle
  if (
    [
      "formation",
      "path",
      "train",
      "skill",
      "gear",
      "rank",
      "start",
      "dungeon",
    ].includes(action.type) &&
    run
  )
    return error(
      "Kết thúc hoặc rút khỏi chuyến đi trước khi đổi đội và nâng cấp.",
    )
  if (action.type === "cinematics") {
    save.cinematics = save.cinematics === false
    if (b?.rulesVersion === 530) { b.cinematics = save.cinematics; if (!save.cinematics) { delete b.cinematic; checkResult(b) } }
  } else if (action.type === "cinematicDone") {
    if (!b?.cinematic || b.cinematic.serial !== action.serial) return {save: current ?? save, changed: false}
    delete b.cinematic
    checkResult(b)
  } else if (action.type === "path") {
    const hero = save.roster.find(h=>h.uid===action.uid)
    if (!hero || hero.level < 10 || !["assault", "support"].includes(action.path)) return error("Hướng tuyệt kỹ mở ở cấp 10.")
    hero.path = action.path
  } else if (action.type === "formation") {
    const heroes = action.uids.map((uid) =>
      save.roster.find((m) => m.uid === uid),
    )
    if (
      !heroes.length ||
      heroes.length > 5 ||
      heroes.some((m) => !m) ||
      new Set(heroes.map((m) => m!.cardId)).size !== heroes.length
    )
      return error("Chọn 1–5 Vị Linh khác nhau trong bộ sưu tập.")
    save.formation = [...action.uids]
  } else if (["train", "skill", "gear", "rank"].includes(action.type)) {
    if (!("uid" in action)) return error("Thiếu nhân vật.")
    const hero = save.roster.find((m) => m.uid === action.uid)
    if (!hero) return error("Không tìm thấy Vị Linh.")
    if (action.type === "train") {
      if (hero.level >= RPG_LEVEL_CAP) return error("Đã đạt cấp 50.")
      if (!spend(save, { experience: 1 }))
        return error("Cần Sổ kinh nghiệm: farm Kho Bếp Ấm.")
      addHeroXp(hero, 180)
    } else if (action.type === "skill" || action.type === "gear") {
      const index = action.index,
        limit = action.type === "skill" ? 4 : 3
      if (!Number.isInteger(index) || index < 0 || index >= limit)
        return error("Chọn đúng kỹ năng hoặc ô trang bị.")
      if (action.type === "skill") {
        if (!heroSkills(hero)[index].ready)
          return error("Kỹ năng chưa mở: cần cấp 5 hoặc nội tại cần bậc 2.")
        if (hero.skills[index] >= Math.min(RPG_SKILL_CAP, hero.level))
          return error("Cấp kỹ năng không vượt cấp nhân vật hoặc cấp 10.")
      } else if (hero.gear[index] >= 10) return error("Trang bị đã đạt cấp 10.")
      if (!spend(save, upgradeCost(hero, action.type, index)))
        return error(
          "Chưa đủ xu hoặc nguyên liệu. Farm Thư Viện Hương / Lò Rèn Ký Ức.",
        )
      if (action.type === "skill") hero.skills[index]++
      else hero.gear[index]++
    } else if (action.type === "rank") {
      if (hero.rank >= 5 || hero.level < hero.rank * 5)
        return error(`Thăng bậc cần cấp ${hero.rank * 5}; tối đa bậc 5.`)
      if (!spend(save, upgradeCost(hero, "rank")))
        return error("Cần xu, Quặng ký ức và Tinh hương từ Lò Rèn.")
      hero.rank++
    }
  } else if (action.type === "start") {
    const stage = rpgStage(action.stageId)
    const difficulty = action.difficulty ?? "normal"
    if (!["normal", "hard", "extreme"].includes(difficulty)) return error("Độ khó không hợp lệ.")
    if (!stage || !stageUnlocked(save, action.stageId))
      return error("Hoàn thành màn trước để mở đường.")
    save.serial++
    const waves = encounterWaves(
      stage.map.school,
      stage.level,
      stage.boss ? 4 : 3,
      stage.boss ? { id: stage.map.boss, name: stage.map.bossName } : undefined,
      false, 1, stage.map.id, difficulty,
    )
    save.run = {
      kind: "campaign",
      difficulty,
      stageId: action.stageId,
      dungeon: null,
      battle: { ...createRpgBattle(save, waves, `rpg:${save.serial}`), difficulty },
    }
  } else if (action.type === "dungeon") {
    if (
      !["experience", "skills", "forge"].includes(action.kind) ||
      !Number.isInteger(action.tier) ||
      action.tier < 1 ||
      action.tier > dungeonTierCap(save)
    )
      return error("Độ khó dungeon chưa được mở.")
    save.serial++
    const scaling = dungeonScaling(save, action.tier)
    const school: School =
      action.kind === "experience"
        ? "hearth"
        : action.kind === "skills"
          ? "sugar"
          : "ember"
    save.run = {
      kind: "dungeon",
      stageId: null,
      dungeon: {
        kind: action.kind,
        tier: action.tier,
        scaling,
        floor: 1,
        status: "battle",
        health: {},
        bonus: 0,
      },
      battle: createRpgBattle(
        save,
        encounterWaves(school, scaling.baseLevel, 1, undefined, true, 1+(action.tier-1)*.14),
        `rpg:${save.serial}:1`,
      ),
    }
  } else if (action.type === "choice") {
    if (
      !RPG_MAPS.some((m) => m.id === action.mapId) ||
      !save.stars[`${action.mapId}-6`] ||
      ![0, 1].includes(action.choice)
    )
      return error("Lựa chọn mở sau khi thắng boss của map.")
    save.choices[action.mapId] = action.choice
  } else if (action.type !== "sync") {
    if (!run || !b) return error("Chưa có chuyến đi đang diễn ra.")
    if (action.type === "tick") {
      if (!Number.isFinite(action.steps))
        return error("Nhịp trận không hợp lệ.")
      if (b.paused || b.result || b.cinematic) return { save: current ?? save, changed: false }
      run.battle = advanceRpgBattle(b, action.steps)
    } else if (action.type === "focus") {
      if (!((b.rulesVersion ?? 0) >= 510) || b.result || b.paused || (action.uid && !b.actors.some(a=>a.side==="enemy" && a.hp>0 && a.uid===action.uid))) return error("Chọn kẻ địch còn sống trong trận mới.")
      b.focus = action.uid
    } else if (action.type === "burst") {
      const actor = b.actors.find(
        (a) => a.uid === action.uid && a.side === "ally",
      )
      if (
        b.result ||
        b.paused ||
        b.cinematic ||
        !actor?.hp ||
        actor.energy < 100 ||
        actor.stun
      )
        return error(
          "Tuyệt kỹ cần 100 năng lượng và nhân vật có thể hành động.",
        )
      cast(b, actor, true)
      if (!b.cinematic) checkResult(b)
    } else if (action.type === "guard") {
      if (
        b.result ||
        b.paused ||
        b.cinematic ||
        b.tick < b.guardReady ||
        !["front", "back"].includes(action.row)
      )
        return error("Che chắn đang hồi; cần 12 giây trước lần tiếp theo.")
      b.guardRow = action.row
      b.guardUntil = b.tick + 12
      b.guardReady = b.tick + 48
      const actor = alive(b, "ally")[0]
      if (actor)
        event(
          b,
          actor,
          "guard",
          alive(b, "ally").filter((a) => rowOf(a) === action.row),
          0,
          "Che chắn · giảm 65% sát thương trong 3s",
        )
    } else if (action.type === "pause") {
      if (!b.result) b.paused = !b.paused
    } else if (action.type === "auto") b.auto = !b.auto
    else if (action.type === "speed") b.speed = b.speed === 1 ? 2 : 1
    else if (action.type === "settle") {
      if (!b.result || b.settled || b.cinematic)
        return { save: current ?? save, changed: false }
      b.settled = true
      if (b.result === "win") {
        let loot: Partial<RpgResources>
        let xp: number
        if (run.kind === "campaign") {
          const stage = rpgStage(run.stageId!)!,
            difficulty = run.difficulty ?? "normal",
            clearKey = `${difficulty}:${run.stageId!}`,
            first = difficulty === "normal" ? !save.stars[run.stageId!] : !save.modeStars?.[clearKey]
          const level = (b.rulesVersion ?? 0) >= 520 ? stage.level : 1 + stage.mapIndex * 7 + stage.index
          if (difficulty === "normal") save.stars[run.stageId!] = Math.max(
            save.stars[run.stageId!] ?? 0,
            b.stars,
          )
          else {
            save.modeStars ??= {}
            save.modeStars[clearKey] = Math.max(save.modeStars[clearKey] ?? 0, b.stars)
          }
          loot = {
            coins: (20 + level * 3 + (first ? 45 : 0)) * (difficulty === "extreme" ? 4 : difficulty === "hard" ? 2 : 1),
            experience: first ? 2 : 1,
            books: stage.boss ? 3 : 1,
            ore: stage.boss ? 5 : 1,
            essence: stage.boss ? 2 : 0,
          }
          xp = 50 + level * 8
        } else {
          const d = run.dungeon!
          loot = {
            coins: 18 * d.tier,
            [d.kind === "experience"
              ? "experience"
              : d.kind === "skills"
                ? "books"
                : "ore"]: d.tier * (d.floor === 5 ? 6 : 2),
            ...(d.kind === "forge"
              ? { essence: d.floor === 5 ? d.tier * 3 : 1 }
              : {}),
          }
          xp = 30 * d.tier
          d.health = Object.fromEntries(
            b.actors
              .filter((a) => a.side === "ally")
              .map((a) => [a.uid, { hp: a.hp, energy: a.energy }]),
          )
          d.status =
            d.floor === 5
              ? "complete"
              : d.floor === 2 || d.floor === 4
                ? "camp"
                : "ready"
          if (d.floor === 5) {
            const key = `${d.kind}:${d.tier}`
            save.dungeonClears[key] = Math.min(
              1_000_000,
              (save.dungeonClears[key] ?? 0) + 1,
            )
          }
        }
        reward(save, loot)
        b.reward = loot
        for (const hero of save.roster.filter((m) =>
          save.formation.includes(m.uid),
        ))
          addHeroXp(hero, xp)
      } else if (run.dungeon) run.dungeon.status = "lost"
    } else if (action.type === "camp") {
      const d = run.dungeon
      if (
        !d ||
        d.status !== "camp" ||
        !["rest", "power"].includes(action.choice)
      )
        return error("Chỉ chọn nghỉ hoặc tiếp sức tại điểm nghỉ.")
      if (action.choice === "rest")
        for (const a of b.actors.filter(
          (a) => a.side === "ally" && d.health[a.uid]?.hp > 0,
        ))
          d.health[a.uid].hp = Math.min(
            a.maxHp,
            d.health[a.uid].hp + Math.round(a.maxHp * 0.4),
          )
      else d.bonus = Math.min(0.3, d.bonus + 0.12)
      d.status = "ready"
    } else if (action.type === "broth") {
      const d = run.dungeon
      if (!d || !["ready", "camp"].includes(d.status))
        return error("Dùng Canh Ấm giữa các tầng dungeon.")
      if (
        !b.actors.some(
          (a) =>
            a.side === "ally" &&
            d.health[a.uid]?.hp > 0 &&
            d.health[a.uid].hp < a.maxHp,
        )
      )
        return error("Đội đang đầy HP; giữ Canh Ấm cho tầng sau.")
      if (!spend(save, { broth: 1 })) return error("Đã hết Canh Ấm.")
      for (const a of b.actors.filter(
        (a) => a.side === "ally" && d.health[a.uid]?.hp > 0,
      ))
        d.health[a.uid].hp = Math.min(
          a.maxHp,
          d.health[a.uid].hp + Math.round(a.maxHp * 0.35),
        )
    } else if (action.type === "revive") {
      const d = run.dungeon,
        actor = b.actors.find((a) => a.uid === action.uid && a.side === "ally")
      if (
        !d ||
        !["ready", "camp"].includes(d.status) ||
        !actor ||
        d.health[actor.uid]?.hp !== 0
      )
        return error("Lá Tỉnh hồi sinh Vị Linh đã gục giữa hai tầng.")
      if (!spend(save, { leaves: 1 })) return error("Đã hết Lá Tỉnh.")
      d.health[actor.uid] = { hp: Math.round(actor.maxHp / 2), energy: 0 }
    } else if (action.type === "next") {
      const d = run.dungeon
      if (!d || d.status !== "ready" || !b.settled || b.result !== "win")
        return error("Nhận thưởng và chọn điểm nghỉ trước khi lên tầng.")
      d.floor++
      d.status = "battle"
      const school: School =
        d.kind === "experience"
          ? "hearth"
          : d.kind === "skills"
            ? "sugar"
            : "ember"
      const boss = d.floor === 5 ? { id: "boss-lotus", name: "Sen Sương Giữ Kho" } : undefined
      const waves = d.scaling ? encounterWaves(school, Math.min(50, d.scaling.baseLevel + d.floor - 1), d.floor === 5 ? 2 : 1, boss, true, 1+(d.tier-1)*.14+(d.floor-1)*.035) : enemyWaves(
        school,
        d.floor + (d.tier - 1) * 8,
        d.floor === 5
          ? { id: "boss-lotus", name: "Sen Sương Giữ Kho" }
          : undefined,
        1,
      )
      run.battle = createRpgBattle(
        save,
        waves,
        `rpg:${save.serial}:${d.floor}`,
        d.health,
        d.bonus,
        b.rulesVersion ?? null,
      )
      if (!b.rulesVersion) delete run.battle.rulesVersion
      run.battle.auto = b.auto
      run.battle.speed = b.speed
    } else if (action.type === "close") save.run = null
  }
  return { save, changed: true }
}
