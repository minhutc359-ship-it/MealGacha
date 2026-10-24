import type { CollectionAction } from "../../src/aw2/collection/model"
import { StrictMode, useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { Aw2DevSaveStore } from "../../src/aw2/save/store"
import type { SaveSnapshot } from "../../src/aw2/save/schema"
import { AW2_DEV_SAVE_KEY } from "../../src/aw2/save/schema"
import { ROSTER } from "../../src/aw2/world/ids"
import { newWorldProgress, type WorldProgress } from "../../src/aw2/world/model"
import { zoneById, type WorldObject } from "../../src/aw2/world/maps"
import {
  applyWorldAction,
  describeObject,
  moveWorld,
  nearestObject,
  questLabel,
  currentObjective,
} from "../../src/aw2/world/rules"
import type { WorldBossEncounter } from "../../src/aw2/world/encounter"
import { WorldBattle } from "./WorldBattle"
import { WorldCanvas } from "./WorldCanvas"
import { InventoryPanel } from "./InventoryPanel"
import { CHEST_RECEIPT, type EconomyAction } from "../../src/aw2/economy/model"
import { findWorldPath, type Waypoint } from "../../src/aw2/world/navigation"
import {
  AW2_MODES,
  modeForPortal,
  type Aw2ModeId,
  type ModeEntry,
} from "../../src/aw2/modes/catalog"
import { Aw2ModeAdapter, type ModeVisit } from "../../src/aw2/modes/session"
import { ModeLobby } from "./ModeLobby"
import { worldKeyAction } from "../../src/aw2/world/controls"
import { JourneyGuide } from "./JourneyGuide"
import { DemoCompletion } from "./DemoCompletion"
import { PlaytestFeedback } from "./PlaytestFeedback"
import "./styles.css"

interface ActiveWorldEncounter {
  run: WorldBossEncounter
  checkpointRaw: string
}

function WorldPreview() {
  const [store] = useState(() => new Aw2DevSaveStore())
  const [snapshot, setSnapshot] = useState<SaveSnapshot>(() => store.load())
  const [world, setWorld] = useState(() =>
    snapshot.status === "ready" ? snapshot.save.progress : newWorldProgress(),
  )
  const [dialogObject, setDialogObject] = useState<WorldObject | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [mapEpoch, setMapEpoch] = useState(0)
  const [activeEncounter, setActiveEncounter] =
    useState<ActiveWorldEncounter | null>(null)
  const [activeMode, setActiveMode] = useState<ModeVisit | null>(null)
  const battleActive = useRef(false)
  battleActive.current = !!activeEncounter
  const [modeAdapter] = useState(
    () => new Aw2ModeAdapter(store, () => !battleActive.current),
  )
  const worldHeading = useRef<HTMLHeadingElement>(null)
  const worldMap = useRef<HTMLDivElement>(null)
  const restoreModeFocus = useRef(false)
  const worldRef = useRef(world)
  const saved = useRef(snapshot)
  const keys = useRef(new Set<string>())
  const route = useRef<Waypoint[]>([])
  const pending = useRef(false)
  const paused = useRef(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  worldRef.current = world
  saved.current = snapshot
  paused.current = !!dialogObject || !!activeEncounter || !!activeMode

  function openInteraction() {
    route.current = []
    if (pending.current || paused.current || saved.current.status !== "ready")
      return
    keys.current.clear()
    route.current = []
    const object = nearestObject(worldRef.current)
    if (object) setDialogObject(object)
    else
      setMessage("Đến gần một người, đồ vật hoặc cửa rồi nhấn E / Tương tác.")
  }

  useEffect(() => {
    const isNativeControl = (target: EventTarget | null) =>
      target instanceof Element &&
      !target.closest("[data-aw2-world-control]") &&
      !!target.closest(
        "button, a, input, textarea, select, summary, dialog, [contenteditable]:not([contenteditable='false']), [role='textbox']",
      )
    const down = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      const action = worldKeyAction(event.key, {
        enabled:
          saved.current.status === "ready" &&
          !paused.current &&
          !pending.current,
        nativeControl: isNativeControl(event.target),
        modified: event.ctrlKey || event.metaKey || event.altKey,
        repeat: event.repeat,
      })
      if (!action) return
      event.preventDefault()
      if (action.type === "interact") openInteraction()
      else {
        route.current = []
        keys.current.add(action.key)
      }
    }
    const up = (event: KeyboardEvent) =>
      keys.current.delete(event.key.toLowerCase())
    const stop = () => {
      keys.current.clear()
      route.current = []
    }
    const focused = (event: FocusEvent) => {
      if (isNativeControl(event.target)) stop()
    }
    const timer = window.setInterval(() => {
      if (paused.current || pending.current || saved.current.status !== "ready")
        return
      const held = (a: string, b: string) =>
        Number(keys.current.has(a) || keys.current.has(b))
      const point = route.current[0]
      const distance = point
        ? Math.hypot(point.x - worldRef.current.x, point.y - worldRef.current.y)
        : 0
      const next = moveWorld(
        worldRef.current,
        point
          ? point.x - worldRef.current.x
          : held("d", "arrowright") - held("a", "arrowleft"),
        point
          ? point.y - worldRef.current.y
          : held("s", "arrowdown") - held("w", "arrowup"),
        point ? Math.min(0.033, distance / 140) : 0.033,
      )
      if (point && distance <= 140 * 0.033) route.current.shift()
      if (next !== worldRef.current) {
        worldRef.current = next
        setWorld(next)
      }
    }, 33)
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", stop)
    window.addEventListener("focusin", focused)
    document.addEventListener("visibilitychange", stop)
    const changed = (event: StorageEvent) => {
      if (event.key === AW2_DEV_SAVE_KEY || event.key === null) {
        stop()
        setError(
          "Kho AW2 đã thay đổi ở tab khác. Đọc lại trước khi tiếp tục lưu.",
        )
      }
    }
    window.addEventListener("storage", changed)
    return () => {
      clearInterval(timer)
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", stop)
      window.removeEventListener("focusin", focused)
      document.removeEventListener("visibilitychange", stop)
      window.removeEventListener("storage", changed)
    }
  }, [])

  useEffect(() => {
    if (dialogObject) {
      dialog.current?.showModal()
      closeButton.current?.focus()
    } else {
      const wasOpen = dialog.current?.open
      dialog.current?.close()
      if (wasOpen) worldMap.current?.focus({ preventScroll: true })
    }
  }, [dialogObject])

  useEffect(() => {
    if (!activeMode && restoreModeFocus.current) {
      restoreModeFocus.current = false
      worldHeading.current?.focus()
    }
  }, [activeMode])

  function reread() {
    if (pending.current) return
    restoreModeFocus.current = !!activeMode
    modeAdapter.abandon()
    setActiveMode(null)
    setMapEpoch((epoch) => epoch + 1)
    keys.current.clear()
    route.current = []
    setDialogObject(null)
    setActiveEncounter(null)
    const next = store.load()
    setSnapshot(next)
    saved.current = next
    if (next.status === "ready") {
      worldRef.current = next.save.progress
      setWorld(next.save.progress)
    } else {
      worldRef.current = newWorldProgress()
      setWorld(worldRef.current)
    }
    setMessage("Đã đọc lại AW2.")
    setError("")
  }

  async function enterMode(modeId: Aw2ModeId, entry: ModeEntry) {
    if (
      pending.current ||
      activeEncounter ||
      activeMode ||
      saved.current.status !== "ready"
    )
      return
    pending.current = true
    setBusy(true)
    keys.current.clear()
    route.current = []
    setError("")
    try {
      const started = await modeAdapter.enter(
        saved.current.raw,
        worldRef.current,
        modeId,
        entry,
      )
      setSnapshot(started.checkpoint)
      saved.current = started.checkpoint
      worldRef.current = started.checkpoint.save.progress
      setWorld(started.checkpoint.save.progress)
      setDialogObject(null)
      setActiveMode(started.visit)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chưa ghé được bàn.")
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  function returnFromMode() {
    try {
      const next = modeAdapter.returnToWorld()
      setSnapshot(next)
      saved.current = next
      worldRef.current = next.save.progress
      setWorld(next.save.progress)
      restoreModeFocus.current = true
      setActiveMode(null)
      setMessage("Đã trở về hành trình.")
      setError("")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Đọc lại hành trình để tiếp tục.",
      )
    }
  }

  async function persist(actionId?: string) {
    if (pending.current || saved.current.status === "unavailable") return
    pending.current = true
    setBusy(true)
    keys.current.clear()
    route.current = []
    setError("")
    setMessage("")
    try {
      if (
        (actionId === "challenge" || actionId === "rematch") &&
        saved.current.status === "ready"
      ) {
        const started = await store.beginBoss(
          saved.current.raw,
          worldRef.current,
          actionId === "rematch" ? "rematch" : "quest",
        )
        setSnapshot(started.snapshot)
        saved.current = started.snapshot
        worldRef.current = started.snapshot.save.progress
        setWorld(started.snapshot.save.progress)
        setDialogObject(null)
        setActiveEncounter({
          run: started.encounter,
          checkpointRaw: started.snapshot.raw,
        })
        return
      }
      const result =
        actionId && dialogObject
          ? applyWorldAction(worldRef.current, dialogObject.id, actionId)
          : { state: worldRef.current, message: "Đã lưu vị trí AW2." }
      const next =
        actionId && dialogObject && saved.current.status === "ready"
          ? await store.act(
              saved.current.raw,
              worldRef.current,
              dialogObject.id,
              actionId,
            )
          : await store.save(
              saved.current.raw,
              saved.current.status === "ready" ? result.state : undefined,
            )
      setSnapshot(next)
      saved.current = next
      worldRef.current = next.save.progress
      setWorld(next.save.progress)
      setDialogObject(null)
      setMessage(result.message)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Thao tác chưa hoàn tất.",
      )
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  async function transact(action: EconomyAction) {
    if (pending.current || saved.current.status !== "ready") return
    pending.current = true
    setBusy(true)
    keys.current.clear()
    route.current = []
    setError("")
    try {
      const next = await store.economyAction(
        saved.current.raw,
        worldRef.current,
        action,
      )
      setSnapshot(next)
      saved.current = next
      setWorld(next.save.progress)
      worldRef.current = next.save.progress
      setDialogObject(null)
      setMessage(
        {
          "claim-quests": "Đã nhận quà nhiệm vụ.",
          "open-chest": "Đã nhận nguyên liệu trong rương.",
          cook: "Đã nấu Chén cơm ấm.",
          "share-meal": "Bữa ăn được chia sẻ. Cả đội nhận 45 EXP.",
        }[action],
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chưa lưu được túi đồ.")
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  async function collect(action: CollectionAction) {
    if (pending.current || saved.current.status !== "ready") return
    pending.current = true
    setBusy(true)
    keys.current.clear()
    route.current = []
    setError("")
    try {
      const next = await store.collectionAction(
        saved.current.raw,
        worldRef.current,
        action,
      )
      saved.current = next
      setSnapshot(next)
      worldRef.current = next.save.progress
      setWorld(next.save.progress)
      setDialogObject(null)
      setMessage(
        action.type === "recruit"
          ? "Đã mời Vị Linh. Hãy chọn và lưu đội hình nếu muốn đồng hành."
          : "Đã lưu đội hình và nhấn tuyệt kỹ cho trận tiếp theo.",
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Chưa lưu được đội hình.",
      )
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  function navigate(point: Waypoint) {
    if (pending.current || paused.current || saved.current.status !== "ready")
      return
    keys.current.clear()
    route.current = findWorldPath(
      worldRef.current.zoneId,
      worldRef.current,
      point,
    )
    if (!route.current.length) setMessage("Chọn một điểm trên lối đi.")
  }
  async function finishEncounter() {
    if (!activeEncounter || pending.current) return
    pending.current = true
    setBusy(true)
    setError("")
    try {
      const next = await store.finishBoss(
        activeEncounter.checkpointRaw,
        activeEncounter.run,
      )
      setSnapshot(next)
      saved.current = next
      worldRef.current = next.save.progress
      setWorld(next.save.progress)
      setActiveEncounter(null)
      setMessage(
        activeEncounter.run.snapshot().purpose === "rematch"
          ? "Đã về Phòng Bàn sau lượt đấu lại. Không nhận thưởng; kết thúc, đội hình và tiến trình được giữ nguyên."
          : next.save.progress.bossDefeated
            ? "Đã lưu chiến thắng. Đọc ghi chép bên chén rồi trở về Bà Giữ Chỗ."
            : "Đã về Sân. Tiến trình được giữ, có thể thử lại.",
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Chưa lưu được kết quả.",
      )
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  if (activeEncounter)
    return (
      <WorldBattle
        encounter={activeEncounter.run}
        busy={busy}
        error={error}
        onFinish={() => void finishEncounter()}
        onReread={reread}
      />
    )
  if (activeMode)
    return (
      <ModeLobby
        visit={activeMode}
        error={error}
        onReturn={returnFromMode}
        onReread={reread}
      />
    )
  const description = dialogObject ? describeObject(world, dialogObject) : null
  const nearby = nearestObject(world)
  return (
    <main className="aw2-save aw2-world">
      <p className="eyebrow">SOUL OF MEAL · RPG · BẢN PHÁT TRIỂN</p>
      <h1 ref={worldHeading} tabIndex={-1}>
        Đường qua Phố Đèn Lồng
      </h1>
      <p>
        Chạm lên lối đi hoặc dùng WASD/mũi tên; E để tương tác. Cùng năm Vị Linh
        tìm lại một lời mời bên bếp.
      </p>
      <p>
        <a href="/dev/aw2/index.html">Kho save / xác nhận reset AW2</a> ·{" "}
        <a href="/dev/aw2/starters.html">Năm starter · xem bộ chuyển động</a>
      </p>
      {snapshot.status === "empty" ? (
        <button onClick={() => void persist()} disabled={busy}>
          Tạo bản lưu AW2
        </button>
      ) : snapshot.status !== "ready" ? (
        <p role="alert">
          Chưa mở được save ({snapshot.status}). Dữ liệu gốc được giữ; đọc lại
          hoặc mở kho save.
        </p>
      ) : (
        <>
          <DemoCompletion
            save={snapshot.save}
            busy={busy}
            onPractice={(mode) => void enterMode(mode, "quick-entry")}
          />
          <h2 data-testid="zone-name">{zoneById(world.zoneId).name}</h2>
          <nav className="actions aw2-mode-menu" aria-label="Ghé bàn nhanh">
            {AW2_MODES.map((mode) => (
              <button
                key={mode.id}
                disabled={busy}
                onClick={() => void enterMode(mode.id, "quick-entry")}
              >
                Ghé nhanh {mode.name}
              </button>
            ))}
          </nav>
          <JourneyGuide objective={currentObjective(world)} />
          <WorldCanvas
            focusRef={worldMap}
            key={`${snapshot.save.saveId}:${mapEpoch}`}
            world={world}
            onNavigate={navigate}
            paused={busy || !!dialogObject}
          />
          <p data-testid="player-position">
            Vị trí {world.x.toFixed(0)}, {world.y.toFixed(0)} · {world.facing}
          </p>
          <p data-testid="quest-status">
            Nhiệm vụ: {questLabel(world)} ·{" "}
            {world.questIndex === 4
              ? "Đã hoàn tất"
              : world.accepted
                ? "Đang nhận"
                : "Chưa nhận"}
            ; ký ức {world.memories.length}/3; puzzle {world.puzzleStep}/3
          </p>
          {world.questIndex >= 3 && (
            <p data-testid="boss-objectives">
              Thử thách: {world.bossDefeated ? "Đã thắng" : "Chưa thắng"} · Ghi
              chép: {world.tableNoteRead ? "Đã đọc" : "Chưa đọc"}
            </p>
          )}
          <p data-testid="party">
            Đội ({world.partyIds.length}/5):{" "}
            {world.partyIds
              .map(
                (id) =>
                  ROSTER.find((spirit) => spirit.spiritId === id)!.displayName,
              )
              .join(", ") || "Nhận sau nhập môn"}
          </p>
          <div className="actions" aria-label="Điều khiển di chuyển">
            {[
              ["w", "↑ Lên"],
              ["a", "← Trái"],
              ["s", "↓ Xuống"],
              ["d", "→ Phải"],
            ].map(([key, label]) => (
              <button
                key={key}
                data-aw2-world-control="move"
                disabled={busy}
                style={{ touchAction: "none" }}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId)
                  route.current = []
                  keys.current.add(key)
                }}
                onPointerUp={() => keys.current.delete(key)}
                onPointerCancel={() => keys.current.delete(key)}
                onLostPointerCapture={() => keys.current.delete(key)}
                onClick={(event) => {
                  if (event.detail !== 0 || pending.current || paused.current)
                    return
                  route.current = []
                  const next = moveWorld(
                    worldRef.current,
                    key === "d" ? 1 : key === "a" ? -1 : 0,
                    key === "s" ? 1 : key === "w" ? -1 : 0,
                    0.05,
                  )
                  worldRef.current = next
                  setWorld(next)
                }}
              >
                {label}
              </button>
            ))}
            <button
              data-aw2-world-control="interact"
              onClick={openInteraction}
              disabled={busy}
            >
              Tương tác{nearby ? ` · ${nearby.name}` : ""}
            </button>
            <button onClick={() => void persist()} disabled={busy}>
              Lưu vị trí
            </button>
          </div>
          <details className="aw2-bag-panel">
            <summary>
              Đội và túi đồ · {snapshot.save.economy.teamExperience} EXP
            </summary>
            <InventoryPanel
              save={snapshot.save}
              world={world}
              busy={busy}
              onAction={(action) => void transact(action)}
              onCollectionAction={(action) => void collect(action)}
            />
          </details>
        </>
      )}
      <div className="actions">
        <button onClick={reread} disabled={busy}>
          Đọc lại
        </button>
      </div>
      <p role="status">{busy ? "Đang lưu…" : message}</p>
      {error && <p role="alert">{error}</p>}
      <PlaytestFeedback snapshot={snapshot} busy={busy} />
      <dialog
        ref={dialog}
        aria-labelledby="interaction-title"
        onCancel={(event) => {
          event.preventDefault()
          if (!pending.current) setDialogObject(null)
        }}
      >
        <h2 id="interaction-title">{description?.title}</h2>
        <p>{description?.text}</p>
        <div className="actions">
          <button
            ref={closeButton}
            onClick={() => setDialogObject(null)}
            disabled={busy}
          >
            Để sau / Đóng
          </button>
          {dialogObject?.kind === "chest" && snapshot.status === "ready" && (
            <button
              disabled={
                busy || snapshot.save.economy.receipts.includes(CHEST_RECEIPT)
              }
              onClick={() => void transact("open-chest")}
            >
              {snapshot.save.economy.receipts.includes(CHEST_RECEIPT)
                ? "Đã nhận rương"
                : "Mở rương nguyên liệu"}
            </button>
          )}
          {description?.actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                const mode = dialogObject && modeForPortal(dialogObject.id)
                if (action.id === "visit-mode" && mode)
                  void enterMode(mode.id, "portal")
                else void persist(action.id)
              }}
              disabled={busy}
            >
              {action.label}
            </button>
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
      </dialog>
    </main>
  )
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WorldPreview />
  </StrictMode>,
)
