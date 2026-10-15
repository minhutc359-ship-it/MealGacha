import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { gameAudio } from "../../infrastructure/audio/gameAudio";
import { AWAKENING_MEDIA, CINEMATIC_SECONDS, awakenedKit, ULTIMATE_MOVES } from "../../game/adventureRpg/awakening";
import { SpiritArt, SkillArt } from "./SpiritArt";
import { CARD_MAP } from "../../game/catalog";
/** The movie presents an already-committed cast. Completion never casts or pays anything. */
export function RpgCinematic({ id, paused, reduced = false, onDone, onTogglePause }: {
    id: string;
    paused: boolean;
    reduced?: boolean;
    onDone: () => boolean | void;
    onTogglePause?: () => void;
}) {
    reduced = reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const video = useRef<HTMLVideoElement>(null), done = useRef(false), callback = useRef(onDone);
    const actions = useRef<HTMLElement>(null);
    const audio = useRef<ReturnType<typeof gameAudio.playClip> | null>(null);
    const [hidden, setHidden] = useState(document.hidden);
    const stopped = paused || hidden;
    useEffect(() => { const update = () => setHidden(document.hidden); document.addEventListener("visibilitychange", update); return () => document.removeEventListener("visibilitychange", update); }, []);
    const [fallback, setFallback] = useState(reduced);
    const [failed, setFailed] = useState(false);
    const [progress, setProgress] = useState(0);
    const kit = awakenedKit(id);
    callback.current = onDone;
    const finish = () => { if (!done.current) {
        done.current = true;
        audio.current?.stop();
        if(callback.current()===false){done.current=false;setFailed(true)}
    } };
    useEffect(() => {
        const element = video.current;
        if (stopped) {
            element?.pause();
            audio.current?.stop();
            audio.current = null;
            return;
        }
        if (!fallback && element)
            void element.play().catch(() => setFallback(true));
    }, [stopped, fallback]);
    useEffect(() => { if (!fallback || stopped)
        return; const at = performance.now(); audio.current?.stop(); audio.current = gameAudio.playClip(`${AWAKENING_MEDIA}/sounds/${id}.mp3`, () => (performance.now() - at) / 1000); return () => audio.current?.stop(); }, [fallback, stopped, id]);
    useEffect(() => {
        if (stopped || failed)
            return;
        // Also bounds loading/decode stalls. The watch clock does not run while paused/hidden.
        let age = 0, previous = performance.now();
        const timer = setInterval(() => {
            const now = performance.now();
            if (!document.hidden)
                age += now - previous;
            previous = now;
            if (fallback && age >= (reduced ? CINEMATIC_SECONDS * 1000 : 1400) || age > (CINEMATIC_SECONDS + 4) * 1000)
                finish();
        }, 100);
        return () => clearInterval(timer);
    }, [stopped, fallback, reduced, failed]);
    useEffect(() => () => { audio.current?.stop(); const element = video.current; if (element) {
        element.pause();
        element.removeAttribute("src");
        element.load();
    } }, []);
    useEffect(()=>{
      if(!onTogglePause)return;
      const previous=document.activeElement as HTMLElement|null, overflow=document.body.style.overflow;
      document.body.style.overflow="hidden";actions.current?.querySelector('button')?.focus({preventScroll:true});
      return()=>{document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus({preventScroll:true})};
    },[!!onTogglePause]);
    const scene = <aside ref={actions} role={onTogglePause?"dialog":undefined} aria-modal={onTogglePause?true:undefined} onKeyDown={e=>{if(!onTogglePause)return;if(e.key==="Escape"){e.preventDefault();finish()}if(e.key==="Tab"){const nodes=actions.current?.querySelectorAll<HTMLElement>('button,a[href]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus()}}}} className={`rpg-cinematic ${onTogglePause?"is-fullscreen":""} ${fallback ? "is-static" : ""}`} aria-label={`Tuyệt kỹ ${CARD_MAP[id].name}`}>
    {onTogglePause && <div className="rpg-cinematic-memory"><SpiritArt id={id}/></div>}
    <div className="rpg-cinematic-top"><span>GIAO ƯỚC THỨC TỈNH</span><div>{onTogglePause && <button type="button" aria-label={paused ? "Tiếp hoạt ảnh" : "Dừng hoạt ảnh"} onClick={onTogglePause}>{paused ? "▶" : "Ⅱ"}</button>}<button type="button" onClick={finish}>{failed?"Thử lại":"Bỏ qua ›"}</button></div></div>
    <div className="rpg-cinematic-screen">
      {!fallback ? <video ref={video} src={`${AWAKENING_MEDIA}/movies/${id}.mp4`} muted playsInline preload="auto" aria-label={`Video ${kit.title}`} onEnded={finish} onError={() => setFallback(true)} onTimeUpdate={() => setProgress(Math.min(1, (video.current?.currentTime ?? 0) / CINEMATIC_SECONDS))} onPlaying={() => { audio.current?.stop(); audio.current = gameAudio.playClip(`${AWAKENING_MEDIA}/sounds/${id}.mp3`, () => video.current?.currentTime ?? CINEMATIC_SECONDS); }} onPause={() => { audio.current?.stop(); audio.current = null; }}/> : <div className="rpg-cinematic-poster"><SpiritArt id={id}/><SkillArt index={64 + kit.iconCell}/></div>}
      <div className="rpg-cinematic-shade"/>
    </div>
    <div className="rpg-cinematic-caption"><SkillArt index={64 + kit.iconCell}/><div><small>{CARD_MAP[id].name}</small><strong>{kit.title} · {ULTIMATE_MOVES[kit.ultimate][0]}</strong><span>{paused ? `Tạm dừng · ${ULTIMATE_MOVES[kit.ultimate][1]}` : ULTIMATE_MOVES[kit.ultimate][1]}</span></div></div>
    {failed && <p className="rpg-cinematic-error" role="alert">Chưa lưu được kết thúc hoạt ảnh. Thử lại sau khi kiểm tra dung lượng. <a href="/settings">Sao lưu & lưu trữ ↗</a></p>}
    <div className="rpg-cinematic-progress" style={{ width: `${progress * 100}%` }}/>
  </aside>;
  return onTogglePause?createPortal(scene,document.body):scene;
}
