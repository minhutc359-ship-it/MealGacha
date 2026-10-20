import { useEffect, useRef, useState } from "react"
import { markersBetween, sampleBattleClip, sampleWorldFrame } from "../../src/aw2/assets/animation"
import { THAN_ASSETS } from "../../src/aw2/assets/than"
import type { BattleState, SkillSlot, WorldDirection } from "../../src/aw2/assets/types"

const manifest = THAN_ASSETS
type Options = {
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
  const canvas = useRef<HTMLCanvasElement>(null)
  const controls = useRef(props)
  controls.current = props
  const [images, setImages] = useState<Record<string, HTMLImageElement> | null>(null)
  const [error, setError] = useState("")
  const [lastCue, setLastCue] = useState("Chưa có contact cue")
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let disposed = false
    const keys = ["world", "battle", "fx"]
    void Promise.all(keys.map(key => new Promise<[string, HTMLImageElement]>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve([key, image])
      image.onerror = () => reject(new Error(`Không tải được asset ${manifest.assets[key].id}`))
      image.src = manifest.assets[key].url
    }))).then(entries => { if (!disposed) setImages(Object.fromEntries(entries)) })
      .catch(cause => { if (!disposed) setError(cause instanceof Error ? cause.message : "Không tải được atlas.") })
    return () => { disposed = true; audio.current?.pause() }
  }, [])

  useEffect(() => {
    if (props.paused || !props.audioEnabled) audio.current?.pause()
  }, [props.paused, props.audioEnabled])

  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext("2d")
    if (!element || !context || !images) return
    let raf = 0, lastTime = 0, elapsed = 0, cuePlayed = false, eventCount = 0
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
      let frameId = "", fxFrame = ""
      if (props.mode === "world") {
        frameId = sampleWorldFrame(manifest, props.direction, props.walking, elapsed, flags.reduced)
        paint(frameId, 320, 328, .68)
      } else {
        const pose = sampleBattleClip(clip, elapsed, flags.reduced)
        frameId = pose.frame
        if (selectedSkill) {
          const since = elapsed - selectedSkill.fxTriggerAtMs
          const index = flags.reduced ? 2 : Math.floor(since / selectedSkill.fxFrameMs)
          if ((flags.reduced || since >= 0) && index >= 0 && index < selectedSkill.fx.length) fxFrame = selectedSkill.fx[index]
        }
        const drawFx = () => {
          if (!fxFrame) return
          const ultimate = props.skill === "ultimate"
          paint(fxFrame, props.skill === "basic" ? 450 : 320, ultimate ? 260 : 212, ultimate ? 1.45 : .9)
        }
        if (props.skill === "ultimate") drawFx()
        paint(frameId, 300 + pose.x, 394 + pose.y, .68 * pose.scale, pose.rotation, pose.opacity)
        if (props.skill !== "ultimate") drawFx()
        const contacts = markersBetween(clip, previous, elapsed)
        if (contacts.length) { eventCount += contacts.length; setLastCue(`${contacts[0].kind} · ${contacts[0].skill} @ ${contacts[0].atMs}ms`) }
        if (selectedSkill && !cuePlayed && elapsed >= selectedSkill.fxTriggerAtMs) {
          cuePlayed = true
          if (props.skill === "passive") { eventCount++; setLastCue(`preview proc · passive @ ${selectedSkill.fxTriggerAtMs}ms; cần shield-expired từ combat`) }
          if (flags.audioEnabled) {
            const sound = new Audio(selectedSkill.audio.url)
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
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); audio.current?.pause() }
  }, [images, props.mode, props.direction, props.walking, props.state, props.skill, props.playId])

  return <>
    <div className="aw2-asset-stage"><canvas ref={canvas} width={640} height={440} aria-label={`Than ${props.mode} ${props.mode === "world" ? props.direction : props.state}`} /></div>
    <p role="status" data-testid="atlas-state">{images ? "Atlas đã tải" : error ? "Tải atlas thất bại" : "Đang tải atlas…"}</p>
    <p data-testid="contact-cue">{lastCue}</p>
    {error && <p role="alert">{error}</p>}
  </>
}
