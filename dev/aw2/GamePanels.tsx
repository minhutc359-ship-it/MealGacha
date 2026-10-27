import { placeAffordance } from "../../src/aw2/world/placeAffordance"
import { PlaceCue } from "./PlaceCue"
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type KeyboardEvent,
} from "react"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { Aw2DevSave } from "../../src/aw2/save/schema"
import type { CollectionAction } from "../../src/aw2/collection/model"
import {
  ownedSpirits,
  RECRUIT_IDS,
  RECRUIT_QUESTS,
} from "../../src/aw2/collection/model"
import { ROSTER } from "../../src/aw2/world/ids"
import {
  questJournal,
  pageSlice,
  textPages,
} from "../../src/aw2/world/questJournal"
import { journeyDirections } from "../../src/aw2/world/journey"
import { describeObject, INTERACT_RANGE } from "../../src/aw2/world/rules"
import { zoneById } from "../../src/aw2/world/maps"
import { placeGuidance } from "../../src/aw2/world/placeGuidance"
import { scenePosition } from "../../src/aw2/world/scene"
import {
  worldObjects,
  type NpcPatrolState,
} from "../../src/aw2/world/npcPatrol"
import type { Waypoint } from "../../src/aw2/world/navigation"
import {
  canUseKitchen,
  ITEM_IDS,
  ITEM_NAMES,
  pendingQuestRewards,
  type EconomyAction,
  type Economy,
} from "../../src/aw2/economy/model"

interface FrameProps {
  title: string
  children: ReactNode
  busy: boolean
  onClose: () => void
}
export function trapPanelTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (node) =>
      node.getClientRects().length > 0 &&
      getComputedStyle(node).visibility !== "hidden",
  )
  event.preventDefault()
  if (!controls.length) return
  const index = controls.indexOf(document.activeElement as HTMLElement)
  const next =
    index < 0
      ? event.shiftKey
        ? controls.length - 1
        : 0
      : (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length
  controls[next].focus({ preventScroll: true })
}
export function PanelFrame({ title, children, busy, onClose }: FrameProps) {
  const dialog = useRef<HTMLDialogElement>(null),
    heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [title])
  useEffect(() => {
    const node = dialog.current!,
      opener = document.activeElement
    node.showModal()
    heading.current?.focus({ preventScroll: true })
    return () => {
      node.close()
      if (opener instanceof HTMLElement && opener.isConnected)
        opener.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className="aw2-game-panel"
      aria-labelledby="game-panel-title"
      data-testid="game-panel"
      onKeyDown={trapPanelTab}
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
    >
      <header>
        <h2 id="game-panel-title" ref={heading} tabIndex={-1}>
          {title}
        </h2>
        <button
          type="button"
          aria-label="Đóng menu"
          disabled={busy}
          onClick={onClose}
        >
          ✕
        </button>
      </header>
      <div className="aw2-panel-content">{children}</div>
    </dialog>
  )
}

interface PageProps {
  page: number
  pages: number
  onPage: (page: number) => void
  label?: string
  compact?: boolean
}
export function PageControls({
  page,
  pages,
  onPage,
  label = "Trang",
  compact = false,
}: PageProps) {
  const navigation = useRef<HTMLElement>(null),
    requestedBy = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    const button = requestedBy.current
    requestedBy.current = null
    if (button?.disabled)
      navigation.current
        ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
        ?.focus({ preventScroll: true })
  }, [page])
  return (
    <nav
      ref={navigation}
      className="aw2-page-controls"
      aria-label={`Phân trang ${label}`}
    >
      <button
        type="button"
        disabled={page === 0}
        aria-label={`${label} trước`}
        onClick={(event) => {
          requestedBy.current = event.currentTarget
          onPage(page - 1)
        }}
      >
        ‹ Trước
      </button>
      <span>
        {!compact && `${label} `}
        {page + 1}/{pages}
      </span>
      <button
        type="button"
        disabled={page + 1 === pages}
        aria-label={`${label} sau`}
        onClick={(event) => {
          requestedBy.current = event.currentTarget
          onPage(page + 1)
        }}
      >
        Sau ›
      </button>
    </nav>
  )
}

interface CopyProps {
  text: string
  limit?: number
  compact?: boolean
}
export function PagedCopy({ text, limit = 140, compact = false }: CopyProps) {
  const [page, setPage] = useState(0),
    view = pageSlice(textPages(text, limit), page, 1)
  useEffect(() => setPage(0), [text])
  return (
    <div className="aw2-paged-copy">
      <p>{view.items[0]}</p>
      {view.pages > 1 && (
        <PageControls
          page={view.page}
          pages={view.pages}
          onPage={setPage}
          label="Đoạn"
          compact={compact}
        />
      )}
    </div>
  )
}

