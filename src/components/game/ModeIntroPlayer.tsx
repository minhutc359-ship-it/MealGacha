import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { buildModeIntro, introAt, type IntroFrame, type IntroScene } from "../../game/modeIntro"
import { INTRO_DURATION, INTRO_NAMES, introTime, type IntroMode } from "../../game/modeIntroState"
import { CARD_MAP, SCHOOLS } from "../../game/catalog"
import { AUTO_SCHOOLS, MONSTER_MAP, PROFESSIONS, SKILL_LABELS, UNIT_MAP } from "../../game/autochess/catalog"
import { traitCounts } from "../../game/autochess/economy"
import { ADVENTURE_MAP_BY_ID } from "../../game/adventureWorld"
import { skillsFor } from "../../game/adventureSkills"
import { SEED_DISHES } from "../../infrastructure/catalog/seedCatalog"
import { unitCharacter, monsterCharacter, acquireCharacterImage } from "../../infrastructure/assets/characterSprites"
import { SPRITE_SHEETS } from "../../game/autochess/presentation"
import { spiritMaxHp as spiritHp } from "../../game/adventure"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import type { BattleUnit } from "../../game/types"
import { CharacterSprite } from "./CharacterSprite"
import { HumanSprite, SpiritSprite, WorldAsset } from "./AdventureArt"
import { Dialog } from "./Dialog"
import { useGameAudio, useGameMusic } from "./GameAudio"
import { useAppStore } from "../../store/useAppStore"
import "../../game/modeIntro.css"

function Meter({ value, max, label, mana = false }: { value: number; max: number; label: string; mana?: boolean }) {
  return <div className={`intro-meter ${mana ? "mana" : ""}`} aria-label={`${label}: ${Math.round(value)} / ${max}`}>
    <i style={{ width: `${Math.max(0, Math.min(100, value / Math.max(1, max) * 100))}%` }} />
    <span>{label} {Math.round(value)}/{max}</span>
  </div>
}

function TcgUnit({ unit, acting, paused, stamp }: { unit: BattleUnit; acting: boolean; paused: boolean; stamp: number }) {
  const card = CARD_MAP[unit.cardId]
  return <div className={`intro-tcg-unit ${acting ? "is-acting" : ""}`} style={{ "--unit-color": SCHOOLS[card.school].color } as CSSProperties}>
    <CharacterSprite model={unitCharacter(unit.cardId)} stamp={`${unit.uid}-${stamp}`} motion={acting ? "attack" : "idle"} paused={paused} fallback={card.art} />
    <strong>{card.name}</strong><Meter value={unit.health} max={unit.maxHealth} label="HP" />
    <small>⚔ {unit.attack} {unit.shield > 0 ? `· ⬡ ${unit.shield}` : ""} · {unit.keywords.includes("guard") ? "Hộ vệ" : unit.ready ? "Sẵn sàng" : "Chờ lượt"}</small>
  </div>
}

function TcgStage({ scene, paused, stamp }: { scene: Extract<IntroScene, { mode: "tcg" }>; paused: boolean; stamp: number }) {
  const b = scene.battle
  return <div className="intro-tcg-stage">
    <div className="intro-hero enemy"><span>ĐẦU BẾP DU HÀNH</span><Meter value={b.enemy.health} max={b.enemy.maxHealth} label="Ý chí" /></div>
    <div className="intro-tcg-lane enemy">{b.enemy.board.length ? b.enemy.board.map(unit => <TcgUnit key={unit.uid} unit={unit} acting={false} paused={paused} stamp={stamp} />) : <span className="intro-cleared">Hộ vệ đã bị hạ · Đường đánh chủ tướng đã mở</span>}</div>
    <div className="intro-arena-mark" aria-hidden="true">✦</div>
    <div className="intro-tcg-lane ally">{b.player.board.map(unit => <TcgUnit key={unit.uid} unit={unit} acting={scene.event?.source === unit.uid} paused={paused} stamp={stamp} />)}</div>
    <div className="intro-hero ally"><span>BẠN · NĂNG LƯỢNG {b.player.mana}/{b.player.maxMana}</span><Meter value={b.player.health} max={b.player.maxHealth} label="Ý chí" /></div>
    <div className="intro-hand" aria-label="Bài trên tay">{b.player.hand.length ? b.player.hand.map((id, i) => <div key={`${id}-${i}`}><img src={CARD_MAP[id].art} alt="" /><span>{CARD_MAP[id].name}<small>◆ {CARD_MAP[id].cost} · {CARD_MAP[id].kind === "spell" ? "Phép" : "Đồng minh"}</small></span></div>) : <span>Đã nối thẻ và hoàn tất đòn đánh</span>}</div>
    {(b.comboCounts?.home ?? 0) > 0 && <div className="intro-combo-badge">❧ Bữa cơm nhà · Đã kích hoạt</div>}
  </div>
}

