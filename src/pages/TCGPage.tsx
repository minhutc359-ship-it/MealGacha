import { BrandMark } from "../components/layout/BrandMark"
import { LegalLinks } from "../legal/LegalLinks"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useCompactPageSize } from "../components/game/useCompactPageSize"
import { ModeSwitch } from "../components/layout/ModeSwitch"
import { useAppStore } from "../store/useAppStore"
import { useGameStore } from "../game/useGameStore"
import { CARDS, CARD_MAP, SCHOOLS, RARITIES } from "../game/catalog"
import { STAGES, STAGE_MAP } from "../game/story"
import { PACKS, QUESTS, DAILY_QUESTS, rotateDay } from "../game/progression"
import { GAME_KEY, parseGame } from "../game/storage"
import { getDateKey } from "../domain/dateKey"
import { GameCardView } from "../components/game/GameCardView"
import { StoryScene } from "../components/game/StoryScene"
import { DuelBasics } from "../components/game/DuelBasics"
import { HomeLobby } from "../components/game/HomeLobby"
import { CampaignScreen } from "../components/game/CampaignScreen"
import { AudioControls, useGameAudio } from "../components/game/GameAudio"
import { SCENES, BOSS_RULES, WORLD_PRIMER } from "../game/narrative"
import { stageArtId } from "../game/storyArt"
import { BattleBoard } from "../components/game/BattleBoard"
import { Collection } from "../components/game/Collection"
import { JourneyHub } from "../components/game/JourneyHub"
import { ProgressTransfer } from "../components/game/ProgressTransfer"
import { CharacterPortrait } from "../components/game/CharacterPortrait"
import { DeckBuilder } from "../components/game/DeckBuilder"
import { Expedition } from "../components/game/Expedition"
import { activeRun } from "../game/expedition"
import { Trader } from "../components/game/Trader"
import { Dialog } from "../components/game/Dialog"
import type { GameSave } from "../game/types"
import { gameAudio } from "../infrastructure/audio/gameAudio"
import "../game/tcg.css"
import "../game/combat.css"
import "../game/story.css"
import "../game/livingTable.css"
import "../game/animeStage.css"
import "../game/compactScreen.css"
import "../game/spiritArena.css"
import "../game/characterMotion.css"

const NAV = [
  { id: "home", name: "Sảnh hành trình", icon: "home" },
  { id: "story", name: "Cốt truyện", icon: "map" },
  { id: "companions", name: "Lời hứa bên bếp", icon: "home" },
  { id: "expedition", name: "Thám hiểm", icon: "compass" },
  { id: "collection", name: "Thư viện thẻ", icon: "cards" },
  { id: "decks", name: "Bộ bài", icon: "deck" },
  { id: "packs", name: "Cửa hàng thẻ", icon: "pack" },
  { id: "workshop", name: "Xưởng vị giác", icon: "craft" },
  { id: "quests", name: "Nhiệm vụ", icon: "quest" },
]
const paths: Record<string, string> = {
  home: "M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10",
  map: "m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5M9 3v16M15 5v16",
  cards: "M7 5h13v15H7zM4 17H3V2h13v1M10 9h7M10 12h7M10 16h4",
  deck: "m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
  pack: "M5 3h14v18H5zM5 7h14M5 17h14m-7-7 3 2-3 2-3-2 3-2",
  compass: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4 6-2 6-6 2 2-6 6-2Z",
  craft: "m15 3 6 6-3 3-6-6 3-3ZM13 9l-9 9 2 2 9-9M3 21h5",
  quest: "M5 4h14v17H5zM9 2h6v4H9zM8 10l2 2 5-4M8 16h7",
  arrow: "M4 12h15m-6-6 6 6-6 6",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
}
function Icon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.cards} />
    </svg>
  )
}

