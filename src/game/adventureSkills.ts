import { CARD_MAP } from "./catalog"
import type { School } from "./types"

export type AdventureStatus = "burn" | "soaked" | "rooted" | "drowsy" | null
export interface AdventureSkill {
  id: string
  name: string
  school: School | null
  power: number
  pp: number
  unlock: number
  effect?: AdventureStatus | "heal" | "shield" | "cleanse"
  description: string
}
export const STATUS_NAMES = {
  burn: "Bỏng hương",
  soaked: "Ướt lạnh",
  rooted: "Bám rễ",
  drowsy: "Mơ màng",
}
export const ADVENTURE_SKILLS: AdventureSkill[] = [
  {
    id: "ladle",
    name: "Nhịp Muôi",
    school: null,
    power: 0.9,
    pp: 30,
    unlock: 1,
    description: "Đòn thường, không bị tương khắc hệ.",
  },
  {
    id: "ember-spark",
    name: "Tia Bếp",
    school: "ember",
    power: 1.15,
    pp: 18,
    unlock: 1,
    description: "Tấn công bằng ngọn lửa bếp.",
  },
  {
    id: "ember-smoke",
    name: "Khói Nồng",
    school: "ember",
    power: 0.8,
    pp: 10,
    unlock: 8,
    effect: "burn",
    description: "Gây Bỏng hương trong 3 lượt: mất HP và giảm lực đánh.",
  },
  {
    id: "ember-feast",
    name: "Đại Tiệc Lửa",
    school: "ember",
    power: 1.8,
    pp: 5,
    unlock: 14,
    description: "Đòn lửa mạnh, PP giới hạn.",
  },
  {
    id: "tide-wave",
    name: "Sóng Nước Dùng",
    school: "tide",
    power: 1.15,
    pp: 18,
    unlock: 1,
    description: "Một lớp sóng hương biển.",
  },
  {
    id: "tide-rain",
    name: "Mưa Ký Ức",
    school: "tide",
    power: 0.8,
    pp: 10,
    unlock: 8,
    effect: "soaked",
    description: "Ướt lạnh 3 lượt: giảm tốc độ.",
  },
  {
    id: "tide-current",
    name: "Triều Dâng",
    school: "tide",
    power: 1.8,
    pp: 5,
    unlock: 14,
    description: "Gọi con nước, gây sát thương lớn.",
  },
  {
    id: "grove-leaf",
    name: "Lá Xoáy",
    school: "grove",
    power: 1.15,
    pp: 18,
    unlock: 1,
    description: "Lá thơm xoay quanh đối thủ.",
  },
  {
    id: "grove-root",
    name: "Rễ Giữ Vị",
    school: "grove",
    power: 0.8,
    pp: 10,
    unlock: 8,
    effect: "rooted",
    description: "Bám rễ 3 lượt: rút HP cuối lượt.",
  },
  {
    id: "grove-spring",
    name: "Mùa Xanh",
    school: "grove",
    power: 1.4,
    pp: 5,
    unlock: 14,
    effect: "heal",
    description: "Tấn công và hồi 25% HP tối đa.",
  },
  {
    id: "hearth-bowl",
    name: "Mâm Đồng",
    school: "hearth",
    power: 1.15,
    pp: 18,
    unlock: 1,
    description: "Sức nặng của mâm cơm nhà.",
  },
  {
    id: "hearth-shelter",
    name: "Mái Bếp",
    school: "hearth",
    power: 0,
    pp: 10,
    unlock: 8,
    effect: "shield",
    description: "Chặn phần lớn đòn tiếp theo.",
  },
  {
    id: "hearth-banquet",
    name: "Bữa Cơm Nhà",
    school: "hearth",
    power: 1.8,
    pp: 5,
    unlock: 14,
    description: "Hợp hương thành đòn đánh lớn.",
  },
  {
    id: "sugar-glow",
    name: "Hạt Ngọt",
    school: "sugar",
    power: 1.15,
    pp: 18,
    unlock: 1,
    description: "Ánh ngọt lấp lánh.",
  },
  {
    id: "sugar-dream",
    name: "Giấc Trăng",
    school: "sugar",
    power: 0.7,
    pp: 10,
    unlock: 8,
    effect: "drowsy",
    description: "Mơ màng 3 lượt: có thể bỏ lượt.",
  },
  {
    id: "sugar-moon",
    name: "Trăng Viên Mãn",
    school: "sugar",
    power: 1.4,
    pp: 5,
    unlock: 14,
    effect: "cleanse",
    description: "Tấn công, gỡ trạng thái và hồi 15% HP.",
  },
]
export const SKILL_MAP = Object.fromEntries(
  ADVENTURE_SKILLS.map((skill) => [skill.id, skill]),
) as Record<string, AdventureSkill>
export const SCHOOL_ORDER: School[] = [
  "ember",
  "grove",
  "tide",
  "hearth",
  "sugar",
]
// One directed cycle. The reverse match is resistant; all other matchups are neutral.
export function schoolMultiplier(attacker: School, defender: School) {
  const a = SCHOOL_ORDER.indexOf(attacker),
    d = SCHOOL_ORDER.indexOf(defender)
  return (a + 1) % 5 === d ? 1.5 : (d + 1) % 5 === a ? 0.67 : 1
}
export function skillsFor(cardId: string, level: number) {
  const school = CARD_MAP[cardId].school
  return ADVENTURE_SKILLS.filter(
    (skill) =>
      (skill.school === school || skill.school === null) &&
      level >= skill.unlock,
  )
}
export function fullPP(cardId: string, level: number) {
  return Object.fromEntries(
    skillsFor(cardId, level).map((skill) => [skill.id, skill.pp]),
  )
}
export function spiritMaxHp(cardId: string, level: number) {
  return 12 + (CARD_MAP[cardId]?.health ?? 3) * 2 + level * 2
}
export function spiritAttack(cardId: string, level: number) {
  return 2 + (CARD_MAP[cardId]?.attack ?? 2) + Math.floor(level / 2)
}
export function spiritSpeed(
  cardId: string,
  level: number,
  status: AdventureStatus = null,
) {
  const bases: Record<School, number> = {
    ember: 12,
    tide: 9,
    grove: 8,
    hearth: 6,
    sugar: 11,
  }
  return Math.max(
    1,
    bases[CARD_MAP[cardId].school] + level - (status === "soaked" ? 8 : 0),
  )
}
export function xpForNext(level: number) {
  return 10 + level * 4
}
