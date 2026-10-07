import { parseGame } from "./storage"
import type { GameSave } from "./types"

const MAX_BYTES = 1_000_000
const MAX_CODE = 2_000_000
const PREFIX = "MGC1"
export const TRANSFER_BACKUP_KEY = "foodchest.tcg.transfer.previous"
export interface SaveCodePreview {
  save: GameSave
  exportedAt: string
}
function cryptoApi() {
  if (!globalThis.crypto?.subtle)
    throw new Error(
      "Mã tiến trình cần HTTPS hoặc localhost. Bạn vẫn có thể dùng bản lưu JSON.",
    )
  return globalThis.crypto
}
function encode(bytes: Uint8Array) {
  let text = ""
  for (let i = 0; i < bytes.length; i += 8192)
    text += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
function decode(text: string) {
  if (!text || !/^[A-Za-z0-9_-]+$/.test(text) || text.length % 4 === 1)
    throw new Error("Mã có ký tự hoặc độ dài không hợp lệ.")
  const raw = atob(text.replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}
function buffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer
}
async function bounded(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader(),
    chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_BYTES) {
        await reader.cancel()
        throw new Error("Bản lưu vượt giới hạn dung lượng.")
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(total)
  let position = 0
  for (const chunk of chunks) {
    bytes.set(chunk, position)
    position += chunk.length
  }
  return bytes
}
export async function createSaveCode(
  save: GameSave,
  compress = true,
): Promise<string> {
  if (!parseGame(save)) throw new Error("Tiến trình hiện tại không hợp lệ.")
  const api = cryptoApi()
  let bytes: Uint8Array = new TextEncoder().encode(
    JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), save }),
  )
  if (bytes.length > MAX_BYTES)
    throw new Error("Bản lưu vượt giới hạn dung lượng.")
  const codec = compress && typeof CompressionStream !== "undefined" ? "g" : "n"
  if (codec === "g")
    bytes = await bounded(
      new Blob([buffer(bytes)])
        .stream()
        .pipeThrough(new CompressionStream("gzip")),
    )
  const keyBytes = api.getRandomValues(new Uint8Array(32)),
    iv = api.getRandomValues(new Uint8Array(12))
  const key = await api.subtle.importKey(
    "raw",
    buffer(keyBytes),
    "AES-GCM",
    false,
    ["encrypt"],
  )
  const encrypted = await api.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: buffer(iv),
      additionalData: new TextEncoder().encode(`${PREFIX}.${codec}`),
      tagLength: 128,
    },
    key,
    buffer(bytes),
  )
  return [
    PREFIX,
    codec,
    encode(keyBytes),
    encode(iv),
    encode(new Uint8Array(encrypted)),
  ].join(".")
}
export async function readSaveCode(input: string): Promise<SaveCodePreview> {
  const text = input.trim()
  if (text.length > MAX_CODE) throw new Error("Mã tiến trình quá dài.")
  const parts = text.split(".")
  if (
    parts.length !== 5 ||
    parts[0] !== PREFIX ||
    !["g", "n"].includes(parts[1])
  )
    throw new Error("Hãy dán nguyên mã MGC1 từ thiết bị cũ.")
  const keyBytes = decode(parts[2]),
    iv = decode(parts[3]),
    ciphertext = decode(parts[4])
  if (
    keyBytes.length !== 32 ||
    iv.length !== 12 ||
    ciphertext.length < 16 ||
    ciphertext.length > MAX_BYTES + 16
  )
    throw new Error("Mã tiến trình bị thiếu hoặc sai kích thước.")
  const api = cryptoApi(),
    key = await api.subtle.importKey(
      "raw",
      buffer(keyBytes),
      "AES-GCM",
      false,
      ["decrypt"],
    )
  let bytes: Uint8Array
  try {
    bytes = new Uint8Array(
      await api.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: buffer(iv),
          additionalData: new TextEncoder().encode(`${PREFIX}.${parts[1]}`),
          tagLength: 128,
        },
        key,
        buffer(ciphertext),
      ),
    )
  } catch {
    throw new Error(
      "Không thể giải mã. Mã bị thiếu hoặc đã thay đổi; hãy copy lại toàn bộ.",
    )
  }
  if (parts[1] === "g") {
    if (typeof DecompressionStream === "undefined")
      throw new Error(
        "Trình duyệt này chưa đọc được mã nén. Hãy tạo mã tương thích ở thiết bị cũ.",
      )
    try {
      bytes = await bounded(
        new Blob([buffer(bytes)])
          .stream()
          .pipeThrough(new DecompressionStream("gzip")),
      )
    } catch {
      throw new Error("Dữ liệu nén không hợp lệ hoặc vượt giới hạn dung lượng.")
    }
  }
  if (bytes.length > MAX_BYTES)
    throw new Error("Bản lưu vượt giới hạn dung lượng.")
  let raw: unknown
  try {
    raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))
  } catch {
    throw new Error("Dữ liệu trong mã không hợp lệ.")
  }
  if (
    !raw ||
    typeof raw !== "object" ||
    !("version" in raw) ||
    raw.version !== 1 ||
    !("save" in raw) ||
    !("exportedAt" in raw) ||
    typeof raw.exportedAt !== "string" ||
    !Number.isFinite(Date.parse(raw.exportedAt))
  )
    throw new Error("Phiên bản bản lưu không được hỗ trợ.")
  const save = parseGame(raw.save)
  if (!save)
    throw new Error(
      "Tiến trình trong mã không hợp lệ. Bản lưu hiện tại được giữ nguyên.",
    )
  return { save, exportedAt: raw.exportedAt }
}
