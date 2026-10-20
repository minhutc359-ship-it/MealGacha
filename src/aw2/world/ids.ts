import { STARTER_ASSETS } from "../assets/starters"

export const ZONE_IDS = [
  "aw2-zone-covenant-village", "aw2-zone-lantern-street", "aw2-zone-forgotten-kitchen-yard",
  "aw2-zone-kitchen-pantry", "aw2-zone-kitchen-hearth", "aw2-zone-kitchen-table",
] as const
export type ZoneId = typeof ZONE_IDS[number]
export const SPIRIT_IDS = ["aw2-than", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-suong", "aw2-muoi", "aw2-nhien", "aw2-hai", "aw2-lien", "aw2-moc", "aw2-bach", "aw2-van"] as const
export const STARTER_TEAM = SPIRIT_IDS.slice(0, 5)
export const QUEST_IDS = ["aw2-quest-kept-seat", "aw2-quest-three-memories", "aw2-quest-open-hearth", "aw2-quest-one-more-bowl"] as const
export const MEMORY_IDS = ["aw2-event-memory-vendor", "aw2-event-memory-chair", "aw2-event-memory-bowl"] as const
export const QUEST_GRANTS = ["aw2-grant-kept-seat", "aw2-grant-three-memories", "aw2-grant-open-hearth", "aw2-grant-one-more-bowl"] as const

export const ROSTER = SPIRIT_IDS.map((spiritId, index) => ({
  spiritId,
  displayName: ["Than", "Lửa Nhỏ", "Lam Lam", "Mộc Non", "Sương Lành", "Muối Đen", "Nhiên", "Hải", "Liên", "Mộc", "Bách", "Vân"][index],
  recipeAffiliation: ["Cơm tấm", "Bánh mì", "Phở", "Gỏi cuốn", "Bánh cuốn", "Muối rang", "Bún bò", "Canh chua", "Chè sen", "Cốm", "Bánh chưng", "Bữa ăn thất lạc"][index],
  rarity: (["N", "N", "N", "R", "R", "R", "SR", "SR", "SR", "SSR", "SSR", "UR"] as const)[index],
  role: ["Tank", "Striker", "Healer", "Support", "Mage", "Debuffer", "Striker", "Tank", "Healer", "Mage", "Tank", "Hybrid"][index],
  assets: STARTER_ASSETS[spiritId]
    ? { status: "REFERENCE_ASSETS_REVIEWED" as const, world: STARTER_ASSETS[spiritId].assets.world.id, battle: STARTER_ASSETS[spiritId].assets.battle.id, portrait: STARTER_ASSETS[spiritId].assets.portrait.id }
    : { status: "NOT_CREATED" as const, world: null, battle: null, portrait: null },
}))
