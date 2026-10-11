import { useEffect, useMemo, useRef, useState, useId } from "react"
import { buildModeIntro, introAt } from "../../game/modeIntro"
import { INTRO_DURATION, INTRO_NAMES, introTime, type IntroMode } from "../../game/modeIntroState"
import { CARD_MAP } from "../../game/catalog"
import { unitCharacter, monsterCharacter, acquireCharacterImage } from "../../infrastructure/assets/characterSprites"
import { SPRITE_SHEETS } from "../../game/autochess/presentation"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import { useGameAudio, useGameMusic } from "./GameAudio"
import { ModeIntroScene } from "./ModeIntroScenes"
import { useAppStore } from "../../store/useAppStore"
import "../../game/tcg.css"
import "../../game/adventure.css"
import "../../game/autochess/autochess.css"
import "../../game/modeIntro.css"

export default function ModeIntroPlayer({ mode, onClose }: { mode: IntroMode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), titleId = useId()
  const clip = useMemo(() => buildModeIntro(mode), [mode])
  const [elapsed, setElapsed] = useState(0), [paused, setPaused] = useState(false), [replay, setReplay] = useState(0)
  const [hidden, setHidden] = useState(document.hidden)
  const [ready, setReady] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
  const low = useAppStore(state => state.user.preferences.graphicsQuality === "low")
  const clock = useRef(0), played = useRef(-1), lastSound = useRef(-1000)
  const finished = elapsed >= clip.duration, running = ready && !paused && !hidden && !finished
  const frame = introAt(clip.frames, elapsed), beat = introAt(clip.beats, elapsed), quiet = reduceMotion || low
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    const scroll = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { dialog.current?.close(); document.body.style.overflow = scroll; if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [])
  useGameAudio()
  useGameMusic(clip.music, 50)
  useEffect(() => {
    let active = true
    const paths = new Set<string>(), cleanups: (() => void)[] = []
    if (mode === "tcg" || mode === "auto") {
      for (const fx of ["water-impact", "fire-impact", "recipe-burst", "shield"]) paths.add(`/assets/tcg/fx/${fx}.webp`)
    }
    const character = (id: string, enemy = false) => {
      const model = enemy ? monsterCharacter(id) : unitCharacter(id)
      paths.add(SPRITE_SHEETS[model.sheet].path)
    }
    for (const { scene } of clip.frames) {
      if (scene.mode === "tcg") {
        for (const unit of [...scene.battle.player.board, ...scene.battle.enemy.board]) character(unit.cardId)
        for (const id of scene.battle.player.hand) { const art = CARD_MAP[id].art; if (art) paths.add(art) }
      } else if (scene.mode === "auto") {
        for (const piece of scene.run.roster) character(piece.id)
        for (const actor of scene.run.combat?.actors ?? []) character(actor.id, actor.side === "enemy")
      } else if (scene.mode === "adventure") paths.add("/assets/adventure/world.svg")
      else { const art = CARD_MAP[scene.dishId].art; if (art) paths.add(art) }
    }
    const leases = [...paths].map(path => acquireCharacterImage(path))
    const loaded = leases.map(({ image }) => new Promise<void>(resolve => {
      if (image.complete) { resolve(); return }
      const complete = () => { image.removeEventListener("load", complete); image.removeEventListener("error", complete); resolve() }
      image.addEventListener("load", complete); image.addEventListener("error", complete)
      cleanups.push(complete)
    }))
    // An unavailable image falls back to labels; it never traps the viewer.
    const fallback = window.setTimeout(() => { if (active) setReady(true) }, 5_000)
    void Promise.all(loaded).then(() => { if (active) { clearTimeout(fallback); setReady(true) } })
    return () => { active = false; clearTimeout(fallback); cleanups.forEach(cleanup => cleanup()); leases.forEach(lease => lease.release()) }
  }, [clip, mode])
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)"), update = () => setReduceMotion(query.matches)
    const visibility = () => setHidden(document.hidden)
    query.addEventListener("change", update); document.addEventListener("visibilitychange", visibility)
    return () => { query.removeEventListener("change", update); document.removeEventListener("visibilitychange", visibility) }
  }, [])
  useEffect(() => {
    if (!running) return
    let handle = 0, previous = performance.now(), rendered = previous
    const tick = (now: number) => {
      clock.current = introTime(clock.current, now - previous, !document.hidden)
      previous = now
      if (now - rendered >= 80 || clock.current === INTRO_DURATION) {
        setElapsed(clock.current); rendered = now
      }
      if (clock.current < INTRO_DURATION) handle = requestAnimationFrame(tick)
    }
    handle = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(handle)
  }, [running, replay])
  useEffect(() => {
    if (!running || frame.at === played.current) return
    played.current = frame.at
    if (frame.sound && elapsed - lastSound.current >= 400) {
      gameAudio.play(frame.sound); lastSound.current = elapsed
    }
  }, [frame.at, frame.sound, elapsed, running])
  const restart = () => {
    clock.current = 0; played.current = -1; lastSound.current = -1000
    setElapsed(0); setPaused(false); setReplay(value => value + 1)
  }
  return <dialog ref={dialog} className={`mode-live-demo mode-${mode} ${quiet ? "is-quiet" : ""} ${!running ? "is-paused" : ""}`} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="live-demo-toolbar">
      <div className="live-demo-caption"><small>GIỚI THIỆU TỰ CHƠI · {Math.floor(elapsed / 1000)} / 25s</small><strong id={titleId}>{finished ? "Hoàn tất · Bạn đã sẵn sàng" : beat.title}</strong></div>
      <div className="live-demo-controls">
        {finished ? <button type="button" onClick={onClose}>Vào chơi →</button> : <button type="button" onClick={() => setPaused(value => !value)} disabled={!ready} aria-pressed={paused}>{paused ? "Tiếp tục" : "Tạm dừng"}</button>}
        <button type="button" onClick={restart} aria-label="Xem lại giới thiệu">↻</button>
        <button type="button" onClick={onClose} aria-label="Đóng giới thiệu">×</button>
      </div>
      <p className="live-demo-note" aria-live="polite" aria-atomic="true">{finished ? clip.takeaway : ready ? beat.text : "Đang chuẩn bị mô hình…"}</p>
      <div className="live-demo-progress" role="progressbar" aria-label="Tiến trình giới thiệu" aria-valuemin={0} aria-valuemax={25} aria-valuenow={Math.floor(elapsed / 1000)}><i style={{ width: `${elapsed / INTRO_DURATION * 100}%` }} /></div>
    </header>
    <div className="live-demo-scene" key={replay}><ModeIntroScene frame={frame} elapsed={elapsed} paused={!running} quiet={quiet} /></div>
  </dialog>
}
