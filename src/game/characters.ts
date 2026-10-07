import type { NpcId } from "./types"
import { STAGE_MAP } from "./story"
export const CHARACTER_ART = {
  hero: "/assets/tcg/characters/hero.webp",
  bach: "/assets/tcg/characters/bach.webp",
  nhien: "/assets/tcg/characters/nhien.webp",
  moc: "/assets/tcg/characters/moc.webp",
  hai: "/assets/tcg/characters/hai.webp",
  lien: "/assets/tcg/characters/lien.webp",
  grandmother: "/assets/tcg/characters/grandmother.webp",
  mist: "/assets/tcg/characters/mist.webp",
} as const
export type CharacterId = keyof typeof CHARACTER_ART
export const NPC_NAMES: Record<NpcId, string> = {
  bach: "Bách",
  nhien: "Nhiên",
  moc: "Mộc",
  hai: "Hải",
  lien: "Liên",
}
export function speakerCharacter(speaker: string): CharacterId | null {
  if (speaker === "Bạn") return "hero"
  if (speaker.includes("Bà") && !speaker.includes("Bài")) return "grandmother"
  const id = (Object.keys(NPC_NAMES) as NpcId[]).find((id) =>
    speaker.includes(NPC_NAMES[id]),
  )
  return (
    id ?? (/(Sương|Canh Bếp|Cổ Thụ|Ảo ảnh|Nuốt)/i.test(speaker) ? "mist" : null)
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
