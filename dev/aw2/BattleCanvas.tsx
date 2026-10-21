import { useEffect, useRef, useState } from "react"
import {
  battleAtlasKeys,
  sampleActorPlayback,
  sampleActorEffect,
  sampleConfirmedEffect,
  type ActorPlayback,
  type EffectPlayback,
} from "../../src/aw2/assets/playback"
import { STARTER_ASSETS } from "../../src/aw2/assets/starters"
import type { SkillSlot, SpiritAssetManifest } from "../../src/aw2/assets/types"
import type {
  CombatActor,
  CombatBattle,
  CombatPresentation,
} from "../../src/aw2/combat"

type LoadedAtlas = Record<string, HTMLImageElement>

interface Props {
  battle: CombatBattle
  presentation: CombatPresentation
  reducedMotion: boolean
  paused?: boolean
  visualIds?: Readonly<Record<string, string>>
  labels?: Readonly<Record<string, string>>
}

const TICK_MS = 650
const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value))
const actorX = (actor: CombatActor) => 65 + actor.position * 8.3
const actorY = (actor: CombatActor) =>
  actor.side === "player" ? 365 + actor.slot * 28 : 255 + actor.slot * 34
const actorById = (battle: CombatBattle, id: string) =>
  battle.actors.find((actor) => actor.id === id)

function manifestFor(
  actor: CombatActor,
  visualIds?: Props["visualIds"],
): SpiritAssetManifest {
  return STARTER_ASSETS[visualIds?.[actor.id] ?? actor.spiritId]
}

function slotFromSkill(skillId?: string): SkillSlot | null {
  const slot = skillId?.split(":").at(-1)
  return ["basic", "auto", "passive", "ultimate"].includes(slot ?? "")
    ? slot as SkillSlot
    : null
}

