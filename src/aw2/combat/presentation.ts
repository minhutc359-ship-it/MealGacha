import type { CombatEvent, CombatEventKind, CombatSkillSlot } from "./types"

export type CombatAnimationState =
  | "idle"
  | "move"
  | "attack"
  | "cast"
  | "hit"
  | "guard"
  | "ultimate"
  | "defeat"

export interface ActorPresentation {
  state: CombatAnimationState
  serial: number
  tick: number
  skillId?: string
  /** Only an authoritative hit/heal may select a confirmed presentation beat. */
  contactIndex?: number
  phase?: "prepare" | "launch" | "confirmed"
  effectTargetId?: string
}

export interface HealingPulse {
  castSerial: number
  tick: number
  index: number
}

export interface ConfirmedEffect {
  serial: number
  tick: number
  skillId: string
  index: number
  targetId?: string
  /** Actual recipients of one area pulse; append only within its rules tick. */
  targetIds?: string[]
  actionId?: string
}

export interface ConfirmedContact {
  targetId: string
  tick: number
  index: number
}

export interface ProjectilePresentation {
  id: string
  serial: number
  sourceId: string
  targetId: string
  skillId: string
  launchTick: number
  resolveTick: number
}

export interface FloatingPresentation {
  serial: number
  tick: number
  kind: CombatEventKind
  targetId: string | null
  amount?: number
  text: string
}

export interface TerminalPresentation {
  serial: number
  tick: number
  text: string
}

export interface CombatPresentation {
  version: 1
  lastSerial: number
  actors: Record<string, ActorPresentation>
  contacts: Record<string, ConfirmedContact>
  healingPulses: Record<string, HealingPulse>
  /** Bounded per-source/slot effects survive simultaneous source pose changes. */
  effects: Record<string, Record<string, ConfirmedEffect>>
  projectiles: Record<string, ProjectilePresentation>
  floating: FloatingPresentation[]
  terminal: TerminalPresentation | null
}

export function createCombatPresentation(): CombatPresentation {
  return {
    version: 1,
    lastSerial: 0,
    actors: {},
    contacts: {},
    healingPulses: {},
    effects: {},
    projectiles: {},
    floating: [],
    terminal: null,
  }
}

function skillSlot(skillId?: string): CombatSkillSlot | null {
  const slot = skillId?.split(":").at(-1)
  return ["basic", "auto", "passive", "ultimate"].includes(slot ?? "")
    ? (slot as CombatSkillSlot)
    : null
}

function actorStateFor(event: CombatEvent): CombatAnimationState | null {
  const slot = skillSlot(event.skillId)
  if (event.kind === "move") return "move"
  if (event.kind === "cast-start" || event.kind === "cast-commit")
    return slot === "ultimate" ? "ultimate" : "cast"
  if (event.kind === "projectile-launch" || event.kind === "hit")
    return slot === "ultimate"
      ? "ultimate"
      : slot === "auto"
        ? "cast"
        : "attack"
  if (event.kind === "heal" || event.kind === "shield")
    return slot === "ultimate" ? "ultimate" : slot === "auto" ? "cast" : "guard"
  if (event.kind === "status" && slot === "passive") return "guard"
  return null
}

function displayText(event: CombatEvent): string | null {
  if (event.text) return event.text
  if (event.kind === "hit") return `-${event.amount ?? 0}`
  if (event.kind === "heal") return `+${event.amount ?? 0}`
  if (event.kind === "shield") return `Khiên +${event.amount ?? 0}`
  if (event.kind === "miss") return "Trượt"
  return null
}

function assertNextEvent(event: CombatEvent, previousSerial: number) {
  if (
    !Number.isSafeInteger(event.serial) ||
    event.serial !== previousSerial + 1
  )
    throw Error("Chuỗi event trình diễn phải liên tục và đúng thứ tự.")
  if (!Number.isSafeInteger(event.tick) || event.tick < 0)
    throw Error("Tick event trình diễn không hợp lệ.")
}

