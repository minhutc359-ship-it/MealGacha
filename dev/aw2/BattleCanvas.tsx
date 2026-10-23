import { useEffect, useRef, useState } from "react"
import {
  battleAtlasKeys,
  sampleActorPlayback,
  sampleActorEffect,
  sampleConfirmedEffect,
  type ActorPlayback,
  type EffectPlayback,
} from "../../src/aw2/assets/playback"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import { isStarterSpiritId } from "../../src/aw2/combat/roster"
import { FORGOTTEN_HOST_ASSETS } from "../../src/aw2/assets/forgottenHost"
import {
  sampleBossVisual,
  type BossPlaybackClock,
} from "../../src/aw2/assets/bossPlayback"
import type { SkillSlot, SpiritAssetManifest } from "../../src/aw2/assets/types"
import type {
  CombatActor,
  CombatBattle,
  CombatPresentation,
} from "../../src/aw2/combat"
import {
  actorDisplayScale,
  actorStatus,
  projectBattle,
  recentActorOutcomes,
} from "./battleLayout"

type LoadedAtlas = Record<string, HTMLImageElement>

interface Props {
  battle: CombatBattle
  presentation: CombatPresentation
  reducedMotion: boolean
  paused?: boolean
  stopped?: boolean
  visualIds?: Readonly<Record<string, string>>
  labels?: Readonly<Record<string, string>>
}

const TICK_MS = 650
const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value))
const actorById = (battle: CombatBattle, id: string) =>
  battle.actors.find((actor) => actor.id === id)

function manifestFor(
  actor: CombatActor,
  visualIds?: Props["visualIds"],
): SpiritAssetManifest {
  return ROSTER_ASSETS[visualIds?.[actor.id] ?? actor.spiritId]
}

function slotFromSkill(skillId?: string): SkillSlot | null {
  const slot = skillId?.split(":").at(-1)
  return ["basic", "auto", "passive", "ultimate"].includes(slot ?? "")
    ? (slot as SkillSlot)
    : null
}

