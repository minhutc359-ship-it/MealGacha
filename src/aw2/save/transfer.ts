import { decodeAw2Save, type SaveSnapshot } from "./schema"

export const AW2_BACKUP_FORMAT = "soul-of-meal-aw2-backup-v1"
export const AW2_BACKUP_MAX_BYTES = 256_000

async function checksum(payload: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload),
  )
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")
}

function validRaw(raw: string) {
  if (new TextEncoder().encode(raw).byteLength > AW2_BACKUP_MAX_BYTES)
    throw Error("Bản sao lưu vượt giới hạn 256 KB.")
  const snapshot = decodeAw2Save(raw)
  if (snapshot.status !== "ready")
    throw Error(
      "Tệp không chứa hành trình Soul of Meal hợp lệ hoặc cần bản game mới hơn.",
    )
  return snapshot
}

/** Explicit local export of the committed AW2 envelope; no other storage key is read. */
export async function exportAw2Backup(snapshot: SaveSnapshot) {
  if (snapshot.status !== "ready") throw Error("Cần bản lưu hợp lệ để sao lưu.")
  validRaw(snapshot.raw)
  const text = JSON.stringify(
    {
      format: AW2_BACKUP_FORMAT,
      payload: snapshot.raw,
      sha256: await checksum(snapshot.raw),
    },
    null,
    2,
  )
  if (new TextEncoder().encode(text).byteLength > AW2_BACKUP_MAX_BYTES)
    throw Error("Bản sao lưu vượt giới hạn 256 KB.")
  return text
}

/** Validate locally before confirmation. A checksum detects damage, not authenticity. */
export async function inspectAw2Backup(text: string) {
  if (new TextEncoder().encode(text).byteLength > AW2_BACKUP_MAX_BYTES)
    throw Error("Bản sao lưu vượt giới hạn 256 KB.")
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw Error("Chưa đọc được JSON của bản sao lưu.")
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Định dạng bản sao lưu không hợp lệ.")
  const record = value as Record<string, unknown>
  if (
    Object.keys(record).length !== 3 ||
    record.format !== AW2_BACKUP_FORMAT ||
    typeof record.payload !== "string" ||
    typeof record.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(record.sha256)
  )
    throw Error("Đây không phải bản sao lưu hành trình Soul of Meal.")
  if ((await checksum(record.payload)) !== record.sha256)
    throw Error("Bản sao lưu đã thay đổi hoặc bị lỗi. Hãy chọn lại tệp gốc.")
  return validRaw(record.payload)
}
