import {
  VAN_TUNING,
  vanEmphasis,
  vanShieldRoom,
  vanAlly,
  vanEnemy,
  vanSupportEligible,
  vanDamageMultiplier,
} from "./van"
import {
  BACH_TUNING,
  bachThreshold,
  bachShareTarget,
  bachAllies,
  bachFront,
  ordinaryShieldCap,
} from "./bach"
import { MOC_TUNING, mocEnemy, mocOccupants } from "./moc"
import {
  combatSkillId,
  isCombatSpiritId,
  COMBAT_KITS,
  type CombatSpiritId,
} from "./roster"

import { MUOI_TUNING, muoiDamageMultiplier, selectMuoiTarget } from "./muoi"
import {
  LIEN_TUNING,
  selectLienAlly,
  lienDebuff,
  cleanseLienDebuff,
} from "./lien"
import {
  HAI_TUNING,
  haiNearbyEnemy,
  haiNeedsShield,
  absorbHaiLine,
} from "./hai"
import {
  NHIEN_TUNING,
  grantNhienRhythm,
  nhienBusy,
  nhienFacing,
  nhienMultipliers,
  nhienTargets,
} from "./nhien"

import {
  FORGOTTEN_HOST_ID,
  FORGOTTEN_HOST_PROFILE,
  FORGOTTEN_HOST_SKILLS,
  forgottenHostTargets,
  newForgottenHostState,
} from "./forgottenHost"
import type {
  CombatActor,
  CombatBattle,
  CombatCast,
  CombatEffect,
  CombatEffectKind,
  CombatEvent,
  CombatEventKind,
  CombatSide,
  CombatUnitSeed,
  CreateCombatBattleInput,
  NhienSequence,
} from "./types"

const MAX_UNITS = 5
const MAX_EVENTS = 160
const MAX_TICKS_PER_COMMAND = 64
const ULTIMATE_ENERGY = 100

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))
const living = (battle: CombatBattle, side?: CombatSide) =>
  battle.actors.filter(
    (actor) => actor.hp > 0 && (!side || actor.side === side),
  )
const opponent = (side: CombatSide): CombatSide =>
  side === "player" ? "enemy" : "player"
const byId = (battle: CombatBattle, id: string) =>
  battle.actors.find((actor) => actor.id === id)
const distance = (left: CombatActor, right: CombatActor) =>
  Math.abs(left.position - right.position)
const ratio = (actor: CombatActor) => actor.hp / actor.maxHp

function copyBattle(battle: CombatBattle): CombatBattle {
  return structuredClone(battle)
}

function assertNumber(
  value: number,
  label: string,
  min: number,
  max: number,
): number {
  if (!Number.isFinite(value) || value < min || value > max)
    throw Error(`${label} không hợp lệ.`)
  return value
}

function defaultEnemy(seed: CombatUnitSeed) {
  const ranged = (seed.range ?? 8) > 12
  return {
    hp: 120,
    attack: 24,
    defense: 8,
    range: ranged ? 36 : 8,
    moveSpeed: ranged ? 5 : 6,
    projectileTicks: ranged ? 2 : 0,
  }
}

function actorFromSeed(
  seed: CombatUnitSeed,
  side: CombatSide,
  slot: number,
): CombatActor {
  if (!seed.id.trim() || !seed.spiritId.trim())
    throw Error("ID combat không được để trống.")
  if (side === "player" && !isCombatSpiritId(seed.spiritId))
    throw Error(`Vị Linh chưa có combat kit AW2-007A: ${seed.spiritId}`)

  if (
    seed.bossProfile !== undefined &&
    (seed.bossProfile !== FORGOTTEN_HOST_PROFILE ||
      side !== "enemy" ||
      !seed.boss ||
      seed.spiritId !== FORGOTTEN_HOST_ID)
  )
    throw Error("Boss profile không thuộc Người Giữ Bàn Quên.")
  if (
    seed.vanEmphasis !== undefined &&
    (seed.spiritId !== "aw2-van" ||
      !["protection", "attack"].includes(seed.vanEmphasis))
  )
    throw Error("Nhấn tuyệt kỹ Vân phải được chọn hợp lệ trước trận.")
  const base =
    side === "player" ||
    [
      "aw2-muoi",
      "aw2-nhien",
      "aw2-hai",
      "aw2-lien",
      "aw2-moc",
      "aw2-bach",
      "aw2-van",
    ].includes(seed.spiritId)
      ? COMBAT_KITS[seed.spiritId as CombatSpiritId]
      : defaultEnemy(seed)
  const maxHp = assertNumber(seed.maxHp ?? base.hp, "HP tối đa", 1, 1_000_000)
  const hp = assertNumber(seed.hp ?? maxHp, "HP", 1, maxHp)
  return {
    id: seed.id,
    spiritId: seed.spiritId,
    ...(seed.spiritId === "aw2-van"
      ? { vanEmphasis: seed.vanEmphasis ?? "protection" }
      : {}),

    ...(seed.bossProfile ? { bossKit: newForgottenHostState() } : {}),
    side,
    slot,
    boss: seed.boss === true,
    ...(seed.debuffImmune ? { debuffImmune: true } : {}),
    ...(seed.summoned ? { summoned: true } : {}),
    controlImmune: seed.controlImmune ?? seed.boss === true,
    position: assertNumber(
      seed.position ?? (side === "player" ? 12 + slot * 4 : 88 - slot * 4),
      "Vị trí",
      0,
      100,
    ),
    hp,
    maxHp,
    attack: assertNumber(seed.attack ?? base.attack, "Tấn công", 1, 100_000),
    defense: assertNumber(
      seed.defense ?? base.defense,
      "Phòng thủ",
      0,
      100_000,
    ),
    range: assertNumber(seed.range ?? base.range, "Tầm đánh", 1, 100),
    moveSpeed: assertNumber(
      seed.moveSpeed ?? base.moveSpeed,
      "Tốc độ",
      0.1,
      100,
    ),
    projectileTicks: Math.floor(
      assertNumber(
        seed.projectileTicks ?? base.projectileTicks,
        "Thời gian đạn",
        0,
        30,
      ),
    ),
    energy: Math.floor(
      assertNumber(seed.energy ?? 0, "Năng lượng", 0, ULTIMATE_ENERGY),
    ),
    shield: 0,
    shieldExpiresAtTick: 0,
    weakenUntilTick: 0,
    slowUntilTick: 0,
    interruptGuardCharges: 0,
    interruptGuardUntilTick: 0,
    nextBasicTick: Math.floor(
      assertNumber(seed.nextBasicTick ?? 1 + slot, "Nhịp đánh", 0, 100_000),
    ),
    nextAutoTick: Math.floor(
      assertNumber(
        seed.nextAutoTick ?? (side === "player" ? 4 + slot * 2 : 100_000),
        "Nhịp kỹ năng",
        0,
        100_000,
      ),
    ),
    cast: null,
    passive: {
      thanArmed: false,
      thanCooldownUntil: 0,
      luaFocusTargetId: null,
      luaFocus: 0,
      mocSupportedIds: [],
      suongSlowCooldowns: {},
    },
  }
}

export function createCombatBattle(
  input: CreateCombatBattleInput,
): CombatBattle {
  if (!input.id.trim()) throw Error("Battle ID không được để trống.")
  if (
    !input.players.length ||
    !input.enemies.length ||
    input.players.length > MAX_UNITS ||
    input.enemies.length > MAX_UNITS
  ) {
    throw Error("Mỗi phe combat phải có từ một đến năm đơn vị.")
  }
  const seeds = [...input.players, ...input.enemies]
  if (new Set(seeds.map((seed) => seed.id)).size !== seeds.length)
    throw Error("Combat unit ID phải duy nhất.")
  const actors = [
    ...input.players.map((seed, slot) => actorFromSeed(seed, "player", slot)),
    ...input.enemies.map((seed, slot) => actorFromSeed(seed, "enemy", slot)),
  ]
  return {
    rulesVersion: 1,
    tuningId: "aw2-combat-development-v1",
    id: input.id,
    tick: 0,
    status: "active",
    actors,
    effects: [],
    events: [],
    eventSerial: 0,
    actionSerial: 0,
  }
}

function record(
  battle: CombatBattle,
  kind: CombatEventKind,
  sourceId: string | null,
  targetIds: string[],
  detail: Omit<
    CombatEvent,
    "serial" | "tick" | "kind" | "sourceId" | "targetIds"
  > = {},
): CombatEvent {
  const event: CombatEvent = {
    serial: ++battle.eventSerial,
    tick: battle.tick,
    kind,
    sourceId,
    targetIds: [...targetIds],
    ...detail,
  }
  battle.events.push(event)
  if (battle.events.length > MAX_EVENTS)
    battle.events.splice(0, battle.events.length - MAX_EVENTS)
  return event
}

function selectEnemy(
  battle: CombatBattle,
  source: CombatActor,
  preferredId?: string | null,
): CombatActor | undefined {
  const preferred = preferredId ? byId(battle, preferredId) : undefined
  if (preferred?.hp && preferred.side === opponent(source.side))
    return preferred
  return living(battle, opponent(source.side)).sort(
    (left, right) =>
      distance(source, left) - distance(source, right) ||
      ratio(left) - ratio(right) ||
      left.slot - right.slot ||
      left.id.localeCompare(right.id),
  )[0]
}

function selectInjuredAlly(
  battle: CombatBattle,
  source: CombatActor,
  preferredId?: string | null,
): CombatActor | undefined {
  const preferred = preferredId ? byId(battle, preferredId) : undefined
  if (
    preferred?.hp &&
    preferred.side === source.side &&
    preferred.hp < preferred.maxHp
  )
    return preferred
  return living(battle, source.side)
    .filter((actor) => actor.hp < actor.maxHp)
    .sort(
      (left, right) =>
        ratio(left) - ratio(right) ||
        distance(source, left) - distance(source, right) ||
        left.slot - right.slot ||
        left.id.localeCompare(right.id),
    )[0]
}

function threatCount(battle: CombatBattle, targetId: string): number {
  return (
    battle.effects.filter(
      (effect) => effect.targetId === targetId && effect.kind === "damage",
    ).length +
    battle.actors.filter(
      (actor) => actor.cast?.targetId === targetId && actor.side === "enemy",
    ).length
  )
}

