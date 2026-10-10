import type { NpcId } from "./types"
import { STAGE_MAP } from "./story"
export const CHARACTER_ART = {
 an: "/assets/autochess/portraits.webp", sen: "/assets/autochess/portraits.webp", tinh: "/assets/autochess/portraits.webp",
  hero: "/assets/tcg/characters/anime/hero.webp",
  bach: "/assets/tcg/characters/anime/bach.webp",
  nhien: "/assets/tcg/characters/anime/nhien.webp",
  moc: "/assets/tcg/characters/anime/moc.webp",
  hai: "/assets/tcg/characters/anime/hai.webp",
  lien: "/assets/tcg/characters/anime/lien.webp",
  grandmother: "/assets/tcg/characters/anime/grandmother.webp",
  mist: "/assets/tcg/characters/anime/mist.webp",
  echo: "/assets/tcg/characters/anime/hero.webp",
  merchant: "/assets/tcg/characters/anime/merchant.webp",
  sailor: "/assets/tcg/characters/anime/sailor.webp",
  fisherman: "/assets/tcg/characters/anime/fisherman.webp",
  hieu: "/assets/tcg/characters/anime/hieu.webp",
  child: "/assets/tcg/characters/anime/child.webp",
  guest: "/assets/tcg/characters/anime/guest.webp",
  la: "/assets/tcg/characters/anime/la.webp",
  conductor: "/assets/tcg/characters/anime/conductor.webp",
} as const
export type CharacterId = keyof typeof CHARACTER_ART
export const NPC_NAMES: Record<NpcId, string> = {
  bach: "Bách",
  nhien: "Nhiên",
  moc: "Mộc",
  hai: "Hải",
  lien: "Liên",
}
export const CHARACTER_NAMES: Record<CharacterId, string> = {
  ...NPC_NAMES,
 an: "An", sen: "Bà Sen", tinh: "Tịnh",
  hero: "Người giữ vị",
  grandmother: "Bà",
  mist: "Linh ảnh trong sương",
  echo: "Sương Nhạt · Tiếng vọng",
  merchant: "Người bán hàng",
  sailor: "Thủy thủ",
  fisherman: "Ngư dân",
  hieu: "Nghệ nhân Hiệu",
  child: "Em bé cầm đèn",
  guest: "Người khách Nam Bộ",
  la: "Lả",
  conductor: "Người soát vé",
}
export function speakerCharacter(speaker: string): CharacterId | null {
  if (speaker === "An") return "an"
  if (speaker === "Bà Sen") return "sen"
  if (speaker === "Tịnh") return "tinh"
  if (speaker.startsWith("Mai")) return "echo"
  if (/Sổ Tự Sửa|Người Giữ Con Nước/.test(speaker)) return "mist"
  if (speaker.startsWith("Bạn")) return "hero"
  if (speaker === "Người kể") return null
  if (speaker.includes("Hiệu")) return "hieu"
  if (/^Bà(?:$| ·)/.test(speaker)) return "grandmother"
  if (speaker === "Sương Nhạt") return "echo"
  if (speaker.includes("bán hàng")) return "merchant"
  if (speaker.includes("Thủy thủ")) return "sailor"
  if (speaker.includes("Ngư dân")) return "fisherman"
  if (speaker === "Em bé") return "child"
  if (speaker.toLowerCase().includes("soát vé")) return "conductor"
  if (speaker.toLowerCase().includes("khách")) return "guest"
  if (speaker === "Lả") return "la"
  if (
    /(Hỏa Linh|Hải Vương|Thiên Nga|Ký Ức Không Tên|Cổ Thụ|Canh Bếp)/i.test(
      speaker,
    )
  )
    return "mist"
  const id = (Object.keys(NPC_NAMES) as NpcId[]).find((id) =>
    speaker.includes(NPC_NAMES[id]),
  )
  return (
    id ??
    (/(Sương|Canh Bếp|Cổ Thụ|Ảo ảnh|Nuốt|Hỏa Linh|Hải Vương|Thiên Nga|Ký Ức)/i.test(
      speaker,
    )
      ? "mist"
      : null)
  )
}
export function opponentCharacter(
  stageId: string | null,
  sideQuest?: NpcId,
): CharacterId {
  if (sideQuest) return sideQuest
  const stage = stageId ? STAGE_MAP[stageId] : null
  return stage?.boss
    ? "mist"
    : (speakerCharacter(stage?.opponent ?? "") ?? "mist")
}
