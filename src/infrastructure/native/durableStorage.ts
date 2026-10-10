export interface DurableBridge {
  readAll(): string
  readRaw?(): string
  setItem(key: string, value: string): boolean
  removeItem(key: string): boolean
  clear(): boolean
}
declare global {
  interface Window {
    NativeProgress?: DurableBridge
  }
}
/** Install before importing either store. Native failures block startup, never fall back to a fresh save. */
export function installDurableStorage(bridge: DurableBridge) {
  const raw = JSON.parse(bridge.readAll()) as unknown
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw) ||
    Object.values(raw).some((value) => typeof value !== "string")
  )
    throw new Error(
      "Kho tiến trình Android không đọc được. Dữ liệu gốc được giữ để phục hồi.",
    )
  const values = new Map(Object.entries(raw as Record<string, string>))
  const adapter: Storage = {
    get length() {
      return values.size
    },
    key(index) {
      return [...values.keys()][index] ?? null
    },
    getItem(key) {
      return values.get(String(key)) ?? null
    },
    setItem(key, value) {
      key = String(key)
      value = String(value)
      if (!bridge.setItem(key, value))
        throw new Error(
          "Android chưa lưu được tiến trình. Hãy kiểm tra dung lượng thiết bị.",
        )
      values.set(key, value)
    },
    removeItem(key) {
      key = String(key)
      if (!bridge.removeItem(key))
        throw new Error("Android chưa hoàn tất thay đổi dữ liệu.")
      values.delete(key)
    },
    clear() {
      if (!bridge.clear()) throw new Error("Android chưa xóa được dữ liệu.")
      values.clear()
    },
  }
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: adapter,
  })
  return adapter
}
