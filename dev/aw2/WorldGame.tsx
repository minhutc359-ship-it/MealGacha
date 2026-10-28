import { WalkingStatus } from "./WalkingTarget"
import type { WalkingTarget } from "../../src/aw2/world/walkingIntent"
import { useEffect, type ReactNode, type RefObject } from "react"
import type { SaveSnapshot } from "../../src/aw2/save/schema"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { Waypoint } from "../../src/aw2/world/navigation"
import type { CollectionAction } from "../../src/aw2/collection/model"
import type { EconomyAction } from "../../src/aw2/economy/model"
import { currentObjective, questLabel } from "../../src/aw2/world/rules"
import { zoneById } from "../../src/aw2/world/maps"
import { sceneName, scenePosition } from "../../src/aw2/world/scene"
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
import type { ZoneId } from "../../src/aw2/world/ids"
import type { NpcPatrolState } from "../../src/aw2/world/npcPatrol"
import { interactionTarget, placeKind } from "../../src/aw2/world/placeGuidance"
import { JourneyOverview } from "./JourneyOverview"
import { RecipePanel } from "./RecipePanel"
import { RoomPracticePanel } from "./RoomPracticePanel"
import { npcLifeClock } from "../../src/aw2/world/npcLife"
import "./game.css"

export type GamePanel = "none" | "quest" | "party" | "bag" | "more" | "places" | "help" | "atlas" | "recipe" | "practice"
interface Props {
  pinned: boolean
  onPin: () => void
  journalMemory: RefObject<QuestViewState>
  overviewMemory: RefObject<ZoneId>
  snapshot: SaveSnapshot
  world: WorldProgress
  patrol?: Readonly<NpcPatrolState>
  panel: GamePanel
  busy: boolean
  error: string
  message: string
  map: ReactNode
  dialog: ReactNode
  mapRef: RefObject<HTMLDivElement | null>
  headingRef: RefObject<HTMLHeadingElement | null>
  canWalk: boolean
  walkTarget: WalkingTarget | null
  onStopWalking: () => void
  onPanel: (panel: GamePanel) => void
  onWalk: (point: Waypoint) => void
  onHold: (key: string, down: boolean) => void
  onStep: (key: string) => void
  onInspect: (id: string) => void
  onInteract: () => void
  onSave: () => void
  onReread: () => void
  onEconomy: (action: EconomyAction) => void
  onCollection: (action: CollectionAction) => void
  onMode: (id: Aw2ModeId) => void
  canEnterRoomPractice: boolean
  onRoomPractice: (id: Aw2ModeId) => void
}
const titles = {
  practice: "Bàn luyện tập trong tiệm trà",
  recipe: "Công thức bên bàn trà",
  quest: "Nhật ký nhiệm vụ",
  party: "Đội đồng hành",
  bag: "Túi đồ và bếp",
  more: "Menu hành trình",
  places: "Địa điểm trong vùng",
  help: "Hướng dẫn và thông báo",
  atlas: "Bản đồ hành trình",
}

/** Opt-in v1.1 exploration UI. Existing controller owns every movement and save action. */
export function WorldGame(props: Props) {
  const { snapshot, world, panel, busy, canWalk, onPanel } = props
  const { pinned, journalMemory } = props
  useEffect(() => {
    document.documentElement.classList.add("aw2-game-document")
    return () => document.documentElement.classList.remove("aw2-game-document")
  }, [])
  const save = snapshot.status === "ready" ? snapshot.save : null
  const lifeClock = npcLifeClock(props.patrol?.lifeMs ?? 0)
  const nearby = canWalk
    ? interactionTarget(world, undefined, props.patrol)
    : undefined
  return (
    <main className="aw2-game-shell" data-testid="game-shell">
      <header className="aw2-game-header">
        <h1 ref={props.headingRef} tabIndex={-1} data-testid="zone-name">
          {sceneName(world)}
        </h1>
        <span data-testid="npc-life-clock" title="Đồng hồ trong game">
          {lifeClock.label}
        </span>
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
        <WalkingStatus target={props.walkTarget} onStop={props.onStopWalking} />
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
            <div className="aw2-game-interaction">
              {nearby && (
                <p
                  id="aw2-nearby-point"
                  role="status"
                  className="aw2-nearby-point"
                  data-testid="nearby-point"
                >
                  {placeKind(nearby)} · {nearby.name}
                </p>
              )}
              <button
                type="button"
                className="aw2-game-interact"
                aria-describedby={nearby ? "aw2-nearby-point" : undefined}
                data-aw2-world-control="interact"
                disabled={!canWalk || busy}
                onClick={props.onInteract}
              >
                E · Tương tác
              </button>
            </div>
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
        Vị trí {scenePosition(world).x.toFixed(0)},{" "}
        {scenePosition(world).y.toFixed(0)} · {scenePosition(world).facing}
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
              patrol={props.patrol}
              canWalk={canWalk}
              pinned={pinned}
              onPin={props.onPin}
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
          {panel === "recipe" && save && <RecipePanel economy={save.economy} />}
          {panel === "practice" && save && (
            <RoomPracticePanel
              busy={busy}
              canEnter={props.canEnterRoomPractice}
              error={props.error}
              onEnter={props.onRoomPractice}
              onReread={props.onReread}
            />
          )}
          {panel === "places" && save && (
            <GamePlacesPanel
              economy={save.economy}
              world={world}
              patrol={props.patrol}
              canWalk={canWalk}
              onWalk={props.onWalk}
              onInspect={props.onInspect}
            />
          )}
          {panel === "atlas" && save && (
            <JourneyOverview
              world={world}
              canWalk={canWalk}
              memory={props.overviewMemory}
              onWalk={props.onWalk}
            />
          )}
          {panel === "more" && (
            <div className="aw2-panel-stack aw2-game-more">
              <button
                type="button"
                disabled={!save}
                onClick={() => onPanel("atlas")}
              >
                Bản đồ hành trình
              </button>
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
