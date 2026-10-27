export interface ScenePreparationProgress {
  completed: number
  total: number
}
export interface ScenePreparationOptions {
  urls: readonly string[]
  load: (url: string) => Promise<unknown>
  acquire: () => Promise<() => void>
  signal: AbortSignal
  onProgress: (progress: ScenePreparationProgress) => void
  timeoutMs?: number
}
function cancelled() {
  const error = Error("Đã hủy chuyển vùng.")
  error.name = "AbortError"
  return error
}

/** Preparation owns no save/world state. Late leases are released after cancel/timeout. */
export async function prepareScene(
  options: ScenePreparationOptions,
): Promise<() => void> {
  const { signal, load, acquire, onProgress } = options
  if (signal.aborted) throw cancelled()
  const urls = [...new Set(options.urls)]
  let disposed = false,
    release: (() => void) | undefined,
    completed = 0
  const cleanup = () => {
    if (disposed) return
    disposed = true
    release?.()
    release = undefined
  }
  onProgress({ completed, total: urls.length })
  const leased = Promise.resolve()
    .then(acquire)
    .then((end) => {
      if (disposed) end()
      else release = end
    })
  const work = Promise.all([
    leased,
    ...urls.map((url) =>
      Promise.resolve()
        .then(() => load(url))
        .then(() => {
          completed++
          if (!disposed && !signal.aborted)
            onProgress({ completed, total: urls.length })
        }),
    ),
  ]).then(() => undefined)
  let abort = () => {},
    timer: ReturnType<typeof setTimeout> | undefined
  const stopped = new Promise<never>((_, reject) => {
    abort = () => reject(cancelled())
    signal.addEventListener("abort", abort, { once: true })
    if (signal.aborted) abort()
    timer = setTimeout(() => {
      const error = Error(
        "Tải cảnh quá lâu. Bạn có thể thử lại; vị trí và bản lưu vẫn được giữ.",
      )
      error.name = "TimeoutError"
      reject(error)
    }, options.timeoutMs ?? 30_000)
  })
  try {
    await Promise.race([work, stopped])
    if (signal.aborted) throw cancelled()
    return cleanup
  } catch (cause) {
    cleanup()
    throw cause
  } finally {
    clearTimeout(timer)
    signal.removeEventListener("abort", abort)
  }
}