function AutoStage({ scene, paused }: { scene: Extract<IntroScene, { mode: "auto" }>; paused: boolean }) {
  const run = scene.run, counts = traitCounts(run.roster.filter(piece => piece.cell !== null))
  const actors = run.combat?.actors ?? []
  return <div className="intro-auto-stage">
    <div className="intro-board-status"><strong>{run.combat ? "GIAO CHIẾN TỰ ĐỘNG" : "CHUẨN BỊ ĐỘI HÌNH"}</strong><span>◇ {run.gold} vàng · {run.roster.length} quân</span></div>
    <div className="intro-auto-board" aria-label="Bàn cờ 6 × 6, đội bạn ở ba hàng dưới">
      {Array.from({ length: 36 }, (_, i) => <div key={i} className={`intro-auto-tile ${i >= 18 ? "ally" : "enemy"}`} />)}
      {!run.combat && <span className="intro-placement-label">Tuyến trước giữ bàn<br />Tuyến sau đánh xa / hỗ trợ</span>}
      {run.combat ? actors.map(actor => {
        const def = actor.side === "ally" ? UNIT_MAP[actor.id] : MONSTER_MAP[actor.id], action = actor.action
        const motion = actor.hp <= 0 ? "fall" : action?.kind === "cast" ? "cast" : action?.kind === "attack" ? "attack" : "idle"
        return <div key={actor.uid} className={`intro-auto-actor ${actor.side} ${actor.hp <= 0 ? "is-fallen" : ""} ${motion === "cast" ? "is-casting" : ""}`}
          style={{ left: `${(actor.cell % 6 + .5) / 6 * 100}%`, top: `${(Math.floor(actor.cell / 6) + .5) / 6 * 100}%`, "--unit-color": AUTO_SCHOOLS[def.school].color } as CSSProperties}>
          <CharacterSprite model={actor.side === "ally" ? unitCharacter(actor.id) : monsterCharacter(actor.id)} motion={motion} stamp={`${actor.uid}-${action?.start ?? actor.diedAt ?? 0}`} paused={paused} />
          <strong>{def.name} {actor.side === "ally" ? "★".repeat(actor.star) : ""}</strong>
          <Meter value={actor.hp} max={actor.maxHp} label="HP" /><Meter value={actor.mana} max={100} label="MP" mana />
          {actor.shield > 0 && <small className="intro-shield">⬡ {Math.round(actor.shield)}</small>}
          {action?.kind === "cast" && <span className="intro-cast-label">{SKILL_LABELS[actor.skill]}</span>}
        </div>
      }) : run.roster.filter(piece => piece.cell !== null).map(piece => <div key={piece.uid} className="intro-auto-actor ally"
        style={{ left: `${(piece.cell! % 6 + .5) / 6 * 100}%`, top: `${(Math.floor(piece.cell! / 6) + .5) / 6 * 100}%` }}>
        <CharacterSprite model={unitCharacter(piece.id)} motion={piece.star === 2 ? "summon" : "idle"} stamp={`${piece.uid}-${piece.star}`} paused={paused} />
        <strong>{UNIT_MAP[piece.id].name} {"★".repeat(piece.star)}</strong>
      </div>)}
    </div>
    <div className="intro-traits">{Object.entries(counts).filter(([, count]) => count >= 2).map(([id, count]) => <span key={id}>✦ {id in AUTO_SCHOOLS ? AUTO_SCHOOLS[id as keyof typeof AUTO_SCHOOLS].name : PROFESSIONS[id as keyof typeof PROFESSIONS].name} {count}</span>)}<span>Mana đầy → tự dùng kỹ năng</span></div>
    {!run.combat && <div className="intro-shop">{run.shop.slice(0, 2).map((id, i) => <div key={i}>{id ? <><img src={UNIT_MAP[id].art} alt="" /><strong>{UNIT_MAP[id].name} · {UNIT_MAP[id].cost} vàng</strong></> : <strong>✓ Đã mua Phở bò</strong>}</div>)}{run.roster.some(piece => piece.cell === null) && <span>+1 Phở bò dự bị · cần đủ 3 bản sao</span>}</div>}
  </div>
}

