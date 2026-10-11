import { useEffect, useMemo, useState } from "react"
import { BrandMark } from "../components/layout/BrandMark"
import { ModeSwitch } from "../components/layout/ModeSwitch"
import { CharacterPortrait } from "../components/game/CharacterPortrait"
import { AudioButton, useGameAudio, useGameMusic } from "../components/game/GameAudio"
import { useGameStore } from "../game/useGameStore"
import { useAppStore } from "../store/useAppStore"
import { CARD_MAP, SCHOOLS } from "../game/catalog"
import {
  ADVENTURE_AREAS,
  ADVENTURE_AREA_MAP,
  ADVENTURE_STARTERS,
  captureChance,
  newAdventure,
  schoolMultiplier,
  spiritMaxHp,
  tileLabel,
  xpForNext,
  type AdventureAction,
  type AdventureDirection,
  type AdventureSpirit,
} from "../game/adventure"
import { gameAudio } from "../infrastructure/audio/gameAudio"
import type { GameSound } from "../game/audioScore"
import "../game/adventure.css"

const directionSymbol: Record<AdventureDirection, string> = { up: "▲", down: "▼", left: "◀", right: "▶" }
const directionName: Record<AdventureDirection, string> = { up: "lên", down: "xuống", left: "trái", right: "phải" }

function Meter({ value, max, kind = "hp", label }: { value: number; max: number; kind?: "hp" | "xp"; label: string }) {
  const ratio = max ? Math.max(0, Math.min(1, value / max)) : 0
  return <div className={`adv-meter is-${kind}`} aria-label={`${label}: ${value}/${max}`}>
    <i style={{ width: `${ratio * 100}%` }} />
  </div>
}

function SpiritImage({ cardId, className = "" }: { cardId: string; className?: string }) {
  const card = CARD_MAP[cardId]
  return <img className={className} src={card.art} alt={card.name} width="320" height="220" loading="lazy" decoding="async" />
}

function SpiritRow({ member, active = false, onLead, onMove }: { member: AdventureSpirit; active?: boolean; onLead?: () => void; onMove?: () => void }) {
  const card = CARD_MAP[member.cardId], max = spiritMaxHp(member.cardId, member.level)
  return <article className={`adv-spirit-row school-${card.school} ${active ? "is-active" : ""}`}>
    <SpiritImage cardId={member.cardId} />
    <div>
      <strong>{card.name}</strong><small>Cấp {member.level} · {SCHOOLS[card.school].name}</small>
      <Meter value={member.hp} max={max} label={`Sinh lực ${card.name}`} />
      <small>{member.hp}/{max} HP · {member.xp}/{xpForNext(member.level)} KN</small>
    </div>
    {(onLead || onMove) && <span className="adv-row-actions">
      {onLead && <button type="button" onClick={onLead} disabled={active}>Dẫn đội</button>}
      {onMove && <button type="button" onClick={onMove}>{onLead ? "Cất" : "Vào đội"}</button>}
    </span>}
  </article>
}

function StarterChoice({ choose }: { choose: (id: string) => void }) {
  return <main className="adv-starter">
    <div className="adv-starter-art"><img src="/assets/tcg/map/meal-world-map.webp" alt="Bản đồ thế giới Soul of Meal" /></div>
    <section>
      <span className="adv-kicker">CHUYẾN PHIÊU LƯU ĐẦU TIÊN</span>
      <h1>Chọn Vị Linh đồng hành</h1>
      <p>Bà để lại ba Hương Ấn trên bàn. Một món sẽ cùng bạn băng qua Phố Đèn Lồng, gặp Vị Linh hoang dã và tìm lại tên của năm vùng đất.</p>
      <div className="adv-starter-grid">
        {ADVENTURE_STARTERS.map((id) => {
          const card = CARD_MAP[id]
          return <button type="button" key={id} className={`school-${card.school}`} onClick={() => choose(id)}>
            <SpiritImage cardId={id} />
            <span>{card.symbol} {SCHOOLS[card.school].name}</span><strong>{card.name}</strong>
            <small>{card.lore.split(".")[0]}.</small><b>Chọn đồng hành →</b>
          </button>
        })}
      </div>
      <div className="adv-rules-strip"><span>⌁ Khám phá 5 vùng</span><span>✦ Thu phục Vị Linh</span><span>⚔ Đấu theo lượt</span><span>◇ Lưu cùng tiến trình chính</span></div>
    </section>
  </main>
}

