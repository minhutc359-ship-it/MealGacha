import { CARD_MAP } from "../catalog"
import { UNIT_MAP } from "../autochess/catalog"
import type { GameSave, School } from "../types"
import { RPG_MAPS, rpgStage } from "./content"
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
export function heroSkills(hero: RpgHero) {
  const role = heroRole(hero.cardId),
    card = CARD_MAP[hero.cardId]
  const primary = {
    guardian: [
      "Giữ bếp",
      "Tạo khiên cho bản thân và đồng đội yếu nhất; đánh trả tuyến trước.",
    ],
    striker: ["Nhịp lửa", "Đánh mạnh một mục tiêu; Hỏa vị để lại Bỏng hương."],
    mage: [
      "Hương xuyên tuyến",
      "Gây sát thương lên cả hàng trước, tích thêm năng lượng.",
    ],
    healer: [
      "Bát canh ấm",
      "Hồi HP cho người bị thương nặng nhất, gỡ Bỏng hương.",
    ],
    trickster: [
      "Hương đánh lạc",
      "Đánh tuyến sau, làm yếu công và gây choáng ngắn.",
    ],
  }[role]
  const support = {
    hearth: ["Mái bếp chung", "Tạo khiên cho hai người ở tuyến trước."],
    ember: [
      "Than hồng",
      "Đốt mục tiêu; Bỏng hương gây sát thương theo thời gian.",
    ],
    tide: ["Dòng hồi ức", "Cho cả đội thêm năng lượng để nối tuyệt kỹ."],
    grove: ["Mùa xanh", "Hồi một phần HP cho cả đội và thanh tẩy Bỏng hương."],
    sugar: [
      "Mộng ngọt",
      "Làm yếu công của tất cả kẻ địch trong thời gian ngắn.",
    ],
  }[card.school]
  const burst = {
    guardian: [
      "Mâm cơm vững chãi",
      "Tạo khiên lớn cho cả đội và đánh trả toàn bộ địch.",
    ],
    striker: [
      "Bùng hương",
      "Dồn sát thương vào địch ít HP nhất; mạnh hơn khi địch đang bỏng.",
    ],
    mage: ["Đại tiệc hương", "Gây sát thương lớn lên mọi kẻ địch."],
    healer: ["Bữa cơm đoàn tụ", "Hồi HP toàn đội, gỡ bỏng, choáng và làm yếu."],
    trickster: ["Khúc ru ký ức", "Đánh tuyến sau và gây choáng toàn bộ địch."],
  }[role]
  return [
    {
      name: `${primary[0]} · ${card.name}`,
      text: primary[1],
      unlock: 1,
      ready: true,
      level: hero.skills[0],
      tag: "Tự động · 7s",
    },
    {
      name: support[0],
      text: support[1],
      unlock: 5,
      ready: hero.level >= 5,
      level: hero.skills[1],
      tag: "Tự động · 9s",
    },
    {
      name: burst[0],
      text: burst[1],
      unlock: 1,
      ready: true,
      level: hero.skills[2],
      tag: "Tuyệt kỹ · 100 năng lượng",
    },
    {
      name: "Giao ước đồng hành",
      text: "Tăng HP và công khi bắt đầu trận; thăng bậc để mở nội tại.",
      unlock: 2,
      ready: hero.rank >= 2,
      level: hero.skills[3],
      tag: "Nội tại · Bậc 2",
    },
  ]
}
export const heroXpNext = (level: number) => 70 + level * 20
export function addHeroXp(hero: RpgHero, amount: number) {
  hero.xp += amount
  while (hero.level < RPG_LEVEL_CAP && hero.xp >= heroXpNext(hero.level)) {
    hero.xp -= heroXpNext(hero.level)
    hero.level++
  }
  if (hero.level === RPG_LEVEL_CAP) hero.xp = 0
}
export function heroStats(hero: RpgHero) {
  const card = CARD_MAP[hero.cardId],
    role = heroRole(hero.cardId)
  const passive = hero.rank >= 2 ? 1 + hero.skills[3] * 0.025 : 1
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
  for (const id of [...STARTERS, ...Object.keys(game.cards)]) {
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
    if (count > 0 && CARD_MAP[id]?.kind === "unit" && !have.has(id)) {
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
): RpgBattle {
  const actors: RpgActor[] = save.formation.map((uid, slot) => {
    const hero = save.roster.find((m) => m.uid === uid)!,
      stats = heroStats(hero)
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
  const battle: RpgBattle = {
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
  for (const [slot, e] of b.waves[b.wave].entries()) {
    const hp = Math.round((140 + e.level * 22) * (e.boss ? 6.8 : 1))
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
      attack: Math.round((15 + e.level * 2.5) * (e.boss ? 1.7 : 1)),
      armor: e.boss ? 18 : 5,
      energy: 0,
      shield: 0,
      burn: 0,
      weaken: 0,
      stun: 0,
      nextAttack: b.tick + 6 + slot * 2,
      nextSkill: b.tick + (e.boss ? 8 : 36),
      nextSupport: 0,
      boss: e.boss,
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
function damage(b: RpgBattle, a: RpgActor, target: RpgActor, power: number) {
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
      (a.weaken ? 0.72 : 1) *
      (beats[a.school] === target.school ? 1.18 : 1)) /
      (1 + target.armor / 100),
  )
  if (
    a.side === "enemy" &&
    b.tick < b.guardUntil &&
    rowOf(target) === b.guardRow
  )
    amount = Math.round(amount * 0.35)
  const absorbed = Math.min(target.shield, amount)
  target.shield -= absorbed
  target.hp = Math.max(0, target.hp - amount + absorbed)
  target.energy = Math.min(100, target.energy + 5)
  target.motion = target.hp ? "hit" : "fall"
  target.motionAt = b.tick
  event(b, a, "hit", [target], amount - absorbed, `${a.name} → ${target.name}`)
}
function heal(
  b: RpgBattle,
  a: RpgActor,
  targets: RpgActor[],
  fraction: number,
  text: string,
) {
  let total = 0
  for (const t of targets) {
    const gain = Math.min(t.maxHp - t.hp, Math.round(t.maxHp * fraction))
    t.hp += gain
    t.burn = 0
    total += gain
  }
  event(b, a, "heal", targets, total, text)
}
function shield(
  b: RpgBattle,
  a: RpgActor,
  targets: RpgActor[],
  amount: number,
  text: string,
) {
  for (const t of targets)
    t.shield = Math.min(t.maxHp, t.shield + Math.round(amount))
  event(b, a, "shield", targets, amount, text)
}
function targetFor(b: RpgBattle, a: RpgActor, back = false) {
  const enemies = alive(b, opposing(a)).sort((x, y) => x.slot - y.slot)
  return (
    (back ? enemies.find((t) => rowOf(t) === "back") : enemies[0]) ?? enemies[0]
  )
}
function cast(b: RpgBattle, a: RpgActor, burst: boolean, support = false) {
  const friends = alive(b, a.side),
    enemies = alive(b, opposing(a)),
    target = targetFor(b, a, a.role === "trickster")
  if (!target) return
  const level = a.skills[burst ? 2 : support ? 1 : 0],
    boost = 1 + (level - 1) * 0.09
  a.motion = "cast"
  a.motionAt = b.tick
  const skillHero: RpgHero = {
    uid: a.uid,
    cardId: a.id,
    level: a.level,
    xp: 0,
    rank: a.rank,
    skills: a.skills,
    gear: [0, 0, 0],
  }
  const name =
    a.side === "ally"
      ? heroSkills(skillHero)[burst ? 2 : support ? 1 : 0].name
      : "Sương phản kích"
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
function checkResult(b: RpgBattle) {
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
  if (current.result || current.paused) return current
  const b = structuredClone(current)
  for (
    let step = 0;
    step < Math.max(1, Math.min(8, Math.floor(steps)));
    step++
  ) {
    if (b.result) break
    b.tick++
    if (b.warning && b.tick >= b.warning.until) {
      const boss = b.actors.find((a) => a.uid === b.warning!.source)
      if (boss?.hp && !boss.stun) {
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
      if (!a.hp || a.stun) continue
      if (a.side === "enemy" && a.boss) {
        if (a.hp <= a.maxHp / 2 && !a.phase) {
          a.phase = 1
          a.attack = Math.round(a.attack * 1.18)
          event(b, a, "boss", [], 0, "Boss chuyển pha · Nhắm tuyến sau")
        }
        if (b.tick >= a.nextSkill && !b.warning) {
          b.warning = {
            until: b.tick + 8,
            source: a.uid,
            row: a.phase ? "back" : "front",
          }
          a.nextSkill = b.tick + 40
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
      if (a.side === "ally" && b.auto && a.energy >= 100) cast(b, a, true)
      else if (a.side === "ally" && a.level >= 5 && b.tick >= a.nextSupport) {
        cast(b, a, false, true)
        a.nextSupport = b.tick + 36
      } else if (a.side === "ally" && b.tick >= a.nextSkill) {
        cast(b, a, false)
        a.nextSkill = b.tick + 28
      } else if (b.tick >= a.nextAttack) {
        const target = targetFor(b, a)
        if (target) {
          damage(b, a, target, 1)
          a.motion = "attack"
          a.motionAt = b.tick
          a.energy = Math.min(100, a.energy + 10)
          a.nextAttack = b.tick + (a.role === "striker" ? 7 : 9)
        }
      }
      // A completed wave must not load new enemies in the middle of this turn order.
      if (!alive(b, "ally").length || !alive(b, "enemy").length) break
    }
    checkResult(b)
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
  syncRoster(save, game.cards)
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
  if (action.type === "formation") {
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
    if (!stage || !stageUnlocked(save, action.stageId))
      return error("Hoàn thành màn trước để mở đường.")
    save.serial++
    const waves = enemyWaves(
      stage.map.school,
      stage.level,
      stage.boss ? { id: stage.map.boss, name: stage.map.bossName } : undefined,
      stage.boss ? 3 : 2,
    )
    save.run = {
      kind: "campaign",
      stageId: action.stageId,
      dungeon: null,
      battle: createRpgBattle(save, waves, `rpg:${save.serial}`),
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
        floor: 1,
        status: "battle",
        health: {},
        bonus: 0,
      },
      battle: createRpgBattle(
        save,
        enemyWaves(school, 1 + (action.tier - 1) * 8, undefined, 1),
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
      if (b.paused || b.result) return { save: current ?? save, changed: false }
      run.battle = advanceRpgBattle(b, action.steps)
    } else if (action.type === "burst") {
      const actor = b.actors.find(
        (a) => a.uid === action.uid && a.side === "ally",
      )
      if (
        b.result ||
        b.paused ||
        !actor?.hp ||
        actor.energy < 100 ||
        actor.stun
      )
        return error(
          "Tuyệt kỹ cần 100 năng lượng và nhân vật có thể hành động.",
        )
      cast(b, actor, true)
      checkResult(b)
    } else if (action.type === "guard") {
      if (
        b.result ||
        b.paused ||
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
      if (!b.result || b.settled)
        return { save: current ?? save, changed: false }
      b.settled = true
      if (b.result === "win") {
        let loot: Partial<RpgResources>
        let xp: number
        if (run.kind === "campaign") {
          const stage = rpgStage(run.stageId!)!,
            first = !save.stars[run.stageId!]
          save.stars[run.stageId!] = Math.max(
            save.stars[run.stageId!] ?? 0,
            b.stars,
          )
          loot = {
            coins: 20 + stage.level * 3 + (first ? 45 : 0),
            experience: first ? 2 : 1,
            books: stage.boss ? 3 : 1,
            ore: stage.boss ? 5 : 1,
            essence: stage.boss ? 2 : 0,
          }
          xp = 50 + stage.level * 8
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
      const waves = enemyWaves(
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
      )
      run.battle.auto = b.auto
      run.battle.speed = b.speed
    } else if (action.type === "close") save.run = null
  }
  return { save, changed: true }
}
