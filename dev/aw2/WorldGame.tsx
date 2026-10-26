import {
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type RefObject,
} from "react"
import type { SaveSnapshot } from "../../src/aw2/save/schema"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { Waypoint } from "../../src/aw2/world/navigation"
import type { CollectionAction } from "../../src/aw2/collection/model"
import type { EconomyAction } from "../../src/aw2/economy/model"
import { currentObjective, questLabel } from "../../src/aw2/world/rules"
import { zoneById } from "../../src/aw2/world/maps"
import {
  PanelFrame,
  GameQuestPanel,
  GameBagPanel,
  GamePartyPanel,
  GamePlacesPanel,
  PagedCopy,
  type QuestViewState,
} from "./GamePanels"
import type { Aw2ModeId } from "../../src/aw2/modes/catalog"
import "./game.css"

export type GamePanel = "none" | "quest" | "party" | "bag" | "more" | "places" | "help"
interface Props {
  snapshot: SaveSnapshot
  world: WorldProgress
  panel: GamePanel
  busy: boolean
  error: string
  message: string
  map: ReactNode
  dialog: ReactNode
  mapRef: RefObject<HTMLDivElement | null>
  headingRef: RefObject<HTMLHeadingElement | null>
  canWalk: boolean
  onPanel: (panel: GamePanel) => void
  onWalk: (point: Waypoint) => void
  onHold: (key: string, down: boolean) => void
  onStep: (key: string) => void
  onInteract: () => void
  onSave: () => void
  onReread: () => void
  onEconomy: (action: EconomyAction) => void
  onCollection: (action: CollectionAction) => void
  onMode: (id: Aw2ModeId) => void
}
const titles = {
  quest: "Nhật ký nhiệm vụ",
  party: "Đội đồng hành",
  bag: "Túi đồ và bếp",
  more: "Menu hành trình",
  places: "Địa điểm trong vùng",
  help: "Hướng dẫn và thông báo",
}

