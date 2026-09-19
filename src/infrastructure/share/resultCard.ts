import type { RewardInstance } from "../../domain/models"
import { getFoodAssetUrl } from "../assets/foodAssets"

const COLORS = { common: "#7dacc2", rare: "#6fe6f4", epic: "#e8c777", diamond: "#d8faff" }

async function loadArt(url: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.crossOrigin = "anonymous"
  image.src = url
  await image.decode()
  return image
}

export async function renderResultCard(reward: RewardInstance): Promise<File> {
  const canvas = document.createElement("canvas")
  canvas.width = 1080; canvas.height = 1350
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xuất ảnh.")
  const rarity = reward.rarity || "common"
  const color = COLORS[rarity]
  const gradient = ctx.createLinearGradient(0, 0, 900, 1350)
  gradient.addColorStop(0, "#0b2639"); gradient.addColorStop(.6, "#081522"); gradient.addColorStop(1, "#19123c")
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1350)
  ctx.strokeStyle = color; ctx.lineWidth = rarity === "diamond" ? 12 : 5
  ctx.strokeRect(32, 32, 1016, 1286)
  ctx.fillStyle = "#e8c777"; ctx.font = "bold 40px sans-serif"; ctx.textAlign = "center"
  ctx.fillText("MEAL GACHA", 540, 126)
  ctx.fillStyle = color; ctx.font = "bold 48px sans-serif"; ctx.fillText(rarity.toUpperCase(), 540, 205)
  const artUrl = getFoodAssetUrl(reward.dishId, "full") || reward.dish.imageUrl
  if (artUrl) {
    try {
      const art = await loadArt(artUrl)
      const scale = Math.max(620 / art.width, 620 / art.height)
      const width = art.width * scale; const height = art.height * scale
      ctx.save(); ctx.beginPath(); ctx.rect(230, 270, 620, 620); ctx.clip(); ctx.drawImage(art, 540 - width / 2, 580 - height / 2, width, height); ctx.restore()
    } catch { /* Art fallback: the card still exports. */ }
  }
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.strokeRect(225, 265, 630, 630)
  ctx.fillStyle = "#e9f5fa"; ctx.font = "bold 56px sans-serif"
  const name = reward.dish.name.length > 25 ? reward.dish.name.slice(0, 24) + "…" : reward.dish.name
  ctx.fillText(name, 540, 1000)
  ctx.fillStyle = color; ctx.font = "bold 32px sans-serif"; ctx.fillText(reward.source === "fusion" ? "⚡ DUNG HỢP THÀNH CÔNG" : "KHAI MỞ PHẦN THƯỞNG", 540, 1073)
  ctx.fillStyle = "#8eaebd"; ctx.font = "28px sans-serif"; ctx.fillText("Không biết ăn gì? Để nhân phẩm quyết định.", 540, 1185)
  ctx.fillText("MEALGACHA", 540, 1260)
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Không xuất được ảnh.")), "image/png"))
  return new File([blob], `mealgacha-${reward.dishId}.png`, { type: "image/png" })
}

export async function shareResultCard(reward: RewardInstance): Promise<"shared" | "downloaded"> {
  const file = await renderResultCard(reward)
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: `MealGacha: ${reward.dish.name}`, text: "Hôm nay nhân phẩm chọn món này!" })
    return "shared"
  }
  const url = URL.createObjectURL(file)
  const link = document.createElement("a"); link.href = url; link.download = file.name; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return "downloaded"
}
