import { useEffect, useMemo, useRef, useState } from "react"
import type { TimelinePost } from "../../domain/models"
import { getDateKey } from "../../domain/dateKey"
import { getUnlockedDishIds } from "../../domain/achievements"
import { deleteImage, getImage, savePhoto } from "../../infrastructure/storage/imageRepository"
import { FoodImage } from "../food/FoodImage"
import { useAppStore } from "../../store/useAppStore"

function Photo({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let current = true
    let objectUrl: string | null = null
    getImage(id).then((image) => {
      if (current && image) { objectUrl = URL.createObjectURL(image.thumbnail || image.blob); setUrl(objectUrl) }
    }).catch(() => undefined)
    return () => { current = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [id])
  return url ? <img className="timeline-photo" src={url} alt="Ảnh check-in" loading="lazy" /> : <div className="timeline-photo-missing">Không tìm thấy ảnh</div>
}

function dateLabel(key: string) {
  if (key === getDateKey()) return "Hôm nay"
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  if (key === getDateKey(yesterday)) return "Hôm qua"
  return key.split("-").reverse().join("/")
}

export function Timeline({ initialDishId }: { initialDishId?: string }) {
  const user = useAppStore((state) => state.user)
  const dishes = useAppStore((state) => state.dishes)
  const savePost = useAppStore((state) => state.saveTimelinePost)
  const deletePost = useAppStore((state) => state.deleteTimelinePost)
  const showToast = useAppStore((state) => state.showToast)
  const [editing, setEditing] = useState<TimelinePost | "new" | null>(initialDishId ? "new" : null)
  const [dishId, setDishId] = useState(initialDishId || "")
  const [query, setQuery] = useState("")
  const [note, setNote] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [imageId, setImageId] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])
  const unlocked = useMemo(() => getUnlockedDishIds(user.rewards), [user.rewards])
  const options = useMemo(() => dishes.filter((dish) => dish.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => Number(unlocked.has(b.id)) - Number(unlocked.has(a.id))).slice(0, 30), [dishes, query, unlocked])
  const grouped = useMemo(() => {
    const groups = new Map<string, TimelinePost[]>()
    for (const post of [...user.timelinePosts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
      const key = getDateKey(new Date(post.createdAt))
      groups.set(key, [...(groups.get(key) || []), post])
    }
    return groups
  }, [user.timelinePosts])

  const startEdit = (post: TimelinePost) => { setEditing(post); setDishId(post.dishId); setNote(post.note || ""); setImageId(post.imageId); setFile(null) }
  const reset = () => { setEditing(null); setDishId(""); setNote(""); setImageId(undefined); setFile(null); setQuery("") }
  const save = async () => {
    if (!dishId || saving) return
    setSaving(true)
    let nextImageId: string | undefined
    try {
      nextImageId = file ? await savePhoto(file) : imageId
      const now = new Date().toISOString()
      const post: TimelinePost = { id: editing !== "new" && editing ? editing.id : crypto.randomUUID(), dishId, note: note.trim().slice(0, 2000) || undefined, imageId: nextImageId, createdAt: editing !== "new" && editing ? editing.createdAt : now, updatedAt: now }
      savePost(post)
      if (editing !== "new" && editing?.imageId && editing.imageId !== nextImageId && !user.timelinePosts.some((item) => item.id !== editing.id && item.imageId === editing.imageId)) await deleteImage(editing.imageId).catch(() => undefined)
      reset()
      showToast("Đã lưu check-in trên thiết bị của bạn.", "success")
    } catch (err) { if (nextImageId && nextImageId !== imageId) await deleteImage(nextImageId).catch(() => undefined); showToast((err as Error).message, "error") }
    finally { setSaving(false) }
  }
  return <div className="timeline-page">
    <div className="timeline-heading"><div><h2>Dòng thời gian</h2><p>Nhật ký ăn uống của riêng bạn, lưu trên thiết bị này.</p></div><button onClick={() => { reset(); setEditing("new") }}>+ Check-in món ăn</button></div>
    {editing && <section className="timeline-editor">
      <div className="timeline-editor-heading"><strong>{editing === "new" ? "Check-in món ăn" : "Sửa check-in"}</strong><button onClick={reset} aria-label="Đóng">×</button></div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm món ăn..." aria-label="Tìm món ăn" />
      <select value={dishId} onChange={(event) => setDishId(event.target.value)} aria-label="Chọn món ăn"><option value="">Chọn món ăn</option>{options.map((dish) => <option key={dish.id} value={dish.id}>{unlocked.has(dish.id) ? "✓ " : ""}{dish.name}</option>)}{dishId && !options.some((item) => item.id === dishId) && <option value={dishId}>{dishes.find((item) => item.id === dishId)?.name || dishId}</option>}</select>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={2000} placeholder="Món này thế nào? Lưu lại cảm nhận của bạn..." />
      <div className="timeline-image-actions"><button onClick={() => cameraRef.current?.click()}>📷 Chụp ảnh</button><button onClick={() => galleryRef.current?.click()}>🖼 Chọn ảnh</button>{(file || imageId) && <button onClick={() => { setFile(null); setImageId(undefined) }}>Bỏ ảnh</button>}</div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(event) => setFile(event.target.files?.[0] || null)} /><input ref={galleryRef} type="file" accept="image/*" hidden onChange={(event) => setFile(event.target.files?.[0] || null)} />
      {previewUrl ? <img className="timeline-preview" src={previewUrl} alt="Xem trước ảnh" /> : imageId && <Photo id={imageId} />}
      <div className="timeline-editor-actions"><button disabled={!dishId || saving} onClick={save}>{saving ? "Đang lưu..." : "Lưu check-in"}</button><button onClick={reset}>Hủy</button></div>
    </section>}
    {grouped.size === 0 && !editing && <div className="timeline-empty">Chưa có check-in. Chọn một món bạn đã thử và lưu lại khoảnh khắc đầu tiên.</div>}
    {[...grouped].map(([day, posts]) => <section className="timeline-group" key={day}><h3>{dateLabel(day)}</h3>{posts.map((post) => { const dish = dishes.find((item) => item.id === post.dishId); const snapshot = user.rewards.find((item) => item.dishId === post.dishId)?.dish; return <article className="timeline-post" key={post.id}>
      <header><FoodImage dishId={post.dishId} name={dish?.name || snapshot?.name || post.dishId} variant="thumb" /><div><strong>{dish?.name || snapshot?.name || post.dishId}</strong><small>{new Date(post.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</small></div><div className="timeline-post-actions"><button onClick={() => startEdit(post)}>Sửa</button><button onClick={() => { if (window.confirm("Xóa check-in này?")) void deletePost(post.id) }}>Xóa</button></div></header>
      {post.imageId && <Photo id={post.imageId} />}{post.note && <p>{post.note}</p>}
    </article> })}</section>)}
  </div>
}