/** Opt-in v1.1 exploration UI. Existing controller owns every movement and save action. */
export function WorldGame(props: Props) {
  const { snapshot, world, panel, busy, canWalk, onPanel } = props
  const [pinned, setPinned] = useState(true)
  const journalMemory = useRef<QuestViewState>({
    page: Math.min(world.questIndex, 3),
    tab: "objective",
    destination: 0,
  })
  useEffect(() => {
    journalMemory.current.page = Math.min(world.questIndex, 3)
    journalMemory.current.destination = 0
  }, [world.questIndex])
  useEffect(() => {
    document.documentElement.classList.add("aw2-game-document")
    return () => document.documentElement.classList.remove("aw2-game-document")
  }, [])
  const save = snapshot.status === "ready" ? snapshot.save : null
  return (
    <main className="aw2-game-shell" data-testid="game-shell">
      <header className="aw2-game-header">
        <h1 ref={props.headingRef} tabIndex={-1} data-testid="zone-name">
          {zoneById(world.zoneId).name}
        </h1>
        <span>{save?.economy.teamExperience ?? 0} EXP</span>
      </header>
      <div className="aw2-game-tracker">
        <div>
          <strong>
            {world.questIndex === 4
              ? "Lời mời đã được giữ"
              : pinned
                ? questLabel(world)
                : "Chưa ghim mục tiêu"}
          </strong>
          <p data-testid="quest-objective">
            {world.questIndex === 4
              ? "Tự do khám phá, ghé bàn hoặc chia một bữa ấm."
              : pinned
                ? currentObjective(world)
                : "Mở Nhật ký để ghim nhiệm vụ hiện tại."}
          </p>
        </div>
        <button
          type="button"
          disabled={!save || busy}
          onClick={() => onPanel("quest")}
          aria-label="Mở nhật ký nhiệm vụ"
        >
          J · Nhiệm vụ
        </button>
      </div>
      <div className="aw2-game-map" data-testid="game-map-stage">
        {save ? (
          props.map
        ) : (
          <section className="aw2-game-empty">
            <h2>Bắt đầu hành trình</h2>
            {snapshot.status === "empty" ? (
              <>
                <p>Cùng năm người bạn giữ một lời mời bên bếp.</p>
                <button type="button" disabled={busy} onClick={props.onSave}>
                  Tạo bản lưu AW2
                </button>
              </>
            ) : (
              <>
                <p role="alert">
                  Chưa đọc được bản lưu ({snapshot.status}). Dữ liệu gốc được
                  giữ.
                </p>
                <button type="button" disabled={busy} onClick={props.onReread}>
                  Đọc lại
                </button>
                <a href="/dev/aw2/index.html">Công cụ bản lưu</a>
              </>
            )}
          </section>
        )}
        {save && (
          <div className="aw2-game-inputs">
            <div className="aw2-game-dpad" aria-label="Điều khiển di chuyển">
              {[
                ["w", "↑", "Lên"],
                ["a", "←", "Trái"],
                ["s", "↓", "Xuống"],
                ["d", "→", "Phải"],
              ].map(([key, symbol, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={`Đi ${label}`}
                  data-aw2-world-control="move"
                  data-direction={key}
                  disabled={!canWalk || busy}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    props.onHold(key, true)
                  }}
                  onPointerUp={() => props.onHold(key, false)}
                  onPointerCancel={() => props.onHold(key, false)}
                  onLostPointerCapture={() => props.onHold(key, false)}
                  onClick={(e) => {
                    if (e.detail === 0) props.onStep(key)
                  }}
                >
                  {symbol}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="aw2-game-interact"
              data-aw2-world-control="interact"
              disabled={!canWalk || busy}
              onClick={props.onInteract}
            >
              E · Tương tác
            </button>
          </div>
        )}
      </div>
      <div className="aw2-game-bottom">
        <p
          className="aw2-game-message"
          role={props.error ? "alert" : "status"}
          title={props.error || props.message}
        >
          {busy
            ? "Đang ghi…"
            : props.error ||
              props.message ||
              "Chạm lối đi · E tương tác · J nhiệm vụ"}
        </p>
        <nav className="aw2-game-dock" aria-label="Menu game">
          {[
            ["quest", "Nhiệm vụ"],
            ["party", "Đội"],
            ["bag", "Túi"],
            ["more", "Thêm"],
          ].map(([id, label]) => (
            <button
              type="button"
              key={id}
              disabled={busy || (id !== "more" && !save)}
              aria-pressed={panel === id}
              onClick={() => onPanel(id as GamePanel)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      <output className="aw2-game-position" data-testid="player-position">
        Vị trí {world.x.toFixed(0)}, {world.y.toFixed(0)} · {world.facing}
      </output>
      {panel !== "none" && (
        <PanelFrame
          key={panel}
          title={titles[panel]}
          busy={busy}
          onClose={() => onPanel("none")}
        >
          {panel === "quest" && save && (
            <GameQuestPanel
              memory={journalMemory}
              save={save}
              world={world}
              canWalk={canWalk}
              pinned={pinned}
              onPin={() => setPinned((p) => !p)}
              onWalk={props.onWalk}
            />
          )}
          {panel === "party" && save && (
            <GamePartyPanel
              key={save.revision}
              save={save}
              busy={busy}
              onAction={props.onCollection}
            />
          )}
          {panel === "bag" && save && (
            <GameBagPanel
              save={save}
              world={world}
              busy={busy}
              onAction={props.onEconomy}
            />
          )}
          {panel === "places" && save && (
            <GamePlacesPanel
              world={world}
              canWalk={canWalk}
              onWalk={props.onWalk}
            />
          )}
          {panel === "more" && (
            <div className="aw2-panel-stack aw2-game-more">
              <button
                type="button"
                disabled={!save}
                onClick={() => onPanel("places")}
              >
                Địa điểm
              </button>
              <div className="aw2-panel-tabs">
                <button
                  type="button"
                  disabled={!save || busy}
                  onClick={props.onSave}
                >
                  Lưu vị trí
                </button>
                <button type="button" disabled={busy} onClick={props.onReread}>
                  Đọc lại
                </button>
              </div>
              <div className="aw2-panel-tabs">
                <button
                  type="button"
                  disabled={!save || busy}
                  onClick={() => props.onMode("tcg")}
                >
                  Ghé TCG
                </button>
                <button
                  type="button"
                  disabled={!save || busy}
                  onClick={() => props.onMode("auto-chess")}
                >
                  Ghé Auto Chess
                </button>
              </div>
              <button type="button" onClick={() => onPanel("help")}>
                Hướng dẫn / thông báo
              </button>
            </div>
          )}
          {panel === "help" && (
            <div className="aw2-panel-stack">
              <PagedCopy
                text={
                  props.error ||
                  props.message ||
                  "Chạm lối đi hoặc dùng WASD/mũi tên để đi. E tương tác, J mở nhiệm vụ, Escape đóng menu. Chỉ đường chỉ đi tới gần: bạn tự nhận nhiệm vụ, qua cửa và chọn hành động. Đi bộ chưa ghi bản lưu; dùng Lưu vị trí trước khi rời trang."
                }
              />
              <a href="/dev/aw2/world.html">Công cụ chơi thử đầy đủ</a>
              <a href="/dev/aw2/index.html">Công cụ bản lưu</a>
            </div>
          )}
        </PanelFrame>
      )}
      {props.dialog}
    </main>
  )
}