function selectShieldAlly(
  battle: CombatBattle,
  source: CombatActor,
  preferredId?: string | null,
): CombatActor | undefined {
  const preferred = preferredId ? byId(battle, preferredId) : undefined
  if (
    preferred?.hp &&
    preferred.side === source.side &&
    preferred.id !== source.id
  )
    return preferred
  const enemies = living(battle, opponent(source.side))
  return living(battle, source.side)
    .filter((actor) => actor.id !== source.id)
    .sort((left, right) => {
      const leftFront = enemies.length
        ? Math.min(...enemies.map((enemy) => distance(left, enemy)))
        : 100
      const rightFront = enemies.length
        ? Math.min(...enemies.map((enemy) => distance(right, enemy)))
        : 100
      return (
        Number(source.passive.mocSupportedIds.includes(left.id)) -
          Number(source.passive.mocSupportedIds.includes(right.id)) ||
        Number(left.shield > 0) - Number(right.shield > 0) ||
        threatCount(battle, right.id) - threatCount(battle, left.id) ||
        leftFront - rightFront ||
        ratio(left) - ratio(right) ||
        left.id.localeCompare(right.id)
      )
    })[0]
}

function armThanPassive(battle: CombatBattle, actor: CombatActor) {
  if (
    actor.spiritId !== "aw2-than" ||
    actor.passive.thanArmed ||
    battle.tick < actor.passive.thanCooldownUntil
  )
    return
  actor.passive.thanArmed = true
  actor.passive.thanCooldownUntil = battle.tick + 8
  record(battle, "status", actor.id, [actor.id], {
    skillId: combatSkillId("aw2-than", "passive"),
    text: "Than Còn Ấm đã sẵn sàng.",
  })
}

function removeMuoiMarks(
  battle: CombatBattle,
  reason: string,
  matches: (sourceId: string, target: CombatActor) => boolean,
) {
  for (const target of battle.actors)
    for (const sourceId of Object.keys(target.muoiMarks ?? {})) {
      if (!matches(sourceId, target)) continue
      delete target.muoiMarks![sourceId]
      record(battle, "status", sourceId, [target.id], {
        skillId: combatSkillId("aw2-muoi", "auto"),
        statusEffect: "muoi-mark",
        statusChange: "remove",
        text: `Dấu gia vị kết thúc: ${reason}.`,
      })
      if (!Object.keys(target.muoiMarks!).length) delete target.muoiMarks
    }
}

function cleanupMuoiMarks(battle: CombatBattle) {
  removeMuoiMarks(
    battle,
    "hết hạn hoặc nguồn/mục tiêu đã gục",
    (id, target) =>
      target.hp <= 0 ||
      !byId(battle, id)?.hp ||
      (target.muoiMarks?.[id].expiresAtTick ?? 0) <= battle.tick,
  )
}

function applyMuoiMark(
  battle: CombatBattle,
  source: CombatActor,
  target: CombatActor,
) {
  removeMuoiMarks(battle, "đổi dấu", (id) => id === source.id)
  const expiresAtTick = battle.tick + MUOI_TUNING.durationTicks
  target.muoiMarks = {
    ...target.muoiMarks,
    [source.id]: {
      appliedTick: battle.tick,
      expiresAtTick,
      capTick: battle.tick + MUOI_TUNING.maxLifetimeTicks,
    },
  }
  record(battle, "status", source.id, [target.id], {
    skillId: combatSkillId("aw2-muoi", "auto"),
    statusEffect: "muoi-mark",
    statusChange: "apply",
    expiresAtTick,
    text: "Nêm Đúng Chỗ: giảm công20%.",
  })
}

function cleanupHaiFields(battle: CombatBattle, terminal = false) {
  for (const actor of battle.actors) {
    for (const key of ["haiZone", "haiLine"] as const) {
      const field = actor[key]
      if (
        !field ||
        (!terminal && actor.hp > 0 && field.expiresAtTick > battle.tick)
      )
        continue
      delete actor[key]
      const slot = key === "haiZone" ? "auto" : "ultimate"
      record(battle, "status", actor.id, [actor.id], {
        skillId: combatSkillId("aw2-hai", slot),
        statusEffect: key === "haiZone" ? "hai-zone" : "hai-line",
        statusChange: "remove",
        text: key === "haiZone" ? "Giữ Lối đã tan." : "Bờ Đợi đã tan.",
      })
    }
  }
}

function updateHaiPassives(battle: CombatBattle) {
  if (!living(battle, "player").length || !living(battle, "enemy").length)
    return
  for (const source of battle.actors) {
    if (!haiNeedsShield(battle, source)) continue
    applyShield(
      battle,
      source,
      source,
      Math.max(1, Math.round(source.maxHp * HAI_TUNING.passiveShieldRatio)),
      combatSkillId("aw2-hai", "passive"),
      HAI_TUNING.passiveShieldTicks,
    )
    source.haiPassiveUntilTick = battle.tick + HAI_TUNING.passiveCooldown
  }
}

function updateHaiZones(battle: CombatBattle) {
  for (const source of battle.actors) {
    const zone = source.haiZone
    if (!zone || source.hp <= 0 || zone.expiresAtTick <= battle.tick) continue
    for (const target of living(battle, opponent(source.side))) {
      if (
        target.controlImmune ||
        target.debuffImmune ||
        Math.abs(target.position - zone.center) > zone.radius
      )
        continue
      const expiry = Math.min(
        zone.expiresAtTick,
        battle.tick + HAI_TUNING.slowTicks,
      )
      if (target.slowUntilTick >= expiry) continue
      target.slowUntilTick = expiry
      record(battle, "status", source.id, [target.id], {
        skillId: combatSkillId("aw2-hai", "auto"),
        statusEffect: "hai-slow",
        statusChange: "refresh",
        expiresAtTick: expiry,
        text: "Giữ Lối làm chậm trong vùng.",
      })
    }
  }
}

function cleanupLienHealing(battle: CombatBattle, terminal = false) {
  for (const actor of battle.actors) {
    for (const key of ["lienHoT", "lienUltimate"] as const) {
      const healing = actor[key]
      if (
        !healing ||
        (!terminal &&
          actor.hp > 0 &&
          (key !== "lienHoT" || !!byId(battle, actor.lienHoT!.targetId)?.hp))
      )
        continue
      delete actor[key]
      record(battle, "status", actor.id, [], {
        skillId: combatSkillId(
          "aw2-lien",
          key === "lienHoT" ? "auto" : "ultimate",
        ),
        statusEffect: key === "lienHoT" ? "lien-hot" : "lien-pulses",
        statusChange: "remove",
        actionId: healing.id,
        text: "Lời hẹn hồi phục đã dừng; không hồi sinh.",
      })
    }
  }
}

function resolveLienHealing(battle: CombatBattle) {
  cleanupLienHealing(battle)
  for (const source of living(battle).filter(
    (a) => a.spiritId === "aw2-lien",
  )) {
    for (const key of ["lienHoT", "lienUltimate"] as const) {
      const healing = source[key]
      if (!healing || healing.nextPulseTick > battle.tick) continue
      const ultimate = key === "lienUltimate"
      const slot = ultimate ? "ultimate" : "auto"
      const skillId = combatSkillId("aw2-lien", slot)
      const targetIds =
        "targetIds" in healing ? healing.targetIds : [healing.targetId]
      const amount = ultimate
        ? source.attack * LIEN_TUNING.ultimateMultipliers[healing.index] +
          LIEN_TUNING.ultimateFlats[healing.index]
        : source.attack * LIEN_TUNING.hotMultiplier + LIEN_TUNING.hotFlat
      for (const id of targetIds) {
        const target = byId(battle, id)
        if (!target || target.hp <= 0 || target.side !== source.side) {
          record(battle, "miss", source.id, [id], {
            skillId,
            actionId: healing.id,
            text: "Không hồi sinh hoặc đổi người nhận sau khi cam kết.",
          })
          continue
        }
        applyHeal(battle, source, target, amount, skillId, {
          actionId: healing.id,
          contactIndex: ultimate ? healing.index : 0,
        })
      }
      healing.index++
      if (healing.index >= (ultimate ? 2 : LIEN_TUNING.hotPulses)) {
        delete source[key]
        record(battle, "status", source.id, [], {
          skillId,
          actionId: healing.id,
          statusEffect: ultimate ? "lien-pulses" : "lien-hot",
          statusChange: "remove",
          text: "Đã hết số nhịp hồi phục.",
        })
      } else healing.nextPulseTick += LIEN_TUNING.pulseInterval
    }
  }
}

function removeMocField(
  battle: CombatBattle,
  source: CombatActor,
  key: "mocMark" | "mocBurst",
  reason: string,
) {
  const field = source[key]
  if (!field) return
  delete source[key]
  record(battle, "status", source.id, [], {
    skillId: combatSkillId("aw2-moc", key === "mocMark" ? "auto" : "ultimate"),
    actionId: field.id,
    statusEffect: key === "mocMark" ? "moc-mark" : "moc-burst",
    statusChange: "remove",
    text: reason,
  })
}

function cleanupMocFields(battle: CombatBattle, terminal = false) {
  for (const source of battle.actors) {
    if (
      terminal ||
      source.hp <= 0 ||
      (source.mocMark && source.mocMark.expiresAtTick <= battle.tick)
    )
      removeMocField(battle, source, "mocMark", "Dấu lá đã tan.")
    if (terminal || source.hp <= 0)
      removeMocField(battle, source, "mocBurst", "Kết tụ đã dừng.")
  }
}

