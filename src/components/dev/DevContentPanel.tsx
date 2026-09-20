import { useState } from "react"
import type { Dish, MealSlot, RewardRarity } from "../../domain/models"
import { MEAL_SLOT_ICONS } from "../../domain/models"
import { EVENTS, LOCAL_EVENTS, type LocalLimitedEvent } from "../../domain/events"
import { BANNER_CONFIG, type BannerConfig } from "../../infrastructure/banner/bannerConfig"
import localDishes from "../../infrastructure/catalog/localDishes.json"
import { repository } from "../../infrastructure/storage/repository"
import { convertImageToWebp } from "../../infrastructure/assets/imageProcessing"
import { RarityFrame, RARITY_LABELS } from "../ui/RarityFrame"
import { useAppStore } from "../../store/useAppStore"

type DishDraft = Omit<Dish, "tags" | "rarity" | "category" | "description" | "imageUrl" | "limitedEventId" | "type"> & {
  tags: string
  rarity: RewardRarity
  category: string
  description: string
  imageUrl: string
  limitedEventId: string
  type: "normal" | "limited"
  imageData?: string
}

const meals: MealSlot[] = ["breakfast", "lunch", "dinner"]
const rarityWeight: Record<RewardRarity, number> = { common: 100, rare: 55, epic: 25, diamond: 8 }
const priceByRarity: Record<RewardRarity, 1 | 2 | 3 | 4> = { common: 1, rare: 2, epic: 3, diamond: 4 }

function emptyDish(): DishDraft {
  return { id: "", name: "", searchQuery: "", mealSlots: ["lunch"], category: "", description: "", imageUrl: "", tags: "", weight: 100, rarity: "common", priceTier: 1, active: true, type: "normal", limitedEventId: "" }
}

function toDraft(dish: Dish): DishDraft {
  return { ...dish, category: dish.category ?? "", description: dish.description ?? "", imageUrl: dish.imageUrl ?? "", tags: dish.tags.join(", "), rarity: dish.rarity ?? "common", type: dish.type === "limited" ? "limited" : "normal", limitedEventId: dish.limitedEventId ?? "" }
}

