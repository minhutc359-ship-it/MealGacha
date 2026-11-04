import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { TacticalBattleScreen } from "../components/game/TacticalBattleScreen"
import { TacticalCampaignScreen } from "../components/game/TacticalCampaignScreen"
import { MangaChronicle } from "../components/game/MangaChronicle"
import { BrandMark } from "../components/layout/BrandMark"
import { LegalLinks } from "../legal/LegalLinks"
import {
  readTacticalProgress,
  type TacticalProgress,
} from "../game/tacticalTcg/progression"
import "../game/tcg.css"
import "../game/tacticalBattle.css"
const NAV = [
  { id: "battle", name: "Linh Chiến", icon: "⚔" },
  { id: "campaign", name: "Chiến dịch", icon: "◇" },
  { id: "manga", name: "Manga ký ức", icon: "▤" },
  { id: "settings", name: "Cài đặt", icon: "⚙" },
] as const
export function TCGPage() {
  const [params, setParams] = useSearchParams(),
    requested = params.get("tab"),
    tab =
      requested === "play" || !requested
        ? "battle"
        : NAV.some((item) => item.id === requested)
          ? requested
          : "battle",
    queue = params.get("queue")
  const [progress, setProgress] = useState<TacticalProgress>(() =>
      readTacticalProgress(localStorage),
    ),
    refresh = () => setProgress(readTacticalProgress(localStorage)),
    go = (id: string) => setParams(id === "battle" ? {} : { tab: id })
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key?.includes("tactical-tcg")) refresh()
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])
  return (
    <div className="tcg-app tactical-shell">
      <aside className="tcg-sidebar tactical-sidebar">
        <button className="tcg-brand" onClick={() => go("battle")}>
          <BrandMark />
          <span>
            <strong>SOUL OF MEAL</strong>
            <small>LINH CHIẾN VỊ GIÁC</small>
          </span>
        </button>
        <nav aria-label="Điều hướng Linh Chiến">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => go(item.id)}
            >
              <b aria-hidden="true">{item.icon}</b>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
        <Link className="tcg-pvp-entry" to="/chest">
          ◇ Rương Vị Giác
        </Link>
        <div className="tcg-sidebar-chapter">
          <span>TIẾN TRÌNH</span>
          <strong>{progress.tinhVi} Tinh Vị</strong>
          <small>
            {progress.completedCampaignNodes.length}/8 nút chiến dịch
          </small>
        </div>
      </aside>
      <div className="tcg-content">
        <header className="tcg-topbar">
          <div>
            <span className="tcg-topbar-label">SOUL OF MEAL / </span>
            <strong>{NAV.find((item) => item.id === tab)?.name}</strong>
          </div>
          <div className="tcg-wallet">
            <span title="Tinh Vị">
              <i>✧</i>
              <b>{progress.tinhVi}</b>
            </span>
            <Link to="/chest">Mở Rương</Link>
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
        <main id="tcg-main" className="tcg-main" data-screen={tab}>
          {tab === "battle" && (
            <TacticalBattleScreen
              options={{
                battleId: queue === "pvp" ? "pvp-practice-v1" : "practice-v1",
                mode: queue === "pvp" ? "pvp" : "campaign",
              }}
              onProgress={refresh}
            />
          )}{" "}
          {tab === "campaign" && (
            <TacticalCampaignScreen onProgress={setProgress} />
          )}{" "}
          {tab === "manga" && (
            <>
              <div className="tcg-section-heading">
                <div>
                  <span className="tcg-kicker">KÝ ỨC ĐÃ MỞ</span>
                  <h1>Manga Linh Vị</h1>
                  <p>
                    {progress.unlockedMangaChapters.length} chương đã được mở
                    bằng tiến trình chiến dịch.
                  </p>
                </div>
              </div>
              <MangaChronicle track="tcg" clearedStages={[]} />
            </>
          )}{" "}
          {tab === "settings" && (
            <section className="tcg-panel">
              <h1>Cài đặt & dữ liệu</h1>
              <p>
                Tiến trình, biên nhận thưởng và chương Manga được lưu trên thiết
                bị. Mỗi biên nhận chỉ được áp dụng một lần, kể cả khi reload.
              </p>
              <p>
                PvP hiện là phòng thử nghiệm cục bộ: không nhập sức mạnh hay xếp
                hạng từ bản lưu cũ và không cấp thưởng PvE.
              </p>
              <LegalLinks />
              <Link className="tcg-button ghost" to="/chest">
                Mở Rương Vị Giác
              </Link>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