function resolveMocFields(battle: CombatBattle) {
  cleanupMocFields(battle)
  for (const source of living(battle).filter((a) => a.spiritId === "aw2-moc")) {
    for (const key of ["mocMark", "mocBurst"] as const) {
      const field = source[key]
      if (!field) continue
      if (key === "mocMark" && source.mocMark!.armedAtTick > battle.tick)
        continue
      if (key === "mocBurst" && source.mocBurst!.resolveTick > battle.tick)
        continue
      const targets = mocOccupants(
        battle,
        source,
        field.center,
        key === "mocMark" ? MOC_TUNING.markRadius : MOC_TUNING.burstRadius,
      )
      if (key === "mocMark" && !targets.length) continue
      const amount =
        key === "mocMark"
          ? source.attack * MOC_TUNING.markMultiplier
          : source.mocBurst!.amount
      const skillId = combatSkillId(
        "aw2-moc",
        key === "mocMark" ? "auto" : "ultimate",
      )
      removeMocField(battle, source, key, "Đã dùng hết một lần kích hoạt.")
      if (!targets.length)
        record(battle, "miss", source.id, [], {
          skillId,
          actionId: field.id,
          text: "Không còn đối thủ trong vùng cố định.",
        })
      for (const target of targets)
        applyDamage(battle, source, target, amount, skillId, undefined, {
          actionId: field.id,
          contactIndex: 0,
        })
      checkResult(battle)
      if (battle.status !== "active") return
    }
  }
}

function endVanLink(
  battle: CombatBattle,
  source: CombatActor,
  reason:
    | "expiry"
    | "defeat"
    | "cleanse"
    | "replacement"
    | "source"
    | "terminal",
) {
  const link = source.vanLink
  if (!link) return
  delete source.vanLink
  record(battle, "status", source.id, [link.enemyId], {
    skillId: combatSkillId("aw2-van", "auto"),
    actionId: link.id,
    statusEffect: "van-link",
    statusChange: reason === "cleanse" ? "dispel" : "remove",
    text: `Nối Hai Đầu kết thúc: ${reason}.`,
  })
  if (
    ["source", "terminal", "replacement"].includes(reason) ||
    source.hp <= 0 ||
    battle.status !== "active" ||
    !living(battle, "player").length ||
    !living(battle, "enemy").length ||
    link.supportedShield <= 0 ||
    battle.tick < (source.vanPassiveUntilTick ?? 0)
  )
    return
  const ally = link.allyId ? byId(battle, link.allyId) : undefined
  if (
    !ally ||
    ally.hp <= 0 ||
    ally.hp >= ally.maxHp ||
    ally.side !== source.side ||
    ally.summoned ||
    distance(source, ally) > VAN_TUNING.allyRange
  )
    return
  const amount = Math.min(
    link.supportedShield,
    Math.round(
      source.attack * VAN_TUNING.memoryMultiplier + VAN_TUNING.memoryFlat,
    ),
    ally.maxHp - ally.hp,
  )
  if (amount <= 0) return
  applyHeal(battle, source, ally, amount, combatSkillId("aw2-van", "passive"), {
    actionId: link.id,
    contactIndex: 0,
  })
  source.vanPassiveUntilTick = battle.tick + VAN_TUNING.memoryCooldown
}
function cleanupVanLinks(battle: CombatBattle, terminal = false) {
  for (const source of battle.actors) {
    const link = source.vanLink
    if (!link) continue
    if (terminal) endVanLink(battle, source, "terminal")
    else if (source.hp <= 0) endVanLink(battle, source, "source")
    else if (!byId(battle, link.enemyId)?.hp)
      endVanLink(battle, source, "defeat")
    else if (link.endsAtTick <= battle.tick)
      endVanLink(battle, source, "expiry")
  }
}
function grantVanShield(
  battle: CombatBattle,
  source: CombatActor,
  target: CombatActor,
  amount: number,
  skillId: string,
  duration: number,
  actionId: string,
) {
  const actual = Math.min(
    Math.max(0, Math.round(amount)),
    vanShieldRoom(target),
  )
  if (actual <= 0) return 0
  applyShield(battle, source, target, actual, skillId, duration, {
    actionId,
    contactIndex: 0,
  })
  return actual
}

function expireTimedState(battle: CombatBattle) {
  cleanupVanLinks(battle)
  cleanupMocFields(battle)
  cleanupLienHealing(battle)
  cleanupHaiFields(battle)
  cleanupMuoiMarks(battle)
  for (const actor of battle.actors) {
    if ((actor.nhienRecoveryUntilTick ?? Infinity) <= battle.tick)
      delete actor.nhienRecoveryUntilTick
    if (
      actor.nhienRhythm &&
      battle.tick >=
        actor.nhienRhythm.windowStartTick + NHIEN_TUNING.rhythmWindowTicks
    ) {
      actor.nhienRhythm.targetIds = []
      actor.nhienRhythm.windowStartTick = battle.tick
    }
    const kit = actor.bossKit

    if (kit && kit.barrierHits > 0 && battle.tick >= kit.barrierExpiresAtTick) {
      kit.barrierHits = 0

      kit.barrierExpiresAtTick = 0

      record(battle, "status", actor.id, [actor.id], {
        skillId: FORGOTTEN_HOST_SKILLS.barrier.id,
        text: "Ghế trống tự tan.",
      })
    }
    if (
      actor.shield > 0 &&
      actor.shieldExpiresAtTick &&
      battle.tick >= actor.shieldExpiresAtTick
    ) {
      actor.shield = 0
      actor.shieldExpiresAtTick = 0
      armThanPassive(battle, actor)
    }
    if (
      actor.interruptGuardCharges &&
      battle.tick >= actor.interruptGuardUntilTick
    ) {
      actor.interruptGuardCharges = 0
      actor.interruptGuardUntilTick = 0
    }
  }
}

function queueEffect(
  battle: CombatBattle,
  source: CombatActor,
  kind: CombatEffectKind,
  skillId: string,
  targetId: string | null,
  amount: number,
  resolveTick: number,
  extra: Pick<CombatEffect, "areaCenter" | "areaRadius" | "pull"> = {},
  projectile = false,
) {
  const serial = ++battle.actionSerial
  const projectileId = projectile ? `projectile:${serial}` : undefined
  const effect: CombatEffect = {
    id: `effect:${serial}`,
    serial,
    sourceId: source.id,
    skillId,
    kind,
    resolveTick,
    targetId,
    amount,
    ...(projectileId ? { projectileId } : {}),
    ...extra,
  }
  battle.effects.push(effect)
  if (projectileId)
    record(battle, "projectile-launch", source.id, targetId ? [targetId] : [], {
      skillId,
      projectileId,
      resolveTick,
    })
}

function startCast(
  battle: CombatBattle,
  actor: CombatActor,
  slot: "auto" | "ultimate",
  targetId: string | null,
  ticks: number,
) {
  const skillId = isCombatSpiritId(actor.spiritId)
    ? combatSkillId(actor.spiritId, slot)
    : `${actor.spiritId}:skill:${slot}`
  const cast: CombatCast = {
    id: `cast:${++battle.actionSerial}`,
    sourceId: actor.id,
    skillId,
    slot,
    targetId,
    commitTick: battle.tick + ticks,
    ...(["aw2-nhien", "aw2-hai", "aw2-bach"].includes(actor.spiritId) &&
    targetId &&
    byId(battle, targetId)
      ? { facing: nhienFacing(actor, byId(battle, targetId)!) }
      : {}),
  }
  actor.cast = cast
  record(battle, "cast-start", actor.id, targetId ? [targetId] : [], {
    skillId,
  })
}

function startNhienSequence(
  battle: CombatBattle,
  actor: CombatActor,
  slot: NhienSequence["slot"],
  targetId: string,
  firstContactTick: number,
  facing: 1 | -1,
  actionId = `nhien:${++battle.actionSerial}`,
) {
  actor.nhienSequence = {
    id: actionId,
    slot,
    targetId,
    facing,
    firstContactTick,
    nextIndex: 0,
  }
  actor.nhienRecoveryUntilTick =
    firstContactTick +
    nhienMultipliers(slot).length -
    1 +
    NHIEN_TUNING.recoveryTicks +
    1
  actor.nextBasicTick = Math.max(
    actor.nextBasicTick,
    actor.nhienRecoveryUntilTick,
  )
  if (slot === "basic")
    record(battle, "cast-start", actor.id, [targetId], {
      skillId: combatSkillId("aw2-nhien", slot),
      actionId,
      text: "Nhịp Chảo chuẩn bị hai điểm chạm.",
    })
}

function resolveNhienSequences(battle: CombatBattle) {
  const order = [...battle.actors].sort(
    (a, b) =>
      a.side.localeCompare(b.side) ||
      a.slot - b.slot ||
      a.id.localeCompare(b.id),
  )
  for (const source of order) {
    const action = source.nhienSequence
    if (
      !action ||
      source.hp <= 0 ||
      action.firstContactTick + action.nextIndex > battle.tick
    )
      continue
    const index = action.nextIndex++
    const skillId = combatSkillId("aw2-nhien", action.slot)
    const candidates = nhienTargets(
      battle,
      source,
      action.slot === "auto" ? action.facing : undefined,
    )
    const preferred = byId(battle, action.targetId)
    // A dead target may fall back inside melee range; a living one can dodge by leaving it.
    const target = preferred?.hp ? preferred : candidates[0]
    const targets =
      action.slot === "auto"
        ? candidates.slice(0, NHIEN_TUNING.maxSweepTargets)
        : target &&
            target.side !== source.side &&
            distance(source, target) <= source.range
          ? [target]
          : []
    if (action.slot !== "auto" && targets[0]) action.targetId = targets[0].id
    const contact = { actionId: action.id, contactIndex: index }
    if (!targets.length)
      record(battle, "miss", source.id, target ? [target.id] : [], {
        skillId,
        ...contact,
        text: "Điểm chạm không còn mục tiêu cận chiến hợp lệ.",
      })
    for (const victim of targets)
      applyDamage(
        battle,
        source,
        victim,
        source.attack * nhienMultipliers(action.slot)[index],
        skillId,
        undefined,
        contact,
      )
    if (action.nextIndex >= nhienMultipliers(action.slot).length) {
      delete source.nhienSequence
      record(battle, "status", source.id, [source.id], {
        skillId,
        actionId: action.id,
        statusEffect: "nhien-recovery",
        statusChange: "apply",
        expiresAtTick: source.nhienRecoveryUntilTick,
        text: `Hồi thế đến nhịp${source.nhienRecoveryUntilTick}.`,
      })
    }
  }
}

