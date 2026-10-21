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
  paused.current = !!dialogObject || !!activeEncounter

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
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const key = event.key.toLowerCase()
      if (
        [
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          "w",
          "a",
          "s",
          "d",
          "e",
        ].includes(key)
      ) {
        event.preventDefault()
        if (key === "e") {
          if (!event.repeat) openInteraction()
        } else if (!paused.current && !pending.current) {
          route.current = []
          keys.current.add(key)
        }
      }
    }
    const up = (event: KeyboardEvent) =>
      keys.current.delete(event.key.toLowerCase())
    const stop = () => {
      keys.current.clear()
      route.current = []
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
      document.removeEventListener("visibilitychange", stop)
      window.removeEventListener("storage", changed)
    }
  }, [])

  useEffect(() => {
    if (dialogObject) {
      dialog.current?.showModal()
      closeButton.current?.focus()
    } else dialog.current?.close()
  }, [dialogObject])

  function reread() {
    setMapEpoch(epoch => epoch + 1)
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

  async function persist(actionId?: string) {
    if (pending.current || saved.current.status === "unavailable") return
    pending.current = true
    setBusy(true)
    keys.current.clear()
    route.current = []
    setError("")
    setMessage("")
    try {
      if (actionId === "challenge" && saved.current.status === "ready") {
        const started = await store.beginBoss(
          saved.current.raw,
          worldRef.current,
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
        next.save.progress.bossDefeated
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
  const description = dialogObject ? describeObject(world, dialogObject) : null
  const nearby = nearestObject(world)
  return (
    <main className="aw2-save aw2-world">
      <p className="eyebrow">SOUL OF MEAL · RPG · BẢN PHÁT TRIỂN</p>
      <h1>Đường qua Phố Đèn Lồng</h1>
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
          <h2 data-testid="zone-name">{zoneById(world.zoneId).name}</h2>
          <WorldCanvas
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
          <p className="aw2-objective" data-testid="quest-objective">
            {currentObjective(world)}
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
              >
                {label}
              </button>
            ))}
            <button onClick={openInteraction} disabled={busy}>
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
              onClick={() => void persist(action.id)}
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
