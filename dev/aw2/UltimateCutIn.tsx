import { useEffect, useRef, useState } from "react"
import type { CombatBattle } from "../../src/aw2/combat/types"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import { ULTIMATE_ART } from "../../src/aw2/assets/ultimateArt"
import {
  latestUltimateArtCue,
  ULTIMATE_ART_DURATION_MS,
  type UltimateArtCue,
} from "../../src/aw2/assets/ultimatePresentation"

function Artwork({ spiritId }: { spiritId: string }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const source = ULTIMATE_ART[spiritId]
  const portrait = ROSTER_ASSETS[spiritId]?.assets.portrait
  return (
    <>
      {(!loaded || failed) && portrait && (
        <img
          src={portrait.url}
          width={portrait.width}
          height={portrait.height}
          alt=""
          decoding="async"
        />
      )}
      {!failed && source && (
        <img
          src={source.url}
          width={source.width}
          height={source.height}
          alt=""
          decoding="async"
          style={{ visibility: loaded ? "visible" : "hidden" }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </>
  )
}

/** Decoration only. It never stops the battle, handles input or dispatches a command. */
export function UltimateCutIn({
  battle,
  paused,
  reducedMotion,
}: {
  battle: CombatBattle
  paused: boolean
  reducedMotion: boolean
}) {
  const cursor = useRef({ battleId: battle.id, serial: battle.eventSerial })
  const [cue, setCue] = useState<UltimateArtCue | null>(null)
  const [hidden, setHidden] = useState(
    () => typeof document !== "undefined" && document.hidden,
  )
  useEffect(() => {
    const changed = () => {
      setHidden(document.hidden)
      setCue(null)
    }
    document.addEventListener("visibilitychange", changed)
    return () => document.removeEventListener("visibilitychange", changed)
  }, [])
  useEffect(() => {
    const reset =
      cursor.current.battleId !== battle.id ||
      battle.eventSerial < cursor.current.serial
    const next = reset
      ? null
      : latestUltimateArtCue(battle, cursor.current.serial)
    cursor.current = { battleId: battle.id, serial: battle.eventSerial }
    if (reset || paused || hidden || battle.status !== "active") setCue(null)
    else if (next) setCue(next)
  }, [battle, paused, hidden])
  useEffect(() => {
    if (!cue) return
    const timer = window.setTimeout(
      () => setCue(null),
      ULTIMATE_ART_DURATION_MS,
    )
    return () => window.clearTimeout(timer)
  }, [cue])
  if (
    !cue ||
    paused ||
    hidden ||
    cue.battleId !== battle.id ||
    battle.status !== "active"
  )
    return null
  return (
    <div
      key={`${cue.battleId}:${cue.serial}`}
      className="aw2-ultimate-cut-in"
      data-side={cue.side}
      data-reduced={reducedMotion}
      data-spirit={cue.spiritId}
      data-serial={cue.serial}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Artwork key={cue.spiritId} spiritId={cue.spiritId} />
      <div>
        <span>{cue.displayName}</span>
        <strong>{cue.skillName}</strong>
      </div>
    </div>
  )
}
