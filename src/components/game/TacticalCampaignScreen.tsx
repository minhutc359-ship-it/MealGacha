import { useState } from "react"
import {
  TACTICAL_CAMPAIGN_NODES,
  isCampaignNodeAvailable,
  type TacticalCampaignNode,
} from "../../game/tacticalTcg/campaign"
import {
  CAMPAIGN_ENDINGS,
  TACTICAL_ACTS,
  TACTICAL_SCENES,
} from "../../game/tacticalTcg/campaign/story"
import {
  TACTICAL_CARD_MAP,
  TACTICAL_STARTER,
} from "../../game/tacticalTcg/cards"
import {
  commitTacticalProgress,
  readTacticalProgress,
  type TacticalProgress,
} from "../../game/tacticalTcg/progression"
import { TacticalBattleScreen } from "./TacticalBattleScreen"

export function TacticalCampaignScreen({
  onProgress,
  onManga,
  deck,
  resumeNodeId,
  onResumeSaved,
}: {
  onProgress?: (value: TacticalProgress) => void
  onManga?: () => void
  deck?: string[]
  resumeNodeId?: string | null
  onResumeSaved?: () => void
}) {
  const [progress, setProgress] = useState(() =>
    readTacticalProgress(localStorage),
  )
  const resumed =
    TACTICAL_CAMPAIGN_NODES.find(
      (node) =>
        node.id === resumeNodeId &&
        node.id === progress.checkpoint?.nodeId &&
        node.battle &&
        isCampaignNodeAvailable(node, progress.completedCampaignNodes),
    ) ?? null
  const [active, setActive] = useState<TacticalCampaignNode | null>(resumed)
  const [screen, setScreen] = useState<"before" | "battle" | "after">(
    resumed ? "battle" : "before",
  )
  const [error, setError] = useState("")
  const refresh = () => {
    const value = readTacticalProgress(localStorage)
    setProgress(value)
    onProgress?.(value)
  }
  const choose = (choice: string) => {
    if (!active) return
    try {
      const scene = TACTICAL_SCENES[active.id]
      const result = commitTacticalProgress(localStorage, {
        receiptId: `story-choice:v2:${active.id}`,
        completedNodeId: active.id,
        unlockMangaChapterId: active.mangaChapterId,
        campaignChoice: { nodeId: active.id, choice },
        cardCopies: progress.completedCampaignNodes.includes(active.id)
          ? {}
          : { [`card:${scene.rewardCardId}`]: 1 },
      })
      setProgress(result.progress)
      onProgress?.(result.progress)
      setScreen("after")
    } catch (e) {
      setError((e as Error).message)
    }
  }
  if (active) {
    const scene = TACTICAL_SCENES[active.id]
    if (screen === "battle" && active.battle)
      return (
        <div className="tactical-campaign-battle">
          <button
            className="tcg-button ghost"
            onClick={() => {
              setActive(null)
              refresh()
            }}
          >
            ← Lưu trận & về chiến dịch
          </button>
          <TacticalBattleScreen
            key={active.id}
            options={{
              ...active.battle,
              deck: deck ?? TACTICAL_STARTER,
              battleId: `campaign:${active.id}:v1`,
              nodeId: active.id,
            }}
            mangaChapterId={active.mangaChapterId}
            onProgress={refresh}
            onResumeSaved={onResumeSaved}
            onExit={() => {
              setActive(null)
              refresh()
            }}
            onComplete={() => {
              refresh()
              setScreen("after")
            }}
          />
        </div>
      )
    const final = active.id === "act-4-last-table" && screen === "after"
    const ending =
      CAMPAIGN_ENDINGS[
        progress.campaignChoices["act-4-vow"] === "remember"
          ? "remember"
          : "share"
      ]
    return (
      <section className="tactical-story-scene">
        <img
          className="tactical-story-scene__background"
          src={`/assets/tcg/story/${scene.art}.webp`}
          alt=""
        />
        <button
          className="tcg-button ghost"
          onClick={() => {
            setActive(null)
            refresh()
          }}
        >
          ← Chiến dịch
        </button>
        <header>
          <small>
            HỒI {active.act} · {scene.region}
          </small>
          <h1>{final ? ending.title : active.title}</h1>
        </header>
        <article>
          <img src={scene.portrait} alt={scene.speaker} />
          <div>
            <strong>{scene.speaker}</strong>
            {(screen === "after" ? scene.after : scene.before).map(
              (line, index) => (
                <p key={index}>{line}</p>
              ),
            )}
            {final && <blockquote>{ending.text}</blockquote>}
          </div>
        </article>
        {screen === "before" && (
          <aside>
            <small>MỤC TIÊU</small>
            <p>{scene.objective}</p>
            <span>
              Thưởng lần đầu:{" "}
              {active.battle
                ? `${active.kind === "boss" ? 60 : 30} Tinh Vị · 1 vé · `
                : ""}
              {TACTICAL_CARD_MAP[scene.rewardCardId].name}
            </span>
            {!!active.battle?.enemyManaPenalty && (
              <p className="tactical-story-handicap">
                Dẫn nhập PvE: địch khởi đầu với 2 Lửa Bếp; bạn có 3.
              </p>
            )}
          </aside>
        )}
        <footer>
          {screen === "before" && active.battle ? (
            <button
              className="tcg-button primary"
              onClick={() => setScreen("battle")}
            >
              Vào trận với bộ bài đang trang bị →
            </button>
          ) : screen === "before" ? (
            <div className="tactical-story-choices">
              <button onClick={() => choose("remember")}>
                <strong>Giữ ngọn lửa đầu tiên</strong>
                <span>Lưu bản gốc và tên người đã truyền công thức.</span>
              </button>
              <button onClick={() => choose("share")}>
                <strong>Viết tiếp nhiều lời kể</strong>
                <span>Mời mỗi gia đình góp một trang vào cuốn sách.</span>
              </button>
            </div>
          ) : (
            <>
              <button
                className="tcg-button primary"
                onClick={() => {
                  setActive(null)
                  refresh()
                }}
              >
                {final ? "Trở về Làng Giao Ước" : "Tiếp tục hành trình →"}
              </button>
              {onManga && (
                <button className="tcg-button ghost" onClick={onManga}>
                  Đọc Manga đã mở
                </button>
              )}
            </>
          )}
        </footer>
        {error && <p role="alert">{error}</p>}
      </section>
    )
  }
  return (
    <section className="tactical-campaign">
      <header>
        <div>
          <small>CHIẾN DỊCH BỐN HỒI</small>
          <h1>Con đường Giao Ước</h1>
          <p>
            Sương Nhạt xóa tên người trong công thức. Cùng năm Người Giữ Vị tìm
            lại ký ức và mời Vô Danh trở lại bàn ăn.
          </p>
        </div>
        <div className="tactical-campaign-progress">
          <span>
            <b>{progress.completedCampaignNodes.length}</b> / 8
          </span>
          <small>ĐÃ HOÀN THÀNH</small>
          <i
            role="progressbar"
            aria-label="Tiến trình chiến dịch"
            aria-valuemin={0}
            aria-valuemax={8}
            aria-valuenow={progress.completedCampaignNodes.length}
          >
            <b
              style={{
                width: `${(progress.completedCampaignNodes.length / 8) * 100}%`,
              }}
            />
          </i>
        </div>
      </header>
      {TACTICAL_ACTS.map((act, index) => (
        <section className="tactical-act" key={act.title}>
          <header>
            <div>
              <small>
                HỒI {index + 1} · {act.subtitle}
              </small>
              <h2>{act.title}</h2>
            </div>
          </header>
          <div className="tactical-node-list">
            {TACTICAL_CAMPAIGN_NODES.filter(
              (node) => node.act === index + 1,
            ).map((node) => {
              const done = progress.completedCampaignNodes.includes(node.id),
                available = isCampaignNodeAvailable(
                  node,
                  progress.completedCampaignNodes,
                )
              return (
                <button
                  key={node.id}
                  disabled={!available}
                  className={done ? "is-complete" : ""}
                  onClick={() => {
                    setActive(node)
                    setScreen("before")
                    setError("")
                  }}
                >
                  <span>
                    {node.kind === "boss"
                      ? "♛"
                      : node.kind === "story"
                        ? "☰"
                        : "⚔"}
                  </span>
                  <strong>{node.title}</strong>
                  <small>
                    {done
                      ? "Đã hoàn thành · đọc lại/đấu lại"
                      : available
                        ? "Sẵn sàng · truyện & thử thách"
                        : "Hoàn thành nút trước để mở"}
                  </small>
                  <b aria-hidden="true">{done ? "✓" : "›"}</b>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </section>
  )
}
