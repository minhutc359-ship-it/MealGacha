export interface LimitedEvent {
  id: string
  name: { vi: string; en: string }
  description: { vi: string; en: string }
  icon: string
  enabled: boolean
  startsAt?: string
  endsAt?: string
  bannerImage: string
  theme: { id: string; className: string }
  dishIds: string[]
}

export const EVENTS: LimitedEvent[] = [
  { id: "hanoi-autumn", name: { vi: "Hà Nội Mùa Thu", en: "Hanoi Autumn" }, description: { vi: "Cốm, rươi và những hương vị phố cổ chỉ có trong banner mùa thu.", en: "Autumn specialties of Hanoi." }, icon: "🍂", enabled: true, startsAt: "2026-09-01", endsAt: "2026-11-30", bannerImage: "/assets/events/hanoi-autumn/banner.webp", theme: { id: "hanoi", className: "event-hanoi" }, dishIds: ["cha-ca-la-vong", "bun-thang", "com-lang-vong", "ca-phe-trung", "cha-ruoi", "banh-com-hang-than"] },
  { id: "seoul-midnight", name: { vi: "Seoul Midnight", en: "Seoul Midnight" }, description: { vi: "Khám phá món ăn khuya đậm chất Hàn ít gặp trong thực đơn thường ngày.", en: "Distinctive Korean night market specialties." }, icon: "🌃", enabled: true, startsAt: "2026-11-01", endsAt: "2027-01-31", bannerImage: "/assets/events/seoul-midnight/banner.webp", theme: { id: "seoul", className: "event-seoul" }, dishIds: ["jjajangmyeon", "kimchi-jjigae", "hotteok", "ganjang-gejang", "gopchang-gui", "sundae-guk"] },
  { id: "tokyo-matsuri", name: { vi: "Tokyo Matsuri", en: "Tokyo Matsuri" }, description: { vi: "Hương vị hội chợ, quầy xiên nướng và bánh cá Nhật Bản.", en: "Food stalls at a Japanese festival." }, icon: "🏮", enabled: true, startsAt: "2027-02-01", endsAt: "2027-04-30", bannerImage: "/assets/events/tokyo-matsuri/banner.webp", theme: { id: "tokyo", className: "event-tokyo" }, dishIds: ["takoyaki", "okonomiyaki", "yakitori", "tonkatsu", "matcha-parfait", "taiyaki"] },
  { id: "bangkok-street-heat", name: { vi: "Bangkok Street Heat", en: "Bangkok Street Heat" }, description: { vi: "Món đường phố cay thơm đậm vị Thái.", en: "Thai street food after dark." }, icon: "🌶️", enabled: true, startsAt: "2027-05-01", endsAt: "2027-07-31", bannerImage: "/assets/events/bangkok-street-heat/banner.webp", theme: { id: "bangkok", className: "event-bangkok" }, dishIds: ["som-tam", "pad-kra-pao", "boat-noodles", "green-curry", "moo-ping", "khao-soi"] },
  { id: "dolce-vita", name: { vi: "Dolce Vita", en: "Dolce Vita" }, description: { vi: "Đi một vòng nước Ý qua những món vùng miền đặc sắc.", en: "Regional Italian specialties." }, icon: "🍝", enabled: true, startsAt: "2027-08-01", endsAt: "2027-10-31", bannerImage: "/assets/events/dolce-vita/banner.webp", theme: { id: "italy", className: "event-italy" }, dishIds: ["ossobuco", "tiramisu", "arancini", "saltimbocca", "pappardelle-cinghiale", "porchetta"] },
  { id: "christmas-feast", name: { vi: "Christmas Feast", en: "Christmas Feast" }, description: { vi: "Bữa tiệc Giáng sinh với món nướng và tráng miệng mùa lễ hội.", en: "A festive year-end feast." }, icon: "🎄", enabled: true, startsAt: "2026-12-01", endsAt: "2026-12-31", bannerImage: "/assets/events/christmas-feast/banner.webp", theme: { id: "christmas", className: "event-christmas" }, dishIds: ["roast-turkey", "beef-wellington", "honey-glazed-ham", "gingerbread", "christmas-pudding", "yule-log"] },
  { id: "new-year-feast", name: { vi: "Tết Việt Sum Vầy", en: "Vietnamese Lunar New Year" }, description: { vi: "Bánh chưng, canh măng miến, giò xào và mâm cỗ Tết Việt.", en: "Traditional Vietnamese Tết family feast." }, icon: "🧧", enabled: true, startsAt: "2027-02-04", endsAt: "2027-02-16", bannerImage: "/assets/events/new-year-feast/banner-tet.webp", theme: { id: "new-year", className: "event-new-year" }, dishIds: ["banh-chung", "canh-mang-mien", "gio-xao", "thit-dong", "thit-kho-trung", "dua-hanh"] },
  { id: "cooling-summer", name: { vi: "Mùa Hè Thanh Mát", en: "Refreshing Summer" }, description: { vi: "Món mát lành ngày nắng: chè, kem bơ, gỏi cuốn và nộm sứa.", en: "Cooling desserts and light summer dishes." }, icon: "🍧", enabled: true, startsAt: "2027-06-01", endsAt: "2027-08-31", bannerImage: "/assets/events/cooling-summer/banner-vietnam.webp", theme: { id: "summer", className: "event-summer" }, dishIds: ["che-khuc-bach", "che-buoi", "sua-chua-mit", "kem-bo-da-lat", "nom-sua-xoai", "goi-cuon-tom-thit"] },
]