export function BattleCanvas({
  battle,
  presentation,
  reducedMotion,
  paused = false,
  stopped = false,
  visualIds,
  labels,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(960)
  const optionalVisualIds = [
    ...new Set(
      battle.actors.map((actor) => visualIds?.[actor.id] ?? actor.spiritId),
    ),
  ]
    .filter((id) => !isStarterSpiritId(id))
    .sort()
    .join(",")
  const bossPresent = battle.actors.some(
    (actor) => actor.spiritId === FORGOTTEN_HOST_ASSETS.entityId,
  )
  const layout = projectBattle(battle.actors, stageWidth)
  const clock = useRef({
    time: 0,
    tick: -1,
    tickStartedAt: 0,
    battleId: "",
    actors: {} as Record<string, ActorPlayback>,
    effects: {} as Record<string, EffectPlayback>,
    bosses: {} as Record<string, BossPlaybackClock>,
  })
  const [atlases, setAtlases] = useState<Record<string, LoadedAtlas> | null>(
    null,
  )
  const [error, setError] = useState("")

  useEffect(() => {
    const container = stage.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) =>
      setStageWidth(entry.contentRect.width),
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

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
    const sources = [
      ...Object.values(ROSTER_ASSETS)
        .filter(
          (manifest) =>
            isStarterSpiritId(manifest.spiritId) ||
            optionalVisualIds.split(",").includes(manifest.spiritId),
        )
        .map((manifest) => ({
          id: manifest.spiritId,
          assets: manifest.assets,
          keys: battleAtlasKeys(manifest),
        })),
      ...(bossPresent
        ? [
            {
              id: FORGOTTEN_HOST_ASSETS.entityId,
              assets: FORGOTTEN_HOST_ASSETS.assets,
              keys: ["battle", "fx"],
            },
          ]
        : []),
    ]
    void Promise.all(
      sources.map(
        async (manifest) =>
          [
            manifest.id,
            Object.fromEntries(
              await Promise.all(
                manifest.keys.map(async (key) => [
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
  }, [bossPresent, optionalVisualIds])

  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext("2d")
    if (!element || !context || !atlases) return
    const unresolved = battle.actors.find(
      (actor) =>
        actor.spiritId !== FORGOTTEN_HOST_ASSETS.entityId &&
        !manifestFor(actor, visualIds),
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
        tickStartedAt: 0,
        battleId: battle.id,
        actors: {},
        effects: {},
        bosses: {},
      }
    }
    if (clock.current.tick !== battle.tick)
      clock.current.tickStartedAt = clock.current.time
    clock.current.tick = battle.tick
    let lastTime = performance.now()
    const tickStartedAt = clock.current.tickStartedAt
    let frameRequest = 0
    const actorX = (actor: CombatActor) => layout.points[actor.id].x
    const actorY = (actor: CombatActor) => layout.points[actor.id].y
    const scales = Object.fromEntries(
      battle.actors.map((actor) => [
        actor.id,
        actorDisplayScale(
          actor.spiritId === FORGOTTEN_HOST_ASSETS.entityId
            ? FORGOTTEN_HOST_ASSETS
            : manifestFor(actor, visualIds),
        ),
      ]),
    )
    const fxScale = (actor: CombatActor) => scales[actor.id] / 0.28

    function label(text: string, x: number, y: number, width = 120) {
      let clipped = text
      while (clipped.length > 1 && context!.measureText(clipped).width > width)
        clipped = clipped.slice(0, -1)
      if (clipped !== text) clipped = clipped.slice(0, -1) + "…"
      context!.fillText(clipped, x, y)
    }

    function paintFrame(
      manifest: Pick<SpiritAssetManifest, "frames">,
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
      const gradient = context!.createLinearGradient(0, 0, 0, layout.height)
      gradient.addColorStop(0, "#172b31")
      gradient.addColorStop(0.58, "#29413c")
      gradient.addColorStop(1, "#17241f")
      context!.fillStyle = gradient
      context!.fillRect(0, 0, layout.width, layout.height)
      context!.strokeStyle = "rgba(245, 214, 139, .2)"
      context!.lineWidth = 1
      for (let x = 64; x <= layout.width - 64; x += (layout.width - 128) / 4) {
        context!.beginPath()
        context!.moveTo(x, 44)
        context!.lineTo(x, layout.height - 12)
        context!.stroke()
      }
      context!.font = "600 13px system-ui"
      context!.textAlign = "left"
      context!.fillStyle = "#e5e8d5"
      context!.fillText("Đội →", 12, 24)
      context!.textAlign = "right"
      context!.fillText("← Ký ức", layout.width - 12, 24)
      for (const actor of battle.actors) {
        context!.fillStyle = actor.side === "player" ? "#8ac5a00c" : "#e7a0a00c"
        context!.fillRect(0, actorY(actor) - 72, layout.width, 108)
      }
    }

    function drawHaiFields() {
      const fields = []
      if (!presentation.terminal)
        for (const actor of battle.actors) {
          if (actor.spiritId !== "aw2-hai" || actor.hp <= 0) continue
          const manifest = manifestFor(actor, visualIds)
          for (const slot of ["auto", "ultimate"] as const) {
            const field = slot === "auto" ? actor.haiZone : actor.haiLine
            if (!field || field.expiresAtTick <= battle.tick) continue
            const position = "center" in field ? field.center : field.position
            const frame = manifest.skills[slot].fx[2]
            paintFrame(
              manifest,
              frame,
              atlases![manifest.spiritId].fx,
              64 + (position * (layout.width - 128)) / 100,
              actorY(actor),
              0.22,
              "facing" in field ? field.facing === -1 : actor.side === "enemy",
              0.65,
            )
            fields.push({
              sourceId: actor.id,
              slot,
              position,
              frame,
              expiresAtTick: field.expiresAtTick,
            })
          }
        }
      element!.dataset.haiFields = JSON.stringify(fields)
    }

    function drawMocFields() {
      const fields = []
      if (!presentation.terminal)
        for (const actor of battle.actors) {
          if (actor.spiritId !== "aw2-moc" || actor.hp <= 0) continue
          const manifest = manifestFor(actor, visualIds)
          for (const slot of ["auto", "ultimate"] as const) {
            const field = slot === "auto" ? actor.mocMark : actor.mocBurst
            if (!field) continue
            const frame = manifest.skills[slot].fx[slot === "auto" ? 1 : 0]
            paintFrame(
              manifest,
              frame,
              atlases![manifest.spiritId].fx,
              64 + (field.center * (layout.width - 128)) / 100,
              actorY(actor),
              0.22,
              actor.side === "enemy",
              0.65,
            )
            fields.push({
              sourceId: actor.id,
              slot,
              position: field.center,
              frame,
              ...field,
            })
          }
        }
      element!.dataset.mocFields = JSON.stringify(fields)
    }

    function drawActor(actor: CombatActor) {
      if (actor.spiritId === FORGOTTEN_HOST_ASSETS.entityId) {
        const manifest = FORGOTTEN_HOST_ASSETS
        const visual = bossVisuals[actor.id]
        const atlas = atlases![manifest.entityId]
        paintFrame(
          manifest,
          visual.pose.frame,
          atlas.battle,
          actorX(actor),
          actorY(actor),
          scales[actor.id],
        )
        actorPoses[actor.id] = visual.pose.frame
        actorEffects[actor.id] = visual.effects.map((effect) => ({
          skillId: effect.skillId,
          phase: effect.phase,
          fx: effect.frame,
          targetIds: effect.targetIds,
        }))
        actorCues[actor.id] = {
          state: visual.state,
          manifest: manifest.entityId,
          facing: manifest.facing,
        }
        drawActorVitals(actor, manifest.displayName)
        return
      }
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
      const scale = scales[actor.id]
      const effectScale = fxScale(actor)
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
          skill: manifest.skills[slot as SkillSlot],
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
              : x + (enemy ? -1 : 1) * skill.fxPlacement.x * 0.28 * effectScale,
            (target ? actorY(target) : y) +
              skill.fxPlacement.y * 0.28 * effectScale,
            0.28 * skill.fxPlacement.scale * effectScale,
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
        x + (enemy ? -pose.x : pose.x) * scale,
        y + pose.y * scale,
        scale * pose.scale,
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

      drawActorVitals(actor, manifest.displayName)
    }

    function drawActorVitals(actor: CombatActor, displayName: string) {
      const x = actorX(actor),
        y = actorY(actor),
        enemy = actor.side === "enemy"
      const barWidth = 76
      const left = x - barWidth / 2
      const top = y + 20
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
      context!.font = "600 13px system-ui"
      context!.textAlign = "center"
      label(
        `${layout.points[actor.id].badge} · ${labels?.[actor.id] ?? displayName}`,
        x,
        top - 5,
      )
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
        actorY(source) - 32 + (actorY(target) - actorY(source)) * progress
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
        0.32 * track.scale * fxScale(source),
        source.side === "enemy",
      )
    }

    function drawFloating() {
      for (const actor of battle.actors) {
        const outcomes = recentActorOutcomes(
          presentation,
          actor.id,
          battle.tick,
        )
        for (const [index, item] of outcomes.entries()) {
          const x = Math.max(
            40,
            Math.min(layout.width - 40, actorX(actor) + 48),
          )
          const y = actorY(actor) - 44 - index * 17
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
          label(`${item.kind === "hit" ? "−" : "+"}${item.amount}`, x, y, 70)
        }
      }
    }

    const actorPoses: Record<string, string> = {}
    const actorContacts: Record<string, unknown> = {}
    const actorCues: Record<string, unknown> = {}
    const actorEffects: Record<string, unknown> = {}
    const bossVisuals: Record<string, ReturnType<typeof sampleBossVisual>> = {}
    function drawBossEffects(confirmed: boolean) {
      const manifest = FORGOTTEN_HOST_ASSETS
      for (const visual of Object.values(bossVisuals))
        for (const effect of visual.effects) {
          if ((effect.phase === "confirmed") !== confirmed) continue
          for (const targetId of effect.targetIds) {
            const target = actorById(battle, targetId)
            if (!target || (effect.phase === "warning" && target.hp <= 0))
              continue
            const frame = manifest.frames[effect.frame]
            paintFrame(
              manifest,
              effect.frame,
              atlases![manifest.entityId].fx,
              actorX(target),
              actorY(target) - 32,
              Math.min(0.32, 90 / Math.max(frame.width, frame.height)),
              false,
              effect.phase === "warning" ? 0.65 : 0.9,
            )
          }
        }
    }
    function draw(now: number) {
      if (!paused && document.visibilityState === "visible")
        clock.current.time += Math.min(50, Math.max(0, now - lastTime))
      lastTime = now
      const elapsed = reducedMotion ? 0 : clock.current.time - tickStartedAt
      for (const actor of battle.actors)
        if (actor.spiritId === FORGOTTEN_HOST_ASSETS.entityId) {
          const visual = sampleBossVisual(
            battle,
            actor,
            presentation,
            clock.current.bosses[actor.id],
            clock.current.time,
            reducedMotion,
            stopped,
          )
          clock.current.bosses[actor.id] = visual.clock
          bossVisuals[actor.id] = visual
        }
      drawArena()
      drawHaiFields()
      drawMocFields()
      drawBossEffects(false)
      for (const projectile of Object.values(presentation.projectiles))
        drawProjectile(projectile, elapsed)
      for (const actor of [...battle.actors].sort(
        (left, right) => actorY(left) - actorY(right),
      ))
        drawActor(actor)
      drawBossEffects(true)
      drawFloating()
      if (presentation.terminal) {
        context!.fillStyle = "rgba(7, 13, 12, .76)"
        context!.fillRect(8, layout.height / 2 - 55, layout.width - 16, 110)
        context!.strokeStyle = "#f5d68b"
        context!.strokeRect(8, layout.height / 2 - 55, layout.width - 16, 110)
        context!.fillStyle = "#fff3cc"
        context!.font = `700 ${layout.width < 480 ? 18 : 30}px system-ui`
        context!.textAlign = "center"
        const label =
          presentation.terminal.text === "player-win"
            ? "Giao ước được giữ"
            : presentation.terminal.text === "enemy-win"
              ? "Ký ức tan vào sương"
              : "Hai phía cùng lặng"
        context!.fillText(label, layout.width / 2, layout.height / 2 + 10)
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
      element!.dataset.actorLayout = JSON.stringify(layout.points)
      frameRequest = requestAnimationFrame(draw)
    }

    frameRequest = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRequest)
  }, [
    atlases,
    battle,
    presentation,
    reducedMotion,
    paused,
    stopped,
    visualIds,
    labels,
    stageWidth,
  ])

  return (
    <>
      <p className="note">
        Làn tách nhân vật để dễ theo dõi; vị trí ngang thể hiện bước tiến trong
        trận. Đ: đội của bạn · K: ký ức.
      </p>
      <div
        className="aw2-battle-stage"
        id="battle-arena"
        tabIndex={-1}
        ref={stage}
      >
        <canvas
          ref={canvas}
          width={layout.width}
          height={layout.height}
          aria-label="Trận đấu năm Vị Linh AW2"
          aria-describedby="battle-roster"
        />
      </div>
      <p role="status" data-testid="battle-atlas-state">
        {atlases
          ? optionalVisualIds && !bossPresent
            ? "Đội luyện đã tải đủ bộ hình chiến đấu"
            : "Năm atlas chiến đấu đã tải"
          : error
            ? "Tải atlas thất bại"
            : "Đang tải atlas chiến đấu…"}
      </p>
      {error && <p role="alert">{error}</p>}
      <details className="aw2-battle-roster" id="battle-roster">
        <summary>Máu và trạng thái từng nhân vật</summary>
        <ul>
          {battle.actors.map((actor) => (
            <li key={actor.id} data-actor-id={actor.id}>
              <strong>
                {layout.points[actor.id].badge} ·{" "}
                {labels?.[actor.id] ??
                  manifestFor(actor, visualIds)?.displayName ??
                  actor.id}
              </strong>
              <span>
                HP {actor.hp}/{actor.maxHp} ·{" "}
                {actorStatus(actor, battle.tick).join(" · ") || "Sẵn sàng"}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </>
  )
}
