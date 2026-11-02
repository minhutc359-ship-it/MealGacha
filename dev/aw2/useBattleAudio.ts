import { useEffect, useRef, useState } from "react"
import type { CombatBattle } from "../../src/aw2/combat"
import { combatAudioCues } from "../../src/aw2/combat/audio"

export function useBattleAudio(battle: CombatBattle, paused: boolean) {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState("")
  const cursor = useRef({ id: battle.id, serial: 0 })
  const playing = useRef(new Set<HTMLAudioElement>())
  useEffect(() => {
    const stop = () => {
      playing.current.forEach((audio) => audio.pause())
      playing.current.clear()
    }
    if (
      cursor.current.id !== battle.id ||
      battle.eventSerial < cursor.current.serial
    ) {
      stop()
      cursor.current = { id: battle.id, serial: 0 }
    }
    const cues = combatAudioCues(battle.events, cursor.current.serial)
    cursor.current.serial = battle.events.at(-1)?.serial ?? 0
    if (!enabled || paused || battle.status !== "active") {
      stop()
      return
    }
    // Prioritize ultimates and cap voices to keep simultaneous attacks legible.
    cues.sort(
      (a, b) => Number(b.slot === "ultimate") - Number(a.slot === "ultimate"),
    )
    for (const cue of cues.slice(0, 3)) {
      if (playing.current.size >= 4) {
        const oldest = playing.current.values().next().value
        oldest?.pause()
        if (oldest) playing.current.delete(oldest)
      }
      const audio = new Audio(cue.url)
      audio.volume = cue.slot === "ultimate" ? 0.45 : 0.22
      playing.current.add(audio)
      audio.onended = () => playing.current.delete(audio)
      void audio.play().catch((cause) => {
        playing.current.delete(audio)
        if (cause?.name !== "AbortError")
          setError("Chưa phát được âm thanh. Chạm tắt/bật Âm thanh để thử lại.")
      })
    }
  }, [battle, enabled, paused])
  useEffect(
    () => () => {
      playing.current.forEach((audio) => audio.pause())
      playing.current.clear()
    },
    [],
  )
  return {
    enabled,
    error,
    toggle: () => {
      setError("")
      setEnabled((value) => !value)
    },
  }
}
