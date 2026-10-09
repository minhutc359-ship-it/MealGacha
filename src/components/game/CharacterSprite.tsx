import { memo, useEffect, useRef, useState } from "react"
import { SPRITE_SHEETS } from "../../game/autochess/presentation"
import { characterPose, type CharacterMotion } from "../../game/tcgCharacterMotion"
import {
  characterBounds, characterImage, subscribeCharacterClock,
  type CharacterModel,
} from "../../infrastructure/assets/characterSprites"

interface Props {
  model: CharacterModel
  motion?: CharacterMotion
  delay?: number
  lead?: "attack"
  stamp: string
  flip?: boolean
  quiet?: boolean
  paused?: boolean
  fallback?: string
  cinematic?: boolean
}

export const CharacterSprite = memo(function CharacterSprite({
  model, motion = "idle", delay = 0, lead, stamp, flip = false,
  quiet = false, paused = false, fallback, cinematic = false,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [loadedPath, setLoadedPath] = useState("")
  const showcase = cinematic ? model.showcase : undefined
  const path = showcase ?? SPRITE_SHEETS[model.sheet].path
  useEffect(() => {
    const surface = canvas.current!, ctx = surface.getContext("2d")
    const bounds = characterBounds(model)
    if (!ctx || !bounds) return
    const image = characterImage(path)
    let width = 1, height = 1, start = performance.now(), visibleSince = start
    let hiddenAt: number | null = document.hidden ? start : null
    const draw = (now: number) => {
      if (!image.complete || !image.naturalWidth || document.hidden) return
      const age = quiet || paused ? 0 : Math.max(0, now - start)
      const current = age < delay ? lead ?? "idle" : motion
      const poseAge = age < delay ? age : age - delay
      const fresh = model.sheet !== "base"
      const pose = characterPose(current, poseAge, fresh, quiet, model.sheet.startsWith("roster"))
      const frame = showcase ? [0, 0, image.naturalWidth, image.naturalHeight, image.naturalWidth / 2, image.naturalHeight] : bounds.row.frames[pose]
      const [sx, sy, sw, sh, ax, ay] = frame
      const scale = showcase ? Math.min(width * .94 / sw, height * .94 / sh) : Math.min(width * .86 / (bounds.right - bounds.left), height * .88 / (bounds.bottom - bounds.top))
      const direction = flip ? -1 : 1
      const center = width / 2 - (showcase ? 0 : direction * (bounds.left + bounds.right) * scale / 2)
      let x = 0, y = 0, stretch = 0, alpha = 1, rotation = 0
      if (!quiet && !paused) {
        if (current === "idle") y = Math.sin((now - visibleSince) / 500 + model.row) * height * .012
        if (["attack", "cast"].includes(current)) x = Math.sin(Math.min(1, poseAge / 780) * Math.PI) * width * .055 * direction
        if (current === "summon") { alpha = Math.min(1, poseAge / 170); y = (1 - Math.min(1, poseAge / 300)) * height * .15 }
        if (current === "hit") x = -Math.sin(Math.min(1, poseAge / 260) * Math.PI) * width * .04 * direction
        if (current === "fall") alpha = Math.max(0, 1 - Math.max(0, poseAge - 250) / 650)
        if (current === "victory") {
          const beat = poseAge / 150 + model.row
          y = -Math.abs(Math.sin(beat)) * height * .05
          rotation = Math.sin(beat) * .04
          stretch = Math.cos(beat * 2) * .015
        }
      }
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.globalAlpha = alpha * .38
      ctx.fillStyle = "#061820"
      ctx.beginPath(); ctx.ellipse(width / 2, height * .96, width * .28, height * .035, 0, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = alpha
      ctx.translate(center + x, height * .94 - (showcase ? 0 : bounds.bottom * scale) + y)
      ctx.rotate(rotation)
      ctx.scale(direction * (1 - stretch), 1 + stretch)
      ctx.drawImage(image, sx, sy, sw, sh, -ax * scale, -ay * scale, sw * scale, sh * scale)
      ctx.restore()
      surface.dataset.pose = String(pose)
      surface.dataset.source = showcase ? "showcase" : "atlas"
    }
    const resize = () => {
      // Entrance transforms start at 30% scale. Measure the layout box so the
      // canvas keeps its full resolution after that animation grows to 100%.
      width = Math.max(1, surface.clientWidth); height = Math.max(1, surface.clientHeight)
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      surface.width = Math.round(width * dpr); surface.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      draw(performance.now())
    }
    const ready = () => { setLoadedPath(path); resize() }
    const visibility = () => {
      const now = performance.now()
      if (document.hidden) hiddenAt ??= now
      else {
        if (hiddenAt !== null) start += now - hiddenAt
        hiddenAt = null; visibleSince = now; draw(now)
      }
    }
    const observer = new ResizeObserver(resize)
    observer.observe(surface)
    image.addEventListener("load", ready)
    document.addEventListener("visibilitychange", visibility)
    if (image.complete && image.naturalWidth) ready()
    else resize()
    const unsubscribe = !quiet && !paused ? subscribeCharacterClock(draw) : () => {}
    return () => {
      unsubscribe(); observer.disconnect(); image.removeEventListener("load", ready)
      document.removeEventListener("visibilitychange", visibility)
    }
  }, [path, showcase, model.sheet, model.row, motion, delay, lead, stamp, flip, quiet, paused])
  return <span className={`tcg-character-sprite${loadedPath === path ? " is-loaded" : ""}`}
    data-character={model.id} data-motion={motion} data-sheet={model.sheet}
    data-quiet={quiet || paused} aria-hidden="true">
    {fallback && <img className="tcg-character-fallback" src={fallback} alt="" draggable={false} />}
    <canvas ref={canvas} />
  </span>
})