function applyShield(
  battle: CombatBattle,
  source: CombatActor,
  target: CombatActor,
  amount: number,
  skillId: string,
  duration = 5,
  contact: Pick<CombatEvent, "actionId" | "contactIndex"> = {},
) {
  if (target.hp <= 0) {
    record(battle, "miss", source.id, [target.id], {
      skillId,
      text: "Mục tiêu khiên không còn hợp lệ.",
    })
    return
  }
  const cap = Math.max(1, Math.round(target.maxHp * 0.45))
  const previous = target.shield
  target.shield = Math.min(cap, target.shield + Math.max(0, Math.round(amount)))
  target.shieldExpiresAtTick = Math.max(
    target.shieldExpiresAtTick,
    battle.tick + duration,
  )
  record(battle, "shield", source.id, [target.id], {
    skillId,
    amount: target.shield - previous,
    ...contact,
  })
  if (
    source.spiritId === "aw2-moc-non" &&
    target.id !== source.id &&
    !source.passive.mocSupportedIds.includes(target.id)
  ) {
    source.passive.mocSupportedIds.push(target.id)
    source.passive.mocSupportedIds = source.passive.mocSupportedIds.slice(-2)
    if (source.passive.mocSupportedIds.length === 2) {
      source.nextBasicTick = Math.max(battle.tick + 1, source.nextBasicTick - 1)
      source.passive.mocSupportedIds = []
      record(battle, "status", source.id, [source.id], {
        skillId: combatSkillId("aw2-moc-non", "passive"),
        text: "Mỗi Người Một Tay tăng nhịp kế tiếp.",
      })
    }
  }
}

function applyHeal(
  battle: CombatBattle,
  source: CombatActor,
  target: CombatActor,
  amount: number,
  skillId: string,
  contact: Pick<CombatEvent, "actionId" | "contactIndex"> = {},
) {
  if (target.hp <= 0) {
    record(battle, "miss", source.id, [target.id], {
      skillId,
      text: "Không thể hồi sinh mục tiêu đã bị hạ.",
    })
    return
  }
  const rounded = Math.max(0, Math.round(amount))
  const missing = target.maxHp - target.hp
  const restored = Math.min(missing, rounded)
  target.hp += restored
  record(battle, "heal", source.id, [target.id], {
    skillId,
    amount: restored,
    ...contact,
  })
  if (
    source.spiritId === "aw2-lien" &&
    source.hp > 0 &&
    restored > 0 &&
    lienDebuff(target, battle.tick) &&
    !(
      target.interruptGuardCharges > 0 &&
      target.interruptGuardUntilTick > battle.tick
    ) &&
    battle.tick >= (source.lienGuardCooldowns?.[target.id] ?? 0)
  ) {
    target.interruptGuardCharges = 1
    target.interruptGuardUntilTick = battle.tick + LIEN_TUNING.guardTicks
    ;(source.lienGuardCooldowns ??= {})[target.id] =
      battle.tick + LIEN_TUNING.guardCooldown
    record(battle, "status", source.id, [target.id], {
      skillId: combatSkillId("aw2-lien", "passive"),
      statusEffect: "lien-guard",
      statusChange: "apply",
      amount: 1,
      expiresAtTick: target.interruptGuardUntilTick,
      text: "Lời Hẹn Còn Đây: kháng một lần gián đoạn có giới hạn.",
    })
  }
  if (source.spiritId === "aw2-lam" && rounded > restored) {
    const cap = Math.round(target.maxHp * 0.2)
    const previous = target.shield
    target.shield = Math.min(cap, target.shield + rounded - restored)
    target.shieldExpiresAtTick = Math.max(
      target.shieldExpiresAtTick,
      battle.tick + 5,
    )
    if (target.shield > previous)
      record(battle, "shield", source.id, [target.id], {
        skillId: combatSkillId("aw2-lam", "passive"),
        amount: target.shield - previous,
        text: "Để Nguội Vừa chuyển hồi phục dư thành bảo vệ.",
      })
  }
}

function luaFocusBonus(
  battle: CombatBattle,
  source: CombatActor,
  target: CombatActor,
  skillId: string,
): number {
  if (
    source.spiritId !== "aw2-lua" ||
    skillId !== combatSkillId("aw2-lua", "basic")
  )
    return 0
  if (source.passive.luaFocusTargetId !== target.id) {
    source.passive.luaFocusTargetId = target.id
    source.passive.luaFocus = 0
  }
  source.passive.luaFocus = Math.min(3, source.passive.luaFocus + 1)
  if (source.passive.luaFocus < 3) return 0
  source.passive.luaFocus = 0
  record(battle, "status", source.id, [target.id], {
    skillId: combatSkillId("aw2-lua", "passive"),
    text: "Đúng Giờ đạt nhịp nhấn.",
  })
  return Math.round(source.attack * 0.45)
}

function updateBachPassive(
  battle: CombatBattle,
  target: CombatActor,
  attacker: CombatActor,
  absorbed: number,
) {
  if (
    target.spiritId !== "aw2-bach" ||
    target.hp <= 0 ||
    attacker.side === target.side ||
    absorbed <= 0
  )
    return
  if (battle.tick < (target.bachShareUntilTick ?? 0)) {
    target.bachGuarded = 0
    return
  }
  target.bachGuarded = Math.min(
    bachThreshold(target),
    (target.bachGuarded ?? 0) + absorbed,
  )
  if (target.bachGuarded < bachThreshold(target)) return
  const ally = bachShareTarget(battle, target)
  if (!ally) return
  const previous = ally.shield
  applyShield(
    battle,
    target,
    ally,
    Math.max(1, Math.round(target.maxHp * BACH_TUNING.shareRatio)),
    combatSkillId("aw2-bach", "passive"),
    BACH_TUNING.shareTicks,
  )
  if (ally.shield > previous) {
    target.bachGuarded = 0
    target.bachShareUntilTick = battle.tick + BACH_TUNING.shareCooldown
  }
}

function resolveBachStrikes(battle: CombatBattle) {
  for (const source of living(battle).filter(
    (a) => a.spiritId === "aw2-bach",
  )) {
    const strike = source.bachStrike
    if (!strike || strike.resolveTick > battle.tick) continue
    delete source.bachStrike
    const skillId = combatSkillId("aw2-bach", "basic")
    const target = byId(battle, strike.targetId)
    if (
      !target ||
      target.hp <= 0 ||
      target.side === source.side ||
      distance(source, target) > source.range
    ) {
      record(battle, "miss", source.id, [strike.targetId], {
        skillId,
        actionId: strike.id,
        text: "Mối Buộc hụt điểm chạm; không đổi mục tiêu.",
      })
      continue
    }
    applyDamage(battle, source, target, source.attack, skillId, undefined, {
      actionId: strike.id,
      contactIndex: 0,
    })
  }
}

function applyDamage(
  battle: CombatBattle,
  source: CombatActor,
  target: CombatActor,
  rawAmount: number,
  skillId: string,
  projectileId?: string,
  contact: Pick<CombatEvent, "actionId" | "contactIndex"> = {},
) {
  if (target.hp <= 0) {
    record(battle, "miss", source.id, [target.id], {
      skillId,
      ...contact,
      ...(projectileId ? { projectileId } : {}),
      text: "Đòn đã phóng không đổi hướng sau khi mục tiêu bị hạ.",
    })
    return
  }

  const protection = target.bossKit
  if (protection && protection.barrierHits > 0) {
    if (skillId.endsWith(":skill:basic")) {
      protection.barrierHits--
      source.energy = Math.min(ULTIMATE_ENERGY, source.energy + 12)
      if (protection.barrierHits === 0) protection.barrierExpiresAtTick = 0
      record(battle, "status", target.id, [target.id], {
        skillId: FORGOTTEN_HOST_SKILLS.barrier.id,
        text: `Ghế trống còn ${protection.barrierHits} đòn thường.`,
      })
    }
    // The contact which breaks the barrier is absorbed too; subsequent hits damage HP.
    record(battle, "hit", source.id, [target.id], {
      skillId,
      ...contact,
      amount: 0,
      absorbed: 0,
      ...(projectileId ? { projectileId } : {}),
      text: "Ghế trống chặn đòn.",
    })
    return
  }
  let raw = rawAmount + luaFocusBonus(battle, source, target, skillId)
  raw *= Math.min(
    source.weakenUntilTick > battle.tick ? 0.75 : 1,
    muoiDamageMultiplier(source, battle.tick),
    vanDamageMultiplier(battle, source),
  )
  const mitigated = Math.max(
    1,
    Math.round((raw * 100) / (100 + target.defense)),
  )
  const line = absorbHaiLine(battle, source, target, mitigated)
  const blocked = line?.blocked ?? 0
  if (line)
    record(battle, "status", line.protector.id, [target.id], {
      skillId: combatSkillId("aw2-hai", "ultimate"),
      statusEffect: "hai-block",
      statusChange: "block",
      amount: blocked,
      text: `Bờ Đợi chặn ${blocked} sát thương phía trước.`,
    })
  const absorbed = Math.min(target.shield, mitigated - blocked)
  target.shield -= absorbed
  if (absorbed && target.shield === 0) {
    target.shieldExpiresAtTick = 0
    armThanPassive(battle, target)
  }
  const hpDamage = Math.min(target.hp, mitigated - blocked - absorbed)
  target.hp -= hpDamage
  source.damageDealt = (source.damageDealt ?? 0) + hpDamage + absorbed
  if (skillId.endsWith(":skill:basic"))
    source.energy = Math.min(ULTIMATE_ENERGY, source.energy + 12)
  target.energy = Math.min(ULTIMATE_ENERGY, target.energy + 4)
  record(battle, "hit", source.id, [target.id], {
    skillId,
    ...contact,
    amount: hpDamage,
    absorbed,
    ...(blocked > 0 ? { blocked } : {}),
    ...(projectileId ? { projectileId } : {}),
  })
  updateBachPassive(battle, target, source, absorbed)
  if (hpDamage + absorbed > 0) {
    const gained = grantNhienRhythm(source, target, battle.tick)
    if (gained > 0)
      record(battle, "status", source.id, [source.id], {
        skillId: combatSkillId("aw2-nhien", "passive"),
        statusEffect: "nhien-energy",
        statusChange: "gain-energy",
        amount: gained,
        text: `Bếp Đông hồi ${gained} năng lượng có giới hạn.`,
      })
  }
  if (
    source.spiritId === "aw2-muoi" &&
    source.hp > 0 &&
    target.hp > 0 &&
    skillId === combatSkillId("aw2-muoi", "basic") &&
    hpDamage + absorbed > 0
  ) {
    const mark = target.muoiMarks?.[source.id]
    if (mark && mark.expiresAtTick > battle.tick) {
      const expiresAtTick = Math.min(
        mark.capTick,
        mark.expiresAtTick + MUOI_TUNING.refreshTicks,
      )
      if (expiresAtTick > mark.expiresAtTick) {
        mark.expiresAtTick = expiresAtTick
        record(battle, "status", source.id, [target.id], {
          skillId: combatSkillId("aw2-muoi", "passive"),
          statusEffect: "muoi-mark",
          statusChange: "refresh",
          expiresAtTick,
          text: "Vị Còn Lại gia hạn dấu trong giới hạn.",
        })
      }
    }
  }
  if (
    source.spiritId === "aw2-than" &&
    skillId === combatSkillId("aw2-than", "basic") &&
    source.passive.thanArmed &&
    target.hp > 0
  ) {
    source.passive.thanArmed = false
    target.weakenUntilTick = Math.max(target.weakenUntilTick, battle.tick + 4)
    record(battle, "status", source.id, [target.id], {
      skillId: combatSkillId("aw2-than", "passive"),
      text: "Than Còn Ấm làm yếu đòn đánh kế tiếp của mục tiêu.",
    })
  }
  if (
    source.spiritId === "aw2-suong" &&
    skillId === combatSkillId("aw2-suong", "auto") &&
    target.hp > 0
  ) {
    const cooldown = source.passive.suongSlowCooldowns[target.id] ?? 0
    if (battle.tick >= cooldown) {
      target.slowUntilTick = Math.max(target.slowUntilTick, battle.tick + 3)
      source.passive.suongSlowCooldowns[target.id] = battle.tick + 8
      record(battle, "status", source.id, [target.id], {
        skillId: combatSkillId("aw2-suong", "passive"),
        text: "Nét Còn Rõ làm chậm có giới hạn.",
      })
    }
  }
  if (target.hp === 0) {
    target.cast = null
    delete target.bachStrike
    target.bachGuarded = 0
    delete target.nhienSequence
    delete target.nhienRecoveryUntilTick
    record(battle, "defeat", source.id, [target.id], { skillId })
    cleanupMuoiMarks(battle)
  }
  cleanupVanLinks(battle)
  cleanupMocFields(battle)
  cleanupHaiFields(battle)
  cleanupLienHealing(battle)
  updateHaiPassives(battle)
}