export function reduceCombatPresentation(
  current: CombatPresentation,
  events: readonly CombatEvent[],
): CombatPresentation {
  const incoming = events.filter((event) => event.serial > current.lastSerial)
  if (!incoming.length) return current
  const next = structuredClone(current)
  for (const event of incoming) {
    assertNextEvent(event, next.lastSerial)
    next.lastSerial = event.serial
    let sourceState = actorStateFor(event)
    let contactIndex: number | undefined
    let phase: ActorPresentation["phase"]
    const lamSkill = event.skillId?.startsWith("aw2-lam:skill:")
    const mocSkill = event.skillId?.startsWith("aw2-moc-non:skill:")
    const muoiSkill = event.skillId?.startsWith("aw2-muoi:skill:")
    const nhienSkill = event.skillId?.startsWith("aw2-nhien:skill:")
    if (event.skillId?.startsWith("aw2-hai:skill:") && event.sourceId) {
      const slot = skillSlot(event.skillId)!
      if (["cast-start", "cast-commit"].includes(event.kind)) phase = "prepare"
      const confirmed =
        (slot === "basic" && event.kind === "hit") ||
        (slot === "passive" &&
          event.kind === "shield" &&
          (event.amount ?? 0) > 0) ||
        (event.statusChange === "apply" &&
          ["hai-zone", "hai-line"].includes(event.statusEffect ?? ""))
      if (confirmed) {
        phase = "confirmed"
        contactIndex = 0
        ;(next.effects[event.sourceId] ??= {})[slot] = {
          serial: event.serial,
          tick: event.tick,
          skillId: event.skillId,
          index: 0,
          ...(slot === "basic" ? { targetId: event.targetIds[0] } : {}),
        }
        sourceState =
          slot === "ultimate"
            ? "ultimate"
            : slot === "auto"
              ? "cast"
              : slot === "basic"
                ? "attack"
                : "guard"
        const prior = next.actors[event.sourceId]
        if (
          slot === "passive" &&
          prior?.tick === event.tick &&
          prior.phase === "confirmed"
        )
          sourceState = null
      } else if (event.kind === "status" || event.kind === "shield")
        sourceState = null
      if (event.kind === "interrupt")
        next.actors[event.sourceId] = {
          state: "hit",
          serial: event.serial,
          tick: event.tick,
        }
    }
    if (nhienSkill && event.sourceId) {
      const slot = skillSlot(event.skillId)
      if (["cast-start", "cast-commit"].includes(event.kind)) {
        phase = "prepare"
        if (slot === "basic") sourceState = "attack"
      }
      const confirmed =
        (event.kind === "hit" && event.contactIndex !== undefined) ||
        (event.statusEffect === "nhien-energy" &&
          event.statusChange === "gain-energy" &&
          (event.amount ?? 0) > 0)
      if (confirmed && slot) {
        phase = "confirmed"
        contactIndex = event.contactIndex ?? 0
        const effects = (next.effects[event.sourceId] ??= {})
        const previous = effects[slot]
        if (
          slot === "auto" &&
          previous?.tick === event.tick &&
          previous.actionId === event.actionId
        ) {
          previous.targetIds = [
            ...new Set([...(previous.targetIds ?? []), ...event.targetIds]),
          ]
          sourceState = null
        } else {
          sourceState =
            slot === "ultimate"
              ? "ultimate"
              : slot === "basic"
                ? "attack"
                : slot === "auto"
                  ? "cast"
                  : "guard"
          effects[slot] = {
            serial: event.serial,
            tick: event.tick,
            skillId: event.skillId!,
            index: contactIndex,
            actionId: event.actionId,
            ...(slot === "auto"
              ? { targetIds: [...event.targetIds] }
              : { targetId: event.targetIds[0] }),
          }
        }
      }
      if (event.statusEffect === "nhien-recovery") sourceState = null
      const previous = next.actors[event.sourceId]
      if (
        slot === "passive" &&
        previous?.tick === event.tick &&
        previous.phase === "confirmed" &&
        previous.skillId !== event.skillId
      )
        sourceState = null
      if (event.kind === "interrupt") {
        // Stop the cancelled anticipation/contact pose as well as its rules
        // sequence. Previously confirmed finite FX keep their own clocks.
        next.actors[event.sourceId] = {
          state: "hit",
          serial: event.serial,
          tick: event.tick,
        }
      }
    }
    if (muoiSkill && event.sourceId) {
      const slot = skillSlot(event.skillId)
      if (["cast-start", "cast-commit"].includes(event.kind)) phase = "prepare"
      if (event.kind === "projectile-launch") phase = "launch"
      const confirmed =
        event.kind === "hit" ||
        (event.kind === "status" &&
          ["apply", "refresh", "dispel"].includes(event.statusChange ?? ""))
      if (confirmed && slot) {
        phase = "confirmed"
        contactIndex = 0
        const effects = (next.effects[event.sourceId] ??= {})
        if (slot === "ultimate" && effects[slot]?.tick === event.tick)
          sourceState = null
        else {
          sourceState =
            slot === "basic"
              ? "attack"
              : slot === "ultimate"
                ? "ultimate"
                : slot === "passive"
                  ? "guard"
                  : "cast"
          effects[slot] = {
            serial: event.serial,
            tick: event.tick,
            skillId: event.skillId!,
            index: 0,
            targetId: event.targetIds[0],
          }
        }
      }
      // Removal/cleanse is not a new proc. Preserve a simultaneous ultimate gesture.
      if (event.statusChange === "remove") sourceState = null
      const prior = next.actors[event.sourceId]
      if (
        prior?.tick === event.tick &&
        prior.phase === "confirmed" &&
        prior.skillId === "aw2-muoi:skill:ultimate" &&
        slot !== "ultimate"
      )
        sourceState = null
    }
    const suongSkill = event.skillId?.startsWith("aw2-suong:skill:")
    if (suongSkill && event.sourceId) {
      const slot = skillSlot(event.skillId)
      if (["cast-start", "cast-commit"].includes(event.kind)) phase = "prepare"
      if (event.kind === "projectile-launch") phase = "launch"
      const confirmed =
        event.kind === "hit" || (slot === "passive" && event.kind === "status")
      if (confirmed && slot) {
        const effects = (next.effects[event.sourceId] ??= {})
        const prior = effects[slot]
        phase = "confirmed"
        contactIndex = 0
        if (slot !== "basic" && prior?.tick === event.tick) {
          // A zone pulse emits one event per actual recipient. Partial batches
          // extend that pulse without restarting its source gesture/FX clock.
          prior.targetIds = [
            ...new Set([...(prior.targetIds ?? []), ...event.targetIds]),
          ]
          sourceState = null
        } else {
          sourceState =
            slot === "ultimate"
              ? "ultimate"
              : slot === "passive"
                ? "guard"
                : slot === "auto"
                  ? "cast"
                  : "attack"
          effects[slot] = {
            serial: event.serial,
            tick: event.tick,
            skillId: event.skillId!,
            index: 0,
            ...(slot === "basic"
              ? { targetId: event.targetIds[0] }
              : { targetIds: [...event.targetIds] }),
          }
        }
      }
      const previous = next.actors[event.sourceId]
      // Interleaved slow/pull statuses are outcomes, not extra damage contacts.
      if (event.kind === "status" && slot === "ultimate") sourceState = null
      if (
        previous?.tick === event.tick &&
        previous.phase === "confirmed" &&
        previous.skillId === "aw2-suong:skill:ultimate" &&
        slot !== "ultimate"
      )
        sourceState = null
    }
    if (lamSkill && event.sourceId) {
      const slot = skillSlot(event.skillId)
      if (["cast-start", "cast-commit"].includes(event.kind)) {
        phase = "prepare"
        if (slot === "ultimate")
          next.healingPulses[event.sourceId] = {
            castSerial: event.serial,
            tick: -1,
            index: -1,
          }
      }
      if (event.kind === "projectile-launch") phase = "launch"
      if (event.kind === "hit" || event.kind === "heal") {
        phase = "confirmed"
        contactIndex = 0
        if (slot === "ultimate" && event.kind === "heal") {
          const prior = next.healingPulses[event.sourceId]
          // One rules pulse can heal several allies, in separate batches and
          // interleaved with overheal shields. Never restart it per recipient.
          if (prior?.tick === event.tick || (prior?.index ?? -1) >= 1)
            sourceState = null
          else {
            contactIndex = prior?.index === 0 ? 1 : 0
            next.healingPulses[event.sourceId] = {
              castSerial: prior?.castSerial ?? event.serial,
              tick: event.tick,
              index: contactIndex,
            }
          }
        }
      }
      if (slot === "passive" && event.kind === "shield") {
        if (
          next.actors[event.sourceId]?.phase === "confirmed" &&
          next.actors[event.sourceId]?.tick === event.tick &&
          ["aw2-lam:skill:auto", "aw2-lam:skill:ultimate"].includes(
            next.actors[event.sourceId]?.skillId ?? "",
          )
        )
          sourceState = null
        else {
          phase = "confirmed"
          contactIndex = 0
        }
      }
      if (sourceState && phase === "confirmed" && slot && slot !== "passive") {
        const effects = (next.effects[event.sourceId] ??= {})
        effects[slot] = {
          serial: event.serial,
          tick: event.tick,
          skillId: event.skillId!,
          index: contactIndex ?? 0,
          ...(event.kind === "hit" && event.targetIds[0]
            ? { targetId: event.targetIds[0] }
            : {}),
        }
      }
      const previous = next.actors[event.sourceId]
      // Rules may heal and launch/commit another action in the same tick.
      // Keep the ultimate gesture; both confirmed effects retain their clocks.
      if (
        previous?.tick === event.tick &&
        previous.phase === "confirmed" &&
        previous.skillId === "aw2-lam:skill:ultimate" &&
        slot !== "ultimate"
      )
        sourceState = null
    }
    if (mocSkill && event.sourceId) {
      const slot = skillSlot(event.skillId)
      if (["cast-start", "cast-commit"].includes(event.kind)) phase = "prepare"
      if (event.kind === "projectile-launch") phase = "launch"
      const confirmed =
        (event.kind === "hit" && slot === "basic") ||
        (event.kind === "shield" && slot === "auto") ||
        (event.kind === "status" && (slot === "ultimate" || slot === "passive"))
      if (confirmed && slot) {
        phase = "confirmed"
        contactIndex = 0
        const effects = (next.effects[event.sourceId] ??= {})
        // Each recipient receives a real guard; one ultimate cast is one
        // source gesture/effect, including when events arrive separately.
        if (slot === "ultimate" && effects[slot]?.tick === event.tick)
          sourceState = null
        else {
          sourceState =
            slot === "ultimate"
              ? "ultimate"
              : slot === "passive"
                ? "guard"
                : slot === "auto"
                  ? "cast"
                  : "attack"
          effects[slot] = {
            serial: event.serial,
            tick: event.tick,
            skillId: event.skillId!,
            index: 0,
            ...(["basic", "auto"].includes(slot) && event.targetIds[0]
              ? { targetId: event.targetIds[0] }
              : {}),
          }
        }
        if (slot === "ultimate")
          for (const targetId of event.targetIds)
            if (targetId !== event.sourceId)
              next.actors[targetId] = {
                state: "guard",
                serial: event.serial,
                tick: event.tick,
              }
      }
      const previous = next.actors[event.sourceId]
      if (
        previous?.tick === event.tick &&
        previous.phase === "confirmed" &&
        previous.skillId === "aw2-moc-non:skill:ultimate" &&
        slot !== "ultimate"
      )
        sourceState = null
    }
    if (event.sourceId && event.skillId === "aw2-lua:skill:basic") {
      if (event.kind === "miss") delete next.contacts[event.sourceId]
      if (event.kind === "hit" && event.targetIds[0]) {
        const prior = next.contacts[event.sourceId]
        contactIndex =
          prior?.index === 0 &&
          prior.targetId === event.targetIds[0] &&
          prior.tick + 1 === event.tick
            ? 1
            : 0
        next.contacts[event.sourceId] = {
          targetId: event.targetIds[0],
          tick: event.tick,
          index: contactIndex,
        }
      }
    }
    if (sourceState && event.sourceId)
      next.actors[event.sourceId] = {
        state: sourceState,
        serial: event.serial,
        tick: event.tick,
        ...(event.skillId ? { skillId: event.skillId } : {}),
        ...(contactIndex === undefined ? {} : { contactIndex }),
        ...(phase ? { phase } : {}),
        ...((lamSkill || mocSkill) && event.kind === "hit" && event.targetIds[0]
          ? { effectTargetId: event.targetIds[0] }
          : {}),
      }
    if (event.kind === "projectile-launch") {
      const targetId = event.targetIds[0]
      if (
        !event.sourceId ||
        !targetId ||
        !event.skillId ||
        !event.projectileId ||
        !Number.isSafeInteger(event.resolveTick) ||
        event.resolveTick! <= event.tick
      )
        throw Error("Projectile event thiếu dữ liệu trình diễn.")
      next.projectiles[event.projectileId] = {
        id: event.projectileId,
        serial: event.serial,
        sourceId: event.sourceId,
        targetId,
        skillId: event.skillId,
        launchTick: event.tick,
        resolveTick: event.resolveTick!,
      }
    }
    if (event.projectileId && ["hit", "miss"].includes(event.kind))
      delete next.projectiles[event.projectileId]
    if (["hit", "interrupt"].includes(event.kind))
      for (const targetId of event.targetIds)
        if (targetId !== event.sourceId)
          next.actors[targetId] = {
            state: "hit",
            serial: event.serial,
            tick: event.tick,
          }
    if (event.kind === "shield" || event.kind === "interrupt-resist")
      for (const targetId of event.targetIds)
        if (targetId !== event.sourceId)
          next.actors[targetId] = {
            state: "guard",
            serial: event.serial,
            tick: event.tick,
          }
    if (event.kind === "defeat")
      for (const targetId of event.targetIds)
        next.actors[targetId] = {
          state: "defeat",
          serial: event.serial,
          tick: event.tick,
        }
    const text = displayText(event)
    if (text)
      next.floating.push({
        serial: event.serial,
        tick: event.tick,
        kind: event.kind,
        targetId: event.targetIds[0] ?? event.sourceId,
        ...(event.amount === undefined ? {} : { amount: event.amount }),
        text,
      })
    next.floating = next.floating.slice(-16)
    if (event.kind === "battle-end") {
      // The terminal rules event cancels remaining visual flights, without hits.
      next.projectiles = {}
      next.terminal = {
        serial: event.serial,
        tick: event.tick,
        text: event.text ?? "draw",
      }
    }
  }
  return next
}
