import { useState } from "react"
import {
  TACTICAL_CAMPAIGN_NODES,
  isCampaignNodeAvailable,
  type TacticalCampaignNode,
} from "../../game/tacticalTcg/campaign"
import {
  commitTacticalProgress,
  readTacticalProgress,
  type TacticalProgress,
} from "../../game/tacticalTcg/progression"
import { TacticalBattleScreen } from "./TacticalBattleScreen"
export function TacticalCampaignScreen({
  onProgress,
}: {
  onProgress?: (value: TacticalProgress) => void
}) {
  const [progress, setProgress] = useState(() =>
      readTacticalProgress(localStorage),
    ),
    [active, setActive] = useState<TacticalCampaignNode | null>(null)
  const refresh = () => {
    const value = readTacticalProgress(localStorage)
    setProgress(value)
    onProgress?.(value)
  }
  const open = (node: TacticalCampaignNode) => {
    if (!isCampaignNodeAvailable(node, progress.completedCampaignNodes)) return
    if (!node.battle) {
      const result = commitTacticalProgress(localStorage, {
        receiptId: `story:${node.id}`,
        completedNodeId: node.id,
        unlockMangaChapterId: node.mangaChapterId,
      })
      setProgress(result.progress)
      onProgress?.(result.progress)
      return
    }
    setActive(node)
  }
  if (active?.battle)
    return (
      <div className="tactical-campaign-battle">
        <button
          className="tcg-button ghost"
          onClick={() => {
            setActive(null)
            refresh()
          }}
        >
          ← Bản đồ chiến dịch
        </button>
        <TacticalBattleScreen
          options={{
            ...active.battle,
            battleId: `campaign:${active.id}:v1`,
            nodeId: active.id,
          }}
          mangaChapterId={active.mangaChapterId}
          onProgress={refresh}
        />
      </div>
    )
  return (
    <section className="tactical-campaign">
      <header>
        <div>
          <small>CHIẾN DỊCH BỐN HỒI</small>
          <h1>Con đường Giao Ước</h1>
          <p>Thắng trận để mở nút tiếp theo và chương Manga tương ứng.</p>
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
      {[1, 2, 3, 4].map((act) => (
        <section className="tactical-act" key={act}>
          <header>
            <div>
              <small>CHƯƠNG {String(act).padStart(2, "0")}</small>
              <h2>Hồi {act}</h2>
            </div>
            <span>
              {
                TACTICAL_CAMPAIGN_NODES.filter(
                  (node) =>
                    node.act === act &&
                    progress.completedCampaignNodes.includes(node.id),
                ).length
              }
              /2 hoàn thành
            </span>
          </header>
          <div className="tactical-node-list">
            {TACTICAL_CAMPAIGN_NODES.filter((node) => node.act === act).map(
              (node) => {
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
                    onClick={() => open(node)}
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
                        ? "Hoàn thành"
                        : available
                          ? "Sẵn sàng"
                          : "Đang khóa"}
                    </small>
                    <b aria-hidden="true">
                      {done ? "✓" : available ? "›" : "⌁"}
                    </b>
                  </button>
                )
              },
            )}
          </div>
        </section>
      ))}
    </section>
  )
}
