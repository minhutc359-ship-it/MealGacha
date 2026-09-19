import { repository, migrateUserState } from "../storage/repository"
import { listImages, putImage, type StoredImage } from "../storage/imageRepository"

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0) }
  return (crc ^ 0xffffffff) >>> 0
}

function zipEntry(name: string, data: Uint8Array, offset: number) {
  const filename = encoder.encode(name)
  const header = new Uint8Array(30 + filename.length)
  const view = new DataView(header.buffer)
  view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(6, 0x0800, true)
  view.setUint32(14, crc32(data), true); view.setUint32(18, data.length, true); view.setUint32(22, data.length, true); view.setUint16(26, filename.length, true)
  header.set(filename, 30)
  const central = new Uint8Array(46 + filename.length)
  const c = new DataView(central.buffer)
  c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true)
  c.setUint32(16, crc32(data), true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, filename.length, true); c.setUint32(42, offset, true)
  central.set(filename, 46)
  return { header, central }
}

export async function createFullBackup(): Promise<Blob> {
  const images = await listImages()
  const manifest = images.map(({ id, width, height, mimeType, createdAt }) => ({ id, width, height, mimeType, createdAt }))
  const files: Array<[string, Uint8Array]> = [
    ["profile.json", encoder.encode(repository.exportBackup())],
    ["images/manifest.json", encoder.encode(JSON.stringify(manifest))],
  ]
  for (const image of images) {
    files.push([`images/${image.id}.webp`, new Uint8Array(await image.blob.arrayBuffer())])
    files.push([`images/${image.id}.thumb.webp`, new Uint8Array(await image.thumbnail.arrayBuffer())])
  }
  const parts: BlobPart[] = []
  const directory: Uint8Array[] = []
  let offset = 0
  for (const [name, data] of files) {
    const { header, central } = zipEntry(name, data, offset)
    parts.push(header as BlobPart, data as BlobPart)
    directory.push(central)
    offset += header.length + data.length
  }
  const directoryLength = directory.reduce((sum, entry) => sum + entry.length, 0)
  parts.push(...directory.map((part) => part as BlobPart))
  const end = new Uint8Array(22)
  const view = new DataView(end.buffer)
  view.setUint32(0, 0x06054b50, true); view.setUint16(8, files.length, true); view.setUint16(10, files.length, true)
  view.setUint32(12, directoryLength, true); view.setUint32(16, offset, true)
  parts.push(end)
  return new Blob(parts, { type: "application/zip" })
}

function readArchive(bytes: Uint8Array): Map<string, Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const files = new Map<string, Uint8Array>()
  let offset = 0
  while (offset + 4 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    if (view.getUint16(offset + 8, true) !== 0) throw new Error("Backup ZIP dùng định dạng nén không được hỗ trợ.")
    const length = view.getUint32(offset + 18, true)
    const nameLength = view.getUint16(offset + 26, true)
    const extraLength = view.getUint16(offset + 28, true)
    const dataStart = offset + 30 + nameLength + extraLength
    if (dataStart + length > bytes.length || length > 100_000_000) throw new Error("Backup bị lỗi hoặc vượt giới hạn ảnh.")
    const name = decoder.decode(bytes.slice(offset + 30, offset + 30 + nameLength))
    if (!/^(profile\.json|images\/manifest\.json|images\/[a-f\d-]+(?:\.thumb)?\.webp)$/.test(name)) throw new Error("Đường dẫn trong backup không hợp lệ.")
    const data = bytes.slice(dataStart, dataStart + length)
    if (crc32(data) !== view.getUint32(offset + 14, true)) throw new Error("Backup bị hỏng (checksum ảnh).")
    files.set(name, data)
    offset = dataStart + length
  }
  if (!files.has("profile.json") || !files.has("images/manifest.json")) throw new Error("Backup thiếu hồ sơ hoặc danh sách ảnh.")
  return files
}

export async function restoreFullBackup(file: File): Promise<void> {
  const files = readArchive(new Uint8Array(await file.arrayBuffer()))
  const profile = decoder.decode(files.get("profile.json"))
  const payload = JSON.parse(profile) as { user?: unknown }
  if (!migrateUserState(payload.user)) throw new Error("Hồ sơ trong backup không hợp lệ.")
  const manifest = JSON.parse(decoder.decode(files.get("images/manifest.json"))) as Array<Omit<StoredImage, "blob" | "thumbnail">>
  if (!Array.isArray(manifest)) throw new Error("Danh sách ảnh không hợp lệ.")
  const images: StoredImage[] = manifest.map((meta) => {
    if (!/^[a-f\d-]{30,40}$/i.test(meta.id) || !Number.isFinite(meta.width) || !Number.isFinite(meta.height)) throw new Error("Metadata ảnh không hợp lệ.")
    const full = files.get(`images/${meta.id}.webp`)
    const thumb = files.get(`images/${meta.id}.thumb.webp`)
    if (!full || !thumb) throw new Error("Backup thiếu ảnh check-in.")
    return { ...meta, blob: new Blob([full as BlobPart], { type: "image/webp" }), thumbnail: new Blob([thumb as BlobPart], { type: "image/webp" }) }
  })
  for (const image of images) await putImage(image)
  if (!repository.importBackup(profile)) throw new Error("Không khôi phục được hồ sơ.")
}
