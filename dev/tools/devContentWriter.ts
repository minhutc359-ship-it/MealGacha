import type { Plugin } from "vite"
import type { IncomingMessage, ServerResponse } from "node:http"
import fs from "node:fs"
import path from "node:path"

const isSlug = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
const root = process.cwd()
const dishFile = path.join(root, "src/infrastructure/catalog/localDishes.json")
const eventFile = path.join(root, "src/infrastructure/events/limitedEvents.json")
const bannerFile = path.join(root, "src/infrastructure/banner/bannerConfig.ts")
const imageDir = path.join(root, "public/assets/food/full")
const bannerDir = path.join(root, "public/assets/banners")

function respond(res: ServerResponse, status: number, result: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.end(JSON.stringify(result))
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let input = ""
  for await (const chunk of req) {
    input += chunk
    if (input.length > 8_000_000) throw new Error("Ảnh vượt quá dung lượng cho phép (6 MB).")
  }
  return JSON.parse(input)
}

function writeJson(file: string, value: unknown) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function webpData(data: unknown): Buffer | null {
  if (!data) return null
  if (typeof data !== "string") throw new Error("Dữ liệu ảnh không hợp lệ.")
  const match = /^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/.exec(data)
  if (!match) throw new Error("Ảnh món cần ở định dạng WebP.")
  const bytes = Buffer.from(match[1], "base64")
  if (!bytes.length || bytes.length > 6_000_000) throw new Error("Ảnh món vượt quá 6 MB.")
  return bytes
}

function writeBanner(config: { id: string; imageUrl: string; enabled: boolean; eventId?: string; startsAt?: string; endsAt?: string }) {
  fs.writeFileSync(bannerFile, `export interface BannerConfig {\n  id: string\n  imageUrl: string\n  enabled: boolean\n  eventId?: string\n  startsAt?: string\n  endsAt?: string\n}\n\nexport const BANNER_CONFIG: BannerConfig = ${JSON.stringify(config, null, 2)}\n`)
}

export function devContentWriter(): Plugin {
  return {
    name: "meal-gacha-dev-content-writer",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0]
        if (!url?.startsWith("/__meal-gacha/dev/")) return next()
        if (!["POST", "PUT", "DELETE"].includes(req.method ?? "")) return respond(res, 405, { error: "Method not allowed" })
        try {
          const payload = await readJson(req)
          if (url === "/__meal-gacha/dev/dish") {
            if (!payload || typeof payload !== "object" || Array.isArray(payload)) return respond(res, 400, { error: "Món không hợp lệ" })
            const dish = payload as Record<string, unknown>
            if (!isSlug(dish.id)) return respond(res, 400, { error: "ID món không hợp lệ" })
            const entries = JSON.parse(fs.readFileSync(dishFile, "utf8")) as Array<Record<string, unknown>>
            const existing = entries.find((entry) => entry.id === dish.id)
            if (req.method === "DELETE") {
              if (!existing) return respond(res, 404, { error: "Không tìm thấy món local" })
              writeJson(dishFile, entries.filter((entry) => entry.id !== dish.id))
              return respond(res, 200, { ok: true })
            }
            if ((req.method === "POST" && existing) || (req.method === "PUT" && !existing)) return respond(res, 409, { error: "ID món đã tồn tại hoặc chưa được tạo" })
            if (typeof dish.name !== "string" || !dish.name.trim() ||
              !Array.isArray(dish.mealSlots) || !dish.mealSlots.length ||
              !dish.mealSlots.every((slot) => ["breakfast", "lunch", "dinner"].includes(slot)) ||
              typeof dish.weight !== "number" || dish.weight <= 0 || dish.weight > 1000 ||
              typeof dish.active !== "boolean") return respond(res, 400, { error: "Thiếu thông tin món, bữa ăn hoặc weight" })
            const image = webpData(dish.imageData)
            const saved = { ...dish }
            delete saved.imageData
            if (image) {
              fs.mkdirSync(imageDir, { recursive: true })
              fs.writeFileSync(path.join(imageDir, `${dish.id}.webp`), image)
              saved.imageUrl = `/assets/food/full/${dish.id}.webp`
            }
            writeJson(dishFile, [...entries.filter((entry) => entry.id !== dish.id), saved])
            return respond(res, 200, { ok: true, dish: saved })
          }
          if (url === "/__meal-gacha/dev/events" && req.method === "POST") {
            if (!Array.isArray(payload) || !payload.every((item) => item && isSlug(item.id) &&
              typeof item.title === "string" && item.title.trim() &&
              typeof item.startsAt === "string" && typeof item.endsAt === "string" &&
              Number.isFinite(Date.parse(item.startsAt)) && Number.isFinite(Date.parse(item.endsAt)) &&
              Date.parse(item.startsAt) < Date.parse(item.endsAt))) return respond(res, 400, { error: "ID, tên hoặc thời gian sự kiện không hợp lệ" })
            if (new Set(payload.map((item) => item.id)).size !== payload.length) return respond(res, 400, { error: "ID sự kiện bị trùng" })
            writeJson(eventFile, payload)
            return respond(res, 200, { ok: true })
          }
          if (url === "/__meal-gacha/dev/banner") {
            if (req.method === "DELETE") {
              writeBanner({ id: "local-banner", imageUrl: "", enabled: false })
              return respond(res, 200, { ok: true })
            }
            if (!payload || typeof payload !== "object" || Array.isArray(payload)) return respond(res, 400, { error: "Banner không hợp lệ" })
            const data = payload as Record<string, unknown>
            if (!isSlug(data.id)) return respond(res, 400, { error: "ID banner không hợp lệ" })
            let imageUrl: string
            if (typeof data.imageData === "string") {
              const match = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(data.imageData)
              if (!match) return respond(res, 400, { error: "Chọn ảnh WebP, PNG hoặc JPEG" })
              const bytes = Buffer.from(match[2], "base64")
              if (!bytes.length || bytes.length > 6_000_000) return respond(res, 400, { error: "Ảnh banner vượt quá 6 MB" })
              const extension = match[1] === "jpeg" ? "jpg" : match[1]
              fs.mkdirSync(bannerDir, { recursive: true })
              imageUrl = `/assets/banners/${data.id}.${extension}`
              fs.writeFileSync(path.join(bannerDir, `${data.id}.${extension}`), bytes)
            } else if (typeof data.imageUrl === "string" && /^\/assets\/banners\/[a-z0-9-]+\.(webp|png|jpg)$/.test(data.imageUrl) && fs.existsSync(path.join(root, "public", data.imageUrl.slice(1)))) {
              imageUrl = data.imageUrl
            } else return respond(res, 400, { error: "Chọn ảnh banner đã có hoặc tải ảnh mới" })
            writeBanner({ id: data.id, imageUrl, enabled: data.enabled === true,
              eventId: typeof data.eventId === "string" ? data.eventId : undefined,
              startsAt: typeof data.startsAt === "string" ? data.startsAt : undefined,
              endsAt: typeof data.endsAt === "string" ? data.endsAt : undefined })
            return respond(res, 200, { ok: true, imageUrl })
          }
          return respond(res, 404, { error: "Not found" })
        } catch (error) {
          return respond(res, error instanceof SyntaxError ? 400 : 500, { error: error instanceof Error ? error.message : "Không thể lưu dữ liệu" })
        }
      })
    },
  }
}
