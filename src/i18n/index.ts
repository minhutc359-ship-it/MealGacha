import { useAppStore } from "../store/useAppStore"

export type Language = "vi" | "en"

const translations = {
  vi: {
    chest: "Rương vị giác", collection: "Bộ sưu tập", achievements: "Thành tựu", wheel: "Vòng quay", settings: "Cài đặt",
    today: "Hôm nay", checkIn: "Điểm danh nhận chìa", checkedIn: "Đã điểm danh", comeBackTomorrow: "Quay lại vào ngày mai",
    keys: "chìa khóa", rewards: "phần thưởng", fusions: "lần ghép", dailyQuest: "NHIỆM VỤ MỖI 3 GIỜ", limitedEvent: "SỰ KIỆN GIỚI HẠN", weeklyEvent: "SỰ KIỆN TUẦN",
    freeChest: "Rương miễn phí", collectionFoods: "Bộ sưu tập món", extendedAchievements: "THÀNH TỰU MỞ RỘNG", achievementProfile: "Hồ sơ chiến tích", streak: "Ngày liên tiếp",
    sound: "Âm thanh nghi thức", reducedMotion: "Giảm chuyển động", language: "Ngôn ngữ", vietnamese: "Tiếng Việt", english: "English",
    addDish: "Thêm món local", catalog: "Nguồn dữ liệu món ăn", keyHistory: "Lịch sử chìa khóa", save: "Lưu", close: "Đóng", cancel: "Hủy",
  },
  en: {
    chest: "Taste Chest", collection: "Collection", achievements: "Achievements", wheel: "Wheel", settings: "Settings",
    today: "Today", checkIn: "Check in for keys", checkedIn: "Checked in", comeBackTomorrow: "Come back tomorrow",
    keys: "keys", rewards: "rewards", fusions: "fusions", dailyQuest: "QUESTS EVERY 3 HOURS", limitedEvent: "LIMITED EVENT", weeklyEvent: "WEEKLY EVENT",
    freeChest: "Free chest", collectionFoods: "Food collection", extendedAchievements: "EXTENDED ACHIEVEMENTS", achievementProfile: "Achievement profile", streak: "Day streak",
    sound: "Ritual sound", reducedMotion: "Reduced motion", language: "Language", vietnamese: "Tiếng Việt", english: "English",
    addDish: "Add local dish", catalog: "Food data source", keyHistory: "Key history", save: "Save", close: "Close", cancel: "Cancel",
  },
} as const

export type TranslationKey = keyof typeof translations.vi

export function useLanguage() {
  const language = useAppStore((state) => state.user.preferences.language ?? "vi") as Language
  const updatePreference = useAppStore((state) => state.updatePreference)
  const t = (key: TranslationKey) => translations[language][key]
  return { language, t, setLanguage: (next: Language) => updatePreference("language", next) }
}