function AdventureExplore({ scene }: { scene: Extract<IntroScene, { mode: "adventure" }> }) {
  const save = scene.save, map = ADVENTURE_MAP_BY_ID[save.mapId]
  // The viewport is a crop of the actual map, with the same sprite symbols.
  const top = 8, width = 13, height = 9
  return <div className="intro-world-stage"><div className="intro-world-map">
    {Array.from({ length: width * height }, (_, index) => {
      const x = index % width, y = Math.floor(index / width) + top, cell = map.grid[y]?.[x]
      return <span key={index} className={`intro-world-tile tile-${cell}`}>
        {cell === "t" && <WorldAsset id="tree" />}{cell === "g" && <WorldAsset id="grass" />}
      </span>
    })}
    <div className="intro-world-human" style={{ left: `${(save.x + .5) / width * 100}%`, top: `${(save.y - top + .5) / height * 100}%` }}><HumanSprite character="hero" direction={save.facing} frame={save.steps % 2} /></div>
    {save.follower && <div className="intro-world-follower" style={{ left: `${(save.follower.x + .5) / width * 100}%`, top: `${(save.follower.y - top + .5) / height * 100}%` }}><SpiritSprite cardId={save.team[0].cardId} /></div>}
    {map.npcs.filter(npc => npc.x < width && npc.y >= top && npc.y < top + height).map(npc => <div className="intro-world-npc" key={npc.id} style={{ left: `${(npc.x + .5) / width * 100}%`, top: `${(npc.y - top + .5) / height * 100}%` }}><HumanSprite character={npc.character} /><small>{npc.name}</small></div>)}
  </div><div className="intro-world-hint"><strong>Chợ Đèn · Vị Linh đi cùng bạn</strong><span>WASD / ↑↓←→ · Chọn điểm để đi · E tương tác</span></div></div>
}

function AdventureStage({ scene }: { scene: Extract<IntroScene, { mode: "adventure" }> }) {
  if (scene.exploring) return <AdventureExplore scene={scene} />
  const encounter = scene.save.encounter ?? scene.opponent!, active = scene.save.team.find(member => member.uid === encounter.activeUid)!, caught = !scene.save.encounter
  const moves = skillsFor(active.cardId, active.level)
  return <div className="intro-adventure-stage">
    <div className="intro-spirit-info enemy"><strong>{CARD_MAP[encounter.cardId].name} <small>Lv.{encounter.level} · {SCHOOLS[CARD_MAP[encounter.cardId].school].name}</small></strong><Meter value={encounter.hp} max={encounter.maxHp} label="HP" /></div>
    <div className={`intro-spirit-model enemy ${caught ? "is-caught" : ""}`}><SpiritSprite cardId={encounter.cardId} /></div>
    <div className="intro-spirit-model ally"><SpiritSprite cardId={active.cardId} back /></div>
    {caught && <div className="intro-capture-mark">✦ Hương Ấn<small>{CARD_MAP[encounter.cardId].name} đã nhận lời!</small></div>}
    <div className="intro-spirit-info ally"><strong>{CARD_MAP[active.cardId].name}<small>Lv.{active.level} · {SCHOOLS[CARD_MAP[active.cardId].school].name}</small></strong><Meter value={active.hp} max={spiritHp(active.cardId, active.level)} label="HP" /></div>
    <div className="intro-adventure-actions">{moves.filter(move => move.school).slice(0, 2).map(move => <span key={move.id}>{move.name}<small>PP {active.pp?.[move.id] ?? move.pp}/{move.pp}</small></span>)}<span>Đổi Vị Linh<small>Đội {scene.save.team.length}/6</small></span><span>Hương Ấn<small>Còn {scene.save.aromaSeals}</small></span></div>
    <p className="intro-battle-log">{caught ? scene.save.message : encounter.log[encounter.log.length - 1]}</p>
  </div>
}

const RARITY_NAMES = { common: "Thường", rare: "Hiếm", epic: "Sử thi", diamond: "Kim cương" }
function ChestStage({ scene }: { scene: Extract<IntroScene, { mode: "chest" }> }) {
  const dish = SEED_DISHES.find(item => item.id === scene.dishId)!, card = CARD_MAP[scene.dishId]
  const revealed = scene.phase === "reveal" || scene.phase === "collect"
  return <div className={`intro-chest-stage phase-${scene.phase}`}>
    <div className="intro-meal-tabs"><span className="selected">☀ Sáng</span><span>☼ Trưa</span><span>☾ Tối</span><strong>◇ {scene.keys} chìa mẫu</strong></div>
    <div className="intro-chest-glow" aria-hidden="true" />
    <div className="intro-chest-model" aria-hidden="true"><div className="intro-chest-lid" /><div className="intro-chest-body"><span>◇</span></div></div>
    {revealed && <div className={`intro-reward rarity-${scene.rarity}`}><img src={card.art} alt="" /><small>{RARITY_NAMES[scene.rarity]}</small><strong>{dish.name}</strong><span>Món minh họa · kết quả chọn sẵn</span></div>}
    {scene.phase === "collect" && <div className="intro-collection"><span>HỒ SƠ VỊ GIÁC</span>{["com-tam", "banh-mi", scene.dishId].map(id => <div key={id} className={id === scene.dishId ? "is-new" : ""}><img src={CARD_MAP[id].art} alt="" /><strong>{CARD_MAP[id].name}</strong><small>{id === scene.dishId ? "✦ Vừa thêm" : "Đã sưu tầm"}</small></div>)}</div>}
    {!revealed && <p className="intro-chest-prompt">{scene.phase === "choose" ? "Bữa sáng đang chờ trong rương" : "Chìa đã chạm · hương vị đang thức giấc"}</p>}
  </div>
}

