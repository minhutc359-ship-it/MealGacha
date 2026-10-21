import type { CombatEvent, CombatEventKind, CombatSkillSlot } from "./types"

export type CombatAnimationState = "idle" | "move" | "attack" | "cast" | "hit" | "guard" | "ultimate" | "defeat"

export interface ActorPresentation {
  state: CombatAnimationState
  serial: number
  tick: number
  skillId?: string
  /** Only an authoritative hit may select a beat of Lua's basic sequence. */
  contactIndex?: number
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
    projectiles: {},
    floating: [],
    terminal: null,
  }
}

function skillSlot(skillId?: string): CombatSkillSlot | null {
  const slot = skillId?.split(":").at(-1)
  return ["basic", "auto", "passive", "ultimate"].includes(slot ?? "")
    ? slot as CombatSkillSlot
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
    const sourceState = actorStateFor(event)
    let contactIndex: number | undefined
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