function applyEffect(battle: CombatBattle, effect: CombatEffect) {
  const source = byId(battle, effect.sourceId)
  if (!source) return
  if (effect.areaCenter !== undefined && effect.areaRadius !== undefined) {
    const targets = living(battle, opponent(source.side))
      .filter(
        (target) =>
          Math.abs(target.position - effect.areaCenter!) <= effect.areaRadius!,
      )
      .sort(
        (left, right) =>
          left.slot - right.slot || left.id.localeCompare(right.id),
      )
    if (!targets.length)
      record(battle, "miss", source.id, [], {
        skillId: effect.skillId,
        text: "Không còn mục tiêu trong vùng hiệu lực.",
      })
    for (const target of targets) {
      applyDamage(
        battle,
        source,
        target,
        effect.amount,
        effect.skillId,
        effect.projectileId,
      )
      if (effect.pull && target.hp > 0 && !target.controlImmune) {
        const direction = effect.areaCenter > target.position ? 1 : -1
        target.position = clamp(
          target.position +
            direction *
              Math.min(
                effect.pull,
                Math.abs(effect.areaCenter - target.position),
              ),
          0,
          100,
        )
        record(battle, "status", source.id, [target.id], {
          skillId: effect.skillId,
          text: "Mục tiêu bị kéo trong giới hạn điều khiển.",
        })
      }
    }
    return
  }
  const target = effect.targetId ? byId(battle, effect.targetId) : undefined
  if (!target) {
    record(
      battle,
      "miss",
      source.id,
      effect.targetId ? [effect.targetId] : [],
      { skillId: effect.skillId, text: "Mục tiêu hiệu ứng không tồn tại." },
    )
    return
  }
  if (effect.kind === "damage")
    applyDamage(
      battle,
      source,
      target,
      effect.amount,
      effect.skillId,
      effect.projectileId,
    )
  if (effect.kind === "heal")
    applyHeal(battle, source, target, effect.amount, effect.skillId)
  if (effect.kind === "shield")
    applyShield(battle, source, target, effect.amount, effect.skillId)
  if (effect.kind === "interrupt-guard" && target.hp > 0) {
    target.interruptGuardCharges = Math.min(
      1,
      target.interruptGuardCharges + Math.round(effect.amount),
    )
    target.interruptGuardUntilTick = Math.max(
      target.interruptGuardUntilTick,
      battle.tick + 6,
    )
    record(battle, "status", source.id, [target.id], {
      skillId: effect.skillId,
      text: "Chung Một Mâm giảm một lần gián đoạn.",
    })
  }
}

function resolveDueEffects(battle: CombatBattle) {
  const due = battle.effects
    .filter((effect) => effect.resolveTick <= battle.tick)
    .sort(
      (left, right) =>
        left.resolveTick - right.resolveTick || left.serial - right.serial,
    )
  battle.effects = battle.effects.filter(
    (effect) => effect.resolveTick > battle.tick,
  )
  for (const effect of due) applyEffect(battle, effect)
}

