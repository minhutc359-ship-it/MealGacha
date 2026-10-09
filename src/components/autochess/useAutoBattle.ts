import { useCallback, useEffect, useRef } from "react"
import { advanceCombat } from "../../game/autochess/combat"
import type { AutoRun } from "../../game/autochess/types"
import { useGameStore } from "../../game/useGameStore"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import type { GameSound } from "../../game/audioScore"
import { battleSpeed, OVERTIME_TICKS } from "../../game/autochess/config"

export function useAutoBattle(run: AutoRun | null, speed: number) {
  const frame = useRef<{ run: AutoRun | null; alpha: number }>({ run, alpha: 0 })
  const speedRef = useRef(speed)
  useEffect(() => {
    speedRef.current = speed
  }, [speed])
  const getFrame = useCallback(() => {
    const saved = useGameStore.getState().save.autoChess?.run ?? null
    return !saved ||
      saved.phase !== "combat" ||
      saved.paused ||
      saved.scene ||
      saved.combat?.pendingScene
      ? { run: saved, alpha: 0 }
      : frame.current
  }, [])
  const flush = useCallback(() => {
    const local = frame.current.run,
      saved = useGameStore.getState().save.autoChess?.run
    if (!local || !saved || local.id !== saved.id || saved.phase !== "combat")
      return true
    if ((local.combat?.tick ?? 0) <= (saved.combat?.tick ?? 0)) return true
    return useGameStore
      .getState()
      .autoAction({ type: "checkpoint", run: local })
  }, [])
  const pause = useCallback(
    (value = true) => {
      if (flush()) useGameStore.getState().autoAction({ type: "pause", value })
    },
    [flush],
  )
  const scene = run?.combat?.pendingScene ?? run?.scene
  const combatId = run?.combat?.id
  useEffect(() => {
    frame.current = {
      run: useGameStore.getState().save.autoChess?.run ?? null,
      alpha: 0,
    }
    if (!run || run.phase !== "combat" || run.paused || scene) return
    let handle = 0,
      previous = performance.now(),
      accumulator = 0,
      savedAt = previous
    let lastSound = run.combat?.nextEvent ? run.combat.nextEvent - 1 : 0
    const update = (now: number) => {
      const dt = now - previous
      previous = now
      if (document.hidden || dt > 1500) {
        pause(true)
        return
      }
      let local = frame.current.run!
      const beforeTick = local.combat?.tick ?? 0
      accumulator += dt * battleSpeed(beforeTick, speedRef.current)
      let count = 0
      while (
        accumulator >= 50 &&
        local.phase === "combat" &&
        !local.combat?.pendingScene &&
        count < 25
      ) {
        local = advanceCombat(local)
        accumulator -= 50
        count++
      }
      frame.current = { run: local, alpha: Math.min(1, accumulator / 50) }
      const cues = new Set<GameSound>()
      for (const event of local.combat?.events ?? []) {
        if (event.id <= lastSound) continue
        lastSound = event.id
        if (event.kind === "cast" && event.amount === 0) {
          cues.add("cast")
          cues.add(
            ({
              ember: "fire",
              tide: "water",
              grove: "leaves",
              hearth: "shield",
              sugar: "sparkle",
            } as const)[event.school],
          )
        }
        if (event.kind === "hit") cues.add("impact")
        if (event.kind === "heal") cues.add("heal")
        if (event.kind === "shield") cues.add("shield")
        if (event.kind === "phase") cues.add("awaken")
        if (event.kind === "death") cues.add("vanish")
      }
      // Cap overlapping voices; sound never changes the simulation.
      ;[...cues].slice(0, 3).forEach((cue) => gameAudio.play(cue))
      const stopped = local.phase !== "combat" || !!local.combat?.pendingScene
      const overtimeStarted = beforeTick < OVERTIME_TICKS && (local.combat?.tick ?? 0) >= OVERTIME_TICKS
      if (stopped || overtimeStarted || now - savedAt >= 1000) {
        if (
          !useGameStore
            .getState()
            .autoAction({ type: "checkpoint", run: local })
        ) {
          useGameStore.setState((s) => ({
            save: {
              ...s.save,
              autoChess: s.save.autoChess
                ? { ...s.save.autoChess, run: { ...local, paused: true } }
                : undefined,
            },
          }))
          return
        }
        savedAt = now
      }
      if (!stopped) handle = requestAnimationFrame(update)
    }
    const hidden = () => {
      if (document.hidden) pause(true)
    }
    const leaving = () => pause(true)
    document.addEventListener("visibilitychange", hidden)
    window.addEventListener("pagehide", leaving)
    handle = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(handle)
      document.removeEventListener("visibilitychange", hidden)
      window.removeEventListener("pagehide", leaving)
      const saved = useGameStore.getState().save.autoChess?.run
      if (saved?.id === run.id && saved.phase === "combat") {
        if (flush() && !saved.paused && !saved.combat?.pendingScene)
          useGameStore.getState().autoAction({ type: "pause", value: true })
      }
    }
  }, [run?.id, run?.phase, run?.paused, combatId, scene, flush, pause])
  return { getFrame, flush, pause }
}