function AdventureBattle({ act }: { act: (action: AdventureAction, sound?: GameSound) => void }) {
  const adventure = useGameStore((state) => state.save.adventure)!, encounter = adventure.encounter!
  const enemy = CARD_MAP[encounter.cardId], member = adventure.team.find((item) => item.uid === encounter.activeUid)!, ally = CARD_MAP[member.cardId]
  const allyMax = spiritMaxHp(member.cardId, member.level), multiplier = schoolMultiplier(ally.school, enemy.school)
  return <div className={`adv-battle is-${encounter.kind}`} role="dialog" aria-modal="true" aria-labelledby="adv-battle-title">
    <img className="adv-battle-bg" src={ADVENTURE_AREA_MAP[adventure.areaId].art} alt="" />
    <div className="adv-battle-head">
      <span>{encounter.kind === "keeper" ? "THỬ THÁCH GIỮ ẤN" : "CHẠM TRÁN VỊ LINH"}</span>
      <strong>Lượt {encounter.turn}</strong>
    </div>
    <section className="adv-combatants">
      <article className={`adv-combatant enemy school-${enemy.school}`}>
        <div><span>{enemy.symbol} {SCHOOLS[enemy.school].name}</span><h2 id="adv-battle-title">{enemy.name}</h2><small>Cấp {encounter.level}</small><Meter value={encounter.hp} max={encounter.maxHp} label={`Sinh lực ${enemy.name}`} /></div>
        <SpiritImage cardId={enemy.id} />
      </article>
      <div className="adv-versus">VS</div>
      <article className={`adv-combatant ally school-${ally.school}`}>
        <SpiritImage cardId={ally.id} />
        <div><span>{ally.symbol} {SCHOOLS[ally.school].name}</span><h2>{ally.name}</h2><small>Cấp {member.level}</small><Meter value={member.hp} max={allyMax} label={`Sinh lực ${ally.name}`} /></div>
      </article>
    </section>
    <section className="adv-battle-console">
      <div className="adv-battle-log" aria-live="polite">{encounter.log.slice(-3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
      <div className="adv-battle-actions">
        <button type="button" onClick={() => act({ type: "battle", move: "strike" }, "impact")}><strong>Nhịp Muôi</strong><small>Đòn ổn định</small></button>
        <button type="button" className={multiplier > 1 ? "is-strong" : multiplier < 1 ? "is-weak" : ""} onClick={() => act({ type: "battle", move: "skill" }, "cast")}><strong>Hương thức</strong><small>{multiplier > 1 ? "Đang lợi thế" : multiplier < 1 ? "Đang bất lợi" : SCHOOLS[ally.school].name}</small></button>
        <button type="button" onClick={() => act({ type: "battle", move: "guard" }, "shield")}><strong>Giữ mâm</strong><small>Giảm đòn kế</small></button>
        <button type="button" disabled={encounter.kind === "keeper" || adventure.aromaSeals < 1} onClick={() => act({ type: "battle", move: "befriend" }, "summon")}><strong>Hương Ấn · {adventure.aromaSeals}</strong><small>{encounter.kind === "keeper" ? "Không dùng với giữ ấn" : `${Math.round(captureChance(encounter) * 100)}% nhận lời`}</small></button>
        <button type="button" disabled={encounter.kind === "keeper"} onClick={() => act({ type: "battle", move: "flee" }, "select")}><strong>Rút lui</strong><small>Tìm đường an toàn</small></button>
      </div>
      {adventure.team.length > 1 && <details className="adv-battle-switch"><summary>Đổi Vị Linh đang đấu</summary><div>{adventure.team.map((item) => <button key={item.uid} type="button" disabled={!item.hp || item.uid === member.uid} onClick={() => act({ type: "battle", move: "switch", uid: item.uid }, "select")}>{CARD_MAP[item.cardId].name} · {item.hp} HP</button>)}</div></details>}
    </section>
  </div>
}

function WorldGrid({ move, interact }: { move: (direction: AdventureDirection) => void; interact: () => void }) {
  const adventure = useGameStore((state) => state.save.adventure)!, area = ADVENTURE_AREA_MAP[adventure.areaId]
  const adjacentDirection = (x: number, y: number): AdventureDirection | null => {
    if (x === adventure.x && y === adventure.y - 1) return "up"
    if (x === adventure.x && y === adventure.y + 1) return "down"
    if (x === adventure.x - 1 && y === adventure.y) return "left"
    if (x === adventure.x + 1 && y === adventure.y) return "right"
    return null
  }
  return <>
    <div className="adv-map-frame">
      <img className="adv-map-backdrop" src={area.art} alt="" />
      <div className="adv-map" role="grid" aria-label={`Bản đồ ${area.name}`} style={{ gridTemplateColumns: `repeat(${area.grid[0].length}, 1fr)` }}>
        {area.grid.flatMap((row, y) => [...row].map((cell, x) => {
          const player = x === adventure.x && y === adventure.y, npc = x === area.npc.x && y === area.npc.y
          const keeper = x === area.keeper.x && y === area.keeper.y && !adventure.badges.includes(area.keeper.badge)
          const found = area.finds.find((item) => item.x === x && item.y === y), claimed = found && adventure.claimedFinds.includes(found.id)
          const direction = adjacentDirection(x, y)
          const tileClass = cell === "." ? "tile-path" : cell === "#" ? "tile-wall" : `tile-${cell}`
          return <button type="button" tabIndex={direction ? 0 : -1} role="gridcell" key={`${x}-${y}`} className={`adv-tile ${tileClass} ${direction ? "is-adjacent" : ""} ${player ? "has-player" : ""}`} aria-label={`${tileLabel(cell)} · cột ${x + 1}, hàng ${y + 1}${player ? " · vị trí của bạn" : ""}`} onClick={() => direction && move(direction)}>
            {cell === "g" && <i className="adv-grass" />}
            {cell === "h" && <span className="adv-place-icon">♨</span>}
            {cell === "e" && <span className="adv-place-icon">⌁</span>}
            {found && !claimed && <span className="adv-place-icon adv-find">✦</span>}
            {npc && <CharacterPortrait id={area.npc.id} decorative className="adv-map-character" />}
            {keeper && <SpiritImage cardId={area.keeper.cardId} className="adv-map-keeper" />}
            {player && <span className={`adv-player face-${adventure.facing}`}><CharacterPortrait id="hero" decorative /></span>}
          </button>
        }))}
      </div>
      <div className="adv-map-caption"><span>{area.region}</span><strong>{area.name}</strong><small>Dùng WASD / phím mũi tên để di chuyển · E để tương tác</small></div>
    </div>
    <div className="adv-controls" aria-label="Điều khiển di chuyển">
      <button type="button" className="up" aria-label="Đi lên" onClick={() => move("up")}>▲</button>
      <button type="button" className="left" aria-label="Đi sang trái" onClick={() => move("left")}>◀</button>
      <button type="button" className="interact" onClick={interact}>TƯƠNG TÁC</button>
      <button type="button" className="right" aria-label="Đi sang phải" onClick={() => move("right")}>▶</button>
      <button type="button" className="down" aria-label="Đi xuống" onClick={() => move("down")}>▼</button>
    </div>
  </>
}

export function AdventurePage() {
  useGameAudio()
  const raw = useGameStore((state) => state.save.adventure), adventure = raw ?? newAdventure()
  const dispatch = useGameStore((state) => state.adventureAction), notice = useGameStore((state) => state.notice), dismissNotice = useGameStore((state) => state.dismiss)
  const user = useAppStore((state) => state.user), prefs = useAppStore((state) => state.user.preferences)
  const [panel, setPanel] = useState<"journey" | "team" | "archive">("journey")
  const area = ADVENTURE_AREA_MAP[adventure.areaId]
  useGameMusic(adventure.encounter ? adventure.encounter.kind === "keeper" ? "boss" : "battle" : area.music, 8)
  const act = (action: AdventureAction, sound: GameSound = "select") => {
    if (dispatch(action)) gameAudio.play(sound)
  }
  const move = (direction: AdventureDirection) => act({ type: "move", direction }, "select")
  const interact = () => act({ type: "interact" }, "confirm")
  useEffect(() => {
    document.body.classList.add("adventure-open")
    return () => document.body.classList.remove("adventure-open")
  }, [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.repeat || adventure.encounter || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const direction = ({ ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" } as Record<string, AdventureDirection>)[event.key]
      if (direction) { event.preventDefault(); move(direction) }
      else if (["e", "E", "Enter", " "].includes(event.key)) { event.preventDefault(); interact() }
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [adventure.encounter, adventure.areaId, adventure.x, adventure.y, adventure.facing])
  const discovered = useMemo(() => new Set(adventure.discovered), [adventure.discovered])
  if (!adventure.started) return <div className={`adv-app ${prefs.reducedMotion ? "is-reduced-motion" : ""}`}>
    <header className="adv-header"><a href="/adventure" className="adv-brand"><BrandMark /><span><strong>SOUL OF MEAL</strong><small>PHIÊU LƯU VỊ LINH</small></span></a><ModeSwitch mode="adventure" /></header>
    <StarterChoice choose={(cardId) => act({ type: "start", cardId }, "summon")} />
  </div>
  return <div className={`adv-app ${prefs.reducedMotion ? "is-reduced-motion" : ""}`}>
    <header className="adv-header">
      <a href="/adventure" className="adv-brand"><BrandMark /><span><strong>SOUL OF MEAL</strong><small>PHIÊU LƯU VỊ LINH</small></span></a>
      <div className="adv-location"><span>CHƯƠNG {area.chapter}</span><strong>{area.name}</strong></div>
      <div className="adv-resources"><span title="Hương Ấn">✦ {adventure.aromaSeals}</span><span title="Vùng đã hoàn thành">◇ {adventure.badges.length}/5</span></div>
      <AudioButton label="Âm thanh" /><ModeSwitch mode="adventure" />
    </header>
    <nav className="adv-mobile-tabs" aria-label="Bảng phiêu lưu">{(["journey", "team", "archive"] as const).map((id) => <button type="button" key={id} aria-pressed={panel === id} onClick={() => setPanel(id)}>{id === "journey" ? "Hành trình" : id === "team" ? "Đội hình" : "Sổ Vị Linh"}</button>)}</nav>
    <main className="adv-layout">
      <aside className={`adv-sidebar adv-journey ${panel === "journey" ? "is-open" : ""}`}>
        <span className="adv-kicker">NHIỆM VỤ HIỆN TẠI</span><h1>{area.objective}</h1><p>{area.summary}</p>
        <div className="adv-objective"><span>{adventure.badges.includes(area.keeper.badge) ? "✓" : `${area.chapter}`}</span><div><strong>{area.keeper.badgeName}</strong><small>{adventure.badges.includes(area.keeper.badge) ? "Đã nhận · đường mới đã mở" : `Đối đầu ${area.keeper.title}`}</small></div></div>
        <ol className="adv-route-list">{ADVENTURE_AREAS.map((zone) => {
          const current = zone.id === area.id, complete = adventure.badges.includes(zone.keeper.badge), unlocked = zone.chapter === 1 || adventure.badges.includes(ADVENTURE_AREAS[zone.chapter - 2].keeper.badge)
          return <li key={zone.id} className={current ? "is-current" : ""}><span>{complete ? "✓" : unlocked ? zone.chapter : "◦"}</span><div><strong>{zone.name}</strong><small>{complete ? zone.keeper.badgeName : unlocked ? "Đã mở" : "Còn phủ sương"}</small></div></li>
        })}</ol>
        {adventure.completed && <div className="adv-complete"><strong>Giao Ước Năm Vị hoàn tất</strong><p>Bạn có thể tiếp tục khám phá, hoàn thiện Sổ Vị Linh và xây đội hình riêng.</p></div>}
      </aside>
      <section className="adv-world" aria-label="Khu vực khám phá"><WorldGrid move={move} interact={interact} />
        {adventure.message && <div className="adv-message" role="status"><CharacterPortrait id={area.npc.id} decorative /><p>{adventure.message}</p><button type="button" aria-label="Đóng lời nhắn" onClick={() => act({ type: "dismiss" })}>×</button></div>}
      </section>
      <aside className={`adv-sidebar adv-party ${panel !== "journey" ? "is-open" : ""}`}>
        <div className="adv-side-tabs"><button type="button" aria-pressed={panel === "team"} onClick={() => setPanel("team")}>Đội hình</button><button type="button" aria-pressed={panel === "archive"} onClick={() => setPanel("archive")}>Sổ Vị Linh</button></div>
        {panel !== "archive" ? <>
          <div className="adv-party-title"><div><span className="adv-kicker">ĐỘI CỦA {user.displayName || "NGƯỜI GIỮ VỊ"}</span><h2>{adventure.team.length}/4 Vị Linh</h2></div><button type="button" onClick={() => act({ type: "heal" }, "heal")}>Hồi đội</button></div>
          <div className="adv-party-list">{adventure.team.map((member, index) => <SpiritRow key={member.uid} member={member} active={index === 0} onLead={() => act({ type: "lead", uid: member.uid })} onMove={adventure.team.length > 1 ? () => act({ type: "deposit", uid: member.uid }) : undefined} />)}</div>
          <details className="adv-reserve" open={adventure.reserve.length > 0}><summary>Tủ Vị Linh · {adventure.reserve.length}/20</summary>{adventure.reserve.length ? adventure.reserve.map((member) => <SpiritRow key={member.uid} member={member} onMove={() => act({ type: "withdraw", uid: member.uid })} />) : <p>Vị Linh thứ năm trở đi sẽ nghỉ tại đây.</p>}</details>
        </> : <>
          <span className="adv-kicker">SỔ VỊ LINH</span><h2>{discovered.size} loài đã gặp</h2><p>Mỗi vùng có một quần thể khác nhau. Những bóng chưa rõ tên vẫn đang chờ trong bãi hương.</p>
          <div className="adv-codex">{[...new Set(ADVENTURE_AREAS.flatMap((zone) => [...zone.encounters, zone.keeper.cardId]))].map((id) => {
            const card = CARD_MAP[id], known = discovered.has(id)
            return <article key={id} className={known ? `school-${card.school}` : "is-unknown"}>{known ? <SpiritImage cardId={id} /> : <span>?</span>}<strong>{known ? card.name : "Chưa gặp"}</strong><small>{known ? SCHOOLS[card.school].name : "Tiếp tục khám phá"}</small></article>
          })}</div>
        </>}
      </aside>
    </main>
    {notice && <div className="adv-toast" role="alert"><span>{notice}</span><button type="button" onClick={dismissNotice}>×</button></div>}
    {adventure.encounter && <AdventureBattle act={act} />}
  </div>
}
