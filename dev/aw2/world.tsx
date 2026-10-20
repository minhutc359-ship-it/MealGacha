import { StrictMode, useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import type { Application } from "pixi.js"
import { Aw2DevSaveStore } from "../../src/aw2/save/store"
import type { SaveSnapshot } from "../../src/aw2/save/schema"
import { AW2_DEV_SAVE_KEY } from "../../src/aw2/save/schema"
import { ROSTER } from "../../src/aw2/world/ids"
import { newWorldProgress, type WorldProgress } from "../../src/aw2/world/model"
import { zoneById, type WorldObject } from "../../src/aw2/world/maps"
import { applyWorldAction, completedReceipts, describeObject, moveWorld, nearestObject, questLabel } from "../../src/aw2/world/rules"
import "./styles.css"

function WorldCanvas({ world }: { world: WorldProgress }) {
  const host = useRef<HTMLDivElement>(null)
  const position = useRef(world)
  position.current = world
  const [error, setError] = useState("")
  useEffect(() => {
    let disposed = false
    let app: Application | undefined
    void (async () => {
      try {
        const { Application, Graphics } = await import("pixi.js")
        const next = new Application()
        await next.init({ width: 640, height: 384, background: 0x203c35, antialias: false, preference: "webgl" })
        if (disposed) { next.destroy(true); return }
        app = next
        const terrain = new Graphics().rect(8, 8, 624, 368).stroke({ width: 3, color: 0x839c84 })
        for (const wall of zoneById(world.zoneId).walls) terrain.rect(wall.x, wall.y, wall.width, wall.height).fill(0x718878)
        for (const object of zoneById(world.zoneId).objects) terrain.circle(object.x, object.y, object.kind === "exit" ? 15 : 10).fill(object.kind === "exit" ? 0xe8ce8c : object.kind === "boss" ? 0xb46b62 : 0x96b9c6)
        const player = new Graphics().circle(0, 0, 8).fill(0xfff2bd).stroke({ width: 2, color: 0x111c17 })
        next.stage.addChild(terrain, player)
        next.ticker.add(() => player.position.set(position.current.x, position.current.y))
        next.canvas.setAttribute("aria-hidden", "true")
        host.current?.replaceChildren(next.canvas)
      } catch (cause) {
        if (!disposed) setError(cause instanceof Error ? cause.message : "Chưa tạo được canvas.")
      }
    })()
    return () => { disposed = true; app?.destroy(true, { children: true }) }
  }, [world.zoneId])
  return <div className="aw2-world-map">
    <div ref={host} />
    {zoneById(world.zoneId).objects.map(object => <span key={object.id} className="aw2-world-label" style={{ left: `${Math.max(12, Math.min(88, object.x / 6.4))}%`, top: `${object.y / 3.84}%` }}>{object.name}</span>)}
    {error && <p role="alert">Canvas: {error}</p>}
  </div>
}

function WorldPreview() {
  const [store] = useState(() => new Aw2DevSaveStore())
  const [snapshot, setSnapshot] = useState<SaveSnapshot>(() => store.load())
  const [world, setWorld] = useState(() => snapshot.status === "ready" ? snapshot.save.progress : newWorldProgress())
  const [dialogObject, setDialogObject] = useState<WorldObject | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const worldRef = useRef(world)
  const saved = useRef(snapshot)
  const keys = useRef(new Set<string>())
  const pending = useRef(false)
  const paused = useRef(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  worldRef.current = world
  saved.current = snapshot
  paused.current = !!dialogObject

  function openInteraction() {
    if (pending.current || paused.current || saved.current.status !== "ready") return
    keys.current.clear()
    const object = nearestObject(worldRef.current)
    if (object) setDialogObject(object)
    else setMessage("Đến gần một người, đồ vật hoặc cửa rồi nhấn E / Tương tác.")
  }

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const key = event.key.toLowerCase()
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e"].includes(key)) {
        event.preventDefault()
        if (key === "e") { if (!event.repeat) openInteraction() }
        else if (!paused.current && !pending.current) keys.current.add(key)
      }
    }
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase())
    const stop = () => keys.current.clear()
    const timer = window.setInterval(() => {
      if (paused.current || pending.current || saved.current.status !== "ready") return
      const held = (a: string, b: string) => Number(keys.current.has(a) || keys.current.has(b))
      const next = moveWorld(worldRef.current, held("d", "arrowright") - held("a", "arrowleft"), held("s", "arrowdown") - held("w", "arrowup"), 0.033)
      if (next !== worldRef.current) { worldRef.current = next; setWorld(next) }
    }, 33)
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", stop)
    document.addEventListener("visibilitychange", stop)
    const changed = (event: StorageEvent) => {
      if (event.key === AW2_DEV_SAVE_KEY || event.key === null) { stop(); setError("Kho AW2 đã thay đổi ở tab khác. Đọc lại trước khi tiếp tục lưu.") }
    }
    window.addEventListener("storage", changed)
    return () => {
      clearInterval(timer); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", stop)
      document.removeEventListener("visibilitychange", stop); window.removeEventListener("storage", changed)
    }
  }, [])

  useEffect(() => {
    if (dialogObject) { dialog.current?.showModal(); closeButton.current?.focus() }
    else dialog.current?.close()
  }, [dialogObject])

  function reread() {
    keys.current.clear(); setDialogObject(null)
    const next = store.load()
    setSnapshot(next)
    if (next.status === "ready") { worldRef.current = next.save.progress; setWorld(next.save.progress) }
    setMessage("Đã đọc lại AW2."); setError("")
  }

  async function persist(actionId?: string) {
    if (pending.current || saved.current.status === "unavailable") return
    pending.current = true; setBusy(true); keys.current.clear(); setError(""); setMessage("")
    try {
      const result = actionId && dialogObject ? applyWorldAction(worldRef.current, dialogObject.id, actionId) : { state: worldRef.current, message: "Đã lưu vị trí AW2." }
      const next = await store.save(saved.current.raw, saved.current.status === "ready" ? result.state : undefined)
      setSnapshot(next); worldRef.current = next.save.progress; setWorld(next.save.progress)
      setDialogObject(null); setMessage(result.message)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Thao tác chưa hoàn tất.") }
    finally { pending.current = false; setBusy(false) }
  }
  const description = dialogObject ? describeObject(world, dialogObject) : null
  const nearby = nearestObject(world)
  return <main className="aw2-save aw2-world">
    <p className="eyebrow">AW2-006A · DEVELOPMENT</p><h1>Đường qua Phố Đèn Lồng</h1>
    <p>World thử nghiệm · hình khối debug, chưa có model/art nhân vật. Di chuyển WASD/mũi tên; E tương tác. Vị trí được lưu khi chọn Lưu hoặc xác nhận tương tác.</p>
    <p><a href="/dev/aw2/index.html">Kho save / xác nhận reset AW2</a></p>
    {snapshot.status === "empty" ? <button onClick={() => void persist()} disabled={busy}>Tạo bản lưu AW2</button> : snapshot.status !== "ready" ? <p role="alert">Chưa mở được save ({snapshot.status}). Dữ liệu gốc được giữ; đọc lại hoặc mở kho save.</p> : <>
      <h2 data-testid="zone-name">{zoneById(world.zoneId).name}</h2>
      <WorldCanvas world={world} />
      <p data-testid="player-position">Vị trí {world.x.toFixed(0)}, {world.y.toFixed(0)} · {world.facing}</p>
      <p data-testid="quest-status">Nhiệm vụ: {questLabel(world)} · {world.accepted ? "Đang nhận" : "Chưa nhận"}; ký ức {world.memories.length}/3; puzzle {world.puzzleStep}/3</p>
      <p data-testid="party">Đội ({world.partyIds.length}/5): {world.partyIds.map(id => ROSTER.find(spirit => spirit.spiritId === id)!.displayName).join(", ") || "Nhận sau nhập môn"}</p>
      <p>Quest receipts: {completedReceipts(world).join(", ") || "Chưa có"}. Chưa cấp XP/vật phẩm khi chưa có economy contract.</p>
      <div className="actions" aria-label="Điều khiển di chuyển">
        {[["w", "↑ Lên"], ["a", "← Trái"], ["s", "↓ Xuống"], ["d", "→ Phải"]].map(([key, label]) => <button key={key} disabled={busy} style={{ touchAction: "none" }} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); keys.current.add(key) }} onPointerUp={() => keys.current.delete(key)} onPointerCancel={() => keys.current.delete(key)} onLostPointerCapture={() => keys.current.delete(key)}>{label}</button>)}
        <button onClick={openInteraction} disabled={busy}>Tương tác{nearby ? ` · ${nearby.name}` : ""}</button>
        <button onClick={() => void persist()} disabled={busy}>Lưu vị trí</button>
      </div>
    </>}
    <div className="actions"><button onClick={reread} disabled={busy}>Đọc lại</button></div>
    <p role="status">{busy ? "Đang lưu…" : message}</p>{error && <p role="alert">{error}</p>}
    <dialog ref={dialog} aria-labelledby="interaction-title" onCancel={event => { event.preventDefault(); if (!pending.current) setDialogObject(null) }}>
      <h2 id="interaction-title">{description?.title}</h2><p>{description?.text}</p>
      <div className="actions"><button ref={closeButton} onClick={() => setDialogObject(null)} disabled={busy}>Để sau / Đóng</button>{description?.actions.map(action => <button key={action.id} onClick={() => void persist(action.id)} disabled={busy}>{action.label}</button>)}</div>
      {error && <p role="alert">{error}</p>}
    </dialog>
  </main>
}
createRoot(document.getElementById("root")!).render(<StrictMode><WorldPreview /></StrictMode>)
