import { MUSIC_TRACKS, type MusicAsset, type MusicTrack } from "./audioScore"

export const WEB_SCORES = {
  "mode-chest": { title: "Lời Mời Khai Vị", mood: "Khoảnh khắc rương vị giác thức tỉnh" },
  "mode-tcg": { title: "Ván Bài Bên Bếp", mood: "Nhịp đấu trí của Thẻ Vị Linh" },
  "mode-autochess": { title: "Bày Mâm Xuất Trận", mood: "Sắp đội hình và giữ nhịp giao tranh" },
  "mode-adventure": { title: "Đường Qua Sương", mood: "Lên đường cùng ba người bạn" },
  "map-lantern": { title: "Phố Đèn Gọi Tên", mood: "Ánh đèn ấm giữa phiên chợ cũ" },
  "map-harbor": { title: "Than Hồng Sau Mưa", mood: "Con tàu tìm lại đường về" },
  "map-garden": { title: "Lời Hứa Dưới Tán", mood: "Khu vườn thở lại sau màn sương" },
  "map-tide": { title: "Trăng Trên Lòng Chảo", mood: "Nhịp nước dưới vầng trăng lạnh" },
  "map-tea": { title: "Mây Qua Đỉnh Trà", mood: "Gió cao và hương trà ngọc" },
  "map-salt": { title: "Nhịp Lò Muối Đỏ", mood: "Nhịp búa vang trong lò nung" },
  "map-lotus": { title: "Sen Nguyệt Thức Giấc", mood: "Mặt nước yên và cánh sen sáng" },
  "map-aroma": { title: "Vũ Khúc Vạn Hương", mood: "Điệu múa của trăm tầng gia vị" },
  boss: { title: "Ngũ Vị Quyết Chiến", mood: "Chủ đề chung cho mọi trận thủ lĩnh" },
} satisfies Partial<Record<MusicTrack, { title: string; mood: string }>>

export function streamingMusicPath(asset: MusicAsset): string | null {
  return MUSIC_TRACKS[asset] ?? null
}