export function TCGPage() {
  useGameAudio()
  const [params, setParams] = useSearchParams()
  const tab = params.get("tab") ?? "home"
  const setTab = (id: string) => {
    setParams(id === "home" ? {} : { tab: id })
    setMenuOpen(false)
  }
  const save = useGameStore((s) => s.save),
    notice = useGameStore((s) => s.notice),
    dismiss = useGameStore((s) => s.dismiss)
  const legacy = useAppStore((s) => s.user)
  const [help, setHelp] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [traderOpen, setTraderOpen] = useState(false)
  const [questPage, setQuestPage] = useState(0)
  const questPageSize = useCompactPageSize()
  const [questView, setQuestView] = useState("daily")
  const questPages = Math.max(
    1,
    Math.ceil(
      (questView === "daily" ? DAILY_QUESTS : QUESTS).length / questPageSize,
    ),
  )
  const visibleQuestPage = Math.min(questPage, questPages - 1)
  const [settingsView, setSettingsView] = useState("audio")
  const [packId, setPackId] = useState(PACKS[0].id)
  const mainRef = useRef<HTMLElement>(null)
  const [sceneRead, setSceneRead] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [stageId, setStageId] = useState<string | null>(null),
    [choice, setChoice] = useState<"courage" | "wisdom">("courage")
  const [revealed, setRevealed] = useState<string[]>([]),
    [revealCount, setRevealCount] = useState(0)
  const [imported, setImported] = useState<GameSave | null>(null),
    [importError, setImportError] = useState("")
  const importInput = useRef<HTMLInputElement>(null)
  const current = rotateDay(save)
  const next = STAGES.find((s) => !current.clearedStages.includes(s.id))
  const level = Math.floor(current.xp / 100) + 1
  const claims = [
    ...QUESTS.filter(
      (q) =>
        !current.claimedQuests.includes(q.id) &&
        q.progress(current) >= q.target,
    ),
    ...DAILY_QUESTS.filter(
      (q) =>
        !current.claimedDailyQuests.includes(q.id) &&
        q.progress(current) >= q.target,
    ),
  ].length

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [tab])
  useEffect(() => {
    useGameStore.getState().importLegacy(legacy.rewards.map((r) => r.dishId))
  }, [legacy.rewards])
  useEffect(() => {
    document.documentElement.dataset.tcgReducedMotion = String(
      legacy.preferences.reducedMotion,
    )
    return () => {
      delete document.documentElement.dataset.tcgReducedMotion
    }
  }, [legacy.preferences.reducedMotion])
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === GAME_KEY) useGameStore.getState().sync()
    }
    const focus = () => useGameStore.getState().sync()
    window.addEventListener("storage", sync)
    window.addEventListener("focus", focus)
    const timer = window.setInterval(focus, 60_000)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("focus", focus)
      clearInterval(timer)
    }
  }, [])
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(dismiss, 5500)
    return () => clearTimeout(t)
  }, [notice, dismiss])
  const goStage = (id: string) => {
    setChoice(current.choices[id] ?? "courage")
    setSceneRead(false)
    setPreparing(false)
    setStageId(id)
  }
  const begin = () => {
    if (stageId && useGameStore.getState().start(stageId, choice))
      setStageId(null)
  }
  const open = (id: string) => {
    const cards = useGameStore.getState().openPack(id)
    if (cards.length) {
      setRevealed(cards)
      setRevealCount(0)
    }
  }
  const exportSave = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(save, null, 2)], { type: "application/json" }),
    )
    const a = document.createElement("a")
    a.href = url
    a.download = `soul-of-meal-tcg-${getDateKey()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div
      className="tcg-app tcg-compact-app"
      onClickCapture={(event) => {
        const target = event.target
        if (
          target instanceof Element &&
          target.closest("button, a") &&
          !target.closest(
            ".tcg-viewport-battle, .tcg-scene, .tcg-audio-controls",
          )
        )
          gameAudio.play(
            target.closest(".tcg-sidebar nav") ? "confirm" : "select",
          )
      }}
    >
      <a href="#tcg-main" className="tcg-skip">
        Đến nội dung chính
      </a>
      <aside className="tcg-sidebar" inert={!!current.battle}>
        <button
          className="tcg-brand"
          onClick={() => setTab("home")}
          aria-label="Soul of Meal — Sảnh hành trình"
        >
          <BrandMark />
          <span>
            <strong>SOUL OF MEAL</strong>
            <small>HUYỀN THOẠI VỊ GIÁC</small>
          </span>
        </button>
        <div className="tcg-sidebar-label">THẾ GIỚI CỦA BẠN</div>
        <nav aria-label="Điều hướng game">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "active" : ""}
              onClick={() => setTab(n.id)}
              aria-label={n.name}
              aria-current={tab === n.id ? "page" : undefined}
            >
              <Icon name={n.icon} />
              <span
                data-mobile-label={
                  ({
                    home: "Sảnh",
                    companions: "Bạn bếp",
                    story: "Truyện",
                    expedition: "Thám hiểm",
                    collection: "Thẻ",
                    decks: "Bộ bài",
                    packs: "Gói thẻ",
                    workshop: "Xưởng",
                    quests: "Nhiệm vụ",
                  } as Record<string, string>)[n.id]
                }
              >
                {n.name}
              </span>
              {n.id === "quests" && claims > 0 && (
                <b className="tcg-nav-badge">{claims}</b>
              )}
              {n.id === "packs" && current.packTickets > 0 && <i />}
            </button>
          ))}
        </nav>
        <div className="tcg-sidebar-chapter">
          <span>HÀNH TRÌNH HIỆN TẠI</span>
          <strong>{next ? next.chapter.title : "Bữa tiệc hoàn thành"}</strong>
          <div className="tcg-progress">
            <i
              style={{ width: `${(current.clearedStages.length / 18) * 100}%` }}
            />
          </div>
          <small>{current.clearedStages.length}/18 màn đã vượt qua</small>
          <button onClick={() => setTab("story")}>
            Xem hành trình <Icon name="arrow" />
          </button>
        </div>
        <div className="tcg-sidebar-bottom">
          <button onClick={() => setHelp(true)} title="Hướng dẫn chơi">
            <Icon name="quest" />ⓘ Hướng dẫn chơi
          </button>
          <button onClick={() => setTab("settings")}>
            <Icon name="settings" /> Cài đặt & bản lưu
          </button>
          <Link to="/chest" title="Rương vị giác">
            <Icon name="pack" />◇ Rương vị giác
          </Link>
          <div className="tcg-player">
            <CharacterPortrait id="hero" decorative />
            <div>
              <strong>{legacy.displayName || "Nhà thám hiểm"}</strong>
              <small>NGƯỜI GIỮ VỊ · CẤP {level}</small>
            </div>
          </div>
        </div>
      </aside>
      {traderOpen && (
        <Dialog
          title="Thương nhân ký ức"
          onClose={() => setTraderOpen(false)}
          wide
        >
          <Trader />
        </Dialog>
      )}
      {menuOpen && (
        <Dialog
          title="Khám phá Soul of Meal"
          onClose={() => setMenuOpen(false)}
          className="tcg-menu-dialog"
        >
          <div className="tcg-menu-grid">
            {NAV.map((n) => (
              <button
                key={n.id}
                aria-current={tab === n.id ? "page" : undefined}
                onClick={() => setTab(n.id)}
              >
                <Icon name={n.icon} />
                <span>{n.name}</span>
              </button>
            ))}
            <button onClick={() => setTab("settings")}>
              <Icon name="settings" />
              <span>Cài đặt & bản lưu</span>
            </button>
            <button
              onClick={() => {
                setMenuOpen(false)
                setHelp(true)
              }}
            >
              <span>ⓘ Hướng dẫn chơi</span>
            </button>
            <Link to="/chest" title="Rương vị giác">
              <Icon name="pack" />◇ Rương vị giác
            </Link>
          </div>
        </Dialog>
      )}
      <div className="tcg-content">
        <header className="tcg-topbar" inert={!!current.battle}>
          <div>
            <span className="tcg-mobile-brand"><BrandMark /><b>Soul<br />of Meal</b></span>
            <span className="tcg-topbar-label">SOUL OF MEAL /</span>
            <strong>{NAV.find((n) => n.id === tab)?.name ?? "Cài đặt"}</strong>
            <span className="tcg-offline-tag">
              <i /> ĐẤU VỚI AI
            </span>
          </div>
          <div className="tcg-wallet">
            <ModeSwitch mode="tcg" />
            <span title="Xu để mở gói thẻ">
              <i>◉</i>
              <b>{current.coins.toLocaleString("vi-VN")}</b>
            </span>
            <span title="Tinh chất để chế tạo">
              <i>✧</i>
              <b>{current.dust.toLocaleString("vi-VN")}</b>
            </span>
            <button onClick={() => setTab("packs")} title="Vé mở gói">
              <i>▱</i>
              <b>{current.packTickets}</b>
            </button>
            <button
              className="tcg-mobile-settings"
              onClick={() => setTab("settings")}
              aria-label="Cài đặt game"
            >
              <Icon name="settings" />
            </button>
          </div>
        </header>
        <nav
          className="tcg-mobile-nav"
          aria-label="Điều hướng nhanh"
          inert={!!current.battle}
        >
          {[
            { id: "home", name: "Sảnh", icon: "home" },
            { id: "story", name: "Truyện", icon: "map" },
            { id: "collection", name: "Thẻ", icon: "cards" },
            { id: "decks", name: "Bộ bài", icon: "deck" },
          ].map((n) => (
            <button
              key={n.id}
              aria-current={tab === n.id ? "page" : undefined}
              onClick={() => setTab(n.id)}
            >
              <Icon name={n.icon} />
              <span>{n.name}</span>
            </button>
          ))}
          <button
            aria-label="Mở menu game"
            aria-haspopup="dialog"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="settings" />
            <span>Thêm</span>
          </button>
        </nav>
        <main
          id="tcg-main"
          ref={mainRef}
          key={tab}
          data-screen={tab}
          tabIndex={-1}
          className={`tcg-main ${current.battle ? "has-battle" : ""}`}
        >
          {current.battle ? (
            <BattleBoard
              onExit={() =>
                setTab(
                  current.battle?.expedition
                    ? "expedition"
                    : current.battle?.sideQuest || current.battle?.weekly
                      ? "companions"
                      : current.battle?.stageId
                        ? "story"
                        : "home",
                )
              }
            />
          ) : (
            <>
              {tab === "home" && (
                <HomeLobby
                  save={current}
                  name={legacy.displayName || "Nhà thám hiểm"}
                  claims={claims}
                  onTab={setTab}
                  onStage={goStage}
                  onHelp={() => setHelp(true)}
                />
              )}
              {tab === "expedition" && <Expedition />}
              {tab === "story" && <CampaignScreen onStage={goStage} />}
              {tab === "collection" && <Collection />}
              {tab === "workshop" && <Collection workshop />}
              {tab === "companions" && <JourneyHub />}
              {tab === "decks" && <DeckBuilder />}
              {tab === "packs" && (
                <>
                  <div className="tcg-section-heading">
                    <div>
                      <span className="tcg-kicker">
                        CÔNG THỨC CHO NHỮNG ĐIỀU BẤT NGỜ
                      </span>
                      <h1>Cửa hàng thẻ</h1>
                      <p>
                        Mỗi gói 5 lá. Thẻ trùng quá 2 bản tự chuyển thành tinh
                        chất.
                      </p>
                    </div>
                    <div className="tcg-number-badge">
                      {current.packTickets}
                      <small>VÉ ĐANG CÓ</small>
                    </div>
                  </div>
                  <div className="tcg-pack-guarantee">
                    <span>
                      ✦ <strong>Ít nhất 1 Hiếm mỗi gói</strong>
                    </span>
                    <span>
                      ✧{" "}
                      <strong>
                        Sử thi trở lên trong tối đa {8 - current.pity} gói nữa
                      </strong>
                    </span>
                    <small>
                      Tỉ lệ mỗi lá: Thường 63% · Hiếm 25% · Sử thi 10% · Huyền
                      thoại 2%. Lá cuối được nâng độ hiếm khi áp dụng bảo đảm.
                    </small>
                  </div>
                  <div
                    className="tcg-pack-picker tcg-segmented"
                    role="group"
                    aria-label="Chọn gói thẻ"
                  >
                    {PACKS.map((p) => (
                      <button
                        key={p.id}
                        aria-pressed={packId === p.id}
                        onClick={() => setPackId(p.id)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <div className="tcg-pack-grid">
                    {PACKS.filter((p) => p.id === packId).map((p) => (
                      <section
                        className="tcg-pack-offer"
                        style={
                          {
                            "--school-color": p.school
                              ? SCHOOLS[p.school].color
                              : "#e4bd70",
                          } as CSSProperties
                        }
                        key={p.id}
                      >
                        <div className="tcg-pack-art">
                          <div className="tcg-pack-box">
                            <span className="tcg-pack-border" />
                            <small>SOUL OF MEAL</small>
                            <span className="tcg-pack-symbol">{p.symbol}</span>
                            <strong>{p.name}</strong>
                            <small>5 THẺ VỊ GIÁC</small>
                          </div>
                          <span className="tcg-pack-spark one">✦</span>
                          <span className="tcg-pack-spark two">✧</span>
                        </div>
                        <h2>{p.name}</h2>
                        <p>
                          {p.description} · {p.coinCost} xu hoặc 1 vé
                        </p>
                        <button
                          className="tcg-button primary"
                          disabled={
                            !current.packTickets && current.coins < p.coinCost
                          }
                          onClick={() => open(p.id)}
                        >
                          {current.packTickets
                            ? "Mở bằng 1 vé"
                            : `Mở gói · ${p.coinCost} ◉`}{" "}
                          <Icon name="arrow" />
                        </button>
                      </section>
                    ))}
                  </div>
                  <button
                    className="tcg-button ghost tcg-trader-launch"
                    onClick={() => setTraderOpen(true)}
                  >
                    Trao đổi thẻ với thương nhân →
                  </button>
                </>
              )}
              {tab === "quests" && (
                <>
                  <div className="tcg-section-heading">
                    <div>
                      <span className="tcg-kicker">
                        NHỮNG BƯỚC NHỎ, MỘT HÀNH TRÌNH LỚN
                      </span>
                      <h1>Sổ nhiệm vụ</h1>
                      <button
                        className="tcg-button ghost tcg-checkin-quick"
                        disabled={current.lastCheckIn === getDateKey()}
                        onClick={() => useGameStore.getState().checkIn()}
                      >
                        {current.lastCheckIn === getDateKey()
                          ? "Đã điểm danh ✓"
                          : "Điểm danh · +100 xu"}
                      </button>
                      <p>
                        Nhận thưởng để mở thêm thẻ và hoàn thiện bộ bài. Nhiệm
                        vụ ngày đổi lúc 00:00 theo múi giờ ứng dụng (mặc định
                        Việt Nam).
                      </p>
                    </div>
                  </div>
                  <div
                    className="tcg-segmented"
                    role="group"
                    aria-label="Loại nhiệm vụ"
                  >
                    <button
                      aria-pressed={questView === "daily"}
                      onClick={() => {
                        setQuestView("daily")
                        setQuestPage(0)
                      }}
                    >
                      Việc hôm nay
                    </button>
                    <button
                      aria-pressed={questView === "milestones"}
                      onClick={() => {
                        setQuestView("milestones")
                        setQuestPage(0)
                      }}
                    >
                      Dấu mốc hành trình
                    </button>
                  </div>
                  <section className="tcg-checkin-panel">
                    <span>☀</span>
                    <div>
                      <h2>Bữa sáng của người giữ vị</h2>
                      <p>Đăng nhập mỗi ngày nhận 100 xu và 10 tinh chất.</p>
                    </div>
                    <button
                      className="tcg-button primary"
                      disabled={current.lastCheckIn === getDateKey()}
                      onClick={() => useGameStore.getState().checkIn()}
                    >
                      {current.lastCheckIn === getDateKey()
                        ? "Đã nhận ✓"
                        : "Nhận thưởng hôm nay"}
                    </button>
                  </section>
                  {[
                    { title: "Việc hôm nay", list: DAILY_QUESTS, daily: true },
                    { title: "Dấu mốc hành trình", list: QUESTS, daily: false },
                  ]
                    .filter((group) => group.daily === (questView === "daily"))
                    .map((group) => (
                      <section key={group.title}>
                        <div className="tcg-mini-heading">
                          <h2>{group.title}</h2>
                          <span>
                            {group.daily
                              ? getDateKey()
                              : "Nhận một lần cho mỗi dấu mốc"}
                          </span>
                        </div>
                        <div className="tcg-quest-grid">
                          {group.list
                            .slice(
                              visibleQuestPage * questPageSize,
                              (visibleQuestPage + 1) * questPageSize,
                            )
                            .map((q) => {
                              const done = (
                                group.daily
                                  ? current.claimedDailyQuests
                                  : current.claimedQuests
                              ).includes(q.id)
                              const progress = q.progress(current)
                              return (
                                <article
                                  className={`tcg-panel tcg-quest ${
                                    done ? "is-complete" : ""
                                  }`}
                                  key={q.id}
                                >
                                  <span className="tcg-quest-icon">
                                    {done ? "✓" : "✦"}
                                  </span>
                                  <h3>{q.name}</h3>
                                  <p>{q.description}</p>
                                  <div className="tcg-progress">
                                    <i
                                      style={{
                                        width: `${Math.min(100, (progress / q.target) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <small>
                                    {Math.min(q.target, progress)}/{q.target}
                                  </small>
                                  <div className="tcg-quest-bottom">
                                    <span>
                                      ◉ {q.coins} <i>✧ {q.dust}</i>
                                    </span>
                                    <button
                                      className="tcg-button ghost"
                                      disabled={done || progress < q.target}
                                      onClick={() =>
                                        useGameStore
                                          .getState()
                                          .claimQuest(q.id, group.daily)
                                      }
                                    >
                                      {done
                                        ? "Đã nhận"
                                        : progress >= q.target
                                          ? "Nhận thưởng"
                                          : "Đang thực hiện"}
                                    </button>
                                  </div>
                                </article>
                              )
                            })}
                        </div>
                      </section>
                    ))}
                  <nav className="tcg-pagination" aria-label="Trang nhiệm vụ">
                    <button
                      className="tcg-button ghost"
                      disabled={visibleQuestPage === 0}
                      onClick={() => setQuestPage(visibleQuestPage - 1)}
                      aria-label="Trang nhiệm vụ trước"
                    >
                      ←
                    </button>
                    <span role="status">
                      {visibleQuestPage + 1}/{questPages} ·{" "}
                      {(questView === "daily" ? DAILY_QUESTS : QUESTS).length}{" "}
                      nhiệm vụ
                    </span>
                    <button
                      className="tcg-button ghost"
                      disabled={visibleQuestPage + 1 === questPages}
                      onClick={() => setQuestPage(visibleQuestPage + 1)}
                      aria-label="Trang nhiệm vụ tiếp"
                    >
                      →
                    </button>
                  </nav>
                </>
              )}
              {tab === "settings" && (
                <>
                  <div className="tcg-section-heading">
                    <div>
                      <span className="tcg-kicker">CĂN BẾP CỦA BẠN</span>
                      <h1>Cài đặt & tiến trình</h1>
                      <p>
                        Tiến trình được lưu trên trình duyệt hiện tại, sau mỗi
                        hành động.
                      </p>
                    </div>
                  </div>
                  <div
                    className="tcg-segmented"
                    role="group"
                    aria-label="Nhóm cài đặt"
                  >
                    <button
                      aria-pressed={settingsView === "audio"}
                      onClick={() => setSettingsView("audio")}
                    >
                      Âm thanh
                    </button>
                    <button
                      aria-pressed={settingsView === "save"}
                      onClick={() => setSettingsView("save")}
                    >
                      Tiến trình
                    </button>
                    <button
                      aria-pressed={settingsView === "experience"}
                      onClick={() => setSettingsView("experience")}
                    >
                      Trải nghiệm
                    </button>
                  </div>
                  <div className="tcg-settings-grid">
                    {settingsView === "audio" && (
                      <section className="tcg-panel">
                        <h2>Âm thanh & âm nhạc</h2>
                        <AudioControls />
                      </section>
                    )}
                    {settingsView === "save" && (
                      <section className="tcg-panel">
                        <h2>Copy & tiếp tục ở thiết bị khác</h2>
                        <ProgressTransfer />
                      </section>
                    )}
                    {settingsView === "save" && (
                      <details className="tcg-json-backup">
                        <summary>Sao lưu file JSON</summary>
                        <section className="tcg-panel">
                          <h2>Sao lưu file hành trình</h2>
                          <p>
                            Xuất file JSON để chuyển sang thiết bị khác. Bản lưu
                            chứa bộ sưu tập, bộ bài, cốt truyện, chuyến thám
                            hiểm, nhật ký và trận đang chơi.
                          </p>
                          <button
                            className="tcg-button primary"
                            onClick={exportSave}
                          >
                            ↓ Xuất bản lưu TCG
                          </button>
                          <button
                            className="tcg-button ghost"
                            onClick={() => importInput.current?.click()}
                          >
                            ↑ Nhập bản lưu TCG
                          </button>
                          <input
                            hidden
                            type="file"
                            accept=".json,application/json"
                            ref={importInput}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              try {
                                const parsed = parseGame(
                                  JSON.parse(await file.text()),
                                )
                                if (!parsed) throw new Error()
                                setImported(parsed)
                                setImportError("")
                              } catch {
                                setImportError(
                                  "File không hợp lệ. Tiến trình hiện tại vẫn được giữ.",
                                )
                              }
                              e.target.value = ""
                            }}
                          />
                          {importError && <p role="alert">{importError}</p>}
                        </section>
                      </details>
                    )}
                    {settingsView === "experience" && (
                      <section className="tcg-panel">
                        <h2>Trải nghiệm & dữ liệu cũ</h2>
                        <LegalLinks />
                        <p>
                          Đổi âm thanh, giảm chuyển động, tên hiển thị hoặc xuất
                          ZIP đầy đủ tại phần cài đặt chung. Các món cũ được
                          chuyển sang thẻ TCG một lần cho mỗi món.
                        </p>
                        <Link className="tcg-button ghost" to="/settings">
                          Mở cài đặt chung →
                        </Link>
                        <button
                          className="tcg-button ghost"
                          onClick={() => setHelp(true)}
                        >
                          Đọc luật chơi
                        </button>
                      </section>
                    )}
                  </div>
                  <div className="tcg-info-strip">
                    Chế độ hiện tại: chiến dịch và đấu với AI, chạy trên máy của
                    bạn. Giao dịch giữa người chơi và PvP trực tuyến cần máy
                    chủ; ứng dụng hiện chưa có hai chế độ này.
                  </div>
                </>
              )}
              {!NAV.some((n) => n.id === tab) && tab !== "settings" && (
                <div className="tcg-empty">
                  <p>Trang này không tồn tại.</p>
                  <button
                    className="tcg-button primary"
                    onClick={() => setTab("home")}
                  >
                    Về sảnh
                  </button>
                </div>
              )}
            </>
          )}
          <footer className="tcg-footer">
            <span>
              SOUL OF MEAL <i>✦</i> Một thế giới được nấu bằng ký ức.
            </span>
            <span>VỊ LINH · HƯƠNG VỊ VIỆT NAM · v2.8.1</span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="tcg-toast" role="status">
          ✦ {notice}
          <button onClick={dismiss} aria-label="Đóng thông báo">
            ×
          </button>
        </div>
      )}
      {stageId && (
        <Dialog
          title={STAGE_MAP[stageId].title}
          onClose={() => setStageId(null)}
          wide
          className={`tcg-story-flow ${
            preparing ? "tcg-preparing-dialog" : ""
          }`}
        >
          <div
            className={`tcg-story-dialog ${preparing ? "is-preparing" : ""}`}
          >
            <span className="tcg-kicker">
              {STAGE_MAP[stageId].chapter.title} ·{" "}
              {STAGE_MAP[stageId].boss ? "BOSS" : "THỬ THÁCH"}
            </span>
            {!preparing ? (
              <>
                <StoryScene
                  key={stageId}
                  lines={SCENES[stageId].before}
                  art={stageArtId(stageId)}
                  onComplete={() => setSceneRead(true)}
                />
                <div className="tcg-dialog-actions tcg-story-next-step">
                  <span>
                    {sceneRead
                      ? "Ký ức đã mở. Chọn cách bước vào trận."
                      : "Đọc lời thoại hoặc bỏ qua để tiếp tục."}
                  </span>
                  <button
                    className="tcg-button primary"
                    disabled={!sceneRead}
                    onClick={() => setPreparing(true)}
                  >
                    Chọn cách nhập trận →
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  className="tcg-text-button"
                  onClick={() => setPreparing(false)}
                >
                  ← Đọc lại câu chuyện
                </button>
                <details className="tcg-tactic">
                  <summary>Gợi ý chiến thuật</summary>
                  <p>{SCENES[stageId].tactic}</p>
                </details>
                {BOSS_RULES[stageId] && (
                  <details className="tcg-boss-rule">
                    <summary>☽ {BOSS_RULES[stageId].name}</summary>
                    <p>{BOSS_RULES[stageId].text}</p>
                  </details>
                )}
                <p>Bạn mang điều gì vào trận chiến này?</p>
                <div className="tcg-choice-row">
                  <button
                    className={choice === "courage" ? "active" : ""}
                    onClick={() => setChoice("courage")}
                    aria-pressed={choice === "courage"}
                  >
                    <span>✹</span>
                    <strong>Can đảm</strong>
                    <small>Bắt đầu với 34 máu, 4 lá</small>
                  </button>
                  <button
                    className={choice === "wisdom" ? "active" : ""}
                    onClick={() => setChoice("wisdom")}
                    aria-pressed={choice === "wisdom"}
                  >
                    <span>◈</span>
                    <strong>Thấu hiểu</strong>
                    <small>Bắt đầu với 32 máu, 5 lá</small>
                  </button>
                </div>
                <div className="tcg-story-reward">
                  <span>
                    {current.clearedStages.includes(stageId)
                      ? "Đã nhận thưởng lần đầu · Chơi lại để thử bộ bài"
                      : `Lần đầu: ${
                          STAGE_MAP[stageId].boss ? 180 : 100
                        } xu · 50 XP · ${CARD_MAP[STAGE_MAP[stageId].rewardCard].name}${
                          STAGE_MAP[stageId].boss ? " · 1 vé gói" : ""
                        }`}
                  </span>
                </div>
                <div className="tcg-dialog-actions">
                  <button
                    className="tcg-button ghost"
                    onClick={() => {
                      setStageId(null)
                      setTab("decks")
                    }}
                  >
                    Chuẩn bị bộ bài
                  </button>
                  <button
                    className="tcg-button primary"
                    onClick={begin}
                    disabled={!sceneRead}
                  >
                    Vào trận →
                  </button>
                </div>
              </>
            )}
          </div>
        </Dialog>
      )}
      {revealed.length > 0 && (
        <Dialog
          title="Những hương vị mới"
          onClose={() => {
            setRevealed([])
            setRevealCount(0)
          }}
          wide
        >
          <p className="tcg-pack-reveal-copy">
            Nhấn từng lá để khám phá. Thẻ đã được thêm vào bộ sưu tập.
          </p>
          <div className="tcg-reveal-row">
            {revealed.map((id, i) =>
              i < revealCount ? (
                <div
                  className={`tcg-revealed reveal-${CARD_MAP[id].rarity}`}
                  key={i}
                >
                  <GameCardView card={CARD_MAP[id]} compact />
                  <small>{RARITIES[CARD_MAP[id].rarity].name}</small>
                </div>
              ) : (
                <button
                  className="tcg-card-back"
                  key={i}
                  onClick={() => setRevealCount(i + 1)}
                  aria-label={`Lật thẻ ${i + 1}`}
                >
                  <span>✦</span>
                  <small>SOUL OF MEAL</small>
                </button>
              ),
            )}
          </div>
          <div className="tcg-dialog-actions">
            <p>Thẻ trùng quá 2 bản đã đổi thành tinh chất.</p>
            <button
              className="tcg-button primary"
              onClick={() =>
                revealCount < 5 ? setRevealCount(5) : setRevealed([])
              }
            >
              {revealCount < 5 ? "Lật tất cả" : "Thêm vào hành trình →"}
            </button>
          </div>
        </Dialog>
      )}
      {imported && (
        <Dialog title="Khôi phục hành trình?" onClose={() => setImported(null)}>
          <p>
            Bản lưu có{" "}
            {Object.values(imported.cards).filter((n) => n > 0).length} thẻ,{" "}
            {imported.clearedStages.length} màn đã vượt qua và {imported.coins}{" "}
            xu. Khôi phục sẽ thay thế tiến trình TCG hiện tại.
          </p>
          <div className="tcg-dialog-actions">
            <button
              className="tcg-button ghost"
              onClick={() => setImported(null)}
            >
              Hủy
            </button>
            <button
              className="tcg-button primary"
              onClick={() => {
                if (useGameStore.getState().importSave(imported))
                  setImported(null)
              }}
            >
              Khôi phục
            </button>
          </div>
        </Dialog>
      )}
      {help && (
        <Dialog
          title="Cách chơi · Huyền thoại vị giác"
          onClose={() => setHelp(false)}
          wide
        >
          <div className="tcg-help">
            <StoryScene lines={WORLD_PRIMER} />
            <DuelBasics />
            <div className="tcg-help-lead">
              <span>✦</span>
              <p>
                Đưa máu chủ tướng đối phương về 0 bằng một bộ bài 18 lá. Không
                cần mua gì: bạn có sẵn bộ khởi đầu, 2 vé gói và 300 xu.
              </p>
            </div>
            <ol>
              <li>
                <strong>Cộng hưởng cùng hệ</strong>
                <p>
                  Dùng hai lá cùng hệ liên tiếp trong một lượt: lá thứ hai giảm
                  1 năng lượng, có thể về 0. Chỉ kích hoạt một lần mỗi lượt; bắt
                  đầu lượt mới sẽ đặt lại. Chi phí trên thẻ tự cập nhật.
                </p>
              </li>
              <li>
                <strong>Triệu hồi đồng minh</strong>
                <p>
                  Đổi tối đa 3 lá trước trận. Chọn thẻ để đọc hiệu ứng, rồi xác
                  nhận dùng năng lượng. Mỗi bên có 3 ô sân. Đồng minh đợi tới
                  lượt sau để đánh; Xung phong được đánh ngay.
                </p>
              </li>
              <li>
                <strong>Chọn mục tiêu</strong>
                <p>
                  Nhấn đồng minh sẵn sàng, rồi nhấn đơn vị địch hoặc chủ tướng.
                  Khi hai đơn vị đánh nhau, cả hai gây sát thương. Phải đánh Hộ
                  vệ trước; phép gây sát thương có thể vượt Hộ vệ.
                </p>
              </li>
              <li>
                <strong>Dùng bí thuật & kết thúc lượt</strong>
                <p>
                  Phép sát thương cần mục tiêu địch. Hồi máu tác động tới chủ
                  tướng; tăng công và lá chắn tác động tới mọi đồng minh. Hết
                  lượt, AI sẽ chơi rồi bạn được rút 1 lá và hồi đầy năng lượng,
                  tăng tối đa tới 7.
                </p>
              </li>
              <li>
                <strong>Đồng hệ & kiệt sức</strong>
                <p>
                  Triệu hồi vào sân có đồng minh cùng hệ nhận 1 lá chắn. Lá chắn
                  chặn sát thương và mất dần. Tay tối đa 8 lá; lá rút dư bị bỏ.
                  Hết bộ bài sẽ chịu kiệt sức 1, 2, 3… máu mỗi lần rút.
                </p>
              </li>
              <li>
                <strong>Quét sân & thám hiểm</strong>
                <p>
                  Bí thuật Quét sân gây sát thương lên mọi đồng minh địch, có
                  tính lá chắn. Thám hiểm có 7 chặng, giữ máu giữa các trận và
                  10 di vật thay đổi chiến thuật. Thẻ nhặt trên đường chỉ thuộc
                  bộ bài của chuyến đi.
                </p>
              </li>
              <li>
                <strong>Mở khóa hành trình</strong>
                <p>
                  Mỗi màn cần thắng màn trước. Phần thưởng cốt truyện chỉ nhận
                  lần đầu. Luyện tập thưởng 25 xu và 10 XP nếu tổng số trận
                  thắng hôm nay chưa tới 5. Nhiệm vụ và điểm danh giúp bạn kiếm
                  thêm tài nguyên.
                </p>
              </li>
            </ol>
            <button
              className="tcg-button primary"
              onClick={() => setHelp(false)}
            >
              Sẵn sàng vào bếp →
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
