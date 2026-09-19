export interface StoredImage {
  id: string
  blob: Blob
  thumbnail: Blob
  mimeType: string
  width: number
  height: number
  createdAt: string
}

const DB_NAME = "mealgacha-images"
const STORE = "checkins"

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("Trình duyệt không hỗ trợ IndexedDB."))
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" }) }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void): Promise<T> {
  const db = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    let result: T
    let settled = false
    tx.oncomplete = () => { db.close(); if (!settled) resolve(result) }
    tx.onerror = () => { db.close(); reject(tx.error) }
    tx.onabort = () => { db.close(); reject(tx.error) }
    operation(tx.objectStore(STORE), (value) => { result = value; settled = false }, reject)
  })
}

export function getImage(id: string): Promise<StoredImage | null> {
  return run("readonly", (store, resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export function deleteImage(id: string): Promise<void> {
  return run("readwrite", (store, resolve) => { store.delete(id); resolve(undefined) })
}

export function listImages(): Promise<StoredImage[]> {
  return run("readonly", (store, resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function putImage(image: StoredImage): Promise<void> {
  return run("readwrite", (store, resolve) => { store.put(image); resolve(undefined) })
}

export async function clearImages(): Promise<void> {
  return run("readwrite", (store, resolve) => { store.clear(); resolve(undefined) })
}

async function resize(file: Blob, longEdge: number): Promise<{ blob: Blob; width: number; height: number }> {
  const source = typeof createImageBitmap === "function" ? await createImageBitmap(file) : await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { URL.revokeObjectURL(url); resolve(image) }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Không đọc được ảnh đã chọn.")) }
    image.src = url
  })
  try {
    const ratio = Math.min(1, longEdge / Math.max(source.width, source.height))
    const width = Math.max(1, Math.round(source.width * ratio))
    const height = Math.max(1, Math.round(source.height * ratio))
    const canvas = document.createElement("canvas")
    canvas.width = width; canvas.height = height
    canvas.getContext("2d")?.drawImage(source, 0, 0, width, height)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((out) => out ? resolve(out) : reject(new Error("Không thể nén ảnh.")), "image/webp", 0.8))
    return { blob, width, height }
  } finally { if ("close" in source) source.close() }
}

export async function savePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Hãy chọn một file ảnh.")
  const [full, thumb] = await Promise.all([resize(file, 1440), resize(file, 480)])
  const id = crypto.randomUUID()
  try {
    await putImage({ id, blob: full.blob, thumbnail: thumb.blob, mimeType: full.blob.type, width: full.width, height: full.height, createdAt: new Date().toISOString() })
  } catch { throw new Error("Không đủ dung lượng lưu ảnh trên thiết bị. Bạn vẫn có thể check-in không ảnh.") }
  return id
}