function Stage({ frame, paused }: { frame: IntroFrame; paused: boolean }) {
  switch (frame.scene.mode) {
    case "tcg": return <TcgStage scene={frame.scene} paused={paused} stamp={frame.at} />
    case "auto": return <AutoStage scene={frame.scene} paused={paused} />
    case "adventure": return <AdventureStage scene={frame.scene} />
    case "chest": return <ChestStage scene={frame.scene} />
  }
}

export default function ModeIntroPlayer({ mode, onClose }: { mode: IntroMode; onClose: () => void }) {
  const clip = useMemo(() => buildModeIntro(mode), [mode])
  const [elapsed, setElapsed] = useState(0), [paused, setPaused] = useState(false), [replay, setReplay] = useState(0)
  const [hidden, setHidden] = useState(document.hidden)
  const [ready, setReady] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
  const low = useAppStore(state => state.user.preferences.graphicsQuality === "low")
  const clock = useRef(0), played = useRef(-1), lastSound = useRef(-1000)
  const finished = elapsed >= clip.duration, running = ready && !paused && !hidden && !finished
  const frame = introAt(clip.frames, elapsed), beat = introAt(clip.beats, elapsed), quiet = reduceMotion || low
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
  return <Dialog title={INTRO_NAMES[mode]} onClose={onClose} wide className={`mode-intro ${quiet ? "is-quiet" : ""} ${!running ? "is-paused" : ""}`}>
    <div className="intro-topline"><span>GIỚI THIỆU TỰ ĐỘNG · 25 GIÂY</span><span>{ready ? "Trận mẫu riêng · Giữ nguyên tiến trình" : "Đang chuẩn bị mô hình…"}</span></div>
    <div className="intro-cinema">
      <div className={`intro-stage mode-${mode} ${finished ? "is-finished" : ""}`} aria-label="Sân khấu demo tự động">
        <Stage frame={frame} paused={!running || quiet} />
        {frame.effect && <div key={`${frame.at}-${replay}`} className={`intro-effect effect-${frame.effect}`} aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>}
        {finished && <div className="intro-finish"><span>✦</span><strong>Bạn đã sẵn sàng</strong><button type="button" onClick={onClose}>Vào chơi →</button></div>}
      </div>
      <aside className="intro-story"><div className="intro-caption" aria-live="polite" aria-atomic="true"><span>{beat.tag}</span><h3>{beat.title}</h3><p>{beat.text}</p></div>
        <ol aria-label="Các pha giới thiệu">{clip.beats.map(item => <li key={item.at} className={item === beat ? "is-current" : item.at < elapsed ? "is-done" : ""} aria-current={item === beat ? "step" : undefined}><i>{Math.floor(item.at / 1000)}s</i><span>{item.title}</span></li>)}</ol>
      </aside>
    </div>
    <div className="intro-playback"><div className="intro-progress" role="progressbar" aria-label="Tiến trình giới thiệu" aria-valuemin={0} aria-valuemax={25} aria-valuenow={Math.min(25, Math.floor(elapsed / 1000))}><i style={{ width: `${elapsed / INTRO_DURATION * 100}%` }} /></div>
      <div className="intro-controls"><span>{String(Math.floor(elapsed / 1000)).padStart(2, "0")} / 25s{!ready ? " · Chuẩn bị mô hình" : hidden ? " · Tạm dừng khi rời tab" : finished ? " · Hoàn tất" : paused ? " · Đã tạm dừng" : " · Đang tự chơi"}</span><div>
        <button type="button" onClick={() => setPaused(value => !value)} disabled={finished || !ready} aria-pressed={paused}>{paused ? "▶ Tiếp tục" : "Ⅱ Tạm dừng"}</button>
        <button type="button" onClick={restart}>↻ Xem lại</button><button type="button" onClick={onClose}>{finished ? "Đóng" : "Bỏ qua"}</button>
      </div></div>
    </div><p className="intro-takeaway">{clip.takeaway}</p>
  </Dialog>
}