async function request(path: string, method: "POST" | "PUT" | "DELETE", payload: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`/__meal-gacha/dev/${path}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
  const result = await response.json() as Record<string, unknown>
  if (!response.ok) throw new Error(String(result.error ?? "Không thể ghi dữ liệu vào source."))
  return result
}

function DevField({ label, value, onChange, placeholder, disabled }: { label: string; value: string | number; onChange(value: string): void; placeholder?: string; disabled?: boolean }) {
  return <label className="local-dish-field"><span>{label}</span><input value={value} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} /></label>
}

export function DevContentPanel() {
  const dishes = useAppStore((state) => state.dishes)
  const showToast = useAppStore((state) => state.showToast)
  const [draft, setDraft] = useState<DishDraft>(emptyDish)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [events, setEvents] = useState<LocalLimitedEvent[]>(LOCAL_EVENTS)
  const [newEvent, setNewEvent] = useState<LocalLimitedEvent>({ id: "", title: "", startsAt: "", endsAt: "" })
  const [banner, setBanner] = useState<BannerConfig>(() => repository.loadBannerOverride() ?? BANNER_CONFIG)
  const [bannerData, setBannerData] = useState("")
  const [dishSearch, setDishSearch] = useState("")
  const eventChoices = [...events.map((event) => ({ id: event.id, title: event.title })), ...EVENTS.map((event) => ({ id: event.id, title: event.name.vi }))]

  const updateDish = <K extends keyof DishDraft>(field: K, value: DishDraft[K]) => setDraft((current) => ({ ...current, [field]: value }))
  const updateEvent = (id: string, field: "title" | "startsAt" | "endsAt", value: string) => setEvents((current) => current.map((event) => event.id === id ? { ...event, [field]: value } : event))

  const uploadDish = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const imageData = await convertImageToWebp(file)
      setDraft((current) => ({ ...current, imageData, imageUrl: `/assets/food/full/${current.id}.webp` }))
    } catch { showToast("Không thể chuyển ảnh sang WebP.", "error") }
    finally { setBusy(false) }
  }

  const saveDish = async () => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.id) || !draft.name.trim() || !draft.mealSlots.length || (draft.type === "limited" && !draft.limitedEventId)) {
      showToast("Nhập ID hợp lệ, tên, bữa ăn và sự kiện cho món giới hạn.", "error")
      return
    }
    if (!editing && dishes.some((dish) => dish.id === draft.id)) { showToast("ID món đã có trong catalog.", "error"); return }
    setBusy(true)
    try {
      await request("dish", editing ? "PUT" : "POST", { ...draft, name: draft.name.trim(), searchQuery: draft.searchQuery.trim() || draft.name.trim(), tags: draft.tags.split(",").map((item) => item.trim()).filter(Boolean), category: draft.category.trim() || undefined, description: draft.description.trim() || undefined, imageUrl: draft.imageUrl.trim() || undefined, limitedEventId: draft.type === "limited" ? draft.limitedEventId : undefined })
      showToast(editing ? "Đã sửa món trong source." : "Đã thêm món vào source.", "success")
      window.setTimeout(() => window.location.reload(), 350)
    } catch (error) { showToast((error as Error).message, "error") }
    finally { setBusy(false) }
  }

  const deleteDish = async (dish: Dish) => {
    if (!window.confirm(`Xóa món local “${dish.name}” khỏi source? Phần thưởng đã mở vẫn được giữ trong hồ sơ.`)) return
    setBusy(true)
    try {
      await request("dish", "DELETE", { id: dish.id })
      showToast("Đã xóa món local.", "success")
      window.setTimeout(() => window.location.reload(), 350)
    } catch (error) { showToast((error as Error).message, "error") }
    finally { setBusy(false) }
  }

  const saveEvents = async (next = events) => {
    setBusy(true)
    try {
      await request("events", "POST", next)
      showToast("Đã lưu sự kiện giới hạn.", "success")
      window.setTimeout(() => window.location.reload(), 350)
    } catch (error) { showToast((error as Error).message, "error") }
    finally { setBusy(false) }
  }

  const addEvent = () => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newEvent.id) || events.some((event) => event.id === newEvent.id) || EVENTS.some((event) => event.id === newEvent.id)) {
      showToast("ID sự kiện không hợp lệ hoặc đã tồn tại.", "error")
      return
    }
    void saveEvents([...events, newEvent])
  }

  const deleteEvent = (event: LocalLimitedEvent) => {
    if (dishes.some((dish) => dish.limitedEventId === event.id)) { showToast("Xóa hoặc chuyển các món thuộc sự kiện trước.", "error"); return }
    if (window.confirm(`Xóa sự kiện “${event.title}”?`)) void saveEvents(events.filter((item) => item.id !== event.id))
  }

  const uploadBanner = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { const data = String(reader.result); setBannerData(data); setBanner((current) => ({ ...current, id: `local-${Date.now()}`, imageUrl: data, enabled: true })) }
    reader.readAsDataURL(file)
  }

  const saveBanner = async () => {
    if (!banner.imageUrl) { showToast("Chọn ảnh banner trước khi lưu.", "error"); return }
    setBusy(true)
    try {
      const result = await request("banner", "POST", { ...banner, imageUrl: bannerData ? undefined : banner.imageUrl, imageData: bannerData || undefined })
      repository.saveBannerOverride({ ...banner, imageUrl: String(result.imageUrl) })
      showToast("Đã lưu banner vào source.", "success")
      window.setTimeout(() => window.location.reload(), 350)
    } catch (error) { showToast((error as Error).message, "error") }
    finally { setBusy(false) }
  }

  const clearBanner = async () => {
    if (!window.confirm("Tắt popup banner thông báo trong source?")) return
    setBusy(true)
    try {
      await request("banner", "DELETE", {})
      repository.clearBannerOverride()
      showToast("Đã tắt banner thông báo.", "success")
      window.setTimeout(() => window.location.reload(), 350)
    } catch (error) { showToast((error as Error).message, "error") }
    finally { setBusy(false) }
  }

  return <div className="dev-content-panel">
    <section className="dev-content-section"><header><small>DEV ONLY</small><h2>Banner thông báo</h2><p>Ghi cấu hình và ảnh vào source để xem thử trước khi commit.</p></header>
      <div className="local-banner-settings">
        {banner.imageUrl && <img src={banner.imageUrl} alt="Xem trước banner" />}
        <label className="local-dish-upload"><span>Chọn ảnh mới</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { uploadBanner(event.target.files?.[0]); event.target.value = "" }} /></label>
        <label className="local-dish-active"><input type="checkbox" checked={banner.enabled} onChange={(event) => setBanner({ ...banner, enabled: event.target.checked })} /> Hiển thị popup thông báo</label>
        <label className="local-dish-field"><span>Gắn với sự kiện</span><select value={banner.eventId ?? ""} onChange={(event) => setBanner({ ...banner, eventId: event.target.value || undefined })}><option value="">Không gắn sự kiện</option>{eventChoices.map((event) => <option value={event.id} key={event.id}>{event.title}</option>)}</select></label>
        <div className="local-dish-grid"><DevField label="Từ (ISO, tuỳ chọn)" value={banner.startsAt ?? ""} onChange={(value) => setBanner({ ...banner, startsAt: value || undefined })} /><DevField label="Đến (ISO, tuỳ chọn)" value={banner.endsAt ?? ""} onChange={(value) => setBanner({ ...banner, endsAt: value || undefined })} /></div>
        <div className="dev-actions"><button disabled={busy} onClick={saveBanner} className="local-dish-submit">Lưu banner</button><button disabled={busy} onClick={clearBanner} className="local-banner-clear">Tắt banner</button></div>
      </div>
    </section>

    <section className="dev-content-section"><header><small>LOCAL EVENTS</small><h2>Sự kiện giới hạn</h2><p>Sự kiện Tây Bắc và các sự kiện đặc biệt khác dùng ngày giờ ISO có múi giờ.</p></header>
      <div className="limited-event-create"><DevField label="ID mới" value={newEvent.id} placeholder="taybac-festival" onChange={(value) => setNewEvent({ ...newEvent, id: value })} /><DevField label="Tên" value={newEvent.title} onChange={(value) => setNewEvent({ ...newEvent, title: value })} /><div className="local-dish-grid"><DevField label="Bắt đầu" value={newEvent.startsAt} placeholder="2026-09-18T00:00:00+07:00" onChange={(value) => setNewEvent({ ...newEvent, startsAt: value })} /><DevField label="Kết thúc" value={newEvent.endsAt} onChange={(value) => setNewEvent({ ...newEvent, endsAt: value })} /></div><button disabled={busy} className="local-dish-submit" onClick={addEvent}>+ Tạo sự kiện</button></div>
      {events.map((event) => <div className="limited-event-row" key={event.id}><strong>{event.id}</strong><DevField label="Tên" value={event.title} onChange={(value) => updateEvent(event.id, "title", value)} /><div className="local-dish-grid"><DevField label="Bắt đầu (ISO)" value={event.startsAt} onChange={(value) => updateEvent(event.id, "startsAt", value)} /><DevField label="Kết thúc (ISO)" value={event.endsAt} onChange={(value) => updateEvent(event.id, "endsAt", value)} /></div><button disabled={busy} onClick={() => deleteEvent(event)} className="local-banner-clear">Xóa sự kiện</button></div>)}
      <button disabled={busy} className="local-dish-submit" onClick={() => void saveEvents()}>Lưu thay đổi sự kiện</button>
    </section>

    <section className="dev-content-section"><header><small>LOCAL CATALOG</small><h2>Thêm, sửa, xóa món</h2><p>Chỉ sửa món trong localDishes.json. Ảnh tải lên được chuyển WebP và lưu vào public/assets/food/full.</p></header>
      <div className="dev-dish-list"><input aria-label="Tìm món local" value={dishSearch} onChange={(event) => setDishSearch(event.target.value)} placeholder="Tìm món local..." />{(localDishes as Dish[]).filter((dish) => `${dish.name} ${dish.id}`.toLowerCase().includes(dishSearch.toLowerCase())).map((dish) => <div key={dish.id} className="dev-dish-row"><strong>{dish.name}</strong><small>{dish.type === "limited" ? "✦ " + dish.limitedEventId : "Món thường"}</small><button onClick={() => { setDraft(toDraft(dish)); setEditing(true) }}>Sửa</button><button disabled={busy} onClick={() => void deleteDish(dish)}>Xóa</button></div>)}</div>
      <div className="dev-dish-editor"><h3>{editing ? `Sửa món: ${draft.id}` : "Thêm món mới"}</h3>
        <div className="local-dish-grid"><DevField label="ID món" value={draft.id} onChange={(value) => updateDish("id", value)} placeholder="bun-ca-keo" disabled={editing} /><DevField label="Tên món" value={draft.name} onChange={(value) => updateDish("name", value)} /></div>
        <DevField label="Từ khóa tìm quán" value={draft.searchQuery} onChange={(value) => updateDish("searchQuery", value)} />
        <div className="local-dish-grid"><DevField label="Category" value={draft.category} onChange={(value) => updateDish("category", value)} /><DevField label="Tags (phân cách dấu phẩy)" value={draft.tags} onChange={(value) => updateDish("tags", value)} /></div>
        <DevField label="Mô tả" value={draft.description} onChange={(value) => updateDish("description", value)} />
        <DevField label="URL ảnh" value={draft.imageUrl} onChange={(value) => updateDish("imageUrl", value)} />
        <label className="local-dish-upload"><span>Ảnh món WebP/PNG/JPG</span><input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => { void uploadDish(event.target.files?.[0]); event.target.value = "" }} /></label>
        <div className="local-dish-rarity-preview"><RarityFrame rarity={draft.rarity} className="local-dish-preview">{draft.imageData || draft.imageUrl ? <img src={draft.imageData || draft.imageUrl} alt="Xem trước món" /> : <span>◇</span>}</RarityFrame><div><small>KHUNG MÓN</small><strong>{RARITY_LABELS[draft.rarity]}</strong></div></div>
        <div className="local-dish-grid"><label className="local-dish-field"><span>Độ hiếm</span><select value={draft.rarity} onChange={(event) => { const rarity = event.target.value as RewardRarity; setDraft({ ...draft, rarity, weight: rarityWeight[rarity], priceTier: priceByRarity[rarity] }) }}>{(Object.keys(RARITY_LABELS) as RewardRarity[]).map((rarity) => <option key={rarity} value={rarity}>{RARITY_LABELS[rarity]}</option>)}</select></label><label className="local-dish-field"><span>Weight trong nhóm hiếm</span><input type="number" min="1" max="1000" value={draft.weight} onChange={(event) => updateDish("weight", Number(event.target.value))} /></label></div>
        <div className="local-dish-grid"><label className="local-dish-field"><span>Loại món</span><select value={draft.type} onChange={(event) => updateDish("type", event.target.value as DishDraft["type"])}><option value="normal">Món thường</option><option value="limited">Món giới hạn</option></select></label>{draft.type === "limited" && <label className="local-dish-field"><span>Banner sự kiện</span><select value={draft.limitedEventId} onChange={(event) => updateDish("limitedEventId", event.target.value)}><option value="">Chọn sự kiện</option>{eventChoices.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>}</div>
        <div className="local-dish-meals">{meals.map((meal) => <label key={meal}><input type="checkbox" checked={draft.mealSlots.includes(meal)} onChange={(event) => updateDish("mealSlots", event.target.checked ? [...draft.mealSlots, meal] : draft.mealSlots.filter((item) => item !== meal))} />{MEAL_SLOT_ICONS[meal]}</label>)}</div>
        <label className="local-dish-active"><input type="checkbox" checked={draft.active} onChange={(event) => updateDish("active", event.target.checked)} /> Có trong rương</label>
        <div className="dev-actions"><button className="local-dish-submit" disabled={busy} onClick={() => void saveDish()}>{editing ? "Lưu món" : "+ Thêm món"}</button>{editing && <button className="local-banner-clear" onClick={() => { setEditing(false); setDraft(emptyDish()) }}>Hủy sửa</button>}</div>
      </div>
    </section>
  </div>
}
