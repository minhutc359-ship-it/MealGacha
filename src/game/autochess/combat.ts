import { UNIT_MAP, MONSTERS, MONSTER_MAP } from "./catalog"
import { boardPieces, capacity, traitCounts } from "./economy"
import type {
  Actor,
  AutoCombat,
  AutoRun,
  CombatEvent,
  EventKind,
  Skill,
} from "./types"

export const distance = (a: number, b: number) =>
  Math.abs((a % 6) - (b % 6)) + Math.abs(Math.floor(a / 6) - Math.floor(b / 6))
export function pressure(wave: number, activeTicks: number) {
  const level = Math.floor(activeTicks / 600)
  return {
    level,
    health: (1 + 0.08 * (wave - 1)) * (1 + 0.05 * level),
    attack: (1 + 0.06 * (wave - 1)) * (1 + 0.04 * level),
  }
}
export function enemyPlan(run: AutoRun) {
  const bossWave =
    run.mode === "campaign" ? run.wave % 3 === 0 : run.wave % 5 === 0
  const bossIndex =
    run.mode === "campaign"
      ? Math.floor(run.wave / 3) - 1
      : (Math.floor(run.wave / 5) - 1) % 4
  const count = Math.min(
    12,
    run.mode === "campaign"
      ? 2 + Math.floor((run.wave - 1) / 2) + (run.wave % 3 === 2 ? 1 : 0)
      : 2 + Math.floor((run.wave - 1) / 2),
  )
  let rng = (run.seed ^ Math.imul(run.wave, 2654435761)) >>> 0
  const cells = [8, 9, 7, 10, 2, 3, 1, 4, 0, 5, 6, 11]
  return Array.from({ length: count }, (_, i) => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0
    const index =
      i === 0 && bossWave
        ? 10 + bossIndex
        : rng % Math.min(10, Math.max(1, run.wave))
    return { def: MONSTERS[index], cell: cells[i] }
  })
}
const baseActor = (
  uid: string,
  id: string,
  side: Actor["side"],
  cell: number,
): Actor => ({
  uid,
  id,
  side,
  cell,
  star: 1,
  hp: 1,
  maxHp: 1,
  attack: 1,
  baseAttack: 1,
  armor: 0,
  range: 1,
  interval: 23,
  mana: 0,
  shield: 0,
  stunnedUntil: 0,
  burnUntil: 0,
  burnPower: 0,
  next: 0,
  action: null,
  skill: "flame",
  power: 1,
  items: [],
  lanternUsed: false,
  casts: 0,
  phase: 0,
  diedAt: null,
  dodgeUntil: 0,
  sealedUntil: 0,
})
export function createCombat(run: AutoRun): AutoCombat {
  const pieces = boardPieces(run),
    traits = traitCounts(pieces),
    distinctSchools = Object.keys(traits).filter((k) =>
      ["ember", "tide", "grove", "hearth", "sugar"].includes(k),
    ).length
  const actors = pieces.map((p) => {
    const d = UNIT_MAP[p.id],
      hpScale = [1, 1.7, 2.9][p.star - 1],
      attackScale = [1, 1.5, 2.25][p.star - 1]
    const a = baseActor(p.uid, p.id, "ally", p.cell!)
    const adjacent = pieces.some(
      (other) => other.uid !== p.uid && distance(p.cell!, other.cell!) === 1,
    )
    Object.assign(a, {
      star: p.star,
      maxHp: Math.round(d.hp * hpScale),
      baseAttack: d.attack * attackScale,
      armor: d.armor,
      range: d.range,
      interval: d.interval,
      power: d.power * attackScale,
      skill: d.skill,
      items: [...p.items],
    })
    if ((traits.keeper ?? 0) >= 2 && d.profession === "keeper")
      a.armor += traits.keeper >= 3 ? 24 : 12
    if ((traits.traveler ?? 0) >= 2 && d.profession === "traveler")
      a.baseAttack *= traits.traveler >= 3 ? 1.16 : 1.08
    if ((traits.storyteller ?? 0) >= 2 && d.profession === "storyteller")
      a.mana += traits.storyteller >= 3 ? 30 : 15
    if ((traits.hearth ?? 0) >= 2 && p.cell! < 24)
      a.shield += traits.hearth >= 4 ? 220 : 100
    if (p.items.includes("herbs")) a.maxHp += 100
    if (p.items.includes("basket")) a.maxHp += 180
    if (p.items.includes("bell") && adjacent) a.baseAttack *= 1.18
    if (run.augments.includes("guests") && distinctSchools >= 3)
      a.maxHp = Math.round(a.maxHp * 1.15)
    if (run.augments.includes("seat") && !adjacent) a.baseAttack *= 1.25
    if (run.augments.includes("together") && adjacent) a.shield += 120
    if (run.augments.includes("last-light") && run.health < 45) a.shield += 180
    a.attack = a.baseAttack
    a.hp = a.maxHp
    return a
  })
  const plan = enemyPlan(run),
    p = pressure(run.wave, run.activeTicks),
    campaignScale = 1 + 0.055 * (run.wave - 1)
  for (const { def, cell } of plan) {
    const a = baseActor(
      `e${run.rounds}-${actors.length}`,
      def.id,
      "enemy",
      cell,
    )
    Object.assign(a, {
      maxHp: Math.round(
        def.hp * (run.mode === "campaign" ? campaignScale : p.health),
      ),
      baseAttack:
        def.attack *
        (run.mode === "campaign" ? campaignScale : 1 + 0.06 * (run.wave - 1)),
      armor: def.armor,
      range: def.range,
      skill: def.skill,
      power: def.power * campaignScale,
    })
    a.attack = a.baseAttack * (run.mode === "campaign" ? 1 : 1 + 0.04 * p.level)
    a.hp = a.maxHp
    actors.push(a)
  }
  return {
    id: `${run.id}:${run.rounds}`,
    tick: 0,
    actors,
    events: [],
    nextEvent: 1,
    result: null,
    settled: false,
    boss: plan.find((p) => p.def.boss)?.def.id ?? null,
    pendingScene: null,
    lastAllySkill: null,
    lastAllyPower: 0,
    pressure: p.level,
  }
}
const schoolOf = (u: Actor) =>
  (u.side === "ally" ? UNIT_MAP[u.id] : MONSTER_MAP[u.id]).school
