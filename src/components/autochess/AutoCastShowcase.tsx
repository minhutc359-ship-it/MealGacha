import { useEffect, useState } from "react"
import {
  MONSTER_MAP,
  SKILL_LABELS,
  UNIT_MAP,
} from "../../game/autochess/catalog"
import type { AutoRun, CombatEvent } from "../../game/autochess/types"
import { subscribeCharacterClock } from "../../infrastructure/assets/characterSprites"
import { UltimateBanner } from "../game/UltimateBanner"

/** Follow live frames, not one-second save checkpoints; React updates only when the cue changes. */
export function AutoCastShowcase({
  getFrame,
  quiet,
}: {
  getFrame: () => { run: AutoRun | null }
  quiet: boolean
}) {
  const [cue, setCue] = useState<{
    key: string
    id: string
    event: CombatEvent
  } | null>(null)
  useEffect(() => {
    let key = "",
      lastSample = 0
    return subscribeCharacterClock((now) => {
      if (now - lastSample < 80) return
      lastSample = now
      const run = getFrame().run,
        b = run?.combat
      const event =
        run?.phase === "combat" && !b?.result
          ? [...(b?.events ?? [])]
              .reverse()
              .find(
                (e) =>
                  e.kind === "cast" && e.amount > 0 && b!.tick - e.tick < 32,
              )
          : undefined
      const actor = b?.actors.find((a) => a.uid === event?.source)
      const next = event && actor ? `${b!.id}:${event.id}` : ""
      if (key === next) return
      key = next
      setCue(event && actor ? { key, id: actor.id, event } : null)
    })
  }, [getFrame])
  if (!cue) return null
  const unit = UNIT_MAP[cue.id],
    monster = MONSTER_MAP[cue.id]
  return (
    <div className="auto-cast-showcase">
      <UltimateBanner
        key={cue.key}
        id={cue.id}
        school={cue.event.school}
        title={SKILL_LABELS[cue.event.skill ?? (unit ?? monster).skill]}
        name={unit?.spirit ?? monster?.name}
        art={unit?.art}
        label={monster?.boss ? "BOSS XUẤT CHIÊU" : "KỸ NĂNG"}
        quiet={quiet}
      />
    </div>
  )
}
