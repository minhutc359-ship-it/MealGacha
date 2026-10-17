import type { Actor, AutoCombat } from "./types"
import { actorFrame } from "./presentation"
import { livingActorFrame } from "../livingClips"
import { combatSignature } from "../combatArt"
import { enemyPose } from "../enemyVisuals"
import { starterPose } from "../starterCharacters"

/** Windup/contact/recovery follow the actual action.hit, for every atlas family.
 * No random values, state writes or changes to combat timing. */
export function actorPose(actor: Actor, sheet: string, time: number, combat: AutoCombat | null, quiet: boolean, victory: boolean) {
  if (sheet.startsWith("starter-") || sheet.startsWith("campaign-")) {
    const pose = sheet.startsWith("campaign-") ? enemyPose : starterPose
    const a = actor.action
    if (actor.hp <= 0) return pose(actor.id,"fall",(time-(actor.diedAt ?? time))*50,quiet)
    if (victory) return pose(actor.id,"victory",time*50,quiet)
    if (actor.stunnedUntil > time) return pose(actor.id,"stun",0,quiet)
    if (!a) {
      const hit = [...(combat?.events ?? [])].reverse().find(e=>e.target===actor.uid && e.kind==="hit" && time>=e.tick && time-e.tick<5)
      return pose(actor.id,hit?"hit":"idle",hit?(time-hit.tick)*50:time*50,quiet)
    }
    const age = Math.max(0,time-a.start)
    const p = age < a.hit-a.start ? age/Math.max(1,a.hit-a.start)*.5 : .5+(age-(a.hit-a.start))/Math.max(1,a.end-a.hit)*.5
    if (a.kind === "move") return pose(actor.id,"walk",age*50,quiet)
    return (a.kind === "cast" ? 12 : 8) + (quiet?0:Math.min(3,Math.floor(p*4)))
  }
  if (sheet.startsWith("living-")) return livingActorFrame(actor, time, combat, quiet, victory)
  const fresh = sheet !== "base", a = actor.action
  if (quiet) return actor.hp <= 0 ? fresh ? 6 : 12 : 0
  if (victory && actor.hp > 0) return (fresh ? [0,1,2,1] : [13,1,13,3])[Math.floor(time / 5) % 4]
  if (actor.hp <= 0 || !a || a.kind === "move") return actorFrame(actor,time,fresh,combat)
  if (fresh) return time < a.hit ? 3 : 4
  const recovery = time >= a.hit + (a.end - a.hit) * .55
  return (a.kind === "cast" ? 8 : 5) + (time < a.hit ? 0 : recovery ? 2 : 1)
}

/** Contact-timed body mechanics keep even short atlases alive without dissolves. */
export function actorBody(actor: Actor, time: number, quiet: boolean) {
  if (quiet || actor.hp <= 0) return { lift: 0, lean: 0, stretch: 0 }
  const signature = combatSignature(actor.id), a = actor.action
  if (!a) return {lift: Math.sin(time * .26 + signature.angle * 9) * .006, lean: 0, stretch: Math.sin(time * .26) * .004}
  const progress = Math.max(0, Math.min(1, (time - a.start) / Math.max(1, a.end - a.start)))
  if (a.kind === "move") {
    const stride = Math.sin(progress * Math.PI * 4)
    return {lift: -Math.abs(stride) * .025, lean: stride * .025, stretch: Math.abs(stride) * .012}
  }
  const contact = Math.max(.01, (a.hit - a.start) / Math.max(1,a.end - a.start))
  const impulse = progress < contact ? -Math.sin(progress / contact * Math.PI) * .28 : Math.exp(-(progress - contact) * 9)
  return {lift: -(a.kind === "cast" ? .035 : .012) * Math.abs(impulse), lean: impulse * (a.kind === "cast" ? -.035 : .06), stretch: Math.abs(impulse) * .025}
}