function emit(
  b: AutoCombat,
  kind: EventKind,
  source: Actor,
  target: Actor,
  amount = 0,
) {
  b.events.push({
    id: b.nextEvent++,
    tick: b.tick,
    kind,
    source: source.uid,
    target: target.uid,
    cell: target.cell,
    amount: Math.round(amount),
    school: schoolOf(source),
  })
}
function damage(
  b: AutoCombat,
  source: Actor,
  target: Actor,
  power: number,
  magic = false,
  kind: EventKind = "hit",
) {
  if (target.hp <= 0 || target.dodgeUntil > b.tick) return
  const reduced = Math.max(
    1,
    Math.round((power * 100) / (100 + target.armor * (magic ? 0.6 : 1))),
  )
  const absorbed = Math.min(target.shield, reduced),
    actual = Math.min(target.hp, reduced - absorbed)
  target.shield -= absorbed
  target.hp = Math.max(0, target.hp - actual)
  target.mana = Math.min(100, target.mana + 8)
  emit(b, kind, source, target, actual + absorbed)
  if (
    target.hp > 0 &&
    target.hp / target.maxHp < 0.35 &&
    target.items.includes("lantern") &&
    !target.lanternUsed
  ) {
    target.lanternUsed = true
    ward(b, target, target, 250)
  }
  if (target.hp === 0) {
    target.diedAt = b.tick
    emit(b, "death", source, target)
  }
}
function heal(b: AutoCombat, source: Actor, target: Actor, power: number) {
  if (target.hp <= 0) return
  const reduction = Math.min(
    0.75,
    Math.max(0, Math.floor((b.tick - 500) / 100) + 1) * 0.125,
  )
  const amount = Math.min(
    target.maxHp - target.hp,
    Math.round(power * (1 - reduction)),
  )
  if (amount > 0) {
    target.hp += amount
    emit(b, "heal", source, target, amount)
  }
}
function ward(b: AutoCombat, source: Actor, target: Actor, power: number) {
  if (target.hp <= 0) return
  const amount = Math.min(Math.round(power), target.maxHp - target.shield)
  if (amount > 0) {
    target.shield += amount
    emit(b, "shield", source, target, amount)
  }
}
const living = (b: AutoCombat, side: Actor["side"]) =>
  b.actors.filter((a) => a.side === side && a.hp > 0)
