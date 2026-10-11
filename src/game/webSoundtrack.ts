import type { MusicAsset, MusicTrack } from "./audioScore"

export const WEB_SCORES = {
  lobby: { title: "Chợ lên đèn", theme: "lobby", mood: "Một lời chào trước chuyến đi" },
  expedition: { title: "Bước qua sương", theme: "expedition", mood: "Tiếng bước chân, một con đường mới" },
  "story-warm": { title: "Chuyện bên nồi ấm", theme: "story-warm", mood: "Dành chỗ cho lời kể" },
  "story-mystery": { title: "Tên còn trong sổ", theme: "story-mystery", mood: "Những điều chưa được nói" },
  "auto-prepare": { title: "Sắp mâm trước hội", theme: "auto-prepare", mood: "Mua quân, phối hệ, giữ nhịp" },
  "auto-story": { title: "Người giữ bếp", theme: "auto-story", mood: "Một câu chuyện giữa các vòng" },
  "v4-market-warm": { title: "Hai giọng, một phiên chợ", theme: "market-warm", mood: "Đèn ấm và tiếng rao" },
  "v4-harbor-warm": { title: "Thư tới sau mưa", theme: "harbor-warm", mood: "Để người nhận có thời gian trả lời" },
  "v4-kitchen-warm": { title: "Ghế dành cho ngày mai", theme: "kitchen-warm", mood: "Một bữa cơm cho người đang sống" },
} satisfies Partial<Record<MusicTrack, { title: string; theme: string; mood: string }>>

export function streamingMusicPath(asset: MusicAsset): string | null {
  const retro = asset.startsWith("8bit-")
  const key = (retro ? asset.slice(5) : asset) as keyof typeof WEB_SCORES
  const score = WEB_SCORES[key]
  return score ? `assets/v4/audio/web410/${retro ? "8bit" : "original"}-${score.theme}.mp3` : null
}