const statuses = {
  locked: "Chưa mở",
  available: "Chưa nhận",
  active: "Đang thực hiện",
  ready_to_claim: "Đã đủ điều kiện",
  claimed: "Đã hoàn tất · đã nhận quà",
}
export interface QuestViewState {
  page: number
  tab: string
  destination: number
}
interface QuestPanelProps {
  memory: RefObject<QuestViewState>
  save: Aw2DevSave
  world: WorldProgress
  patrol?: Readonly<NpcPatrolState>
  canWalk: boolean
  pinned: boolean
  onPin: () => void
  onWalk: (point: Waypoint) => void
}
export function GameQuestPanel({
  memory,
  save,
  world,
  patrol,
  canWalk,
  pinned,
  onPin,
  onWalk,
}: QuestPanelProps) {
  const [page, setPage] = useState(memory.current.page),
    [tab, setTab] = useState(memory.current.tab),
    [destination, setDestination] = useState(memory.current.destination)
  useEffect(() => {
    memory.current = { page, tab, destination }
  }, [page, tab, destination, memory])
  const quests = questJournal(world, save.economy),
    view = pageSlice(quests, page, 1),
    quest = view.items[0]
  const directions = quest.current ? journeyDirections(world, patrol) : [],
    destinations = pageSlice(directions, destination, 1),
    direction = destinations.items[0]
  return (
    <div className="aw2-panel-stack" data-testid="quest-journal">
      <div className="aw2-panel-subtitle">
        <span>Cốt truyện</span>
        <span>{statuses[quest.status]}</span>
      </div>
      <h3 data-testid="journal-quest-title">{quest.title}</h3>
      <div
        role="group"
        aria-label="Nội dung nhiệm vụ"
        className="aw2-panel-tabs"
      >
        {[
          ["objective", "Mục tiêu"],
          ["directions", "Chỉ đường"],
          ["reward", "Phần thưởng"],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="aw2-panel-body">
        {tab === "objective" && (
          <>
            <PagedCopy key={quest.id} text={quest.objective} />
            {quest.current && (
              <button type="button" onClick={onPin} aria-pressed={pinned}>
                {pinned ? "Bỏ ghim mục tiêu" : "Ghim mục tiêu"}
              </button>
            )}
            {quest.status === "ready_to_claim" && (
              <p className="note">
                {quest.complete
                  ? "Phần thưởng chưa ghi: mở Túi để nhận quà nhiệm vụ."
                  : "Đến NPC và tự chọn thao tác để hoàn tất."}
              </p>
            )}
          </>
        )}
        {tab === "directions" &&
          (direction ? (
            <>
              <p>
                <strong>{direction.targetName}</strong>
              </p>
              <p className="note">
                {direction.zones.map((id) => zoneById(id).name).join(" → ")}
              </p>
              <button
                type="button"
                disabled={!canWalk}
                data-testid={`game-quest-walk-${direction.targetId}`}
                data-approach-x={direction.approach.x}
                data-approach-y={direction.approach.y}
                onClick={() =>
                  onWalk({ ...direction.approach, entityId: direction.next.id })
                }
              >
                Đi tới{" "}
                {direction.zones.length > 1 ? "cửa kế tiếp" : "gần mục tiêu"}
              </button>
              <p className="note">
                Tới nơi: E / Tương tác. Tự chọn Đi qua hoặc hành động.
              </p>
              {directions.length > 1 && (
                <PageControls
                  page={destinations.page}
                  pages={destinations.pages}
                  onPage={setDestination}
                  label="Điểm đến"
                />
              )}
            </>
          ) : (
            <p>
              {quest.complete
                ? "Nhiệm vụ đã hoàn tất."
                : "Mục tiêu sẽ có khi tới nhiệm vụ này."}
            </p>
          ))}
        {tab === "reward" && (
          <>
            <p>
              <strong>{quest.reward.xp} EXP cho đội</strong>
            </p>
            <div className="aw2-game-items">
              {(["rice", "herbs", "broth"] as const)
                .filter((id) => quest.reward[id] > 0)
                .map((id) => (
                  <p key={id}>
                    {ITEM_NAMES[id]}
                    <strong>+{quest.reward[id]}</strong>
                  </p>
                ))}
            </div>
            <p className="note">
              {quest.rewardClaimed
                ? "Biên nhận đã ghi; không nhận thêm."
                : "Thưởng do hành động nhiệm vụ ghi một lần."}
            </p>
          </>
        )}
      </div>
      <PageControls
        page={view.page}
        pages={view.pages}
        onPage={(p) => {
          setPage(p)
          setDestination(0)
        }}
        label="Nhiệm vụ"
      />
    </div>
  )
}

interface BagProps {
  save: Aw2DevSave
  world: WorldProgress
  busy: boolean
  onAction: (action: EconomyAction) => void
}
export function GameBagPanel({ save, world, busy, onAction }: BagProps) {
  const [tab, setTab] = useState("items"),
    kitchen = canUseKitchen(world),
    ingredients = (["rice", "herbs", "broth"] as const).every(
      (id) => save.economy.inventory[id] > 0,
    ),
    pending = pendingQuestRewards(save.economy, world)
  return (
    <div className="aw2-panel-stack" data-testid="game-bag">
      <div role="group" aria-label="Nội dung túi" className="aw2-panel-tabs">
        <button
          type="button"
          aria-pressed={tab === "items"}
          onClick={() => setTab("items")}
        >
          Nguyên liệu
        </button>
        <button
          type="button"
          aria-pressed={tab === "kitchen"}
          onClick={() => setTab("kitchen")}
        >
          Bếp
        </button>
      </div>
      {tab === "items" ? (
        <>
          <div className="aw2-game-items">
            {ITEM_IDS.map((id) => (
              <p key={id}>
                {ITEM_NAMES[id]}
                <strong data-testid={`game-item-${id}`}>
                  {save.economy.inventory[id]}
                </strong>
              </p>
            ))}
          </div>
          {pending > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction("claim-quests")}
            >
              Nhận quà {pending} nhiệm vụ đã hoàn tất
            </button>
          )}
        </>
      ) : (
        <>
          <p className="note">
            {kitchen
              ? "Bạn đang ở bếp. Một chén cần 1 gạo + 1 rau + 1 nước dùng."
              : world.questIndex < 3
                ? "Hoàn tất Mở lại bếp để nấu và chia bữa."
                : "Đến gần Dì hoặc ngọn lửa để nấu/chia bữa."}
          </p>
          <button
            type="button"
            disabled={busy || !kitchen || !ingredients}
            onClick={() => onAction("cook")}
          >
            Nấu Chén cơm ấm
          </button>
          <button
            type="button"
            disabled={
              busy || !kitchen || save.economy.inventory["warm-bowl"] < 1
            }
            onClick={() => onAction("share-meal")}
          >
            Chia bữa · +45 EXP
          </button>
        </>
      )}
    </div>
  )
}