function stun(
  b: AutoCombat,
  source: Actor,
  target: Actor,
  ticks: number,
  traits: Record<string, number>,
) {
  const resistant =
    target.items.includes("herbs") ||
    (target.side === "ally" && (traits.grove ?? 0) >= 4)
  // Repeated control cannot cancel every action forever.
  const duration = Math.round(ticks * (resistant ? 0.5 : 1))
  target.stunnedUntil = Math.max(target.stunnedUntil, b.tick + duration)
  emit(b, "stun", source, target, duration)
}
function targetFor(b: AutoCombat, u: Actor) {
  const opponents = living(b, u.side === "ally" ? "enemy" : "ally")
  return opponents.sort((a, c) =>
    u.id === "rat"
      ? c.range - a.range ||
        distance(u.cell, a.cell) - distance(u.cell, c.cell) ||
        a.uid.localeCompare(c.uid)
      : distance(u.cell, a.cell) - distance(u.cell, c.cell) ||
        a.uid.localeCompare(c.uid),
  )[0]
}
export function nextCell(
  from: number,
  target: number,
  range: number,
  blocked: Set<number>,
) {
  const queue: { cell: number; first: number | null }[] = [
      { cell: from, first: null },
    ],
    seen = new Set([from])
  for (let i = 0; i < queue.length; i++) {
    const { cell, first } = queue[i]
    if (distance(cell, target) <= range) return first
    const x = cell % 6,
      y = Math.floor(cell / 6)
    const neighbors = [
      y > 0 ? cell - 6 : -1,
      x > 0 ? cell - 1 : -1,
      x < 5 ? cell + 1 : -1,
      y < 5 ? cell + 6 : -1,
    ].filter((n) => n >= 0)
    for (const n of neighbors)
      if (!seen.has(n) && !blocked.has(n)) {
        seen.add(n)
        queue.push({ cell: n, first: first ?? n })
      }
  }
  return null
}
function skillHit(
  run: AutoRun,
  b: AutoCombat,
  u: Actor,
  target: Actor,
  traits: Record<string, number>,
) {
  const multiplier = u.items.includes("book") && u.casts === 0 ? 1.45 : 1
  let skill = u.skill,
    power = u.power * multiplier
  if (skill === "copy") {
    skill =
      b.lastAllySkill && b.lastAllySkill !== "copy" ? b.lastAllySkill : "steam"
    power = (b.lastAllyPower || u.power) * 0.65 * multiplier
  }
  if (u.side === "ally" && u.skill !== "copy") {
    b.lastAllySkill = skill
    b.lastAllyPower = power
  }
  u.casts++
  emit(b, "cast", u, target, power)
  const allies = living(b, u.side).sort(
      (a, c) => a.hp / a.maxHp - c.hp / c.maxHp || a.uid.localeCompare(c.uid),
    ),
    enemies = living(b, u.side === "ally" ? "enemy" : "ally")
  const hit = (t: Actor, p = power, magic = true) => damage(b, u, t, p, magic)
  const nearby = enemies.filter((t) => distance(t.cell, u.cell) <= 2)
  switch (skill) {
    case "heal":
      heal(b, u, allies[0] ?? u, power)
      break
    case "shield":
      for (const a of allies.slice(0, 2)) ward(b, u, a, power)
      break
    case "leaves":
      for (const a of allies.slice(0, 2)) {
        ward(b, u, a, power)
        heal(b, u, a, power * 0.5)
      }
      break
    case "ginger": {
      const center = allies[0] ?? u
      for (const a of allies.filter(
        (a) => distance(a.cell, center.cell) <= 2,
      )) {
        heal(b, u, a, power)
        a.stunnedUntil = Math.min(a.stunnedUntil, b.tick)
      }
      break
    }
    case "feast": {
      const center = allies[0] ?? u
      for (const a of allies.filter(
        (a) => distance(a.cell, center.cell) <= 2,
      )) {
        heal(b, u, a, power)
        ward(b, u, a, power * 0.35)
      }
      break
    }
    case "lantern":
      for (const a of allies.filter(
        (a) => Math.floor(a.cell / 6) === Math.floor((allies[0] ?? u).cell / 6),
      ))
        ward(b, u, a, power)
      break
    case "rhythm":
      hit(target)
      for (const a of allies.filter(
        (a) => a.uid !== u.uid && distance(a.cell, u.cell) <= 2,
      )) {
        a.mana = Math.min(100, a.mana + 25)
        emit(b, "mana", u, a, 25)
      }
      break
    case "mana":
      hit(target)
      for (const a of allies.filter((a) => a.uid !== u.uid).slice(0, 2)) {
        a.mana = Math.min(100, a.mana + 20)
        emit(b, "mana", u, a, 20)
      }
      break
    case "drain":
      hit(target)
      target.mana = Math.max(0, target.mana - 30)
      u.mana = Math.min(100, u.mana + 30)
      emit(b, "mana", u, target, -30)
      break
    case "shell":
      ward(b, u, u, power)
      for (const t of nearby) hit(t, power * 0.2)
      break
    case "cleave":
      for (const t of nearby.length ? nearby : [target]) hit(t, power, false)
      break
    case "cone":
      for (const t of enemies.filter((t) => distance(t.cell, target.cell) <= 1))
        hit(t)
      break
    case "charge":
    case "dash":
      for (const t of enemies.filter(
        (t) => Math.floor(t.cell / 6) === Math.floor(target.cell / 6),
      )) {
        hit(t, power, skill === "dash")
        if (skill === "charge") stun(b, u, t, 14, traits)
      }
      break
    case "steam": {
      const sameCol = enemies.filter((t) => t.cell % 6 === target.cell % 6)
      for (const t of sameCol) hit(t)
      u.mana = Math.min(100, u.mana + sameCol.length * 5)
      break
    }
    case "flame":
      hit(target)
      for (const t of enemies.filter(
        (t) =>
          t.uid === target.uid ||
          (u.id === "chef-nhien" && distance(t.cell, target.cell) === 1),
      )) {
        t.burnUntil = b.tick + 80
        t.burnPower = Math.round(power * 0.1)
        emit(b, "burn", u, t, t.burnPower)
      }
      break
    case "dodge":
      u.dodgeUntil = b.tick + 20
      heal(b, u, allies[0] ?? u, power)
      break
    case "stun":
    case "frost":
      hit(target, power, skill === "frost")
      stun(b, u, target, 20, traits)
      if (u.id === "banh-ram-it") ward(b, u, u, 160)
      break
    case "seal": {
      hit(target)
      const school = schoolOf(target)
      for (const t of enemies.filter((t) => schoolOf(t) === school)) {
        t.sealedUntil = b.tick + 60
        emit(b, "stun", u, t, 60)
      }
      break
    }
    case "summon": {
      hit(target)
      summon(run, b, u)
      break
    }
  }
  if (u.items.includes("ladle")) u.mana = Math.min(100, u.mana + 20)
  if (u.side === "ally" && (traits.sugar ?? 0) >= 2)
    ward(b, u, allies[0] ?? u, traits.sugar >= 4 ? 150 : 70)
}
function summon(run: AutoRun, b: AutoCombat, source: Actor) {
  if (living(b, "enemy").length >= 12 || b.actors.length >= 60) return
  const occupied = new Set(
    b.actors
      .filter((a) => a.hp > 0)
      .flatMap((a) => [
        a.cell,
        ...(a.action?.kind === "move" ? [a.action.to] : []),
      ]),
  )
  const cell = Array.from({ length: 18 }, (_, i) => i).find(
    (c) => !occupied.has(c),
  )
  if (cell === undefined) return
  const d = MONSTER_MAP.mist,
    a = baseActor(`summon-${b.nextEvent}`, d.id, "enemy", cell),
    p = pressure(run.wave, run.activeTicks)
  a.maxHp = Math.round(
    d.hp * (run.mode === "campaign" ? 1 + 0.055 * (run.wave - 1) : p.health),
  )
  a.hp = a.maxHp
  a.baseAttack =
    d.attack * (run.mode === "campaign" ? 1 : 1 + 0.06 * (run.wave - 1))
  a.attack = a.baseAttack
  a.skill = d.skill
  a.power = d.power
  b.actors.push(a)
  emit(b, "summon", source, a)
}
function step(run: AutoRun) {
  const b = run.combat!
  if (b.result || b.pendingScene || run.paused || run.scene) return
  b.tick++
  run.activeTicks++
  b.events = b.events.filter((e) => b.tick - e.tick <= 32).slice(-120)
  const traits = traitCounts(boardPieces(run)),
    level = pressure(run.wave, run.activeTicks).level
  const enrage = 1 + Math.max(0, Math.floor((b.tick - 500) / 100) + 1) * 0.15
  for (const u of b.actors.filter((a) => a.hp > 0)) {
    if (u.side === "enemy") {
      if (run.mode !== "campaign" && level !== b.pressure) {
        const factor = (1 + 0.05 * level) / (1 + 0.05 * b.pressure)
        u.maxHp = Math.round(u.maxHp * factor)
        u.hp = Math.max(1, Math.round(u.hp * factor))
      }
      u.attack =
        u.baseAttack *
        (run.mode === "campaign" ? 1 : 1 + 0.04 * level) *
        enrage *
        (1 + 0.12 * u.phase)
    }
    if (u.burnUntil > b.tick && b.tick % 20 === 0)
      damage(b, u, u, u.burnPower, true, "burn")
    if (u.side === "ally" && b.tick % 100 === 0 && u.hp > 0) {
      const schools = Object.keys(traits).filter((t) =>
        ["ember", "tide", "grove", "hearth", "sugar"].includes(t),
      ).length
      const amount =
        (schools >= 3 ? 0.02 : 0) +
        ((traits.grove ?? 0) >= 2 ? (traits.grove >= 4 ? 0.06 : 0.03) : 0)
      heal(b, u, u, u.maxHp * amount)
    }
  }
  b.pressure = level
  const due = b.actors.filter(
    (u) =>
      u.hp > 0 &&
      u.action &&
      u.action.kind !== "move" &&
      u.action.hit === b.tick,
  )
  // Collect all hits before applying them; simultaneous lethal cannot depend on actor order.
  for (const u of due) {
    const a = u.action!,
      target = b.actors.find((t) => t.uid === a.target)
    if (!target || target.hp <= 0 || u.stunnedUntil > b.tick) continue
    if (a.kind === "cast") skillHit(run, b, u, target, traits)
    else {
      damage(b, u, target, u.attack)
      u.mana = Math.min(
        100,
        u.mana +
          10 +
          (u.side === "ally" &&
          schoolOf(u) === "tide" &&
          (traits.tide ?? 0) >= 2
            ? traits.tide >= 4
              ? 8
              : 4
            : 0),
      )
      if (
        u.side === "ally" &&
        schoolOf(u) === "ember" &&
        (traits.ember ?? 0) >= 2
      ) {
        target.burnUntil = b.tick + 80
        target.burnPower = traits.ember >= 4 ? 16 : 8
      }
    }
  }
  for (const u of b.actors) {
    if (u.action && u.action.end <= b.tick) {
      if (u.hp > 0 && u.action.kind === "move") u.cell = u.action.to
      u.action = null
    }
    if (u.hp <= 0 || u.action || u.stunnedUntil > b.tick || u.next > b.tick)
      continue
    const target = targetFor(b, u)
    if (!target) continue
    if (distance(u.cell, target.cell) > u.range) {
      const occupied = new Set(
        b.actors
          .filter((a) => a.hp > 0 && a.uid !== u.uid)
          .flatMap((a) => [
            a.cell,
            ...(a.action?.kind === "move" ? [a.action.to] : []),
          ]),
      )
      const to = nextCell(u.cell, target.cell, u.range, occupied)
      if (to !== null) {
        const ticks =
          u.items.includes("basket") ||
          (u.side === "ally" && (traits.traveler ?? 0) >= 2)
            ? 5
            : 7
        u.action = {
          kind: "move",
          start: b.tick,
          hit: b.tick + ticks,
          end: b.tick + ticks,
          target: target.uid,
          from: u.cell,
          to,
        }
        emit(b, "move", u, u)
      }
    } else {
      const cast = u.mana >= 100 && u.sealedUntil <= b.tick
      if (cast) u.mana = 0
      u.action = {
        kind: cast ? "cast" : "attack",
        start: b.tick,
        hit: b.tick + (cast ? 10 : 4),
        end: b.tick + (cast ? 17 : 10),
        target: target.uid,
        from: u.cell,
        to: target.cell,
        ...(cast ? { skill: u.skill } : {}),
      }
      u.next = b.tick + (cast ? 22 : u.interval)
      emit(b, cast ? "cast" : "attack", u, target)
    }
  }
  const boss = b.actors.find((a) => a.id === b.boss && a.hp > 0)
  if (boss) {
    const nextPhase =
      boss.id === "unwritten"
        ? boss.hp / boss.maxHp <= 0.33
          ? 2
          : boss.hp / boss.maxHp <= 0.66
            ? 1
            : 0
        : boss.hp / boss.maxHp <= 0.5
          ? 1
          : 0
    if (nextPhase > boss.phase) {
      boss.phase = nextPhase
      boss.mana = 100
      if (boss.id === "white-ink") boss.skill = "drain"
      emit(b, "phase", boss, boss, nextPhase + 1)
      if (boss.id === "unwritten") {
        summon(run, b, boss)
        summon(run, b, boss)
      }
      const scene = `boss-${run.wave}`
      if (run.mode === "campaign" && !run.seenScenes.includes(scene))
        b.pendingScene = scene
    }
  }
  if (!living(b, "ally").length) b.result = "loss"
  else if (!living(b, "enemy").length) b.result = "win"
  else if (b.tick >= 1100) b.result = "loss"
  if (b.result) {
    b.pendingScene = null
    run.phase = "result"
    run.paused = false
  }
}
export function advanceCombat(input: AutoRun, ticks = 1): AutoRun {
  if (
    input.phase !== "combat" ||
    input.paused ||
    input.scene ||
    input.combat?.pendingScene ||
    input.combat?.result ||
    !Number.isInteger(ticks) ||
    ticks < 1 ||
    ticks > 40
  )
    return input
  const run = structuredClone(input)
  for (
    let i = 0;
    i < ticks && run.phase === "combat" && !run.combat?.pendingScene;
    i++
  )
    step(run)
  return run
}
export function combatScore(run: AutoRun) {
  const b = run.combat!,
    survivors = living(b, "ally").length
  return (
    100 +
    12 * run.wave +
    3 * survivors +
    Math.max(0, 60 - 2 * Math.ceil(b.tick / 20)) +
    (b.boss ? 300 : 0)
  )
}
export const combatantsAlive = (b: AutoCombat, side: Actor["side"]) =>
  living(b, side).length
export const combatReady = (run: AutoRun) =>
  run.phase === "prepare" &&
  !run.scene &&
  boardPieces(run).length > 0 &&
  boardPieces(run).length <= capacity(run.xp)
export type { CombatEvent }
