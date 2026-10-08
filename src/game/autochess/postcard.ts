import type { AutoRun } from "./types"
import { UNIT_MAP } from "./catalog"
export async function downloadAutoPostcard(run: AutoRun) {
  const canvas = document.createElement("canvas")
  canvas.width = 960
  canvas.height = 540
  const ctx = canvas.getContext("2d")!
  const image = new Image()
  image.src = "/assets/autochess/world.webp"
  await image.decode()
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth / 2,
    image.naturalHeight / 2,
    0,
    0,
    960,
    540,
  )
  ctx.fillStyle = "rgba(7,20,29,.84)"
  ctx.fillRect(0, 0, 960, 540)
  ctx.strokeStyle = "#e8c27c"
  ctx.lineWidth = 2
  ctx.strokeRect(24, 24, 912, 492)
  ctx.fillStyle = "#ebcc93"
  ctx.font = "24px sans-serif"
  ctx.fillText("MEALGACHA · CHỢ ĐÊM VỊ LINH", 58, 80)
  ctx.font = "bold 76px sans-serif"
  ctx.fillStyle = "#fff2cf"
  ctx.fillText(`${run.score.toLocaleString("vi-VN")} điểm`, 58, 182)
  ctx.font = "28px sans-serif"
  ctx.fillStyle = "#bce3dc"
  ctx.fillText(
    `Đợt thắng ${run.bestWave} · ${Math.floor(run.activeTicks / 1200)} phút giao chiến`,
    58,
    232,
  )
  ctx.font = "22px sans-serif"
  ctx.fillStyle = "#e1d2b9"
  run.roster
    .filter((p) => p.cell !== null)
    .forEach((p, i) =>
      ctx.fillText(
        `${"★".repeat(p.star)} ${UNIT_MAP[p.id].name}`,
        58 + (i % 2) * 430,
        300 + Math.floor(i / 2) * 36,
      ),
    )
  ctx.font = "16px sans-serif"
  ctx.fillStyle = "#d0bea1"
  ctx.fillText(
    `${run.mode.toUpperCase()} · seed ${run.seed} · luật ${run.rulesVersion} · ${run.day}`,
    58,
    482,
  )
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(Error("Postcard failed"))),
      "image/png",
    ),
  )
  const url = URL.createObjectURL(blob),
    a = document.createElement("a")
  a.href = url
  a.download = "mealgacha-cho-dem-ky-luc.png"
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