const DEV_OVERRIDE_KEY = "mealgacha.dev-event-override"

export function getDevEventOverride(): string | null {
  return import.meta.env.DEV && typeof localStorage !== "undefined" ? localStorage.getItem(DEV_OVERRIDE_KEY) : null
}

export function setDevEventOverride(id: string | null): void {
  if (!import.meta.env.DEV) return
  if (id === null) localStorage.removeItem(DEV_OVERRIDE_KEY)
  else localStorage.setItem(DEV_OVERRIDE_KEY, id)
  window.dispatchEvent(new Event("mealgacha:event-preview-changed"))
}

export function isEventActive(event: LimitedEvent, date: string, override = getDevEventOverride()): boolean {
  if (override === "none") return false
  if (override && override !== "auto") return event.id === override
  return event.enabled && (!event.startsAt || date >= event.startsAt) && (!event.endsAt || date <= event.endsAt)
}

export function getActiveEvents(date: string): LimitedEvent[] {
  return EVENTS.filter((event) => isEventActive(event, date))
}

export function getFeaturedEvents(dishes: Dish[], now = new Date()): FeaturedEvent[] {
  const date = getDateKey(now)
  const override = getDevEventOverride()
  const seasonal = EVENTS.map((event) => ({
    id: event.id,
    title: event.name.vi,
    description: event.description.vi,
    icon: event.icon,
    bannerImage: event.bannerImage,
    themeClass: event.theme.className,
    dishIds: dishes.filter((dish) => dish.active && dish.type === "limited" && dish.limitedEventId === event.id).map((dish) => dish.id),
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    active: isEventActive(event, date, override),
    local: false,
  }))
  const local = LOCAL_EVENTS.map((event) => ({
    id: event.id,
    title: event.title,
    description: "Khám phá hương vị giới hạn và lưu món vào bộ sưu tập.",
    icon: "🏔️",
    bannerImage: BANNER_CONFIG.eventId === event.id || LOCAL_EVENTS[0]?.id === event.id
      ? BANNER_CONFIG.imageUrl : undefined,
    themeClass: "event-local",
    dishIds: dishes.filter((dish) => dish.active && dish.type === "limited" && dish.limitedEventId === event.id).map((dish) => dish.id),
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    active: override === event.id || (override !== "none" && (override === null || override === "auto") && isLimitedEventActive(event, now)),
    local: true,
  }))
  return [...local, ...seasonal]
}

export function getAnnouncementEvent(dishes: Dish[], now = new Date()): FeaturedEvent | null {
  return getFeaturedEvents(dishes, now)
    .filter((event) => event.active && event.bannerImage && event.dishIds.length > 0)
    .sort((a, b) => Date.parse(b.startsAt ?? "") - Date.parse(a.startsAt ?? ""))[0] ?? null
}
import localEvents from "../infrastructure/events/limitedEvents.json"
import { BANNER_CONFIG } from "../infrastructure/banner/bannerConfig"
import type { Dish } from "./models"
import { getDateKey } from "./dateKey"
import { isLimitedEventActive } from "./limitedEvents"

export interface LocalLimitedEvent {
  id: string
  title: string
  startsAt: string
  endsAt: string
  bannerId?: string
}

export interface FeaturedEvent {
  id: string
  title: string
  description: string
  icon: string
  bannerImage?: string
  themeClass: string
  dishIds: string[]
  startsAt?: string
  endsAt?: string
  active: boolean
  local: boolean
}

export const LOCAL_EVENTS: LocalLimitedEvent[] = localEvents
