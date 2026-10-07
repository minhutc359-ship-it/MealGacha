import { CARD_MAP } from "./catalog"
import { CHARACTER_ART } from "./characters"
import { RECIPES } from "./recipes"
import { weeklyPoints } from "./journeys"
import type { Battle } from "./types"
export interface PostcardInput {
  battle?: Battle
  deck?: {
    name: string
    cards: string[]
  }
}
function image(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const picture = new Image()
    picture.onload = () => resolve(picture)
    picture.onerror = () =>
      reject(new Error("Không tải được hình bưu thiếp. Hãy thử lại."))
    picture.src = src
  })
}
export async function createPostcard({
  battle,
  deck,
}: PostcardInput): Promise<Blob> {
  const ids = [
    ...new Set(deck?.cards ?? battle?.player.board.map((u) => u.cardId) ?? []),
  ]
    .filter((id) => CARD_MAP[id]?.kind === "unit")
    .slice(0, 3)
  const [board, hero, foods] = await Promise.all([
    image("/assets/tcg/boards/home.webp"),
    image(CHARACTER_ART.hero),
    Promise.all(
      ids.map((id) =>
        CARD_MAP[id]?.art ? image(CARD_MAP[id].art!) : Promise.resolve(null),
      ),
    ),
  ])
  const canvas = document.createElement("canvas")
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Thiết bị chưa hỗ trợ xuất ảnh.")
  ctx.fillStyle = "#0d2527"
  ctx.fillRect(0, 0, 1080, 1350)
  ctx.drawImage(board, 0, 0, 1080, 1350)
  ctx.fillStyle = "#092425df"
  ctx.fillRect(0, 0, 1080, 1350)
  ctx.strokeStyle = "#d8b777"
  ctx.lineWidth = 3
  ctx.strokeRect(40, 40, 1000, 1270)
  const text = (
    value: string,
    y: number,
    size = 34,
    color = "#e6dfc8",
    max = 920,
  ) => {
    ctx.fillStyle = color
    ctx.font = `${size >= 50 ? "bold " : ""}${size}px ${
      size >= 50 ? "Georgia" : "sans-serif"
    }`
    ctx.textAlign = "center"
    ctx.fillText(value, 540, y, max)
  }
  text("MEALGACHA · BÀN KÝ ỨC", 115, 30, "#ddbd82")
  text(
    deck
      ? "Công thức của tôi"
      : battle?.result === "win"
        ? "Một bàn ăn được giữ lại"
        : "Ngọn lửa vẫn còn",
    195,
    54,
  )
  text(deck?.name ?? battle?.opponent ?? "Người giữ vị", 254, 30)
  ctx.save()
  ctx.beginPath()
  ctx.arc(540, 453, 153, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(hero, 387, 300, 306, 306)
  ctx.restore()
  ctx.strokeStyle = "#d8b777"
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(540, 453, 155, 0, Math.PI * 2)
  ctx.stroke()
  text(
    deck
      ? `${deck.cards.length} lá · ${deck.cards.filter((id) => CARD_MAP[id].kind === "unit").length} đồng minh`
      : `Lượt ${battle?.round ?? 1} · Ý chí ${Math.max(0, battle?.player.health ?? 0)} · ${
          battle?.weekly
            ? "Thử thách tuần"
            : battle?.sideQuest
              ? "Lời hứa bên bếp"
              : "Hành trình"
        }`,
    685,
    32,
  )
  if (battle?.weekly)
    text(
      `Tuần ${battle.weekly.week} · Chặng ${battle.weekly.index + 1}/3 · ${battle.weekly.score ?? weeklyPoints(battle)} điểm`,
      735,
      26,
      "#e4bf7b",
    )
  const combo = RECIPES.filter(
    (r) => (battle?.comboCounts?.[r.id] ?? 0) > 0,
  ).map((r) => r.name)
  if (combo.length)
    text(combo.join(" · "), battle?.weekly ? 775 : 735, 25, "#e4bf7b")
  for (let i = 0; i < foods.length; i++) {
    const x = 150 + i * 270
    ctx.fillStyle = "#193c3e"
    ctx.fillRect(x, 790, 240, 170)
    if (foods[i]) ctx.drawImage(foods[i]!, x, 790, 240, 170)
    ctx.fillStyle = "#ecdcb4"
    ctx.font = "24px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(CARD_MAP[ids[i]].name, x + 120, 1004, 245)
  }
  text("Mỗi món ăn giữ một câu chuyện.", 1100, 34, "#e7c38b")
  text("Mời bạn giữ một chỗ bên bếp Việt Nam.", 1154, 30)
  text("Thẻ bài · Ký ức · Những người cùng bàn", 1240, 23, "#9bb3a8")
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Không xuất được ảnh.")),
      "image/png",
    ),
  )
}
