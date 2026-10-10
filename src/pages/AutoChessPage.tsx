import { ArenaScene } from "../components/game/ArenaScene"
import { livingMusic } from "../game/audioScore"
import { BrandMark } from "../components/layout/BrandMark"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useGameStore } from "../game/useGameStore"
import { useAppStore } from "../store/useAppStore"
import { getDateKey } from "../domain/dateKey"
import {
  AudioControls,
  useGameAudio,
  useGameMusic,
} from "../components/game/GameAudio"
import { ProgressTransfer } from "../components/game/ProgressTransfer"
import { Dialog } from "../components/game/Dialog"
import { ModeSwitch } from "../components/layout/ModeSwitch"
import { AutoBoard } from "../components/autochess/AutoBoard"
import { AutoPreparation } from "../components/autochess/AutoPreparation"
import { AutoTraits } from "../components/autochess/AutoTraits"
import { QuickUnitInfo } from "../components/autochess/QuickUnitInfo"
import { useFormationDrag } from "../components/autochess/useFormationDrag"
import { useAutoShortcuts } from "../components/autochess/useAutoShortcuts"
import { useStarUpgrades } from "../components/autochess/useStarUpgrades"
import { ShopOdds } from "../components/autochess/ShopOdds"
import { ItemArt } from "../components/autochess/ItemArt"
import { maxWillpower, willpowerRatio, willpowerHelp } from "../game/autochess/willpower"
import { ITEM_MAP, ITEM_RECIPES, itemPreview, equipPreview, isComponent } from "../game/autochess/items"
import { AutoVictory, useAutoVictory } from "../components/autochess/AutoVictory"
import { AutoPortrait, AutoMonsterPortrait, WorldArt } from "../components/autochess/AutoArt"
import {
  AutoGuide,
  AutoRoster,
  AutoStory,
  UnitInspector,
} from "../components/autochess/AutoPanels"
import { useAutoBattle } from "../components/autochess/useAutoBattle"
import {
  AUTO_SCHOOLS,
  UNIT_MAP,
  AUGMENTS,
  COSMETICS,
  PROFESSIONS,
  MONSTER_MAP,
  SKILL_LABELS,
} from "../game/autochess/catalog"
import {
  boardPieces,
  capacity,
  copies,
  traitCounts,
} from "../game/autochess/economy"
import { enemyPlan, pressure } from "../game/autochess/combat"
import { hasActiveAutoRun, type AutoAction } from "../game/autochess/reducer"
import {
  AUTO_ACTS,
  CULTURE_PAGES,
  SCENES,
  actIndex,
} from "../game/autochess/story"
import { emptyAutoSave, type AutoMode } from "../game/autochess/types"
import { gameAudio } from "../infrastructure/audio/gameAudio"
import { downloadAutoPostcard } from "../game/autochess/postcard"
import "../game/tcg.css"
import "../game/autochess/autochess.css"
import "../game/autochess/marketHud.css"
import { battleSpeed, OVERTIME_SECONDS, OVERTIME_TICKS } from "../game/autochess/config"