function commitCast(
  battle: CombatBattle,
  actor: CombatActor,
  cast: CombatCast,
) {
  actor.cast = null
  const enemy =
    actor.spiritId === "aw2-moc"
      ? cast.targetId
        ? byId(battle, cast.targetId)
        : undefined
      : actor.spiritId === "aw2-muoi" && cast.slot === "auto"
        ? selectMuoiTarget(battle, actor)
        : selectEnemy(battle, actor, cast.targetId)
  const injuredAlly =
    cast.slot === "auto" && ["aw2-lam", "aw2-lien"].includes(actor.spiritId)
      ? actor.spiritId === "aw2-lien"
        ? selectLienAlly(battle, actor, cast.targetId)
        : selectInjuredAlly(battle, actor, cast.targetId)
      : undefined
  const shieldAlly =
    cast.slot === "auto" && actor.spiritId === "aw2-moc-non"
      ? selectShieldAlly(battle, actor, cast.targetId)
      : undefined
  const skillId = cast.skillId
  const teamTarget =
    cast.slot === "ultimate" &&
    ["aw2-than", "aw2-lam", "aw2-moc-non", "aw2-lien", "aw2-bach"].includes(
      actor.spiritId,
    )
  const committedTargets =
    actor.spiritId === "aw2-van"
      ? cast.slot === "auto"
        ? [cast.vanTargets?.allyId, cast.vanTargets?.enemyId].filter(
            (id): id is string => !!id,
          )
        : vanEmphasis(actor) === "protection"
          ? living(battle, actor.side)
              .filter(
                (a) =>
                  !a.summoned && distance(actor, a) <= VAN_TUNING.allyRange,
              )
              .map((a) => a.id)
          : cast.targetId
            ? [cast.targetId]
            : []
      : teamTarget
        ? living(battle, actor.side).map((ally) => ally.id)
        : cast.slot === "auto" &&
            ["aw2-than", "aw2-bach"].includes(actor.spiritId)
          ? [actor.id]
          : injuredAlly
            ? [injuredAlly.id]
            : shieldAlly
              ? [shieldAlly.id]
              : enemy
                ? [enemy.id]
                : []
  record(battle, "cast-commit", actor.id, committedTargets, { skillId })
  if (actor.spiritId === "aw2-van") {
    if (cast.slot === "auto") {
      const ally = cast.vanTargets?.allyId
        ? byId(battle, cast.vanTargets.allyId)
        : undefined
      const target = cast.vanTargets?.enemyId
        ? byId(battle, cast.vanTargets.enemyId)
        : undefined
      const supported =
        ally && vanSupportEligible(battle, actor, ally)
          ? grantVanShield(
              battle,
              actor,
              ally,
              actor.attack * VAN_TUNING.supportMultiplier +
                VAN_TUNING.supportFlat,
              skillId,
              VAN_TUNING.supportTicks,
              cast.id,
            )
          : 0
      const valid =
        target &&
        target.hp > 0 &&
        target.side !== actor.side &&
        !target.debuffImmune &&
        distance(actor, target) <= actor.range
      if (valid) {
        endVanLink(battle, actor, "replacement")
        actor.vanLink = {
          id: cast.id,
          enemyId: target.id,
          allyId: supported > 0 ? ally!.id : null,
          supportedShield: supported,
          endsAtTick: battle.tick + VAN_TUNING.linkTicks,
        }
        record(battle, "status", actor.id, [target.id], {
          skillId,
          actionId: cast.id,
          contactIndex: 0,
          statusEffect: "van-link",
          statusChange: "apply",
          expiresAtTick: actor.vanLink.endsAtTick,
          text: "Nối Hai Đầu: dấu giảm công10%, không cộng dồn.",
        })
      }
      if (!supported && !valid)
        record(battle, "miss", actor.id, [], {
          skillId,
          actionId: cast.id,
          text: "Cả hai nửa Nối Hai Đầu không còn hợp lệ; không đổi mục tiêu.",
        })
    } else if (vanEmphasis(actor) === "protection") {
      for (const ally of living(battle, actor.side).filter(
        (a) => !a.summoned && distance(actor, a) <= VAN_TUNING.allyRange,
      ))
        grantVanShield(
          battle,
          actor,
          ally,
          actor.attack * VAN_TUNING.wardMultiplier + VAN_TUNING.wardFlat,
          skillId,
          VAN_TUNING.wardTicks,
          cast.id,
        )
    } else {
      const target = cast.targetId ? byId(battle, cast.targetId) : undefined
      if (
        !target ||
        target.hp <= 0 ||
        target.side === actor.side ||
        distance(actor, target) > actor.range
      ) {
        record(battle, "miss", actor.id, cast.targetId ? [cast.targetId] : [], {
          skillId,
          actionId: cast.id,
          text: "Nhấn tấn công không còn mục tiêu trong tầm; không đổi mục tiêu.",
        })
        return
      }
      const center = target.position
      const targets = living(battle, opponent(actor.side))
        .filter((a) => Math.abs(a.position - center) <= VAN_TUNING.burstRadius)
        .sort(
          (a, b) =>
            Math.abs(a.position - center) - Math.abs(b.position - center) ||
            a.slot - b.slot ||
            a.id.localeCompare(b.id),
        )
        .slice(0, VAN_TUNING.burstTargets)
      for (const victim of targets)
        applyDamage(
          battle,
          actor,
          victim,
          actor.attack * VAN_TUNING.burstMultiplier,
          skillId,
          undefined,
          { actionId: cast.id, contactIndex: 0 },
        )
    }
    return
  }
  if (actor.spiritId === "aw2-bach") {
    if (cast.slot === "auto") {
      if (actor.shield > 0) {
        record(battle, "miss", actor.id, [actor.id], {
          skillId,
          text: "Đã có khiên khác; Gói Chắc không cộng thêm.",
        })
        return
      }
      applyShield(
        battle,
        actor,
        actor,
        Math.max(1, Math.round(actor.maxHp * BACH_TUNING.shellRatio)),
        skillId,
        BACH_TUNING.shellTicks,
        { actionId: cast.id, contactIndex: 0 },
      )
    } else {
      const budget = actor.shield
      actor.shield = 0
      actor.shieldExpiresAtTick = 0
      actor.bachGuarded = 0
      record(battle, "status", actor.id, [actor.id], {
        skillId,
        actionId: cast.id,
        statusEffect: "bach-release",
        statusChange: "remove",
        amount: budget,
        text: `Mở Vòng Dây dùng hết ${budget} khiên cá nhân.`,
      })
      const allies = bachAllies(battle, actor).sort(
        (a, b) => a.slot - b.slot || a.id.localeCompare(b.id),
      )
      for (const [index, ally] of allies.entries()) {
        const allocation =
          Math.floor(budget / allies.length) +
          (index < budget % allies.length ? 1 : 0)
        const actual = Math.min(
          allocation,
          Math.max(0, ordinaryShieldCap(ally) - ally.shield),
        )
        if (actual > 0)
          applyShield(
            battle,
            actor,
            ally,
            actual,
            skillId,
            BACH_TUNING.wardTicks,
            { actionId: cast.id, contactIndex: 0 },
          )
      }
      const targets = bachFront(
        battle,
        actor,
        cast.facing ?? (actor.side === "player" ? 1 : -1),
      )
      if (!targets.length)
        record(battle, "miss", actor.id, [], {
          skillId,
          actionId: cast.id,
          text: "Không có đối thủ trong tuyến trước ngắn.",
        })
      for (const target of targets)
        applyDamage(
          battle,
          actor,
          target,
          actor.attack * BACH_TUNING.impactMultiplier,
          skillId,
          undefined,
          { actionId: cast.id, contactIndex: 0 },
        )
    }
    return
  }
  if (actor.spiritId === "aw2-moc") {
    const target = cast.targetId ? byId(battle, cast.targetId) : undefined
    if (
      !target ||
      target.hp <= 0 ||
      target.side === actor.side ||
      distance(actor, target) > actor.range
    ) {
      record(battle, "miss", actor.id, cast.targetId ? [cast.targetId] : [], {
        skillId,
        actionId: cast.id,
        text: "Mục tiêu Mộc không còn hợp lệ trong tầm; không đổi mục tiêu.",
      })
      return
    }
    if (cast.slot === "auto") {
      const old = actor.mocMark
      const replacedAtNewPosition =
        old &&
        old.expiresAtTick > battle.tick &&
        Math.abs(old.center - target.position) >= MOC_TUNING.newPositionDistance
      removeMocField(battle, actor, "mocMark", "Dấu mới thay dấu cũ.")
      actor.mocMark = {
        id: cast.id,
        center: target.position,
        armedAtTick: battle.tick + MOC_TUNING.armTicks,
        expiresAtTick: battle.tick + MOC_TUNING.markTicks,
      }
      if (
        replacedAtNewPosition &&
        actor.shield === 0 &&
        battle.tick >= (actor.mocPassiveUntilTick ?? 0)
      ) {
        applyShield(
          battle,
          actor,
          actor,
          actor.maxHp * MOC_TUNING.passiveShieldRatio,
          combatSkillId("aw2-moc", "passive"),
          MOC_TUNING.passiveShieldTicks,
        )
        actor.mocPassiveUntilTick = battle.tick + MOC_TUNING.passiveCooldown
      }
      record(battle, "status", actor.id, [], {
        skillId,
        actionId: cast.id,
        statusEffect: "moc-mark",
        statusChange: "apply",
        areaCenter: target.position,
        resolveTick: actor.mocMark.armedAtTick,
        expiresAtTick: actor.mocMark.expiresAtTick,
        text: "Gieo Dấu: một vùng lá cố định, chờ đủ nhịp.",
      })
    } else {
      const mark = actor.mocMark
      const consumedMark = !!mark && mark.expiresAtTick > battle.tick
      const center = consumedMark ? mark!.center : target.position
      removeMocField(
        battle,
        actor,
        "mocMark",
        "Mở Gói Mùa Xanh thu dấu hợp lệ.",
      )
      actor.mocBurst = {
        id: cast.id,
        center,
        resolveTick: battle.tick + MOC_TUNING.burstDelay,
        amount:
          actor.attack *
          (consumedMark
            ? MOC_TUNING.markedBurstMultiplier
            : MOC_TUNING.burstMultiplier),
        consumedMark,
      }
      record(battle, "status", actor.id, [], {
        skillId,
        actionId: cast.id,
        statusEffect: "moc-burst",
        statusChange: "apply",
        areaCenter: center,
        resolveTick: actor.mocBurst.resolveTick,
        text: "Mở Gói Mùa Xanh: báo trước vùng kết tụ hai nhịp.",
      })
    }
    return
  }
  if (actor.spiritId === "aw2-lien") {
    if (cast.slot === "auto") {
      if (!injuredAlly || actor.lienHoT) {
        record(battle, "miss", actor.id, [], {
          skillId,
          text: "Không còn người nhận bị thương hoặc lời hẹn cũ chưa hết.",
        })
        return
      }
      actor.lienHoT = {
        id: cast.id,
        targetId: injuredAlly.id,
        nextPulseTick: battle.tick,
        index: 0,
      }
    } else {
      const targets = living(battle, actor.side)
      actor.lienUltimate = {
        id: cast.id,
        targetIds: targets.map((a) => a.id),
        nextPulseTick: battle.tick,
        index: 0,
      }
      for (const target of targets) {
        const cleansed = cleanseLienDebuff(target, battle.tick)
        if (cleansed)
          record(battle, "status", actor.id, [target.id], {
            skillId,
            actionId: cast.id,
            contactIndex: 0,
            statusEffect: "lien-cleanse",
            statusChange: "dispel",
            cleansedEffect: cleansed.kind,
            text: `Mở Lời tẩy một hiệu ứng: ${cleansed.kind}.`,
          })
      }
    }
    record(
      battle,
      "status",
      actor.id,
      cast.slot === "auto" ? [injuredAlly!.id] : committedTargets,
      {
        skillId,
        actionId: cast.id,
        statusEffect: cast.slot === "auto" ? "lien-hot" : "lien-pulses",
        statusChange: "apply",
        text:
          cast.slot === "auto"
            ? "Hẹn Sau Cơn Mệt đã cam kết ba nhịp."
            : "Mở Lời đã cam kết hai nhịp.",
      },
    )
    return
  }
  if (actor.spiritId === "aw2-hai") {
    const facing = cast.facing ?? (actor.side === "player" ? 1 : -1)
    if (cast.slot === "auto") {
      actor.haiZone = {
        center: clamp(actor.position + facing * HAI_TUNING.zoneRadius, 0, 100),
        radius: HAI_TUNING.zoneRadius,
        expiresAtTick: battle.tick + HAI_TUNING.zoneTicks,
      }
    } else {
      actor.haiLine = {
        position: clamp(
          actor.position + facing * HAI_TUNING.lineOffset,
          0,
          100,
        ),
        facing,
        expiresAtTick: battle.tick + HAI_TUNING.lineTicks,
        remaining: Math.max(
          1,
          Math.round(actor.maxHp * HAI_TUNING.lineCapacityRatio),
        ),
        createdTick: battle.tick,
      }
    }
    record(battle, "status", actor.id, [actor.id], {
      skillId,
      statusEffect: cast.slot === "auto" ? "hai-zone" : "hai-line",
      statusChange: "apply",
      expiresAtTick: (actor.haiZone && cast.slot === "auto"
        ? actor.haiZone
        : actor.haiLine)!.expiresAtTick,
      text:
        cast.slot === "auto"
          ? "Giữ Lối đã dựng vùng cố định."
          : "Bờ Đợi đã dựng tuyến chắn theo hướng.",
    })
    return
  }
  if (actor.spiritId === "aw2-nhien") {
    startNhienSequence(
      battle,
      actor,
      cast.slot,
      cast.targetId!,
      battle.tick,
      cast.facing ?? (actor.side === "player" ? 1 : -1),
      cast.id,
    )
    return
  }
  if (actor.spiritId === "aw2-muoi") {
    if (!enemy || distance(actor, enemy) > actor.range) {
      record(battle, "miss", actor.id, enemy ? [enemy.id] : [], {
        skillId,
        text: "Không còn mục tiêu hợp lệ trong tầm.",
      })
      return
    }
    if (cast.slot === "auto") applyMuoiMark(battle, actor, enemy)
    else {
      const removed = Math.floor(
        enemy.shield * MUOI_TUNING.shieldRemovalFraction,
      )
      if (removed > 0) {
        enemy.shield -= removed
        record(battle, "status", actor.id, [enemy.id], {
          skillId,
          statusEffect: "ordinary-shield",
          statusChange: "dispel",
          amount: removed,
          text: `Một Nhúm Đủ Rồi bóc ${removed} khiên thường.`,
        })
      }
      queueEffect(
        battle,
        actor,
        "damage",
        skillId,
        enemy.id,
        actor.attack * MUOI_TUNING.ultimateMultiplier,
        battle.tick,
      )
    }
    return
  }
  if (cast.slot === "auto") {
    if (actor.spiritId === "aw2-than")
      applyShield(battle, actor, actor, actor.attack + 28, skillId, 4)
    if (actor.spiritId === "aw2-lua" && enemy)
      moveToward(battle, actor, enemy, Math.max(actor.moveSpeed, 10), skillId)
    if (actor.spiritId === "aw2-lam") {
      const ally = injuredAlly
      if (ally)
        queueEffect(
          battle,
          actor,
          "heal",
          skillId,
          ally.id,
          actor.attack * 1.8 + 12,
          battle.tick,
        )
      else
        record(battle, "miss", actor.id, [], {
          skillId,
          text: "Không tiêu hồi phục khi cả đội đầy máu.",
        })
    }
    if (actor.spiritId === "aw2-moc-non") {
      const ally = shieldAlly
      if (ally)
        queueEffect(
          battle,
          actor,
          "shield",
          skillId,
          ally.id,
          actor.attack + 18,
          battle.tick,
        )
    }
    if (actor.spiritId === "aw2-suong" && enemy) {
      for (let offset = 0; offset < 3; offset++)
        queueEffect(
          battle,
          actor,
          "damage",
          skillId,
          null,
          actor.attack * 0.42,
          battle.tick + offset,
          {
            areaCenter: enemy.position,
            areaRadius: 10,
          },
        )
    }
    return
  }
  if (actor.spiritId === "aw2-than")
    for (const ally of living(battle, actor.side))
      applyShield(battle, actor, ally, actor.attack * 1.3 + 25, skillId, 6)
  if (actor.spiritId === "aw2-lua" && enemy)
    queueEffect(
      battle,
      actor,
      "damage",
      skillId,
      null,
      actor.attack * 1.7,
      battle.tick,
      {
        areaCenter: enemy.position,
        areaRadius: 14,
      },
    )
  if (actor.spiritId === "aw2-lam")
    for (const ally of living(battle, actor.side)) {
      queueEffect(
        battle,
        actor,
        "heal",
        skillId,
        ally.id,
        actor.attack * 1.5 + 10,
        battle.tick,
      )
      queueEffect(
        battle,
        actor,
        "heal",
        skillId,
        ally.id,
        actor.attack * 1.1 + 8,
        battle.tick + 2,
      )
    }
  if (actor.spiritId === "aw2-moc-non")
    for (const ally of living(battle, actor.side))
      queueEffect(
        battle,
        actor,
        "interrupt-guard",
        skillId,
        ally.id,
        1,
        battle.tick,
      )
  if (actor.spiritId === "aw2-suong" && enemy)
    queueEffect(
      battle,
      actor,
      "damage",
      skillId,
      null,
      actor.attack * 1.6,
      battle.tick,
      {
        areaCenter: enemy.position,
        areaRadius: 20,
        pull: 4,
      },
    )
}

