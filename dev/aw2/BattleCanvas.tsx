import { useEffect, useRef, useState } from "react"
import { sampleBattleClip } from "../../src/aw2/assets/animation"
import { STARTER_ASSETS } from "../../src/aw2/assets/starters"
import type {
  BattleState,
  SkillSlot,
  SpiritAssetManifest,
} from "../../src/aw2/assets/types"
import type {
  CombatActor,
  CombatBattle,
  CombatPresentation,
} from "../../src/aw2/combat"

interface LoadedAtlas {
  battle: HTMLImageElement
  fx: HTMLImageElement
}

interface Props {
  battle: CombatBattle
  presentation: CombatPresentation
  reducedMotion: boolean
}

const TICK_MS = 650
const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value))
const actorX = (actor: CombatActor) => 65 + actor.position * 8.3
const actorY = (actor: CombatActor) =>
  actor.side === "player" ? 365 + actor.slot * 28 : 255 + actor.slot * 34
const actorById = (battle: CombatBattle, id: string) =>
  battle.actors.find((actor) => actor.id === id)

function manifestFor(actor: CombatActor): SpiritAssetManifest {
  return STARTER_ASSETS[actor.spiritId] ?? STARTER_ASSETS["aw2-than"]
}

function slotFromSkill(skillId?: string): SkillSlot | null {
  const slot = skillId?.split(":").at(-1)
  return ["basic", "auto", "passive", "ultimate"].includes(slot ?? "")
    ? slot as SkillSlot
    : null
}

export function BattleCanvas({ battle, presentation, reducedMotion }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
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
            {
              battle: await load(manifest.assets.battle.url),
              fx: await load(manifest.assets.fx.url),
            },
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
    const startedAt = performance.now()
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
    ) {
      const frame = manifest.frames[frameId]
      if (!frame) return
      context!.save()
      context!.globalAlpha = clamp(opacity)
      context!.translate(x, y)
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

    function drawActor(actor: CombatActor, elapsed: number) {
      const manifest = manifestFor(actor)
      const atlas = atlases![manifest.spiritId]
      const cue = presentation.actors[actor.id]
      const fresh =
        cue && (cue.state === "defeat" || cue.tick >= battle.tick - 1)
      const state: BattleState =
        actor.hp <= 0
          ? "defeat"
          : fresh
            ? cue.state
            : actor.cast
              ? "cast"
              : "idle"
      const pose = sampleBattleClip(
        manifest.battle[state],
        elapsed,
        reducedMotion,
      )
      const x = actorX(actor)
      const y = actorY(actor)
      const enemy = actor.side === "enemy"
      if (enemy) {
        context!.save()
        context!.filter = "hue-rotate(155deg) saturate(.68) brightness(.82)"
      }
      paintFrame(
        manifest,
        pose.frame,
        atlas.battle,
        x + (enemy ? -pose.x : pose.x) * 0.28,
        y + pose.y * 0.28,
        0.28 * pose.scale,
        enemy,
        pose.opacity,
      )
      if (enemy) context!.restore()

      const slot = slotFromSkill(cue?.skillId)
      if (
        fresh &&
        slot &&
        ["cast", "ultimate", "attack", "guard"].includes(state)
      ) {
        const skill = manifest.skills[slot]
        const fxIndex = reducedMotion
          ? 2
          : Math.floor(elapsed / 90) % skill.fx.length
        const fxFrame = skill.fx[fxIndex]
        paintFrame(
          manifest,
          fxFrame,
          atlas.fx,
          x + (enemy ? -1 : 1) * skill.fxPlacement.x * 0.28,
          y + skill.fxPlacement.y * 0.28,
          0.28 * skill.fxPlacement.scale,
          enemy,
          0.82,
        )
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
      context!.fillText(manifest.displayName, x, top - 5)
    }

    function drawProjectile(
      projectile: CombatPresentation["projectiles"][string],
      elapsed: number,
    ) {
      const source = actorById(battle, projectile.sourceId)
      const target = actorById(battle, projectile.targetId)
      if (!source || !target) return
      const manifest = manifestFor(source)
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

    function draw(now: number) {
      const elapsed = reducedMotion ? 0 : now - startedAt
      drawArena()
      for (const projectile of Object.values(presentation.projectiles))
        drawProjectile(projectile, elapsed)
      for (const actor of [...battle.actors].sort(
        (left, right) => actorY(left) - actorY(right),
      ))
        drawActor(actor, elapsed)
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
      frameRequest = requestAnimationFrame(draw)
    }

    frameRequest = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRequest)
  }, [atlases, battle, presentation, reducedMotion])

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
