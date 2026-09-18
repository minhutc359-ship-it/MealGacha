import { useMemo, useState, useRef } from "react"
import { useAppStore } from "../store/useAppStore"
import { repository } from "../infrastructure/storage/repository"
import { MEAL_SLOT_ICONS, MealSlot } from "../domain/models"
import { fetchCatalog, ParseResult } from "../infrastructure/catalog/csvAdapter"
import { Dish } from "../domain/models"
import { RewardRarity } from "../domain/models"
import { BannerConfig } from "../infrastructure/banner/bannerConfig"
import { LimitedEvent } from "../domain/models"
import sourceLimitedEvents from "../infrastructure/events/limitedEvents.json"
import { useLanguage } from "../i18n"
import { RarityFrame, RARITY_LABELS } from "../components/ui/RarityFrame"
import { convertImageToWebp } from "../infrastructure/assets/imageProcessing"
import { getPriceTierFromWeight, getRarityFromWeight } from "../domain/drawReward"

interface CatalogPreview {
  url: string
  result: ParseResult
  slotCounts: Record<MealSlot, number>
  canApply: boolean
}

export function SettingsPage() {
  const user = useAppStore((s) => s.user)
  const updatePref = useAppStore((s) => s.updatePreference)
  const loadRemoteCatalog = useAppStore((s) => s.loadRemoteCatalog)
  const addLocalDish = useAppStore((s) => s.addLocalDish)
  const dishes = useAppStore((s) => s.dishes)
  const resetData = useAppStore((s) => s.resetData)
  const showToast = useAppStore((s) => s.showToast)

  const [catalogUrl, setCatalogUrl] = useState(
    user.preferences.catalogUrl ?? repository.loadAdminOverrideUrl() ?? "",
  )
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<CatalogPreview | null>(null)
  const [showReset, setShowReset] = useState(false)
  const [newDish, setNewDish] = useState<LocalDishDraft>(createLocalDishDraft())
  const [dishImageUploading, setDishImageUploading] = useState(false)
  const [bannerDraft, setBannerDraft] = useState<BannerConfig>(() =>
    repository.loadBannerOverride() ?? { id: "local-banner-1", imageUrl: "", enabled: false },
  )
  const [eventDrafts, setEventDrafts] = useState<LimitedEvent[]>(sourceLimitedEvents as LimitedEvent[])
  const [newEvent, setNewEvent] = useState<LimitedEvent>({ id: "", title: "", startsAt: "", endsAt: "" })
  const fileRef = useRef<HTMLInputElement>(null)

  const prefs = user.preferences
  const isLocal = import.meta.env.DEV
  const { language, setLanguage, t } = useLanguage()

  const slotCounts = {
    breakfast: dishes.filter(
      (d) => d.active && d.mealSlots.includes("breakfast"),
    ).length,
    lunch: dishes.filter((d) => d.active && d.mealSlots.includes("lunch"))
      .length,
    dinner: dishes.filter((d) => d.active && d.mealSlots.includes("dinner"))
      .length,
  }

  const recentTx = [...user.keyTransactions].reverse().slice(0, 8)
  const catalogCategories = useMemo(
    () => [...new Set(dishes.map((dish) => dish.category).filter(Boolean) as string[])].sort(),
    [dishes],
  )
  const catalogTags = useMemo(
    () => [...new Set(dishes.flatMap((dish) => dish.tags))].sort(),
    [dishes],
  )
  const previewRarity = newDish.rarity || getRarityFromWeight(newDish.weight)
  const updateNewDishWeight = (weight: number) => setNewDish((current) => ({
    ...current,
    weight,
    rarity: getRarityFromWeight(weight),
    priceTier: getPriceTierFromWeight(weight),
  }))
  const updateNewDishRarity = (rarity: RewardRarity | "") => {
    if (!rarity) {
      updateNewDish("rarity", "")
      return
    }
    const weight = rarity === "diamond" ? 8 : rarity === "epic" ? 25 : rarity === "rare" ? 50 : 100
    setNewDish((current) => ({ ...current, rarity, weight, priceTier: getPriceTierFromWeight(weight) }))
  }

  const handlePreview = async () => {
    const url = catalogUrl.trim()
    if (!url) return
    setPreviewLoading(true)
    setPreview(null)
    try {
      const result = await fetchCatalog(url)
      const sc = {
        breakfast: result.dishes.filter(
          (d: Dish) => d.active && d.mealSlots.includes("breakfast"),
        ).length,
        lunch: result.dishes.filter(
          (d: Dish) => d.active && d.mealSlots.includes("lunch"),
        ).length,
        dinner: result.dishes.filter(
          (d: Dish) => d.active && d.mealSlots.includes("dinner"),
        ).length,
      }
      const bannerError = result.errors.some((e) => e.includes("Banner"))
      setPreview({
        url,
        result,
        slotCounts: sc,
        canApply: result.dishes.length > 0 && !bannerError,
      })
    } catch (e) {
      showToast(`Lỗi tải catalog: ${(e as Error).message}`, "error")
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleApplyCatalog = () => {
    if (!preview?.canApply) return
    repository.saveAdminOverrideUrl(preview.url)
    loadRemoteCatalog(preview.url)
    showToast(
      `✓ Đã áp dụng catalog: ${preview.result.dishes.length} món`,
      "success",
    )
    setPreview(null)
  }

  const handleClearOverride = () => {
    repository.saveAdminOverrideUrl(null)
    setCatalogUrl("")
    setPreview(null)
    showToast("Đã xóa override. Dùng dữ liệu gốc.", "info")
  }

  const updateNewDish = <K extends keyof LocalDishDraft>(
    key: K,
    value: LocalDishDraft[K],
  ) => setNewDish((current) => ({ ...current, [key]: value }))

  const handleAddLocalDish = async () => {
    const id = newDish.id.trim()
    const name = newDish.name.trim()
    if (!id || !name || !/^[a-z0-9-]+$/.test(id)) {
      showToast("ID chỉ dùng chữ thường, số và dấu gạch ngang; tên món không được trống.", "error")
      return
    }
    if (newDish.mealSlots.length === 0) {
      showToast("Chọn ít nhất một khung bữa.", "error")
      return
    }
    const dish = {
      id,
      name,
      searchQuery: newDish.searchQuery.trim() || name,
      mealSlots: newDish.mealSlots,
      category: newDish.category.trim() || undefined,
      description: newDish.description.trim() || undefined,
      imageUrl: newDish.imageUrl.trim() || undefined,
      tags: newDish.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      weight: Number(newDish.weight) || 100,
      rarity: newDish.rarity || undefined,
      priceTier: newDish.priceTier,
      active: newDish.active,
      type: newDish.type,
      limitedEventId: newDish.type === "limited" ? newDish.limitedEventId || undefined : undefined,
    }
    try {
      const response = await fetch("/__meal-gacha/dev/dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dish, imageData: newDish.imageData }),
      })
      if (!response.ok) throw new Error("Không thể ghi món vào source.")
    } catch (error) {
      showToast((error as Error).message, "error")
      return
    }
    const result = addLocalDish(dish)
    if (!result.success) {
      showToast(result.error ?? "Không thể thêm món.", "error")
      return
    }
    setNewDish(createLocalDishDraft())
  }

  const handleDishImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      showToast("Ảnh món phải là file hình ảnh.", "error")
      return
    }
    setDishImageUploading(true)
    try {
      const imageData = await convertImageToWebp(file)
      const imageUrl = `/assets/food/full/${newDish.id.trim() || "new-dish"}.webp`
      setNewDish((current) => ({ ...current, imageUrl, imageData }))
      showToast("Đã chuyển ảnh sang WebP. Bấm thêm món để lưu vào source.", "success")
    } catch {
      showToast("Không thể chuyển ảnh. Hãy thử file PNG/JPG khác.", "error")
    } finally {
      setDishImageUploading(false)
    }
  }

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      showToast("Banner phải là file hình ảnh.", "error")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setBannerDraft({
        id: `local-${Date.now()}`,
        imageUrl: String(reader.result),
        enabled: true,
      })
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  const saveLocalBanner = async () => {
    if (!bannerDraft.imageUrl) {
      showToast("Hãy tải ảnh banner trước.", "error")
      return
    }
    try {
      const response = await fetch("/__meal-gacha/dev/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bannerDraft.id,
          imageData: bannerDraft.imageUrl,
          enabled: bannerDraft.enabled,
          eventId: bannerDraft.eventId,
          startsAt: bannerDraft.startsAt,
          endsAt: bannerDraft.endsAt,
        }),
      })
      if (!response.ok) throw new Error("Không thể ghi banner vào source.")
      const result = (await response.json()) as { imageUrl: string }
      repository.saveBannerOverride({ ...bannerDraft, imageUrl: result.imageUrl })
    } catch (error) {
      showToast((error as Error).message, "error")
      return
    }
    showToast("Đã bật banner local. Tải lại trang để xem popup.", "success")
  }

  const updateEvent = (eventId: string, key: "title" | "startsAt" | "endsAt", value: string) => {
    setEventDrafts((events) => events.map((event) => event.id === eventId ? { ...event, [key]: value } : event))
  }

  const saveLocalEvents = async () => {
    const response = await fetch("/__meal-gacha/dev/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventDrafts),
    })
    if (!response.ok) {
      showToast("Không thể ghi sự kiện vào source.", "error")
      return
    }
    showToast("Đã cập nhật sự kiện. Tải lại dev server để áp dụng.", "success")
  }

  const createLocalEvent = async () => {
    if (!/^[a-z0-9-]+$/.test(newEvent.id) || !newEvent.title || !newEvent.startsAt || !newEvent.endsAt) {
      showToast("Event cần ID hợp lệ, tên và thời gian bắt đầu/kết thúc.", "error")
      return
    }
    if (eventDrafts.some((event) => event.id === newEvent.id)) {
      showToast("ID event đã tồn tại.", "error")
      return
    }
    setEventDrafts((events) => [...events, newEvent])
    const response = await fetch("/__meal-gacha/dev/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([...eventDrafts, newEvent]),
    })
    if (!response.ok) {
      showToast("Không thể tạo event.", "error")
      return
    }
    setNewEvent({ id: "", title: "", startsAt: "", endsAt: "" })
    showToast("Đã tạo sự kiện giới hạn.", "success")
  }

  const clearLocalBanner = () => {
    repository.clearBannerOverride()
    setBannerDraft({ id: "local-banner-1", imageUrl: "", enabled: false })
    showToast("Đã xóa banner local.", "info")
  }

  const handleExport = () => {
    const json = repository.exportBackup()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `foodchest-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast("Đã xuất backup!", "success")
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const ok = repository.importBackup(ev.target?.result as string)
      if (ok) {
        showToast("Khôi phục thành công! Đang tải lại...", "success")
        setTimeout(() => window.location.reload(), 1200)
      } else {
        showToast("File backup không hợp lệ.", "error")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <div className="min-h-dvh pb-20 flex flex-col max-w-md mx-auto px-4 pt-4">
      <h1
        className="text-xl font-extrabold mb-5"
        style={{ fontFamily: "Exo 2, sans-serif" }}
      >
        Cài đặt
      </h1>

      {isLocal && (
        <Section title="Banner thông báo local">
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "#6b7f99" }}>
            Chỉ hiển thị trong môi trường local. Production dùng <strong>BANNER_CONFIG</strong> đã commit trong source.
          </p>
          <div className="local-banner-settings">
            {bannerDraft.imageUrl && <img src={bannerDraft.imageUrl} alt="Xem trước banner" />}
            <input type="file" accept="image/*" onChange={handleBannerUpload} />
            <label className="local-dish-active">
              <input
                type="checkbox"
                checked={bannerDraft.enabled}
                onChange={(event) => setBannerDraft((current) => ({ ...current, enabled: event.target.checked }))}
              />
              Bật popup banner local
            </label>
            <label className="local-dish-field"><span>Sự kiện giới hạn</span><select value={bannerDraft.eventId ?? ""} onChange={(event) => setBannerDraft((current) => ({ ...current, eventId: event.target.value || undefined }))}><option value="">Không gắn event</option>{eventDrafts.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
            <div className="flex gap-2">
              <button className="local-dish-submit flex-1" onClick={saveLocalBanner}>Lưu banner</button>
              <button className="local-banner-clear" onClick={clearLocalBanner}>Xóa</button>
            </div>
          </div>
          <div className="limited-event-settings">
            <strong>Danh sách sự kiện giới hạn</strong>
            <div className="limited-event-create">
              <TextField label="ID event" value={newEvent.id} placeholder="moon-festival" onChange={(value) => setNewEvent((event) => ({ ...event, id: value }))} />
              <TextField label="Tên event" value={newEvent.title} placeholder="Lễ hội đêm trăng" onChange={(value) => setNewEvent((event) => ({ ...event, title: value }))} />
              <TextField label="Bắt đầu (ISO)" value={newEvent.startsAt} placeholder="2026-09-18T00:00:00+07:00" onChange={(value) => setNewEvent((event) => ({ ...event, startsAt: value }))} />
              <TextField label="Kết thúc (ISO)" value={newEvent.endsAt} placeholder="2026-09-25T23:59:59+07:00" onChange={(value) => setNewEvent((event) => ({ ...event, endsAt: value }))} />
              <button className="local-dish-submit" onClick={createLocalEvent}>+ Tạo sự kiện</button>
            </div>
            {eventDrafts.map((event) => (
              <div className="limited-event-row" key={event.id}>
                <TextField label="Tên" value={event.title} placeholder="Tên event" onChange={(value) => updateEvent(event.id, "title", value)} />
                <TextField label="Bắt đầu (ISO)" value={event.startsAt} placeholder="2026-09-18T00:00:00+07:00" onChange={(value) => updateEvent(event.id, "startsAt", value)} />
                <TextField label="Kết thúc (ISO)" value={event.endsAt} placeholder="2026-09-25T23:59:59+07:00" onChange={(value) => updateEvent(event.id, "endsAt", value)} />
              </div>
            ))}
            <button className="local-dish-submit" onClick={saveLocalEvents}>Lưu thời gian sự kiện</button>
          </div>
        </Section>
      )}

      {/* Stats */}
      <Section title="Thống kê">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatTile
            label="Chìa khóa"
            value={user.keys}
            color="#f5a623"
            icon="🔑"
          />
          <StatTile
            label="Phần thưởng"
            value={user.rewards.length}
            color="#00d4ff"
            icon="📦"
          />
          <StatTile
            label="Ghép thành công"
            value={user.fusions.length}
            color="#a855f7"
            icon="✨"
          />
          <StatTile
            label="Streak tốt nhất"
            value={user.bestCheckInStreak}
            color="#4ade80"
            icon="🔥"
          />
          <StatTile
            label="Mảnh vị giác"
            value={user.shards}
            color="#f472b6"
            icon="♢"
          />
        </div>
        <div className="flex gap-3 text-xs" style={{ color: "#6b7f99" }}>
          <span>
            {MEAL_SLOT_ICONS.breakfast} {slotCounts.breakfast} sáng
          </span>
          <span>
            {MEAL_SLOT_ICONS.lunch} {slotCounts.lunch} trưa
          </span>
          <span>
            {MEAL_SLOT_ICONS.dinner} {slotCounts.dinner} tối
          </span>
          <span className="ml-auto">{dishes.length} món trong catalog</span>
        </div>
      </Section>

      {/* Key history */}
      {recentTx.length > 0 && (
        <Section title="Lịch sử chìa khóa">
          <div className="key-history-scroll flex flex-col gap-1.5">
            {recentTx.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between text-xs py-0.5"
              >
                <span style={{ color: "#6b7f99" }}>
                  {tx.reason === "daily_checkin"
                    ? "🔑 Điểm danh"
                    : tx.reason === "daily_quest"
                      ? "🧩 Mật mã vị giác"
                    : tx.reason === "chest_open"
                      ? "📦 Mở rương"
                      : tx.reason === "free_chest"
                        ? "🎁 Rương miễn phí"
                        : tx.reason === "streak_reward"
                          ? "🔥 Thưởng streak"
                          : tx.reason === "shard_exchange"
                            ? "♢ Đổi mảnh"
                      : "⚙️ Khác"}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className="font-bold"
                    style={{ color: tx.amount > 0 ? "#4ade80" : "#f87171" }}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                  <span style={{ color: "#6b7f99" }}>= {tx.balanceAfter}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Preferences */}
      <Section title="Tuỳ chọn">
        <div className="language-setting">
          <span>{t("language")}</span>
          <div>
            <button className={language === "vi" ? "is-active" : ""} onClick={() => setLanguage("vi")}>{t("vietnamese")}</button>
            <button className={language === "en" ? "is-active" : ""} onClick={() => setLanguage("en")}>{t("english")}</button>
          </div>
        </div>
        <ToggleRow
          label={t("sound")}
          description="Hiệu ứng âm thanh khi mở rương, ghép món và quay"
          checked={prefs.soundEnabled}
          onChange={(v) => updatePref("soundEnabled", v)}
        />
        <ToggleRow
          label={t("reducedMotion")}
          description="Tắt animation nếu gây khó chịu"
          checked={prefs.reducedMotion}
          onChange={(v) => updatePref("reducedMotion", v)}
        />
        <div
          className="mt-4 pt-3 border-t space-y-3"
          style={{ borderColor: "rgba(107,127,153,0.12)" }}
        >
          <NumberInput
            label="Bán kính tìm quán"
            unit="m"
            value={prefs.searchRadiusMeters}
            min={500}
            max={10000}
            step={500}
            onChange={(v) => updatePref("searchRadiusMeters", v)}
          />
          <NumberInput
            label="Điểm đánh giá tối thiểu"
            unit=""
            value={prefs.minRating}
            min={1}
            max={5}
            step={0.1}
            onChange={(v) => updatePref("minRating", parseFloat(v.toFixed(1)))}
          />
          <NumberInput
            label="Số lượt đánh giá tối thiểu"
            unit="lượt"
            value={prefs.minReviews}
            min={0}
            max={500}
            step={10}
            onChange={(v) => updatePref("minReviews", v)}
          />
        </div>
      </Section>

      {isLocal && <Section title="Thêm món local">
        <p className="text-xs mb-3 leading-relaxed" style={{ color: "#6b7f99" }}>
          Chỉ lưu trên trình duyệt hiện tại. Khi deploy, thêm món vào catalog/seed và commit ảnh vào <strong>public/assets/food/full</strong>.
        </p>
        <div className="local-dish-form">
          <TextField label="ID món" value={newDish.id} placeholder="bun-ca-keo" onChange={(value) => updateNewDish("id", value)} />
          <TextField label="Tên món" value={newDish.name} placeholder="Bún cá kèo" onChange={(value) => updateNewDish("name", value)} />
          <TextField label="Từ khóa tìm quán" value={newDish.searchQuery} placeholder="bún cá kèo" onChange={(value) => updateNewDish("searchQuery", value)} />
          <TextField label="Category (chọn hoặc nhập mới)" value={newDish.category} placeholder="noodle" list="catalog-categories" onChange={(value) => updateNewDish("category", value)} />
          <label className="local-dish-field">
            <span>Tags (chọn sẵn hoặc nhập mới, cách nhau bằng dấu phẩy)</span>
            <input list="catalog-tags" value={newDish.tags} placeholder="vietnamese, hot" onChange={(event) => updateNewDish("tags", event.target.value)} />
            <div className="local-dish-suggestions">
              {catalogTags.map((tag) => <button type="button" key={tag} onClick={() => updateNewDish("tags", [...new Set([...newDish.tags.split(",").map((item) => item.trim()).filter(Boolean), tag])].join(", "))}>{tag}</button>)}
            </div>
          </label>
          <datalist id="catalog-categories">{catalogCategories.map((category) => <option key={category} value={category} />)}</datalist>
          <datalist id="catalog-tags">{catalogTags.map((tag) => <option key={tag} value={tag} />)}</datalist>
          <TextField label="URL ảnh hoặc /assets/food/full/id.webp" value={newDish.imageUrl} placeholder="/assets/food/full/bun-ca-keo.webp" onChange={(value) => updateNewDish("imageUrl", value)} />
          <label className="local-dish-upload">
            <span>{dishImageUploading ? "Đang chuyển sang WebP..." : "Hoặc upload PNG/JPG để tự convert WebP"}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleDishImageUpload} disabled={dishImageUploading} />
          </label>
          <div className="local-dish-rarity-preview">
            <RarityFrame rarity={previewRarity} className="local-dish-preview">
              {newDish.imageData ? <img src={newDish.imageData} alt="Preview món mới" /> : <span>◇</span>}
            </RarityFrame>
            <div>
              <span className="local-dish-rarity-caption">Khung rarity</span>
              <strong>{RARITY_LABELS[previewRarity]}</strong>
              <small>{newDish.rarity ? "Theo rarity đã chọn" : "Suy ra từ weight"}</small>
            </div>
          </div>
          <div className="local-dish-grid">
            <label className="local-dish-field">
              <span>Bữa áp dụng</span>
              <div className="local-dish-meals">
                {(["breakfast", "lunch", "dinner"] as MealSlot[]).map((meal) => (
                  <label key={meal}>
                    <input
                      type="checkbox"
                      checked={newDish.mealSlots.includes(meal)}
                      onChange={(event) => updateNewDish("mealSlots", event.target.checked
                        ? [...newDish.mealSlots, meal]
                        : newDish.mealSlots.filter((item) => item !== meal))}
                    />
                    {MEAL_SLOT_ICONS[meal]}
                  </label>
                ))}
              </div>
            </label>
            <label className="local-dish-field">
              <span>Rarity</span>
              <select value={newDish.rarity} onChange={(event) => updateNewDishRarity(event.target.value as RewardRarity | "")}>
                <option value="">Theo weight</option>
                <option value="common">{RARITY_LABELS.common} · Common</option>
                <option value="rare">{RARITY_LABELS.rare} · Rare</option>
                <option value="epic">{RARITY_LABELS.epic} · Epic</option>
                <option value="diamond">{RARITY_LABELS.diamond} · Diamond</option>
              </select>
            </label>
          </div>
          <div className="local-dish-grid">
            <label className="local-dish-field">
              <span>Loại món</span>
              <select value={newDish.type} onChange={(event) => updateNewDish("type", event.target.value as LocalDishDraft["type"])}>
                <option value="standard">Món thường</option>
                <option value="limited">Món giới hạn</option>
              </select>
            </label>
            {newDish.type === "limited" && (
              <label className="local-dish-field">
                <span>Sự kiện</span>
                <select value={newDish.limitedEventId} onChange={(event) => updateNewDish("limitedEventId", event.target.value)}>
                  <option value="">Chọn sự kiện</option>
                  {eventDrafts.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
                </select>
              </label>
            )}
          </div>
          <div className="local-dish-grid">
            <div>
              <NumberInput label="Weight" unit="" value={newDish.weight} min={1} max={1000} step={1} onChange={updateNewDishWeight} />
              <p className="local-dish-field-hint">Weight cao hơn = tỉ lệ chọn cao hơn trong cùng rarity.</p>
            </div>
            <div className="local-dish-auto-value">
              <span>Price tier</span>
              <strong>{newDish.priceTier}/4</strong>
              <small>Tự động: weight thấp hơn = mức giá cao hơn</small>
            </div>
          </div>
          <TextField label="Mô tả" value={newDish.description} placeholder="Món ăn đặc trưng..." onChange={(value) => updateNewDish("description", value)} />
          <label className="local-dish-active"><input type="checkbox" checked={newDish.active} onChange={(event) => updateNewDish("active", event.target.checked)} /> Có thể xuất hiện trong rương</label>
          <button className="local-dish-submit" onClick={handleAddLocalDish}>+ Thêm vào catalog local</button>
        </div>
      </Section>}

      {/* Catalog source — with preview */}
      <Section title="Nguồn dữ liệu món ăn">
        <p
          className="text-xs mb-3 leading-relaxed"
          style={{ color: "#6b7f99" }}
        >
          Nhập URL Google Sheet đã <em>Publish to web</em> dạng CSV. Nhấn{" "}
          <strong>Xem trước</strong> để kiểm tra trước khi áp dụng.
        </p>

        <div className="flex gap-2 mb-3">
          <input
            value={catalogUrl}
            onChange={(e) => {
              setCatalogUrl(e.target.value)
              setPreview(null)
            }}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="flex-1 px-3 py-2.5 rounded-xl text-xs outline-none min-w-0"
            style={{
              background: "rgba(14,22,40,0.8)",
              border: "1px solid rgba(0,212,255,0.15)",
              color: "#e8edf5",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(0,212,255,0.45)"
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(0,212,255,0.15)"
            }}
          />
          <button
            onClick={handlePreview}
            disabled={previewLoading || !catalogUrl.trim()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all"
            style={{
              background: "rgba(0,212,255,0.13)",
              color: "#00d4ff",
              border: "1px solid rgba(0,212,255,0.25)",
            }}
          >
            {previewLoading ? (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                Đang tải
              </span>
            ) : (
              "Xem trước"
            )}
          </button>
        </div>

        {/* Preview panel */}
        {preview && (
          <div
            className="rounded-2xl overflow-hidden mb-3"
            style={{
              border: `1px solid ${
                preview.canApply
                  ? "rgba(74,222,128,0.25)"
                  : "rgba(239,68,68,0.25)"
              }`,
              background: preview.canApply
                ? "rgba(74,222,128,0.04)"
                : "rgba(239,68,68,0.04)",
            }}
          >
            {/* Summary row */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: "rgba(107,127,153,0.1)" }}
            >
              <span className="text-lg">{preview.canApply ? "✅" : "❌"}</span>
              <div className="flex-1">
                <p
                  className="text-xs font-bold"
                  style={{ color: preview.canApply ? "#4ade80" : "#f87171" }}
                >
                  {preview.result.dishes.length} món hợp lệ
                  {preview.result.errors.length > 0
                    ? ` · ${preview.result.errors.length} lỗi`
                    : ""}
                </p>
                <div
                  className="flex gap-2 text-xs mt-0.5"
                  style={{ color: "#6b7f99" }}
                >
                  <span>
                    {MEAL_SLOT_ICONS.breakfast} {preview.slotCounts.breakfast}
                  </span>
                  <span>
                    {MEAL_SLOT_ICONS.lunch} {preview.slotCounts.lunch}
                  </span>
                  <span>
                    {MEAL_SLOT_ICONS.dinner} {preview.slotCounts.dinner}
                  </span>
                </div>
              </div>
            </div>

            {/* Errors */}
            {preview.result.errors.length > 0 && (
              <div className="px-4 py-3 max-h-32 overflow-y-auto">
                {preview.result.errors.map((err, i) => (
                  <p
                    key={i}
                    className="text-xs mb-1 leading-relaxed"
                    style={{ color: "#f87171" }}
                  >
                    ⚠ {err}
                  </p>
                ))}
              </div>
            )}

            {/* Apply button */}
            <div className="px-4 pb-3 pt-2 flex gap-2">
              <button
                onClick={handleApplyCatalog}
                disabled={!preview.canApply}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={
                  preview.canApply
                    ? {
                        background: "linear-gradient(135deg,#4ade80,#16a34a)",
                        color: "#080c18",
                      }
                    : {
                        background: "rgba(107,127,153,0.1)",
                        color: "#6b7f99",
                        cursor: "not-allowed",
                      }
                }
              >
                Dùng nguồn này
              </button>
              <button
                onClick={() => setPreview(null)}
                className="px-3 py-2 rounded-xl text-xs"
                style={{
                  color: "#6b7f99",
                  background: "rgba(107,127,153,0.08)",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Current state */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex gap-3" style={{ color: "#4ade80" }}>
            <span>✓ Đang dùng {dishes.length} món</span>
          </div>
          {repository.loadAdminOverrideUrl() && (
            <button
              onClick={handleClearOverride}
              className="text-xs"
              style={{ color: "#6b7f99" }}
            >
              Xóa override
            </button>
          )}
        </div>
      </Section>

      {/* Backup */}
      <Section title="Backup & Khôi phục">
        <p
          className="text-xs mb-3 leading-relaxed"
          style={{ color: "#6b7f99" }}
        >
          Dữ liệu lưu trong trình duyệt này. Xuất backup để không mất khi xóa
          cache.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExport}
            className="py-3 rounded-xl text-sm font-semibold border transition-all"
            style={{
              borderColor: "rgba(0,212,255,0.25)",
              color: "#00d4ff",
              background: "rgba(0,212,255,0.06)",
            }}
          >
            📤 Xuất backup
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="py-3 rounded-xl text-sm font-semibold border transition-all"
            style={{
              borderColor: "rgba(107,127,153,0.2)",
              color: "#a8b8d0",
              background: "rgba(14,22,40,0.5)",
            }}
          >
            📥 Nhập backup
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </Section>

      {/* Danger zone */}
      <Section title="Vùng nguy hiểm">
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="w-full py-3 rounded-xl text-sm font-semibold border transition-all"
            style={{
              borderColor: "rgba(239,68,68,0.2)",
              color: "#f87171",
              background: "rgba(239,68,68,0.05)",
            }}
          >
            🗑️ Xóa toàn bộ dữ liệu
          </button>
        ) : (
          <div
            className="p-4 rounded-xl"
            style={{
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <p
              className="text-sm mb-1 font-semibold"
              style={{ color: "#f87171" }}
            >
              Xác nhận xóa toàn bộ?
            </p>
            <p className="text-xs mb-4" style={{ color: "#6b7f99" }}>
              Toàn bộ chìa khóa, phần thưởng, lịch sử và cài đặt sẽ biến mất.
              Không thể hoàn tác.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={resetData}
                className="py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                Xác nhận xóa
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="py-2.5 rounded-xl text-sm font-semibold border"
                style={{
                  borderColor: "rgba(107,127,153,0.2)",
                  color: "#a8b8d0",
                }}
              >
                Huỷ
              </button>
            </div>
          </div>
        )}
      </Section>

      <p className="text-center text-xs pb-2 mt-1" style={{ color: "#6b7f99" }}>
        Rương Vị Giác v1.0 · Mở rương, chốt món 🍴
      </p>
    </div>
  )
}

interface LocalDishDraft {
  id: string
  name: string
  searchQuery: string
  mealSlots: MealSlot[]
  category: string
  tags: string
  imageUrl: string
  imageData: string
  description: string
  weight: number
  rarity: RewardRarity | ""
  priceTier: 1 | 2 | 3 | 4
  active: boolean
  type: "standard" | "limited"
  limitedEventId: string
}

function createLocalDishDraft(): LocalDishDraft {
  return {
    id: "",
    name: "",
    searchQuery: "",
    mealSlots: ["lunch"],
    category: "",
    tags: "",
    imageUrl: "",
    imageData: "",
    description: "",
    weight: 100,
    rarity: "",
    priceTier: 2,
    active: true,
    type: "standard",
    limitedEventId: "",
  }
}

function TextField({ label, value, placeholder, list, onChange }: { label: string; value: string; placeholder: string; list?: string; onChange(value: string): void }) {
  return (
    <label className="local-dish-field">
      <span>{label}</span>
      <input list={list} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
        style={{ color: "#6b7f99" }}
      >
        {title}
      </p>
      <div
        className="p-4 rounded-2xl"
        style={{
          background: "rgba(14,22,40,0.7)",
          border: "1px solid rgba(107,127,153,0.1)",
        }}
      >
        {children}
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number
  color: string
  icon: string
}) {
  return (
    <div
      className="p-3 rounded-xl text-center"
      style={{ background: `${color}0d`, border: `1px solid ${color}20` }}
    >
      <p className="text-lg mb-0.5">{icon}</p>
      <p
        className="text-xl font-extrabold"
        style={{ color, fontFamily: "Exo 2, sans-serif" }}
      >
        {value}
      </p>
      <p
        className="text-[10px] leading-tight mt-0.5"
        style={{ color: "#6b7f99" }}
      >
        {label}
      </p>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange(v: boolean): void
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "#6b7f99" }}>
            {description}
          </p>
        )}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 w-11 h-6 rounded-full cursor-pointer transition-colors duration-200"
        style={{ background: checked ? "#00d4ff" : "rgba(107,127,153,0.3)" }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{
            transform: checked ? "translateX(24px)" : "translateX(4px)",
          }}
        />
      </div>
    </label>
  )
}

function NumberInput({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  unit: string
  value: number
  min: number
  max: number
  step: number
  onChange(v: number): void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium" style={{ color: "#a8b8d0" }}>
          {label}
        </label>
        <span className="text-xs font-bold" style={{ color: "#00d4ff" }}>
          {value}
          {unit ? " " + unit : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v =
            step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value, 10)
          onChange(v)
        }}
        className="w-full h-1.5 rounded-full appearance-none outline-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #00d4ff ${((value - min) / (max - min)) * 100}%, rgba(107,127,153,0.2) 0%)`,
        }}
      />
    </div>
  )
}