function resolveDueCasts(battle: CombatBattle) {
  for (const actor of [...battle.actors].sort(
    (left, right) =>
      left.side.localeCompare(right.side) ||
      left.slot - right.slot ||
      left.id.localeCompare(right.id),
  )) {
    const cast = actor.cast
    if (!cast || cast.commitTick > battle.tick) continue
    if (actor.hp <= 0) {
      actor.cast = null
      continue
    }
    commitCast(battle, actor, cast)
  }
}

function moveToward(
  battle: CombatBattle,
  actor: CombatActor,
  target: CombatActor,
  requestedSpeed: number,
  skillId?: string,
) {
  const currentDistance = distance(actor, target)
  if (currentDistance <= actor.range) return
  const slowed = actor.slowUntilTick > battle.tick
  const speed = requestedSpeed * (slowed ? 0.5 : 1)
  const step = Math.min(speed, Math.max(0, currentDistance - actor.range))
  const direction = target.position > actor.position ? 1 : -1
  actor.position = clamp(actor.position + direction * step, 0, 100)
  record(battle, "move", actor.id, [target.id], {
    ...(skillId ? { skillId } : {}),
    amount: step,
  })
}

function basicCooldown(actor: CombatActor): number {
  return isCombatSpiritId(actor.spiritId)
    ? COMBAT_KITS[actor.spiritId].basicCooldown
    : 5
}

function performBasic(
  battle: CombatBattle,
  actor: CombatActor,
  target: CombatActor,
) {
  const skillId = isCombatSpiritId(actor.spiritId)
    ? combatSkillId(actor.spiritId, "basic")
    : `${actor.spiritId}:skill:basic`
  if (distance(actor, target) > actor.range) {
    moveToward(battle, actor, target, actor.moveSpeed, skillId)
    return
  }
  actor.nextBasicTick = battle.tick + basicCooldown(actor)
  if (actor.spiritId === "aw2-nhien") {
    startNhienSequence(
      battle,
      actor,
      "basic",
      target.id,
      battle.tick + NHIEN_TUNING.basicWindupTicks,
      nhienFacing(actor, target),
    )
    return
  }
  if (actor.spiritId === "aw2-bach") {
    const id = `bach:${++battle.actionSerial}`
    actor.bachStrike = {
      id,
      targetId: target.id,
      resolveTick: battle.tick + BACH_TUNING.basicWindup,
    }
    record(battle, "cast-start", actor.id, [target.id], {
      skillId,
      actionId: id,
      resolveTick: actor.bachStrike.resolveTick,
      text: "Mối Buộc chuẩn bị một điểm chạm nặng.",
    })
    return
  }
  const projectile = actor.projectileTicks > 0
  if (actor.spiritId === "aw2-lua") {
    queueEffect(
      battle,
      actor,
      "damage",
      skillId,
      target.id,
      actor.attack * 0.58,
      battle.tick,
    )
    queueEffect(
      battle,
      actor,
      "damage",
      skillId,
      target.id,
      actor.attack * 0.58,
      battle.tick + 1,
    )
    return
  }
  queueEffect(
    battle,
    actor,
    "damage",
    skillId,
    target.id,
    actor.attack,
    battle.tick + actor.projectileTicks,
    {},
    projectile,
  )
}

function tryAutoSkill(battle: CombatBattle, actor: CombatActor): boolean {
  if (actor.bossKit) return tryForgottenHostSkill(battle, actor)
  if (
    !isCombatSpiritId(actor.spiritId) ||
    battle.tick < actor.nextAutoTick ||
    actor.cast
  )
    return false
  const kit = COMBAT_KITS[actor.spiritId]
  const enemy = selectEnemy(battle, actor)
  if (actor.spiritId === "aw2-van") {
    const ally = vanAlly(battle, actor)
    const target = vanEnemy(battle, actor, ally ?? actor)
    if (!ally && !target) return false
    actor.nextAutoTick = battle.tick + kit.autoCooldown
    startCast(battle, actor, "auto", ally?.id ?? target!.id, kit.autoCastTicks)
    actor.cast!.vanTargets = {
      allyId: ally?.id ?? null,
      enemyId: target?.id ?? null,
    }
    return true
  }
  if (actor.spiritId === "aw2-bach") {
    if (actor.shield > 0) return false
    actor.nextAutoTick = battle.tick + kit.autoCooldown
    startCast(battle, actor, "auto", actor.id, kit.autoCastTicks)
    return true
  }
  if (actor.spiritId === "aw2-moc") {
    const target = mocEnemy(battle, actor)
    if (!target) return false
    actor.nextAutoTick = battle.tick + kit.autoCooldown
    startCast(battle, actor, "auto", target.id, kit.autoCastTicks)
    return true
  }
  if (actor.spiritId === "aw2-lien") {
    if (actor.lienHoT) return false
    const target = selectLienAlly(battle, actor)
    if (!target) return false
    actor.nextAutoTick = battle.tick + kit.autoCooldown
    startCast(battle, actor, "auto", target.id, kit.autoCastTicks)
    return true
  }
  if (actor.spiritId === "aw2-hai") {
    const target = haiNearbyEnemy(battle, actor)
    if (!target) return false
    actor.nextAutoTick = battle.tick + kit.autoCooldown
    startCast(battle, actor, "auto", target.id, kit.autoCastTicks)
    return true
  }
  if (actor.spiritId === "aw2-nhien") {
    const target = nhienTargets(battle, actor)[0]
    if (!target) return false
    actor.nextAutoTick = battle.tick + kit.autoCooldown
    startCast(battle, actor, "auto", target.id, kit.autoCastTicks)
    return true
  }
  if (actor.spiritId === "aw2-muoi") {
    const target = selectMuoiTarget(battle, actor)
    if (!target) return false
    actor.nextAutoTick = battle.tick + kit.autoCooldown
    startCast(battle, actor, "auto", target.id, kit.autoCastTicks)
    return true
  }
  let targetId: string | null = enemy?.id ?? null
  if (actor.spiritId === "aw2-than") {
    if (actor.shield > 0) return false
    targetId = actor.id
  }
  if (
    actor.spiritId === "aw2-lua" &&
    (!enemy || distance(actor, enemy) <= actor.range)
  )
    return false
  if (actor.spiritId === "aw2-lam") {
    const ally = selectInjuredAlly(battle, actor)
    if (!ally) return false
    targetId = ally.id
  }
  if (actor.spiritId === "aw2-moc-non") {
    const ally = selectShieldAlly(battle, actor)
    if (!ally) return false
    targetId = ally.id
  }
  if (!targetId && actor.spiritId === "aw2-suong") return false
  actor.nextAutoTick = battle.tick + kit.autoCooldown
  startCast(battle, actor, "auto", targetId, kit.autoCastTicks)
  return true
}

function tryForgottenHostSkill(
  battle: CombatBattle,
  actor: CombatActor,
): boolean {
  const kit = actor.bossKit!
  if (kit.intent || battle.tick < kit.nextSkillTick) return false
  const target = selectEnemy(battle, actor)
  if (!target) return false
  const phase = kit.phase++ % 3
  kit.nextSkillTick = battle.tick + 9
  if (phase === 0) {
    kit.barrierHits = 4
    kit.barrierExpiresAtTick = battle.tick + 8
    record(battle, "status", actor.id, [actor.id], {
      skillId: FORGOTTEN_HOST_SKILLS.barrier.id,
      text: "Ghế trống: phá bằng 4 đòn thường, tự tan sau 8 nhịp.",
    })
  } else {
    const kind = phase === 1 ? "sweep" : "snuff"
    kit.intent = {
      kind,
      startedTick: battle.tick,
      resolveTick: battle.tick + 3,
      areaCenter: kind === "sweep" ? target.position : 50,
      areaRadius: kind === "sweep" ? 14 : 100,
    }
    record(
      battle,
      "cast-start",
      actor.id,
      forgottenHostTargets(battle, actor).map((unit) => unit.id),
      {
        skillId: FORGOTTEN_HOST_SKILLS[kind].id,
        resolveTick: kit.intent.resolveTick,
        text: `${FORGOTTEN_HOST_SKILLS[kind].name}: còn 3 nhịp.`,
      },
    )
  }
  return true
}

