import { useEffect, useRef, useState } from "react"
import type { RpgBattle, RpgEvent } from "../../game/adventureRpg/types"
import { subscribeCharacterClock } from "../../infrastructure/assets/characterSprites"

export function rpgContactMs(events: RpgEvent[], event: RpgEvent) {
  const action = [...events]
    .reverse()
    .find(
      (e) =>
        e.source === event.source &&
        e.tick === event.tick &&
        e.animation &&
        e.serial <= event.serial,
    )
  return action?.animation === "ultimate"
    ? 960
    : action?.animation && action.animation !== "attack"
      ? 380
      : 300
}
/** Delay only the displayed HP/shield and labels to contact. The save is authoritative
 * immediately; neither this clock nor unmount/reload can deal damage or award anything. */
export function useRpgImpactFrame(
  battle: RpgBattle,
  paused: boolean,
  quiet: boolean,
) {
  const [, refresh] = useState(0)
  const state = useRef({
    last: battle,
    paused,
    pending: [] as { uid: string hp: number shield: number due: number }[],
    labels: new Map<number, number>(),
  })
  const s = state.current
  // Derive a new presentation ledger synchronously, before painting a new snapshot.
  if (s.last !== battle) {
    const before = s.last
    if (
      before.id !== battle.id ||
      before.wave !== battle.wave ||
      battle.serial < before.serial ||
      battle.cinematic ||
      quiet
    ) {
      s.pending = []
      s.labels.clear()
    } else {
      const now = performance.now()
      const fresh = battle.events.filter((e) => e.serial > before.serial)
      for (const e of fresh)
        if (["hit", "heal", "shield"].includes(e.kind))
          s.labels.set(e.serial, now + rpgContactMs(battle.events, e))
      for (const actor of battle.actors) {
        const previous = before.actors.find((a) => a.uid === actor.uid)
        const e = [...fresh]
          .reverse()
          .find(
            (e) =>
              e.targets.includes(actor.uid) &&
              ["hit", "heal", "shield"].includes(e.kind),
          )
        if (
          previous &&
          e &&
          (previous.hp !== actor.hp || previous.shield !== actor.shield)
        )
          s.pending.push({
            uid: actor.uid,
            hp: actor.hp - previous.hp,
            shield: actor.shield - previous.shield,
            due: now + rpgContactMs(battle.events, e),
          })
      }
    }
    s.last = battle
  }
  s.paused = paused
  useEffect(() => {
    let previous = performance.now()
    let hiddenAt: number | null = null
    const visibility = () => {
      const now = performance.now()
      if (document.hidden) hiddenAt = now
      else if (hiddenAt !== null) {
        const delta = now - hiddenAt
        for (const p of s.pending) p.due += delta
        for (const [serial, due] of s.labels) s.labels.set(serial, due + delta)
        hiddenAt = null
        previous = now
      }
    }
    document.addEventListener("visibilitychange", visibility)
    const stop = subscribeCharacterClock(
      (now) => {
        const elapsed = now - previous
        previous = now
        if (s.paused || document.hidden) {
          for (const p of s.pending) p.due += elapsed
          for (const [serial, due] of s.labels)
            s.labels.set(serial, due + elapsed)
          return
        }
        const due =
          s.pending.some((p) => p.due <= now) ||
          [...s.labels.values()].some((due) => due <= now)
        s.pending = s.pending.filter((p) => p.due > now)
        for (const [serial, at] of s.labels)
          if (at <= now) s.labels.delete(serial)
        if (due) refresh((n) => n + 1)
      },
      () => !s.paused && (s.pending.length > 0 || s.labels.size > 0),
    )
    return () => {
      stop()
      document.removeEventListener("visibilitychange", visibility)
    }
  }, [])
  return {
    actors: battle.actors.map((a) => {
      const pending = s.pending.filter((p) => p.uid === a.uid)
      const hp = Math.max(
        0,
        Math.min(a.maxHp, a.hp - pending.reduce((n, p) => n + p.hp, 0)),
      )
      return {
        ...a,
        hp,
        shield: Math.max(
          0,
          a.shield - pending.reduce((n, p) => n + p.shield, 0),
        ),
        motion: hp > 0 && a.hp <= 0 ? "idle" as const : a.motion,
      }
    }),
    events: battle.events.filter((e) => !s.labels.has(e.serial)),
  }
}
