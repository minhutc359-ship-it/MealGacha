import { useEffect, useRef, useState } from "react"
import { markersBetween, sampleBattleClip, sampleWorldFrame, sampleProjectile, sampleSkillFx, skillCueTimes } from "../../src/aw2/assets/animation"
import type { BattleState, SkillSlot, SpiritAssetManifest, WorldDirection } from "../../src/aw2/assets/types"

type Options = {
  manifest: SpiritAssetManifest
  mode: "world" | "battle"
  direction: WorldDirection
  walking: boolean
  state: BattleState
  skill: SkillSlot | null
  playId: number
  paused: boolean
  reduced: boolean
  audioEnabled: boolean
}

export function AssetCanvas(props: Options) {
  const manifest = props.manifest
  const canvas = useRef<HTMLCanvasElement>(null)
  const controls = useRef(props)
  controls.current = props
  const [images, setImages] = useState<Record<string, HTMLImageElement> | null>(null)
  const [error, setError] = useState("")
  const [lastCue, setLastCue] = useState("Chưa có contact cue")
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let disposed = false
    setImages(null); setError("")
    canvas.current?.getContext("2d")?.clearRect(0, 0, 640, 440)
    const keys = ["world", "battle", "fx"]
    void Promise.all(keys.map(key => new Promise<[string, HTMLImageElement]>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve([key, image])
      image.onerror = () => reject(new Error(`Không tải được asset ${manifest.assets[key].id}`))
      image.src = manifest.assets[key].url
    }))).then(entries => { if (!disposed) setImages(Object.fromEntries(entries)) })
      .catch(cause => { if (!disposed) setError(cause instanceof Error ? cause.message : "Không tải được atlas.") })
    return () => { disposed = true; audio.current?.pause() }
  }, [manifest])

  useEffect(() => {
    if (props.paused || !props.audioEnabled) audio.current?.pause()
  }, [props.paused, props.audioEnabled])

  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext("2d")
    if (!element || !context || !images) return
    let raf = 0, lastTime = 0, elapsed = 0, eventCount = 0
    const playedCues = new Set<number>()
    setLastCue("Chưa có contact cue")
    audio.current?.pause()
    const clip = manifest.battle[props.state]
    const selectedSkill = props.mode === "battle" && props.skill ? manifest.skills[props.skill] : null

    function paint(frameId: string, x: number, y: number, scale: number, rotation = 0, opacity = 1) {
      const frame = manifest.frames[frameId]
      const image = images![frame.asset]
      context!.save()
      context!.globalAlpha = Math.max(0, Math.min(1, opacity))
      context!.translate(x, y); context!.rotate(rotation)
      context!.imageSmoothingEnabled = props.mode === "battle"
      context!.drawImage(image, frame.x, frame.y, frame.width, frame.height,
        -frame.anchorX * scale, -frame.anchorY * scale, frame.width * scale, frame.height * scale)
      context!.restore()
    }
    function draw(now: number) {
      const flags = controls.current
      const previous = elapsed
      if (lastTime && !flags.paused && document.visibilityState === "visible") elapsed += Math.min(50, now - lastTime)
      lastTime = now
      context!.clearRect(0, 0, 640, 440)
      let frameId = "", fxFrame = "", projectileFrame = "", projectileX = ""
      if (props.mode === "world") {
        frameId = sampleWorldFrame(manifest, props.direction, props.walking, elapsed, flags.reduced)
        paint(frameId, 320, 328, .68)
      } else {
        const pose = sampleBattleClip(clip, elapsed, flags.reduced)
        frameId = pose.frame
        const effect = selectedSkill ? sampleSkillFx(selectedSkill, elapsed, flags.reduced) : null
        fxFrame = effect?.frame ?? ""
        const drawFx = () => {
          if (!fxFrame || !selectedSkill) return
          const placement = selectedSkill.fxPlacement
          const anchor = placement.attachment === "contact" ? sampleBattleClip(clip, effect?.cue ?? selectedSkill.fxTriggerAtMs, flags.reduced) : pose
          paint(fxFrame, 300 + anchor.x + placement.x * .68, 394 + anchor.y + placement.y * .68, .68 * placement.scale)
        }
        if (selectedSkill?.fxPlacement.layer === "behind") drawFx()
        paint(frameId, 300 + pose.x, 394 + pose.y, .68 * pose.scale, pose.rotation, pose.opacity)
        if (selectedSkill?.fxPlacement.layer !== "behind") drawFx()
        const projectile = selectedSkill ? sampleProjectile(selectedSkill, elapsed, flags.reduced) : null
        if (projectile) {
          projectileFrame = projectile.frame
          projectileX = String(projectile.x)
          paint(projectile.frame, 300 + projectile.x * .68, 394 + projectile.y * .68, .68 * projectile.scale)
        }
        const contacts = markersBetween(clip, previous, elapsed)
        if (contacts.length) { eventCount += contacts.length; setLastCue(`${contacts[0].kind} · ${contacts[0].skill} @ ${contacts[0].atMs}ms`) }
        for (const cue of selectedSkill ? skillCueTimes(selectedSkill) : []) {
          if (playedCues.has(cue) || elapsed < cue) continue
          playedCues.add(cue)
          if (props.skill === "passive") { eventCount++; setLastCue(`preview proc · passive @ ${cue}ms; ${selectedSkill!.trigger}`) }
          if (flags.audioEnabled) {
            const sound = new Audio(selectedSkill!.audio.url)
            audio.current = sound; sound.volume = .3
            void sound.play().catch(cause => {
              if (cause instanceof DOMException && cause.name === "AbortError") return
              setError("Chưa phát được audio. Tắt/bật âm thanh rồi phát lại để thử.")
            })
          }
        }
      }
      element!.dataset.frame = frameId
      element!.dataset.fx = fxFrame
      element!.dataset.elapsed = String(Math.floor(elapsed))
      element!.dataset.events = String(eventCount)
      element!.dataset.cues = String(playedCues.size)
      element!.dataset.projectile = projectileFrame
      element!.dataset.projectileX = projectileX
      element!.dataset.spirit = manifest.spiritId
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); audio.current?.pause() }
  }, [images, manifest, props.mode, props.direction, props.walking, props.state, props.skill, props.playId])

  return <>
    <div className="aw2-asset-stage"><canvas ref={canvas} width={640} height={440} aria-label={`${manifest.displayName} ${props.mode} ${props.mode === "world" ? props.direction : props.state}`} /></div>
    <p role="status" data-testid="atlas-state">{images ? "Atlas đã tải" : error ? "Tải atlas thất bại" : "Đang tải atlas…"}</p>
    <p data-testid="contact-cue">{lastCue}</p>
    {error && <p role="alert">{error}</p>}
  </>
}