export function BattleCanvas({
  battle,
  presentation,
  reducedMotion,
  paused = false,
  visualIds,
  labels,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const clock = useRef({
    time: 0,
    tick: -1,
    battleId: "",
    actors: {} as Record<string, ActorPlayback>,
    effects: {} as Record<string, EffectPlayback>,
  })
  const [atlases, setAtlases] = useState<Record<string, LoadedAtlas> | null>(
    null,
  )
  const [error, setError] = useState("")

  useEffect(() => {
    let disposed = false
    const load = (url: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error(`Không tải được atlas ${url}`))
        image.src = url
      })
    setAtlases(null)
    setError("")
    void Promise.all(
      Object.values(STARTER_ASSETS).map(
        async (manifest) =>
          [
            manifest.spiritId,
            Object.fromEntries(
              await Promise.all(
                battleAtlasKeys(manifest).map(async (key) => [
                  key,
                  await load(manifest.assets[key].url),
                ]),
              ),
            ),
          ] as const,
      ),
    )
      .then((entries) => {
        if (!disposed) setAtlases(Object.fromEntries(entries))
      })
      .catch((cause) => {
        if (!disposed)
          setError(
            cause instanceof Error ? cause.message : "Không tải được atlas.",
          )
      })
    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext("2d")
    if (!element || !context || !atlases) return
    const unresolved = battle.actors.find(
      (actor) => !manifestFor(actor, visualIds),
    )
    if (unresolved) {
      context.clearRect(0, 0, element.width, element.height)
      setError(`Chưa có manifest hình ảnh cho ${unresolved.id}.`)
      return
    }
    if (
      clock.current.battleId !== battle.id ||
      battle.tick < clock.current.tick
    ) {
      clock.current = {
        time: 0,
        tick: battle.tick,
        battleId: battle.id,
        actors: {},
        effects: {},
      }
    }
    clock.current.tick = battle.tick
    let lastTime = performance.now()
    const tickStartedAt = clock.current.time
    let frameRequest = 0

    function paintFrame(
      manifest: SpiritAssetManifest,
      frameId: string,
      image: HTMLImageElement,
      x: number,
      y: number,
      scale: number,
      flip = false,
      opacity = 1,
      rotation = 0,
    ) {
      const frame = manifest.frames[frameId]
      if (!frame) return
      scale *= frame.renderScale ?? 1
      context!.save()
      context!.globalAlpha = clamp(opacity)
      context!.translate(x, y)
      context!.rotate(rotation)
      context!.scale(flip ? -scale : scale, scale)
      context!.imageSmoothingEnabled = true
      context!.drawImage(
        image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        -frame.anchorX,
        -frame.anchorY,
        frame.width,
        frame.height,
      )
      context!.restore()
    }

    function drawArena() {
      const gradient = context!.createLinearGradient(0, 0, 0, 560)
      gradient.addColorStop(0, "#172b31")
      gradient.addColorStop(0.58, "#29413c")
      gradient.addColorStop(1, "#17241f")
      context!.fillStyle = gradient
      context!.fillRect(0, 0, 960, 560)
      context!.strokeStyle = "rgba(245, 214, 139, .2)"
      context!.lineWidth = 1
      for (let x = 64; x < 920; x += 64) {
        context!.beginPath()
        context!.moveTo(x, 210)
        context!.lineTo(x, 520)
        context!.stroke()
      }
      context!.fillStyle = "rgba(255,255,255,.08)"
      context!.fillRect(40, 280, 880, 2)
    }

    function drawActor(actor: CombatActor) {
      const manifest = manifestFor(actor, visualIds)
      const atlas = atlases![manifest.spiritId]
      const cue = presentation.actors[actor.id]
      const playback = sampleActorPlayback(
        manifest,
        clock.current.actors[actor.id],
        cue,
        actor.hp <= 0,
        clock.current.time,
        reducedMotion,
      )
      clock.current.actors[actor.id] = playback.clock
      const { state, pose } = playback
      const x = actorX(actor)
      const y = actorY(actor)
      const enemy = actor.side === "enemy"
      if (enemy) {
        context!.save()
        context!.filter = "hue-rotate(155deg) saturate(.68) brightness(.82)"
      }
      const slot = slotFromSkill(cue?.skillId)
      const skill =
        playback.active &&
        slot &&
        ["cast", "ultimate", "attack", "guard"].includes(state)
          ? manifest.skills[slot]
          : null
      const effect =
        !presentation.terminal &&
        skill &&
        slot &&
        !presentation.effects[actor.id]?.[slot]
          ? sampleActorEffect(manifest, cue, playback.elapsedMs, reducedMotion)
          : null
      const independent = Object.entries(
        presentation.effects[actor.id] ?? {},
      ).flatMap(([slot, cue]) => {
        const key = `${actor.id}:${slot}`
        const sampled = sampleConfirmedEffect(
          manifest,
          clock.current.effects[key],
          cue,
          clock.current.time,
          reducedMotion,
        )
        clock.current.effects[key] = sampled.clock
        return (cue.targetIds ?? [cue.targetId]).map((targetId) => ({
          skill: manifest.skills[(slot as SkillSlot)],
          effect: presentation.terminal ? null : sampled.effect,
          targetId,
          serial: cue.serial,
          index: cue.index,
        }))
      })
      actorEffects[actor.id] = independent.map((entry) => ({
        serial: entry.serial,
        index: entry.index,
        skillId: entry.skill.id,
        fx: entry.effect?.frame ?? "",
        atMs: entry.effect?.cue ?? null,
        targetId: entry.targetId,
        pose: pose.frame,
      }))
      const entries = [
        ...independent,
        ...(skill && effect
          ? [{ skill, effect, targetId: cue?.effectTargetId }]
          : []),
      ]
      const drawFx = (layer: "front" | "behind") => {
        for (const { skill, effect, targetId } of entries) {
          if (!effect || skill.fxPlacement.layer !== layer) continue
          const target = targetId ? actorById(battle, targetId) : undefined
          paintFrame(
            manifest,
            effect.frame,
            atlas.fx,
            target
              ? actorX(target)
              : x + (enemy ? -1 : 1) * skill.fxPlacement.x * 0.28,
            (target ? actorY(target) : y) + skill.fxPlacement.y * 0.28,
            0.28 * skill.fxPlacement.scale,
            enemy,
            0.82,
          )
        }
      }
      drawFx("behind")
      paintFrame(
        manifest,
        pose.frame,
        atlas[manifest.frames[pose.frame].asset],
        x + (enemy ? -pose.x : pose.x) * 0.28,
        y + pose.y * 0.28,
        0.28 * pose.scale,
        enemy,
        pose.opacity,
        enemy ? -pose.rotation : pose.rotation,
      )
      drawFx("front")
      if (enemy) context!.restore()
      actorPoses[actor.id] = pose.frame
      actorCues[actor.id] = {
        serial: cue?.serial,
        phase: cue?.phase,
        skillId: cue?.skillId,
        fx: effect?.frame ?? "",
      }
      actorContacts[actor.id] =
        cue?.contactIndex === undefined
          ? null
          : {
              serial: cue.serial,
              index: cue.contactIndex,
              fx: effect?.frame ?? "",
              atMs: effect?.cue ?? null,
              skillId: cue.skillId,
              targetId: cue.effectTargetId,
            }

      const barWidth = 76
      const left = x - barWidth / 2
      const top = y - 128
      context!.fillStyle = "rgba(5, 12, 10, .78)"
      context!.fillRect(left, top, barWidth, 8)
      context!.fillStyle = enemy ? "#d46a6a" : "#74d28c"
      context!.fillRect(left, top, barWidth * (actor.hp / actor.maxHp), 8)
      if (actor.shield > 0) {
        context!.fillStyle = "#82c8ef"
        context!.fillRect(
          left,
          top + 9,
          barWidth * Math.min(1, actor.shield / actor.maxHp),
          3,
        )
      }
      context!.fillStyle = "#fff6df"
      context!.font = "600 11px system-ui"
      context!.textAlign = "center"
      context!.fillText(labels?.[actor.id] ?? manifest.displayName, x, top - 5)
    }

    function drawProjectile(
      projectile: CombatPresentation["projectiles"][string],
      elapsed: number,
    ) {
      const source = actorById(battle, projectile.sourceId)
      const target = actorById(battle, projectile.targetId)
      if (!source || !target) return
      const manifest = manifestFor(source, visualIds)
      const slot = slotFromSkill(projectile.skillId)
      const track = slot ? manifest.skills[slot].projectile : null
      if (!track) return
      const tickProgress = reducedMotion ? 0.5 : elapsed / TICK_MS
      const progress = clamp(
        (battle.tick + tickProgress - projectile.launchTick) /
          (projectile.resolveTick - projectile.launchTick),
      )
      const x = actorX(source) + (actorX(target) - actorX(source)) * progress
      const y =
        actorY(source) - 55 + (actorY(target) - actorY(source)) * progress
      const frame =
        track.frames[
          reducedMotion
            ? 0
            : Math.floor(elapsed / track.frameMs) % track.frames.length
        ]
      paintFrame(
        manifest,
        frame,
        atlases![manifest.spiritId].fx,
        x,
        y,
        0.32 * track.scale,
        source.side === "enemy",
      )
    }

    function drawFloating() {
      for (const item of presentation.floating.filter(
        (entry) => entry.tick >= battle.tick - 2,
      )) {
        const target = item.targetId ? actorById(battle, item.targetId) : null
        const x = target ? actorX(target) : 480
        const y = target ? actorY(target) - 145 - (item.serial % 3) * 15 : 80
        context!.font = "700 14px system-ui"
        context!.textAlign = "center"
        context!.fillStyle =
          item.kind === "heal"
            ? "#9cf0b4"
            : item.kind === "shield"
              ? "#9ddcff"
              : item.kind === "hit"
                ? "#ffd0a3"
                : "#fff0b7"
        context!.fillText(item.text, x, y)
      }
    }

    const actorPoses: Record<string, string> = {}
    const actorContacts: Record<string, unknown> = {}
    const actorCues: Record<string, unknown> = {}
    const actorEffects: Record<string, unknown> = {}
    function draw(now: number) {
      if (!paused && document.visibilityState === "visible")
        clock.current.time += Math.min(50, Math.max(0, now - lastTime))
      lastTime = now
      const elapsed = reducedMotion ? 0 : clock.current.time - tickStartedAt
      drawArena()
      for (const projectile of Object.values(presentation.projectiles))
        drawProjectile(projectile, elapsed)
      for (const actor of [...battle.actors].sort(
        (left, right) => actorY(left) - actorY(right),
      ))
        drawActor(actor)
      drawFloating()
      if (presentation.terminal) {
        context!.fillStyle = "rgba(7, 13, 12, .76)"
        context!.fillRect(280, 210, 400, 110)
        context!.strokeStyle = "#f5d68b"
        context!.strokeRect(280, 210, 400, 110)
        context!.fillStyle = "#fff3cc"
        context!.font = "700 30px system-ui"
        context!.textAlign = "center"
        const label =
          presentation.terminal.text === "player-win"
            ? "Giao ước được giữ"
            : presentation.terminal.text === "enemy-win"
              ? "Ký ức tan vào sương"
              : "Hai phía cùng lặng"
        context!.fillText(label, 480, 276)
      }
      element!.dataset.tick = String(battle.tick)
      element!.dataset.status = battle.status
      element!.dataset.projectiles = String(
        Object.keys(presentation.projectiles).length,
      )
      element!.dataset.lastSerial = String(presentation.lastSerial)
      element!.dataset.reduced = String(reducedMotion)
      element!.dataset.actorPoses = JSON.stringify(actorPoses)
      element!.dataset.actorContacts = JSON.stringify(actorContacts)
      element!.dataset.actorCues = JSON.stringify(actorCues)
      element!.dataset.actorEffects = JSON.stringify(actorEffects)
      element!.dataset.motionTime = String(Math.floor(clock.current.time))
      frameRequest = requestAnimationFrame(draw)
    }

    frameRequest = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRequest)
  }, [atlases, battle, presentation, reducedMotion, paused, visualIds, labels])

  return (
    <>
      <div className="aw2-battle-stage">
        <canvas
          ref={canvas}
          width={960}
          height={560}
          aria-label="Trận đấu năm Vị Linh AW2"
        />
      </div>
      <p role="status" data-testid="battle-atlas-state">
        {atlases
          ? "Năm atlas chiến đấu đã tải"
          : error
            ? "Tải atlas thất bại"
            : "Đang tải atlas chiến đấu…"}
      </p>
      {error && <p role="alert">{error}</p>}
    </>
  )
}