interface PartyProps {
  save: Aw2DevSave
  busy: boolean
  onAction: (action: CollectionAction) => void
}
export function GamePartyPanel({ save, busy, onAction }: PartyProps) {
  const [tab, setTab] = useState("team"),
    [slot, setSlot] = useState(0),
    [unit, setUnit] = useState(0),
    [draft, setDraft] = useState([...save.progress.partyIds]),
    [emphasis, setEmphasis] = useState(save.collection.vanEmphasis)
  const owned = ownedSpirits(save.progress, save.collection),
    roster = pageSlice(ROSTER, unit, 1),
    spirit = roster.items[0]
  const changed =
    JSON.stringify(draft) !== JSON.stringify(save.progress.partyIds) ||
    emphasis !== save.collection.vanEmphasis
  const recruit = RECRUIT_IDS.find((id) => id === spirit.spiritId),
    gate = recruit ? RECRUIT_QUESTS[recruit] : 1
  return (
    <div className="aw2-panel-stack" data-testid="game-party">
      <div role="group" aria-label="Nội dung đội" className="aw2-panel-tabs">
        {[
          ["team", "Đội hình"],
          ["collection", "Bộ sưu tập"],
          ...(owned.includes("aw2-van") ? [["van", "Nhấn Vân"]] : []),
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "team" &&
        (draft.length === 5 ? (
          <>
            <p>
              Đại diện đã lưu:{" "}
              <strong>
                {
                  ROSTER.find((u) => u.spiritId === save.progress.partyIds[0])
                    ?.displayName
                }
              </strong>
            </p>
            <label>
              Vị trí đội {slot + 1}
              <select
                aria-label={`Vị trí đội ${slot + 1}`}
                value={draft[slot]}
                disabled={busy}
                onChange={(event) => {
                  const id = event.target.value as typeof draft[number]
                  if (!owned.includes(id)) return
                  setDraft((current) => {
                    const next = [...current],
                      other = next.indexOf(id)
                    if (other >= 0) next[other] = next[slot]
                    next[slot] = id
                    return next
                  })
                }}
              >
                {ROSTER.filter((u) => owned.includes(u.spiritId)).map((u) => (
                  <option key={u.spiritId} value={u.spiritId}>
                    {u.displayName}
                  </option>
                ))}
              </select>
            </label>
            <p className="note">
              {changed
                ? "Có thay đổi chưa lưu."
                : "Đội đã lưu; trên map chỉ có một đại diện."}
            </p>
            <div className="aw2-panel-tabs">
              <button
                type="button"
                disabled={busy || !changed}
                onClick={() => {
                  setDraft([...save.progress.partyIds])
                  setEmphasis(save.collection.vanEmphasis)
                }}
              >
                Hủy chọn đội
              </button>
              <button
                type="button"
                disabled={busy || !changed}
                onClick={() =>
                  onAction({
                    type: "team",
                    partyIds: draft,
                    vanEmphasis: emphasis,
                  })
                }
              >
                Lưu đội hình
              </button>
            </div>
            <PageControls
              page={slot}
              pages={5}
              onPage={setSlot}
              label="Vị trí"
            />
          </>
        ) : (
          <p>Nhận năm người bạn qua nhiệm vụ nhập môn.</p>
        ))}
      {tab === "collection" && (
        <>
          <h3>
            {spirit.displayName} · {spirit.rarity}
          </h3>
          <p>
            {spirit.recipeAffiliation} · {spirit.role}
          </p>
          <p>
            {owned.includes(spirit.spiritId)
              ? "Đã sở hữu"
              : `Mở sau nhiệm vụ ${gate}`}
          </p>
          {recruit && !owned.includes(recruit) && (
            <button
              type="button"
              disabled={busy || save.progress.questIndex < gate}
              onClick={() => onAction({ type: "recruit", spiritId: recruit })}
            >
              Mời {spirit.displayName}
            </button>
          )}
          <PageControls
            page={roster.page}
            pages={roster.pages}
            onPage={setUnit}
            label="Vị Linh"
          />
        </>
      )}
      {tab === "van" && (
        <>
          <p>Nhấn tuyệt kỹ cho trận tiếp theo</p>
          <select
            aria-label="Nhấn Vân"
            disabled={busy}
            value={emphasis}
            onChange={(e) =>
              setEmphasis(e.target.value === "attack" ? "attack" : "protection")
            }
          >
            <option value="protection">Bảo hộ</option>
            <option value="attack">Tấn công</option>
          </select>
          <button
            type="button"
            disabled={busy || !changed}
            onClick={() =>
              onAction({ type: "team", partyIds: draft, vanEmphasis: emphasis })
            }
          >
            Lưu đội hình
          </button>
        </>
      )}
    </div>
  )
}

interface PlacesProps {
  world: WorldProgress
  economy: Readonly<Economy>
  patrol?: Readonly<NpcPatrolState>
  canWalk: boolean
  onWalk: (point: Waypoint) => void
  onInspect: (id: string) => void
}
export function GamePlacesPanel({
  world,
  economy,
  patrol,
  canWalk,
  onWalk,
  onInspect,
}: PlacesProps) {
  const [page, setPage] = useState(0),
    view = pageSlice(worldObjects(world, patrol), page, 1),
    object = view.items[0]
  const { near, locked, kind, approach } = placeGuidance(world, object)
  const cue = placeAffordance(world, economy, object.id)
  return (
    <div
      className="aw2-panel-stack"
      data-testid="place-guidance"
      data-place-id={object.id}
    >
      <h3>{object.name}</h3>
      <p className="note" data-testid="place-context">
        {kind}
      </p>
      {cue && (
        <div className="aw2-place-explanation" data-testid="place-availability">
          <PlaceCue value={cue} />
          <p>{cue.detail}</p>
        </div>
      )}
      {!cue && (
        <p>
          {locked
            ? "Cửa chưa mở theo nhiệm vụ."
            : near
              ? "Đã ở gần. Xem tương tác hoặc tự E trên bản đồ."
              : "Đi bộ tới gần, sau đó tự tương tác."}
        </p>
      )}
      {near ? (
        <button
          type="button"
          disabled={!canWalk}
          onClick={() => onInspect(object.id)}
        >
          Xem tương tác
        </button>
      ) : (
        <button
          type="button"
          disabled={!canWalk || locked}
          data-approach-x={approach.x}
          data-approach-y={approach.y}
          onClick={() => onWalk(approach)}
        >
          Đi tới địa điểm
        </button>
      )}
      <PageControls
        page={view.page}
        pages={view.pages}
        onPage={setPage}
        label="Địa điểm"
      />
    </div>
  )
}