function updateForgottenHostIntents(battle: CombatBattle) {
  for (const actor of battle.actors) {
    const kit = actor.bossKit
    if (!kit) continue
    if (actor.hp <= 0) {
      kit.intent = null
      kit.barrierHits = 0
      kit.barrierExpiresAtTick = 0
      continue
    }
    const intent = kit.intent
    if (!intent) continue
    const skill = FORGOTTEN_HOST_SKILLS[intent.kind]
    const targets = forgottenHostTargets(battle, actor)
    if (battle.tick < intent.resolveTick) {
      record(
        battle,
        "status",
        actor.id,
        targets.map((unit) => unit.id),
        {
          skillId: skill.id,
          resolveTick: intent.resolveTick,
          text: `${skill.name}: còn ${intent.resolveTick - battle.tick} nhịp.`,
        },
      )
      continue
    }
    kit.intent = null
    record(
      battle,
      "cast-commit",
      actor.id,
      targets.map((unit) => unit.id),
      { skillId: skill.id, text: skill.name },
    )
    for (const target of targets)
      applyDamage(
        battle,
        actor,
        target,
        actor.attack * (intent.kind === "sweep" ? 1 : 0.7),
        skill.id,
      )
  }
}

function actAutomatically(battle: CombatBattle) {
  const order = [...living(battle)].sort(
    (left, right) =>
      left.side.localeCompare(right.side) ||
      left.slot - right.slot ||
      left.id.localeCompare(right.id),
  )
  for (const actor of order) {
    if (
      actor.hp <= 0 ||
      actor.cast ||
      actor.bachStrike ||
      actor.bossKit?.intent ||
      nhienBusy(actor, battle.tick)
    )
      continue
    if (tryAutoSkill(battle, actor)) continue
    if (battle.tick < actor.nextBasicTick) continue
    const target = selectEnemy(battle, actor)
    if (target) performBasic(battle, actor, target)
  }
}

function checkResult(battle: CombatBattle) {
  if (battle.status !== "active") return
  const players = living(battle, "player").length
  const enemies = living(battle, "enemy").length
  if (players && enemies) return
  battle.status = players ? "player-win" : enemies ? "enemy-win" : "draw"
  cleanupVanLinks(battle, true)
  cleanupMocFields(battle, true)
  cleanupHaiFields(battle, true)
  cleanupLienHealing(battle, true)

  removeMuoiMarks(battle, "trận kết thúc", () => true)
  for (const actor of battle.actors) {
    actor.cast = null
    delete actor.bachStrike
    if (actor.spiritId === "aw2-bach") actor.bachGuarded = 0
    delete actor.nhienSequence
    delete actor.nhienRecoveryUntilTick
    if (actor.nhienRhythm) actor.nhienRhythm.targetIds = []

    if (actor.bossKit) {
      actor.bossKit.intent = null

      actor.bossKit.barrierHits = 0

      actor.bossKit.barrierExpiresAtTick = 0
    }
  }
  record(battle, "battle-end", null, [], { text: battle.status })
}

function advanceOneTick(battle: CombatBattle) {
  battle.tick++
  expireTimedState(battle)
  updateHaiPassives(battle)
  resolveDueCasts(battle)
  updateHaiZones(battle)
  resolveDueEffects(battle)
  checkResult(battle)
  if (battle.status !== "active") return

  resolveLienHealing(battle)

  resolveMocFields(battle)
  if (battle.status !== "active") return
  resolveBachStrikes(battle)
  resolveNhienSequences(battle)
  checkResult(battle)
  if (battle.status !== "active") return

  updateForgottenHostIntents(battle)

  checkResult(battle)

  if (battle.status !== "active") return
  actAutomatically(battle)
  resolveDueEffects(battle)
  checkResult(battle)
}

export function advanceCombatBattle(
  current: CombatBattle,
  steps = 1,
): CombatBattle {
  if (!Number.isInteger(steps) || steps < 1 || steps > MAX_TICKS_PER_COMMAND)
    throw Error(`Số tick phải từ 1 đến ${MAX_TICKS_PER_COMMAND}.`)
  if (current.status !== "active") return current
  const battle = copyBattle(current)
  for (let step = 0; step < steps && battle.status === "active"; step++)
    advanceOneTick(battle)
  return battle
}

export function castCombatUltimate(
  current: CombatBattle,
  actorId: string,
  targetId?: string,
): CombatBattle {
  if (current.status !== "active") throw Error("Trận đấu đã kết thúc.")
  const battle = copyBattle(current)
  const actor = byId(battle, actorId)
  if (
    !actor ||
    actor.side !== "player" ||
    actor.hp <= 0 ||
    !isCombatSpiritId(actor.spiritId)
  )
    throw Error("Vị Linh không thể dùng tuyệt kỹ.")
  if (actor.bachStrike) throw Error("Bách đang chuẩn bị điểm chạm nặng.")
  if (actor.cast) throw Error("Vị Linh đang thi triển kỹ năng khác.")
  if (actor.mocBurst) throw Error("Mộc đang chờ vùng kết tụ đã cam kết.")
  if (actor.lienUltimate)
    throw Error("Liên đang hoàn tất nhịp hồi phục đã cam kết.")
  if (nhienBusy(actor, battle.tick))
    throw Error("Nhiên đang nối nhịp hoặc hồi thế.")
  if (actor.energy < ULTIMATE_ENERGY)
    throw Error("Tuyệt kỹ chưa đủ năng lượng.")
  const needsEnemy =
    (actor.spiritId === "aw2-van" && vanEmphasis(actor) === "attack") ||
    ["aw2-lua", "aw2-suong", "aw2-muoi", "aw2-nhien", "aw2-moc"].includes(
      actor.spiritId,
    )
  if (needsEnemy) {
    const target = targetId ? byId(battle, targetId) : undefined
    if (!target?.hp || target.side !== "enemy")
      throw Error("Tuyệt kỹ cần một mục tiêu địch hợp lệ.")
    if (
      ["aw2-nhien", "aw2-moc", "aw2-van"].includes(actor.spiritId) &&
      distance(actor, target) > actor.range
    )
      throw Error(
        ["aw2-moc", "aw2-van"].includes(actor.spiritId)
          ? "Mục tiêu nằm ngoài tầm của kỹ năng."
          : "Mục tiêu nằm ngoài tầm cận chiến của Nhiên.",
      )
  }
  actor.energy = 0
  startCast(
    battle,
    actor,
    "ultimate",
    ["aw2-hai", "aw2-bach"].includes(actor.spiritId)
      ? (selectEnemy(battle, actor)?.id ?? null)
      : (targetId ?? null),
    COMBAT_KITS[actor.spiritId].ultimateCastTicks,
  )
  return battle
}

export function interruptCombatCast(
  current: CombatBattle,
  actorId: string,
): CombatBattle {
  if (current.status !== "active") throw Error("Trận đấu đã kết thúc.")
  const battle = copyBattle(current)
  const actor = byId(battle, actorId)
  if (
    !actor ||
    actor.hp <= 0 ||
    (!actor.cast && !actor.nhienSequence && !actor.bachStrike)
  )
    throw Error("Không có kỹ năng đang thi triển để ngắt.")
  const skillId =
    actor.cast?.skillId ??
    (actor.bachStrike
      ? combatSkillId("aw2-bach", "basic")
      : combatSkillId("aw2-nhien", actor.nhienSequence!.slot))
  if (
    actor.interruptGuardCharges > 0 &&
    actor.interruptGuardUntilTick > battle.tick
  ) {
    actor.interruptGuardCharges--
    record(battle, "interrupt-resist", actor.id, [actor.id], {
      skillId,
      text: "Giảm một lần gián đoạn.",
    })
    return battle
  }
  actor.cast = null
  delete actor.bachStrike
  if (actor.spiritId === "aw2-nhien") {
    delete actor.nhienSequence
    actor.nhienRecoveryUntilTick = battle.tick + NHIEN_TUNING.recoveryTicks + 1
    actor.nextBasicTick = Math.max(
      actor.nextBasicTick,
      actor.nhienRecoveryUntilTick,
    )
  }
  record(battle, "interrupt", actor.id, [actor.id], {
    skillId,
    text:
      actor.spiritId === "aw2-nhien"
        ? "Chuỗi nhịp bị ngắt; các điểm chạm còn lại đã hủy."
        : "Kỹ năng bị ngắt trước điểm commit.",
  })
  return battle
}

/** Explicit counterplay command for ephemeral combat; no saved-game writes. */
export function cleanseMuoiMarks(
  current: CombatBattle,
  targetId: string,
): CombatBattle {
  if (current.status !== "active") throw Error("Trận đấu đã kết thúc.")
  const target = byId(current, targetId)
  if (!target || target.hp <= 0) throw Error("Mục tiêu tẩy dấu không hợp lệ.")
  const battle = copyBattle(current)
  removeMuoiMarks(battle, "được tẩy", (_, actor) => actor.id === targetId)
  return battle
}

/** Explicit ephemeral counterplay; never writes saves or changes emphasis. */
export function cleanseVanLinks(
  current: CombatBattle,
  targetId: string,
): CombatBattle {
  if (current.status !== "active") throw Error("Trận đấu đã kết thúc.")
  const target = byId(current, targetId)
  if (!target || target.hp <= 0)
    throw Error("Mục tiêu tẩy dấu Vân không hợp lệ.")
  const battle = copyBattle(current)
  for (const source of battle.actors)
    if (source.vanLink?.enemyId === targetId)
      endVanLink(battle, source, "cleanse")
  return battle
}
