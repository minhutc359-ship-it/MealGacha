import { lazy, Suspense, useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { TacticalBattleScreen } from "../components/game/TacticalBattleScreen"
import { TacticalCampaignScreen } from "../components/game/TacticalCampaignScreen"
import { TacticalHome, TacticalGuide } from "../components/game/TacticalHome"
import { BrandMark } from "../components/layout/BrandMark"
import { LegalLinks } from "../legal/LegalLinks"
import {
  ensureTacticalAccount,
  claimTacticalDaily,
  readTacticalProgress,
  withTacticalLock,
  type TacticalProgress,
} from "../game/tacticalTcg/progression"
import {
  ownedTacticalCards,
  tacticalDeckErrors,
} from "../game/tacticalTcg/cards"
import { useAppStore } from "../store/useAppStore"
import "../game/tcg.css"
import "../game/tacticalBattle.css"
import "../game/tacticalHub.css"

const MangaChronicle = lazy(() =>
  import("../components/game/MangaChronicle").then((module) => ({
    default: module.MangaChronicle,
  })),
)
const TacticalCollection = lazy(() =>
  import("../components/game/TacticalCardHub").then((module) => ({
    default: module.TacticalCollection,
  })),
)
const TacticalDeckBuilder = lazy(() =>
  import("../components/game/TacticalCardHub").then((module) => ({
    default: module.TacticalDeckBuilder,
  })),
)
const TacticalPacks = lazy(() =>
  import("../components/game/TacticalCardHub").then((module) => ({
    default: module.TacticalPacks,
  })),
)
const NAV = [
  { id: "home", name: "Sảnh", icon: "⌂" },
  { id: "campaign", name: "Hành trình", icon: "◇" },
  { id: "decks", name: "Bộ bài", icon: "▱" },
  { id: "collection", name: "Bộ sưu tập", icon: "▤" },
  { id: "packs", name: "Mở thẻ", icon: "✧" },
  { id: "manga", name: "Manga", icon: "☰" },
  { id: "guide", name: "Cách chơi", icon: "?" },
  { id: "settings", name: "Cài đặt", icon: "⚙" },
]
const MANGA_UNLOCKS: Record<string, string[]> = {
  "manga:act-1": ["lantern"],
  "manga:act-2": ["harbor"],
  "manga:act-3": ["garden", "tide"],
  "manga:act-4": ["moon"],
  "manga:ending": ["last-table"],
}

export function TCGPage() {
  const preferences = useAppStore((state) => state.user.preferences)
  const updatePreference = useAppStore((state) => state.updatePreference)
  const [params, setParams] = useSearchParams()
  const requested = params.get("tab") ?? "home"
  const tab =
    requested === "play"
      ? "battle"
      : [...NAV.map((n) => n.id), "battle"].includes(requested)
        ? requested
        : "home"
  const [progress, setProgress] = useState<TacticalProgress>(() =>
    ensureTacticalAccount(localStorage),
  )
  const [notice, setNotice] = useState("")
  const activeDeck =
    progress.decks.find((d) => d.id === progress.activeDeckId) ??
    progress.decks[0]
  const deckErrors = tacticalDeckErrors(
    activeDeck?.cards ?? [],
    ownedTacticalCards(progress.cardCopies),
  )
  const go = (id: string) => {
    setParams(id === "home" ? {} : { tab: id })
    window.scrollTo({ top: 0 })
  }
  const refresh = () => {
    try {
      setProgress(readTacticalProgress(localStorage))
    } catch (e) {
      setNotice((e as Error).message)
    }
  }
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key?.includes("tactical-tcg")) refresh()
    }
    window.addEventListener("storage", sync)
    window.addEventListener("focus", refresh)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("focus", refresh)
    }
  }, [])
  const daily = async () => {
    try {
      setProgress(
        await withTacticalLock(() => claimTacticalDaily(localStorage)),
      )
      setNotice(
        "Quà hôm nay đã được ghi nhận: 1 vé và 30 Tinh Vị (mỗi ngày một lần).",
      )
    } catch (e) {
      setNotice((e as Error).message)
    }
  }
  const backup = () => {
    const keys = [
      "foodchest.tcg.v1",
      "foodchest.user.v1",
      "soul-of-meal.tactical-tcg.profile.v1",
      "soul-of-meal.tactical-tcg.progress.v1",
      "soul-of-meal.tactical-tcg.legacy-backup.v1",
    ]
    const data = {
      format: "soul-of-meal-tactical-backup-v1",
      exportedAt: new Date().toISOString(),
      storage: Object.fromEntries(
        keys.map((key) => [key, localStorage.getItem(key)]),
      ),
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "soul-of-meal-backup.json"
    link.click()
    URL.revokeObjectURL(url)
    setNotice("Đã xuất bản sao tiến trình trên thiết bị.")
  }
  return (
    <div className="tcg-app tactical-shell" data-active-screen={tab}>
      <a className="tcg-skip" href="#tcg-main">
        Đến nội dung
      </a>
      <aside className="tcg-sidebar tactical-sidebar">
        <button className="tcg-brand" onClick={() => go("home")}>
          <BrandMark />
          <span>
            <strong>SOUL OF MEAL</strong>
            <small>LINH CHIẾN VỊ GIÁC</small>
          </span>
        </button>
        <span className="tcg-sidebar-label">HÀNH TRÌNH CỦA BẠN</span>
        <nav aria-label="Điều hướng Linh Chiến">
          {NAV.map((item) => (
            <button
              key={item.id}
              title={item.name}
              className={tab === item.id ? "active" : ""}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => go(item.id)}
            >
              <b aria-hidden="true">{item.icon}</b>
              <span>{item.name}</span>
              {item.id === "packs" && progress.packTickets > 0 && (
                <small className="tactical-nav-count">
                  {progress.packTickets}
                </small>
              )}
            </button>
          ))}
        </nav>
        <Link className="tcg-pvp-entry" to="/chest">
          ◇ Rương Vị Giác ↗
        </Link>
        <div className="tcg-sidebar-chapter">
          <span>BỘ BÀI ĐANG TRANG BỊ</span>
          <strong>{activeDeck?.name}</strong>
          <small>
            {activeDeck?.cards.length}/24 lá ·{" "}
            {progress.completedCampaignNodes.length}/8 chặng
          </small>
        </div>
      </aside>
      <div className="tcg-content">
        <header className="tcg-topbar">
          <div>
            <span className="tcg-topbar-label">SOUL OF MEAL / </span>
            <strong>
              {tab === "battle"
                ? "Linh Chiến"
                : NAV.find((n) => n.id === tab)?.name}
            </strong>
          </div>
          <div className="tcg-wallet">
            <button onClick={() => go("packs")} title="Vé mở thẻ">
              ▱ <b>{progress.packTickets}</b>
            </button>
            <span title="Tinh Vị">
              <i>✧</i>
              <b>{progress.tinhVi}</b>
            </span>
            <button onClick={() => go("guide")} aria-label="Hướng dẫn chơi">
              ?
            </button>
          </div>
        </header>
        <nav className="tcg-mobile-nav" aria-label="Điều hướng nhanh">
          {NAV.map((item) => (
            <button
              key={item.id}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => go(item.id)}
            >
              <b>{item.icon}</b>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
        {notice && (
          <div className="tactical-shell-notice" role="status">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Đóng thông báo">
              ×
            </button>
          </div>
        )}
        <main
          id="tcg-main"
          className="tcg-main"
          data-screen={tab}
          tabIndex={-1}
        >
          <Suspense
            fallback={
              <p className="tcg-panel" role="status">
                Đang mở ký ức…
              </p>
            }
          >
            {tab === "home" && (
              <TacticalHome progress={progress} go={go} onDaily={daily} />
            )}
            {tab === "decks" && (
              <TacticalDeckBuilder
                progress={progress}
                onProgress={setProgress}
              />
            )}
            {tab === "collection" && (
              <TacticalCollection
                progress={progress}
                onProgress={setProgress}
              />
            )}
            {tab === "packs" && (
              <TacticalPacks progress={progress} onProgress={setProgress} />
            )}
            {(tab === "battle" || tab === "campaign") &&
            deckErrors.length > 0 ? (
              <section className="tcg-panel">
                <h1>Bộ bài chưa sẵn sàng</h1>
                <p>{deckErrors[0]}</p>
                <button
                  className="tcg-button primary"
                  onClick={() => go("decks")}
                >
                  Sửa bộ bài
                </button>
              </section>
            ) : (
              <>
                {tab === "battle" && (
                  <TacticalBattleScreen
                    key={`${activeDeck.id}:${params.get("queue") ?? "solo"}`}
                    options={{
                      battleId: `practice:${activeDeck.id}:v2`,
                      mode: params.get("queue") === "pvp" ? "pvp" : "campaign",
                      deck: activeDeck.cards,
                      seed: 101,
                    }}
                    onProgress={refresh}
                  />
                )}
                {tab === "campaign" && (
                  <TacticalCampaignScreen
                    deck={activeDeck.cards}
                    onProgress={setProgress}
                    onManga={() => go("manga")}
                  />
                )}
              </>
            )}
            {tab === "manga" && (
              <>
                <div className="tcg-section-heading">
                  <div>
                    <span className="tcg-kicker">
                      MỖI LỜI KỂ ĐỀU ĐƯỢC GIỮ LẠI
                    </span>
                    <h1>Manga Linh Vị</h1>
                    <p>
                      Chương mở theo campaign. Đọc đối thoại trong Hành trình để
                      theo trọn mạch truyện mới.
                    </p>
                  </div>
                </div>
                <MangaChronicle
                  track="tcg"
                  unlockedChapterIds={progress.unlockedMangaChapters.flatMap(
                    (id) => MANGA_UNLOCKS[id] ?? [],
                  )}
                  clearedStages={[]}
                />
              </>
            )}
            {tab === "guide" && <TacticalGuide onPlay={() => go("battle")} />}
            {tab === "settings" && (
              <section className="tactical-hub">
                <header className="tactical-hub-heading">
                  <div>
                    <span className="tcg-kicker">HỒ SƠ NGƯỜI GIỮ VỊ</span>
                    <h1>Cài đặt & dữ liệu</h1>
                    <p>
                      Tiến trình được lưu trên thiết bị. Trận đang chơi tiếp tục
                      sau khi tải lại.
                    </p>
                  </div>
                </header>
                <div className="tactical-settings-cards">
                  <article>
                    <h2>Bản sao tiến trình</h2>
                    <p>
                      Xuất toàn bộ thẻ, bộ bài, Rương và dữ liệu trước chuyển
                      đổi để giữ bản dự phòng của riêng bạn.
                    </p>
                    <button className="tcg-button primary" onClick={backup}>
                      Xuất bản sao JSON
                    </button>
                  </article>
                  <article>
                    <h2>Hiển thị & chuyển động</h2>
                    <p>
                      Giảm hiệu ứng khi cần tập trung vào lá bài hoặc khi thiết
                      bị yếu.
                    </p>
                    <label>
                      <input
                        type="checkbox"
                        checked={preferences.reducedMotion}
                        onChange={(e) =>
                          updatePreference("reducedMotion", e.target.checked)
                        }
                      />{" "}
                      Giảm chuyển động
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={preferences.graphicsQuality === "low"}
                        onChange={(e) =>
                          updatePreference(
                            "graphicsQuality",
                            e.target.checked ? "low" : "normal",
                          )
                        }
                      />{" "}
                      Đồ họa nhẹ
                    </label>
                    <button
                      className="tcg-button ghost"
                      onClick={() => go("guide")}
                    >
                      Xem toàn bộ luật
                    </button>
                  </article>
                </div>
                <LegalLinks />
                <Link to="/chest">Rương Vị Giác ↗</Link>
              </section>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
