import { Directory, Filesystem } from "@capacitor/filesystem"
import type { StoredImage } from "../storage/imageRepository"
const KEY = "meal.native.photos.v1"
type Metadata = Omit<StoredImage, "blob" | "thumbnail"> & {
  files?: [string, string]
}
function validId(id: string) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id))
    throw new Error("Mã ảnh không hợp lệ.")
  return id
}
function metadata(): Metadata[] {
  const value = JSON.parse(localStorage.getItem(KEY) ?? "[]")
  if (
    !Array.isArray(value) ||
    value.some(
      (entry) =>
        !entry ||
        typeof entry.id !== "string" ||
        !/^[a-zA-Z0-9_-]{1,128}$/.test(entry.id) ||
        typeof entry.mimeType !== "string" ||
        (entry.files &&
          (!Array.isArray(entry.files) ||
            entry.files.length !== 2 ||
            entry.files.some(
              (path: unknown) =>
                typeof path !== "string" ||
                !/^photos\/[a-zA-Z0-9_.-]+\.webp$/.test(path),
            ))),
    )
  )
    throw new Error("Danh sách ảnh không đọc được.")
  return value
}
const paths = (entry: Metadata): [string, string] =>
  entry.files ?? [`photos/${entry.id}.webp`, `photos/${entry.id}.thumb.webp`]
export function blobBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
async function readBlob(path: string, mimeType: string) {
  const { data } = await Filesystem.readFile({
    path,
    directory: Directory.Data,
  })
  if (typeof data !== "string") return data
  return fetch(`data:${mimeType};base64,${data}`).then((r) => r.blob())
}
async function removeFiles(files: readonly string[]) {
  for (const path of files)
    await Filesystem.deleteFile({ path, directory: Directory.Data }).catch(
      () => {},
    )
}
export async function nativeGetImage(id: string): Promise<StoredImage | null> {
  validId(id)
  const entry = metadata().find((image) => image.id === id)
  if (!entry) return null
  const [full, thumb] = paths(entry)
  const [blob, thumbnail] = await Promise.all([
    readBlob(full, entry.mimeType),
    readBlob(thumb, entry.mimeType),
  ])
  const { files: _, ...info } = entry
  return { ...info, blob, thumbnail }
}
export async function nativePutImage(image: StoredImage) {
  const id = validId(image.id),
    token = crypto.randomUUID()
  const files: [string, string] = [
    `photos/${id}.${token}.webp`,
    `photos/${id}.${token}.thumb.webp`,
  ]
  // Versioned files keep the old image intact until BOTH writes and the durable metadata commit succeed.
  try {
    for (const [index, blob] of [image.blob, image.thumbnail].entries())
      await Filesystem.writeFile({
        path: files[index],
        directory: Directory.Data,
        data: await blobBase64(blob),
        recursive: true,
      })
    const previous = metadata(),
      old = previous.find((entry) => entry.id === id)
    const { blob: _, thumbnail: __, ...info } = image
    localStorage.setItem(
      KEY,
      JSON.stringify([
        ...previous.filter((entry) => entry.id !== id),
        { ...info, files },
      ]),
    )
    if (old) await removeFiles(paths(old))
  } catch (error) {
    await removeFiles(files)
    throw error
  }
}
export async function nativeDeleteImage(id: string) {
  validId(id)
  const previous = metadata(),
    old = previous.find((entry) => entry.id === id)
  localStorage.setItem(
    KEY,
    JSON.stringify(previous.filter((entry) => entry.id !== id)),
  )
  if (old) await removeFiles(paths(old))
}
export async function nativeListImages() {
  return Promise.all(metadata().map((entry) => nativeGetImage(entry.id))).then(
    (items) => items.filter((item): item is StoredImage => !!item),
  )
}
export async function nativeClearImages() {
  for (const entry of metadata()) await nativeDeleteImage(entry.id)
}