const EMPTY = emptyAutoSave()
const modeNames: Record<AutoMode, string> = {
  campaign: "Chợ Đêm Vị Linh",
  survival: "Đêm Không Tắt Bếp",
  daily: "Thử thách hôm nay",
}
type Menu = "play" | "roster" | "journal" | "records" | "cosmetics"
type Modal = "guide" | "audio" | "transfer" | "inventory" | "traits" | "abandon" | null
export function AutoChessPage() {
  const auto = useGameStore((s) => s.save.autoChess ?? EMPTY),
    action = useGameStore((s) => s.autoAction),
    notice = useGameStore((s) => s.notice),
    dismiss = useGameStore((s) => s.dismiss),
    oldEnding = useGameStore((s) => s.save.storyEnding)
  const prefs = useAppStore((s) => s.user.preferences)
  const [menu, setMenu] = useState<Menu | null>(() =>
    hasActiveAutoRun(auto.run) ||
    (auto.run?.phase === "won" && (!!auto.run.scene || !auto.ending))
      ? null
      : "play",
  )
  const [modal, setModal] = useState<Modal>(null),
    [selected, setSelected] = useState<string | null>(null),
    [inspect, setInspect] = useState<{
      id: string
      uid?: string
      shop?: number
    } | null>(null)
  const [replace, setReplace] = useState<AutoMode | null>(null),
    [speed, setSpeed] = useState(1),
    [recordMode, setRecordMode] = useState<AutoMode>("survival"),
    [journal, setJournal] = useState<string | null>(null),
    [language, setLanguage] = useState<"vi" | "en">("vi")
  const lowQuality = prefs.graphicsQuality === "low"
  const setLowQuality = (low:boolean) => useAppStore.getState().updatePreference("graphicsQuality",low?"low":"normal")
  const [shopOpen, setShopOpen] = useState(true), [inventoryOpen, setInventoryOpen] = useState(false), [traitsOpen, setTraitsOpen] = useState(false)
  const [haptics, setHaptics] = useState(() => {
    try { return localStorage.getItem("som.auto.haptics") === "true" } catch { return false }
  })
  const hapticsSupported = typeof navigator.vibrate === "function"
  const run = auto.run,
    runtime = useAutoBattle(run, speed),
    playing = menu === null && !!run,
    preparing = run?.phase === "prepare"
  const sceneId = run?.combat?.pendingScene ?? run?.scene
  const victory = useAutoVictory(run, playing && !modal && !inspect, prefs.reducedMotion)
  const upgrades = useStarUpgrades(run)
  const lastHaptic = useRef(0)
  useEffect(() => { try { localStorage.setItem("som.auto.haptics", String(haptics)) } catch { /* Cosmetic preference only. */ } }, [haptics])
  useEffect(() => {
    const fresh = upgrades.filter(u => u.at > lastHaptic.current)
    if (!fresh.length) return
    lastHaptic.current = Math.max(...fresh.map(u => u.at))
    if (haptics && hapticsSupported) navigator.vibrate(fresh.some(u => u.to === 3) ? [20, 40, 30] : 18)
  }, [haptics, hapticsSupported, upgrades])
  useGameAudio()
  useGameMusic(
    run && run.rulesVersion >= 6 && run.wave >= 13 ? livingMusic(run.wave <= 15 ? "rain-harbor" : "tomorrow-table", run.phase === "combat" && !sceneId) : sceneId && !victory.pending
      ? "auto-story"
      : playing && run?.phase === "combat"
        ? (run.combat?.tick ?? 0) >= 500 || willpowerRatio(run) < .35
          ? "auto-pressure"
          : run.combat?.boss
            ? "auto-boss"
            : "auto-battle"
        : "auto-prepare",
    5, run?.combat?.boss ? .75 : Math.max(1-(run ? willpowerRatio(run) : 1),(run?.combat?.tick ?? 0)>=1100?.9:.35),
  )
  useEffect(() => {
    document.body.classList.add("autochess-open")
    return () => document.body.classList.remove("autochess-open")
  }, [])
  useEffect(() => {
    if (run?.lastResult && run.phase !== "combat" && run.phase !== "prepare")
      gameAudio.play(run.lastResult.result === "win" ? "auto-victory" : "auto-defeat")
  }, [run?.lastResult?.id])
  const doAction = (a: AutoAction) => {
    if (a.type === "buy") setSelected(null)
    const mergedBefore =
      run?.roster.map((p) => p.star).reduce((a, b) => a + b, 0) ?? 0
    const ok = action(a)
    if (ok) {
      const fresh = useGameStore.getState().save.autoChess?.run
      const merged =
        a.type === "buy" &&
        fresh?.roster.some(
          (p) =>
            p.star > (run?.roster.find((old) => old.uid === p.uid)?.star ?? 1),
        )
      gameAudio.play(
        merged && mergedBefore || a.type === "craft"
          ? "combo"
          : a.type === "battle"
            ? "summon"
            : a.type === "move"
              ? "select"
              : "confirm",
      )
    }
    return ok
  }
  const openModal = (value: Modal) => {
    if (run?.phase === "combat") runtime.pause(true)
    setModal(value)
  }
  const inspectUnit = (value: { id: string; uid?: string; shop?: number }) => {
    if (run?.phase === "combat") runtime.pause(true)
    setInspect(value)
  }
  const lobby = () => {
    if (run?.phase === "combat") runtime.pause(true)
    setMenu("play")
  }
  const start = (mode: AutoMode) => {
    if (hasActiveAutoRun(useGameStore.getState().save.autoChess?.run ?? null)) {
      setReplace(mode)
      return
    }
    const seed = crypto.getRandomValues(new Uint32Array(1))[0]
    if (
      doAction({
        type: "start",
        mode,
        seed,
        day: getDateKey(),
        id: crypto.randomUUID(),
      })
    ) {
      setMenu(null)
      setSelected(null)
      if (!auto.tutorialSeen) setModal("guide")
    }
  }
  const onCell = (cell: number, dragged?: string, keyboard = false) => {
    if (!run || victory.pending || drag.ignoreClick()) return
    if (!dragged && !keyboard && drag.touchTap()) return
    if (!preparing) {
      const live = runtime
        .getFrame()
        .run?.combat?.actors.find((a) => a.cell === cell && a.hp > 0)
      if (live) inspectUnit({ id: live.id, uid: live.uid })
      return
    }
    if (cell < 18) {
      const enemy = enemyPlan(run).find((p) => p.cell === cell)
      if (enemy) inspectUnit({ id: enemy.def.id })
      return
    }
    const piece = run.roster.find((p) => p.cell === cell),
      chosen = dragged || selected
    if (chosen && chosen !== piece?.uid) {
      if (doAction({ type: "move", uid: chosen, cell })) setSelected(null)
    } else if (piece) {
      setSelected(piece.uid === selected ? null : piece.uid)
      gameAudio.play("select")
    }
  }
  const selectedPiece = run?.roster.find((p) => p.uid === selected)
  const traits = run ? traitCounts(boardPieces(run)) : {}
  const capacityNow = run ? capacity(run.xp) : 3
  const overtime = run?.phase === "combat" && (run.combat?.tick ?? 0) >= OVERTIME_TICKS
  const effectiveSpeed = battleSpeed(run?.combat?.tick ?? 0, speed)
  const drag = useFormationDrag({
    enabled: playing && preparing && !sceneId && !victory.pending && !modal && !inspect && !replace && !journal,
    peekEnabled: playing && !sceneId && !victory.pending && !modal && !inspect && !replace && !journal,
    onSelect: setSelected,
    onDrop: (uid, target) => {
      if (doAction({ type: "move", uid, ...target })) setSelected(null)
    },
    onSell: uid => { doAction({ type: "sell", uid }); setSelected(null) },
    inspectPiece: uid => { const piece = run?.roster.find(p => p.uid === uid); return piece ? { id: piece.id, uid } : null },
    previewItem: (index, target) => itemPreview(run!, index, target),
    onItemDrop: (index, target) => {
      if (!run) return
      if (target.kind === "craft") doAction({ type: "craft", index, target: target.index })
      else doAction({ type: "equip", uid: target.uid, item: run.inventory[index] })
      setSelected(null)
    },
  })
  const draggedPiece = run?.roster.find(piece => piece.uid === drag.dragging)
  const draggedItem = drag.itemIndex === null ? null : ITEM_MAP[run?.inventory[drag.itemIndex] ?? ""]
  const inspectCell = (cell: number) => {
    if (!run) return null
    if (preparing) {
      const piece = run.roster.find(p => p.cell === cell), enemy = enemyPlan(run).find(p => p.cell === cell)
      return piece ? { id: piece.id, uid: piece.uid } : enemy ? { id: enemy.def.id } : null
    }
    const actor = runtime.getFrame().run?.combat?.actors.find(a => a.cell === cell && a.hp > 0)
    return actor ? { id: actor.id, uid: actor.uid } : null
  }
  useAutoShortcuts({
    enabled: playing && preparing && !sceneId && !victory.pending && !modal && !inspect && !replace && !journal && !drag.dragging && drag.itemIndex === null && !drag.peek,
    run,
    onAction: value => {
      if (doAction(value) && (value.type === "move" || value.type === "sell"))
        setSelected(value.type === "move" ? value.uid : null)
    },
  })
  const sceneIndex =
    playing && run?.mode === "campaign"
      ? Math.min(3, actIndex(run.wave))
      : (COSMETICS.find((c) => c.id === auto.board)?.scene ?? 0)
  const records = auto.records.filter((r) => r.mode === recordMode)
  const p = run ? pressure(run.wave, run.activeTicks, run.rulesVersion) : null
  const latestCast = run?.combat?.events
    .filter((e) => e.kind === "cast" && e.amount > 0)
    .slice(-1)[0]
  const castingUnit = latestCast
    ? run?.combat?.actors.find((a) => a.uid === latestCast.source)
    : null
  const commanderLine =
    run?.phase === "combat" && (run.combat?.tick ?? 0) < 60
      ? Object.keys(traits).filter(id => id in AUTO_SCHOOLS).length >= 3 ? "An: Cả đội, giữ tuyến trước! Mâm chung sẽ tiếp sức." : "An: Giữ tuyến trước, che carry phía sau!"
      : castingUnit
        ? `${(UNIT_MAP[castingUnit.id] ?? MONSTER_MAP[castingUnit.id]).name} · ${SKILL_LABELS[latestCast?.skill ?? castingUnit.skill]}`
        : "Kỹ năng tự tung khi đủ mana · nhấn một ô để xem quân"
  return (
    <div className={`ac-shell ${prefs.reducedMotion ? "is-reduced" : ""}`}>
      {draggedPiece && <div className="ac-drag-ghost" ref={drag.ghostRef} aria-hidden="true">
        <AutoPortrait index={UNIT_MAP[draggedPiece.id].portrait} />
        <strong>{UNIT_MAP[draggedPiece.id].name}</strong><small>{"★".repeat(draggedPiece.star)}</small>
      </div>}
      {draggedItem && <div className="ac-drag-ghost ac-item-ghost" ref={drag.ghostRef} aria-hidden="true" style={{ "--item": draggedItem.color } as CSSProperties}><ItemArt id={draggedItem.id} decorative /><strong>{draggedItem.name}</strong></div>}
      {drag.preview && <div className={`ac-item-preview ${drag.preview.valid ? "is-valid" : "is-invalid"}`} role="status" style={{ borderColor: drag.preview.color }}><strong>{drag.preview.name}</strong><span>{drag.preview.text}</span><small>{drag.preview.valid ? "Thả để xác nhận" : "Trang bị sẽ được giữ trong kho"}</small></div>}
      <WorldArt scene={sceneIndex} className="ac-backdrop" />
      <header className="ac-header">
        <button
          className="ac-brand"
          onClick={lobby}
          aria-label="Về hội quán auto chess"
        >
          <BrandMark />
          <div>
            <strong>SOUL OF MEAL</strong>
            <small>CHỢ ĐÊM · AUTO CHESS</small>
          </div>
        </button>
        <ModeSwitch mode="auto" />
        <div className="ac-header-actions">
          <button
            onClick={() => openModal("guide")}
            aria-label="Hướng dẫn auto chess"
          >
            ?
          </button>
          <button
            onClick={() => openModal("audio")}
            aria-label="Âm thanh và nhạc"
          >
            ♫
          </button>
          <button
            onClick={() => openModal("transfer")}
            aria-label="Chuyển tiến trình bằng mã"
          >
            ⇄
          </button>
        </div>
      </header>
      {!playing ? (
        <main className="ac-lobby">
          <nav className="ac-tabs" aria-label="Hội quán">
            {([
              ["play", "Chơi"],
              ["roster", "Vị Linh"],
              ["journal", "Truyện"],
              ["records", "Kỷ lục"],
              ["cosmetics", "Bàn đấu"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                aria-pressed={menu === id}
                onClick={() => setMenu(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="ac-menu-scroll">
            {menu === "play" && (
              <>
                <div className="ac-lobby-intro">
                  <div>
                    <small>HỘI QUÁN KHÔNG TẮT BẾP</small>
                    <h1>
                      Mỗi món giữ một ký ức.
                      <br />
                      <em>Mỗi đội kể một câu chuyện.</em>
                    </h1>
                    <p>
                      Mua Vị Linh, ghép sao và xếp đội hình. Cùng An giữ phiên
                      chợ qua sương, hoặc sống sót lâu hơn để vượt kỷ lục.
                    </p>
                    <span className="ac-seals">
                      ✧ {auto.seals} Ấn Chợ · {auto.campaignCleared}/18 màn
                    </span>
                  </div>
                  <AutoPortrait
                    index={0}
                    npc
                    label="An, người thắp đèn"
                    className="ac-lobby-an"
                  />
                </div>
                {run && hasActiveAutoRun(run) && (
                  <button className="ac-resume" onClick={() => setMenu(null)}>
                    <span>Tiếp tục {modeNames[run.mode]}</span>
                    <strong>
                      Đợt {run.wave} · {run.health} ý chí ·{" "}
                      {run.score.toLocaleString("vi-VN")} điểm →
                    </strong>
                  </button>
                )}
                <div className="ac-mode-cards">
                  {(["campaign", "survival", "daily"] as const).map(
                    (mode, i) => (
                      <article key={mode}>
                        <WorldArt scene={Math.min(3, i)} />
                        <div>
                          <small>
                            {i === 0
                              ? "6 HỒI · 18 ĐỢT"
                              : i === 1
                                ? "SURVIVAL · ÁP LỰC TĂNG DẦN"
                                : `SEED CHUNG · ${getDateKey()}`}
                          </small>
                          <h2>{modeNames[mode]}</h2>
                          <p>
                            {i === 0
                              ? "100 ý chí để đi tìm tên những ký ức bị xóa. Thua còn ý chí thì chơi lại cùng đợt. Bốn boss và lựa chọn kết truyện."
                              : i === 1
                                ? "3 ý chí, thua mất 1 và chơi lại cùng đợt. Thắng không hồi ý chí. Quái mạnh dần theo thời gian; hết ý chí ghi kỷ lục."
                                : "Cùng một cửa hàng và địch khởi đầu cho mọi lượt hôm nay. Thử đội hình khác để vượt chính mình."}
                          </p>
                          <button
                            className="ac-button primary"
                            onClick={() => start(mode)}
                          >
                            Bắt đầu{" "}
                            {i === 0
                              ? "câu chuyện"
                              : i === 1
                                ? "survival"
                                : "thử thách"}{" "}
                            →
                          </button>
                        </div>
                      </article>
                    ),
                  )}
                </div>
                <p className="ac-muted">
                  Không cần tài khoản. Pool quân mở cho mọi người; vàng trong
                  phiên chợ tách riêng với xu TCG.
                </p>
              </>
            )}
            {menu === "roster" && (
              <>
                <div className="ac-menu-title">
                  <h1>44 Vị Linh</h1>
                  <p>Chọn quân để xem kỹ năng, nghề, hệ và ký ức món ăn.</p>
                </div>
                <AutoRoster onInspect={(id) => inspectUnit({ id })} />
                <h2>Những ký ức thất lạc</h2>
                <div className="ac-enemy-library">
                  {Object.values(MONSTER_MAP).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => inspectUnit({ id: m.id })}
                    >
                      <AutoMonsterPortrait id={m.id} label={m.name} />
                      <strong>{m.name}</strong>
                      <small>
                        {m.boss ? "BOSS" : AUTO_SCHOOLS[m.school].name}
                      </small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {menu === "journal" && (
              <>
                <div className="ac-menu-title">
                  <h1>Sổ chuyện phiên chợ</h1>
                  <p>
                    Những đoạn đã mở trong chiến dịch. Tranh và chân dung đổi
                    theo người nói.
                  </p>
                </div>
                <div className="ac-act-cards">
                  {AUTO_ACTS.map((act, i) => (
                    <article key={act.title}>
                      <WorldArt scene={Math.min(3, i)} />
                      <div>
                        <small>
                          HỒI {i + 1} ·{" "}
                          {auto.campaignCleared >= (i + 1) * 3
                            ? "ĐÃ VƯỢT"
                            : "CHƯA VƯỢT"}
                        </small>
                        <h2>{act.title}</h2>
                        <p>{act.subtitle}</p>
                        <button
                          className="ac-button"
                          disabled={auto.campaignCleared < i * 3}
                          onClick={() => setJournal(`intro-${i * 3 + 1}`)}
                        >
                          Đọc lại
                        </button>
                        {auto.campaignCleared >= (i + 1) * 3 && (
                          <button
                            className="ac-button"
                            onClick={() => setJournal(`boss-${(i + 1) * 3}`)}
                          >
                            Lời giữa trận
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                {auto.ending && (
                  <p className="ac-ending-note">
                    {auto.ending === "hall"
                      ? "An đã dựng hội quán truyền nghề. Chiếc ghế cuối cùng vẫn để cho người đến sau."
                      : "An đã giữ những chú giải bên công thức. Mỗi người được kể câu chuyện của mình."}
                  </p>
                )}
                <div className="ac-menu-title">
                  <h2>Góc văn hóa Việt</h2>
                  <button
                    className="ac-button"
                    onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
                  >
                    {language === "vi" ? "English" : "Tiếng Việt"}
                  </button>
                </div>
                <div className="ac-culture-grid">
                  {CULTURE_PAGES.map((c) => (
                    <article key={c.title}>
                      <h3>{c.title}</h3>
                      <p>{c[language]}</p>
                      <a href={c.url} target="_blank" rel="noreferrer">
                        Tìm hiểu thêm ↗
                      </a>
                    </article>
                  ))}
                </div>
              </>
            )}
            {menu === "records" && (
              <>
                <div className="ac-menu-title">
                  <h1>Kỷ lục của bạn</h1>
                  <p>
                    Điểm và seed được lưu trên thiết bị, có thể chuyển bằng mã.
                  </p>
                </div>
                <div className="ac-record-filters">
                  {(["survival", "daily", "campaign"] as const).map((m) => (
                    <button
                      className="ac-button"
                      key={m}
                      aria-pressed={m === recordMode}
                      onClick={() => setRecordMode(m)}
                    >
                      {modeNames[m]}
                    </button>
                  ))}
                </div>
                {records.length ? (
                  <div className="ac-record-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Điểm</th>
                          <th>Đợt thắng</th>
                          <th>Thời gian đánh</th>
                          <th>Ngày / seed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <strong>{r.score.toLocaleString("vi-VN")}</strong>
                            </td>
                            <td>{r.wave}</td>
                            <td>
                              {Math.floor(r.seconds / 60)}:
                              {String(r.seconds % 60).padStart(2, "0")}
                            </td>
                            <td>
                              {r.day}
                              <small>
                                {r.seed} · luật {r.rulesVersion}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="ac-empty">
                    Chưa có kỷ lục. Bắt đầu một phiên chợ và giữ bàn đến phút
                    cuối.
                  </p>
                )}
              </>
            )}
            {menu === "cosmetics" && (
              <>
                <div className="ac-menu-title">
                  <h1>Một chỗ để trở về</h1>
                  <p>Ấn Chợ đổi diện mạo bàn; không tăng sức mạnh.</p>
                  <strong>✧ {auto.seals} Ấn Chợ</strong>
                </div>
                <div className="ac-cosmetic-grid">
                  {[
                    { id: "market", name: "Chợ còn sáng", cost: 0, scene: 0 },
                    ...COSMETICS,
                  ].map((c) => (
                    <article key={c.id}>
                      <WorldArt scene={c.scene} />
                      <h2>{c.name}</h2>
                      <button
                        className="ac-button"
                        disabled={
                          auto.board === c.id ||
                          (!auto.cosmetics.includes(c.id) &&
                            auto.seals < c.cost)
                        }
                        onClick={() => doAction({ type: "cosmetic", id: c.id })}
                      >
                        {auto.board === c.id
                          ? "Đang dùng"
                          : auto.cosmetics.includes(c.id)
                            ? "Trang bị"
                            : `Mở · ${c.cost} Ấn Chợ`}
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      ) : (
        <main
          className={`ac-game ${preparing ? "is-preparing" : "is-fighting"}`}
        >
          <div className="ac-hud">
            <AutoPortrait index={0} npc label="An" />
            <div className="ac-health" title={willpowerHelp(run.mode)}>
              <span>AN · {run.health}/{maxWillpower(run)} ý chí</span>
              <div>
                <i style={{ width: `${willpowerRatio(run) * 100}%` }} />
              </div>
            </div>
            <div className="ac-hud-number">
              <small>VÀNG</small>
              <strong>◉ {run.gold}</strong>
            </div>
            <div className="ac-hud-number">
              <small>
                ĐỢT {run.mode === "campaign" ? `${run.wave}/${run.rulesVersion >= 6 ? 18 : 12}` : run.wave}
              </small>
              <strong>
                {run.score.toLocaleString("vi-VN")} <small>điểm</small>
              </strong>
            </div>
            <button
              className="ac-lobby-button"
              onClick={lobby}
              aria-label="Về hội quán"
            >
              ⌂
            </button>
          </div>
          <div className="ac-round-heading">
            <span>
              <strong>
                {run.mode === "campaign"
                  ? AUTO_ACTS[actIndex(run.wave)].title
                  : modeNames[run.mode]}
              </strong>
              <small>
                {preparing
                  ? "CHUẨN BỊ · Mua → xếp quân → xuất trận"
                  : victory.pending
                    ? "CHIẾN THẮNG · Vị Linh ăn mừng"
                  : run.phase !== "combat"
                    ? "VÒNG ĐÃ KẾT THÚC"
                  : run.paused
                    ? "ĐANG TẠM DỪNG"
                    : `GIAO CHIẾN · ${Math.floor((run.combat?.tick ?? 0) / 20)} giây${overtime ? " · TĂNG TỐC ×3" : ""}`}
              </small>
            </span>
            <button onClick={() => openModal("traits")} className="ac-trait-summary" aria-label="Tộc hệ và tỉ lệ cửa hàng">Hệ</button>
          </div>
          <div className="ac-battle-layout">
            <AutoTraits counts={traits} expanded={traitsOpen} onToggle={() => setTraitsOpen(!traitsOpen)} onDetails={() => openModal("traits")} />
          <section className={`ac-arena ${run.combat?.boss ? "is-boss" : ""} ${overtime ? "is-overtime" : ""}`} aria-label="Trận auto chess">
            {run.rulesVersion >= 6 && run.wave >= 13 ? <ArenaScene region={run.wave <= 15 ? "harbor" : "kitchen"} pressure={run.phase === "combat" && !!run.combat?.boss} /> : <WorldArt scene={sceneIndex} />}
            <AutoBoard
              run={run}
              getFrame={runtime.getFrame}
              selected={selected}
              reducedMotion={prefs.reducedMotion}
              lowQuality={lowQuality}
              celebrating={victory.celebrating}
              upgrades={upgrades}
              onCell={onCell}
              onPiecePointerDown={drag.start}
              onCellPointerDown={(cell, event) => { const target = inspectCell(cell); if (target) drag.startPeek(target, event) }}
              onInspectCell={cell => { const target = inspectCell(cell); if (target && !drag.touchTap()) inspectUnit(target) }}
            />
            {victory.celebrating && <AutoVictory wave={run.wave} onFinish={victory.finish} />}
            {run.mode !== "campaign" && p && !victory.pending && (
              <div className="ac-pressure">
                Sương {p.level} · Địch ×{p.health.toFixed(2)} máu / ×
                {p.attack.toFixed(2)} công
                {(run.combat?.tick ?? 0) >= 500 ? " · CUỒNG NỘ" : ""}
              </div>
            )}
            {run.paused &&
              run.phase === "combat" &&
              !sceneId &&
              !modal &&
              !inspect && (
                <div className="ac-pause-overlay">
                  <strong>Giữ lại nhịp bếp</strong>
                  <p>Đồng hồ và đội hình đang dừng.</p>
                  <button
                    className="ac-button primary"
                    onClick={() => runtime.pause(false)}
                  >
                    Tiếp tục chiến đấu →
                  </button>
                </div>
              )}
          </section>
          </div>
          {preparing ? (
            <AutoPreparation run={run} selected={selected} onSelect={setSelected} upgrades={upgrades} reducedMotion={prefs.reducedMotion}
              drag={drag} onAction={doAction} onInspect={inspectUnit} shopOpen={shopOpen} onToggleShop={() => setShopOpen(!shopOpen)}
              inventoryOpen={inventoryOpen} onToggleInventory={() => setInventoryOpen(!inventoryOpen)} onInventoryDetails={() => openModal("inventory")} />
          ) : (
            <div className="ac-fight-controls">
              <div className="ac-combat-strip">
                <AutoPortrait index={0} npc />
                <span><strong>{run.combat?.boss ? MONSTER_MAP[run.combat.boss].name : "Vị Linh đang giữ bàn"}</strong><small>{commanderLine}</small></span>
                <button className="ac-button" onClick={() => runtime.pause(!run.paused)} disabled={run.phase !== "combat"}>{run.paused ? "Tiếp tục" : "Tạm dừng"}</button>
                <button className="ac-button" onClick={() => setSpeed(speed === 1 ? 2 : 1)} disabled={overtime}
                  aria-label={overtime ? `Tự động tăng tốc ×3 sau ${OVERTIME_SECONDS} giây` : "Đổi tốc độ chiến đấu"}
                  title={overtime ? "Trận tiếp tục đến khi một đội bị hạ; tốc độ cố định ×3" : "Chọn ×1 hoặc ×2; sau 55 giây tự chuyển ×3"}>×{effectiveSpeed}</button>
              </div>
              <footer className="ac-controls">
                <span className="ac-team-caption">{boardPieces(run).length} Vị Linh · {(run.activeTicks / 20) | 0}s · Cấp {capacityNow} · {run.xp} XP</span>
                <button className="ac-button" aria-label="Chất lượng đồ họa Auto chess" aria-pressed={!lowQuality} onClick={() => setLowQuality(!lowQuality)}>{lowQuality ? "Đồ họa thấp" : "Đồ họa cao"}</button>
                <button className="ac-button" onClick={() => openModal("abandon")}>Kết thúc lượt</button>
                <button className="ac-inventory-button" onClick={() => openModal("inventory")} aria-label="Di vật và Lời hẹn">✧<span>{run.inventory.length}</span></button>
              </footer>
            </div>
          )}
          {draggedPiece && <div className="ac-sell-zones" aria-label="Kéo quân vào đây để bán">
            {["left", "right"].map(side => <div key={side} data-sell-zone={side} className={`ac-sell-zone is-${side}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M7 6l1 15h8l1-15M10 10v7M14 10v7" /></svg><strong>Bán</strong><span>+{UNIT_MAP[draggedPiece.id].cost * copies(draggedPiece.star)} ◉</span></div>)}
          </div>}

        </main>
      )}
      {notice && (
        <div className="ac-notice" role="status">
          <span>{notice}</span>
          <button onClick={dismiss} aria-label="Ẩn thông báo">
            ×
          </button>
        </div>
      )}
      {sceneId && playing && !victory.pending && !modal && !inspect && (
        <AutoStory
          sceneId={sceneId}
          line={run!.sceneLine}
          oldEnding={oldEnding}
          onNext={() => doAction({ type: "dialogue" })}
        />
      )}
      {journal && (
        <JournalReader sceneId={journal} onClose={() => setJournal(null)} />
      )}
      {drag.peek && run && <QuickUnitInfo id={drag.peek.id} piece={run.roster.find(p => p.uid === drag.peek?.uid)} actor={run.phase === "combat" ? runtime.getFrame().run?.combat?.actors.find(a => a.uid === drag.peek?.uid) : undefined} />}
      {modal === "guide" && (
        <AutoGuide
          onClose={() => {
            action({ type: "tutorial" })
            setModal(null)
          }}
        />
      )}
      {modal === "audio" && (
        <Dialog title="Âm thanh phiên chợ" onClose={() => setModal(null)}>
          <AudioControls />
          <label className="ac-motion-toggle">
            <input
              type="checkbox"
              checked={prefs.reducedMotion}
              onChange={(e) =>
                useAppStore
                  .getState()
                  .updatePreference("reducedMotion", e.target.checked)
              }
            />{" "}
            Giảm chuyển động
          </label>
          <label className="ac-motion-toggle"><input type="checkbox" checked={haptics} disabled={!hapticsSupported} onChange={e => setHaptics(e.target.checked)} /> Rung nhẹ khi lên sao</label>
          {!hapticsSupported && <p className="ac-muted">Trình duyệt này chưa hỗ trợ rung. Hiệu ứng hình ảnh và âm thanh vẫn hoạt động.</p>}
        </Dialog>
      )}
      {modal === "transfer" && (
        <Dialog
          title="Copy & tiếp tục phiên chợ"
          onClose={() => setModal(null)}
        >
          <ProgressTransfer />
        </Dialog>
      )}
      {modal === "traits" && run && (
        <Dialog title="Hệ, nghề và cửa hàng" onClose={() => setModal(null)}>
          <div className="ac-traits-detail">
            {[
              ...Object.entries(AUTO_SCHOOLS),
              ...Object.entries(PROFESSIONS),
            ].map(([id, t]) => (
              <article key={id}>
                <strong>
                  {t.name} · {traits[id] ?? 0}
                </strong>
                <p>{t.text}</p>
              </article>
            ))}
          </div>
          <p>
            Ba hệ khác nhau kích Mâm chung: hồi 2% máu mỗi 5 giây. Bản trùng ID
            không cộng thêm mốc.
          </p>
          <ShopOdds level={capacityNow} rulesVersion={run.rulesVersion} />
        </Dialog>
      )}
      {modal === "inventory" && run && (
        <Dialog title="Di vật và Lời hẹn" onClose={() => setModal(null)}>
          <p>
            {selectedPiece && preparing
              ? `Trao di vật cho ${UNIT_MAP[selectedPiece.id].name}`
              : "Ở vòng chuẩn bị, mở Túi cạnh nút Xuất trận. Kéo trang bị lên quân; kéo hai mảnh đè lên nhau để ghép. Giữ quân 0,3 giây để xem, thả tay để đóng."}
          </p>
          <div className="ac-item-grid">
            {run.inventory.map((id, i) => {
              const item = ITEM_MAP[id]
              return (
                <button
                  key={`${id}-${i}`}
                  disabled={
                    !selectedPiece ||
                    !preparing ||
                    !equipPreview(selectedPiece, id).valid
                  }
                  onClick={() =>
                    doAction({
                      type: "equip",
                      uid: selectedPiece!.uid,
                      item: id,
                    })
                  }
                >
                  <ItemArt id={id} decorative /><strong>{item.name}</strong>
                  <small>{item.text}</small>
                </button>
              )
            })}
          </div>
          {!run.inventory.length && (
            <p className="ac-muted">Thắng mỗi ba đợt để chọn một di vật.</p>
          )}
          <h3>Công thức · hai mảnh thành một di vật</h3>
          <div className="ac-recipe-list">{ITEM_RECIPES.map(({ parts, result }) => <article key={result}><span className="ac-recipe-parts">{parts.map((part, index) => <span key={index}><ItemArt id={part} /><small>{ITEM_MAP[part].name}</small>{index === 0 && " + "}</span>)}</span><strong className="ac-recipe-result">→ <ItemArt id={result} />{ITEM_MAP[result].name}</strong><small>{ITEM_MAP[result].text}</small></article>)}</div>
          <h3>Lời hẹn đang giữ</h3>
          {run.augments.map((id) => {
            const a = AUGMENTS.find((a) => a.id === id)!
            return (
              <p key={id}>
                <strong>{a.name}</strong> · {a.text}
              </p>
            )
          })}
        </Dialog>
      )}
      {modal === "abandon" && (
        <Dialog title="Khép phiên chợ này?" onClose={() => setModal(null)}>
          <p>
            Điểm các đợt đã thắng được giữ làm kỷ lục. Vàng và đội hình của lượt
            này sẽ kết thúc.
          </p>
          <button
            className="ac-button primary"
            onClick={() => {
              if (doAction({ type: "abandon" })) setModal(null)
            }}
          >
            Kết thúc và giữ kỷ lục
          </button>
        </Dialog>
      )}
      {replace && (
        <Dialog title="Bắt đầu phiên chợ mới?" onClose={() => setReplace(null)}>
          <p>
            Lượt hiện tại sẽ kết thúc và ghi kỷ lục. Sau đó bắt đầu{" "}
            {modeNames[replace]} với đội hình mới.
          </p>
          <button
            className="ac-button primary"
            onClick={() => {
              const mode = replace
              if (action({ type: "abandon" })) {
                setReplace(null)
                start(mode)
              }
            }}
          >
            Kết thúc lượt cũ & bắt đầu
          </button>
        </Dialog>
      )}
      {inspect && (
        <UnitInspector
          id={inspect.id}
          piece={run?.roster.find((p) => p.uid === inspect.uid)}
          actor={run?.phase === "combat" ? run.combat?.actors.find((p) => p.uid === inspect.uid) : undefined}
          onClose={() => setInspect(null)}
          onBuy={
            inspect.shop !== undefined && preparing
              ? () => {
                  if (doAction({ type: "buy", index: inspect.shop! }))
                    setInspect(null)
                }
              : undefined
          }
          onUnequip={
            preparing && inspect.uid
              ? (item) => doAction({ type: "unequip", uid: inspect.uid!, item })
              : undefined
          }
        />
      )}
      {playing &&
        run &&
        !sceneId &&
        run.phase === "result" &&
        run.lastResult &&
        !victory.pending &&
        !modal &&
        !inspect && (
          <Dialog
            title={
              run.lastResult.result === "win"
                ? "Bàn vẫn sáng"
                : "Một vòng chưa giữ được"
            }
            onClose={() => {}}
            dismissible={false}
            className="ac-result-dialog"
          >
            <AutoPortrait index={0} npc />
            <h2>
              {run.lastResult.result === "win"
                ? `+${run.lastResult.points} điểm`
                : `−${run.lastResult.damage} ý chí`}
            </h2>
            <p>{run.lastResult.reason}</p>
            {run.combat?.recap && <details><summary>Đóng góp thực tế của đội</summary><table><thead><tr><th>Vị Linh</th><th>Sát thương máu</th><th>Hồi</th><th>Trao chắn</th><th>Đỡ bằng chắn</th></tr></thead><tbody>{run.combat.actors.filter(a => a.side === "ally").map(a => { const s = run.combat!.recap![a.uid]; return <tr key={a.uid}><td>{UNIT_MAP[a.id]?.name ?? a.id}</td><td>{s?.damage ?? 0}</td><td>{s?.healing ?? 0}</td><td>{s?.shielding ?? 0}</td><td>{s?.blocked ?? 0}</td></tr> })}</tbody></table><p>Hồi và chắn do kỹ năng thực sự trao; chắn ban đầu của trang bị/nâng cấp không tính là kỹ năng hồi.</p></details>}
            <div className="ac-result-stats">
              <span>+{run.lastResult.gold} vàng</span>
              <span>{run.health}/{maxWillpower(run)} ý chí</span>
              <span>{run.score} điểm tổng</span>
            </div>
            <p className="ac-muted">
              {run.lastResult.result === "win" ? "Di vật, đội hình và lợi tức mở thêm cách giữ bàn." : `Còn ${run.health} ý chí. Giữ đội hình, nhận vàng và XP để chuẩn bị lại; đợt ${run.wave} chưa hoàn thành.`}
            </p>
            <button
              className="ac-button primary"
              onClick={() => doAction({ type: "next" })}
            >
              {run.lastResult.result === "win" ? "Qua đợt tiếp theo →" : `Chuẩn bị lại đợt ${run.wave} →`}
            </button>
          </Dialog>
        )}
      {playing &&
        run?.phase === "reward" &&
        !victory.pending &&
        run.reward &&
        !modal &&
        !inspect && (
          <Dialog
            title={
              run.reward.kind === "relic"
                ? "Một di vật cho phiên chợ"
                : "Lời hẹn bên bếp"
            }
            onClose={() => {}}
            dismissible={false}
            className="ac-reward-dialog"
          >
            <p>Chọn một cách bổ trợ đội hình. Mỗi lựa chọn giữ đến hết lượt.</p>
            <div className="ac-reward-choices">
              {run.reward.choices.map((id) => {
                const item = ITEM_MAP[id] ?? AUGMENTS.find(r => r.id === id)!
                return (
                  <button
                    key={id}
                    onClick={() => doAction({ type: "reward", id })}
                  >
                    {ITEM_MAP[id] ? <ItemArt id={id} decorative /> : <span>✧</span>}
                    <strong>{item.name}</strong>
                    <p>{item.text}</p>
                    {isComponent(id) && <small>Nhận 2 mảnh · có thể ghép trong kho hoặc trên quân</small>}
                  </button>
                )
              })}
            </div>
            {run.reward.kind === "relic" && run.relicReroll && (
              <button
                className="ac-button"
                onClick={() => doAction({ type: "reroll-reward" })}
              >
                Kể thêm một chuyện · đổi lựa chọn
              </button>
            )}
          </Dialog>
        )}
      {playing &&
        run &&
        ["won", "lost", "abandoned"].includes(run.phase) &&
        !victory.pending &&
        !sceneId &&
        !modal &&
        !inspect && (
          <Dialog
            title={
              run.phase === "won"
                ? "Phiên chợ đón bình minh"
                : "Kỷ lục của một đêm"
            }
            onClose={() => {}}
            dismissible={false}
            className="ac-result-dialog"
          >
            <AutoPortrait index={0} npc />
            <h2>{run.score.toLocaleString("vi-VN")} điểm</h2>
            <p>
              Đợt thắng cao nhất: {run.bestWave} ·{" "}
              {Math.floor(run.activeTicks / 1200)} phút giao chiến
            </p>
            <p>
              {run.phase === "won"
                ? "Những tên gọi đã trở lại. An để một chiếc ghế cho người đến sau."
                : run.phase === "lost"
                  ? `An ${run.mode === "daily" ? "đã hết lượt thử thách" : "đã hết ý chí"} ở đợt ${run.wave}. Điểm các đợt đã thắng được lưu; bắt đầu phiên mới để thử đội hình khác.`
                  : "Lượt đã kết thúc. Kỷ lục và bộ sưu tập được giữ; thử một hướng đội hình khác ở phiên sau."}
            </p>
            {run.phase === "lost" && run.lastResult && <p className="ac-muted">{run.lastResult.reason}</p>}
            {run.phase === "won" && (
              <div className="ac-ending-choices">
                <button
                  className="ac-button"
                  aria-pressed={auto.ending === "annotations"}
                  onClick={() =>
                    doAction({ type: "ending", choice: "annotations" })
                  }
                >
                  Giữ những chú giải
                </button>
                <button
                  className="ac-button"
                  aria-pressed={auto.ending === "hall"}
                  onClick={() => doAction({ type: "ending", choice: "hall" })}
                >
                  Dựng hội quán truyền nghề
                </button>
              </div>
            )}
            <div className="ac-result-actions">
              <button
                className="ac-button"
                onClick={() =>
                  void downloadAutoPostcard(run).catch(() =>
                    useGameStore.setState({
                      notice: "Chưa tạo được ảnh kỷ lục. Hãy thử lại.",
                    }),
                  )
                }
              >
                Tải ảnh kỷ lục
              </button>
              <button
                className="ac-button primary"
                disabled={run.phase === "won" && !auto.ending}
                onClick={lobby}
              >
                Về hội quán →
              </button>
            </div>
          </Dialog>
        )}
    </div>
  )
}
function JournalReader({
  sceneId,
  onClose,
}: {
  sceneId: string
  onClose: () => void
}) {
  const [line, setLine] = useState(0)
  return (
    <div className="ac-journal-reader">
      <AutoStory
        sceneId={sceneId}
        line={line}
        onNext={() => {
          if (line + 1 < SCENES[sceneId].lines.length) setLine(line + 1)
          else onClose()
        }}
      />
    </div>
  )
}
