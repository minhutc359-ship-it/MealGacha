import { useCallback, useEffect, useRef } from "react"
import { advanceCombat } from "../../game/autochess/combat"
import type { AutoRun } from "../../game/autochess/types"
import { useGameStore } from "../../game/useGameStore"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import { AutoSoundscape } from "../../game/autochess/soundscape"
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
    const soundscape = new AutoSoundscape((run.combat?.nextEvent ?? 1) - 1)
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
      for (const cue of soundscape.collect(local.combat?.events ?? [], local.combat?.actors ?? [], now)) gameAudio.play(cue.cue, 0, cue.pan)
      const stopped = local.phase !== "combat" || !!local.combat?.pendingScene
      const overtimeStarted = beforeTick < OVERTIME_TICKS && (local.combat?.tick ?? 0) >= OVERTIME_TICKS
      if (overtimeStarted) gameAudio.play("auto-overtime")
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
    window.addEventListener("meal:native-pause", leaving)
    handle = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(handle)
      document.removeEventListener("visibilitychange", hidden)
      window.removeEventListener("pagehide", leaving)
      window.removeEventListener("meal:native-pause", leaving)
      const saved = useGameStore.getState().save.autoChess?.run
      if (saved?.id === run.id && saved.phase === "combat") {
        if (flush() && !saved.paused && !saved.combat?.pendingScene)
          useGameStore.getState().autoAction({ type: "pause", value: true })
      }
    }
  }, [run?.id, run?.phase, run?.paused, combatId, scene, flush, pause])
  return { getFrame, flush, pause }
}
