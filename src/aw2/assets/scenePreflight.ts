export interface SceneReadiness {
  ready: boolean
  error?: string
  assertUsable?: () => void
}

function cancelled() {
  const error = Error("Đã hủy chuyển vùng.")
  error.name = "AbortError"
  return error
}

/** Owns a candidate until its exact renderer is promoted or discarded. No save access. */
export class ScenePreflight {
  readonly ready: Promise<void>
  private resolve: () => void = () => {
    throw Error("Scene readiness promise not initialized")
  }
  private reject: (cause: Error) => void = () => {
    throw Error("Scene readiness promise not initialized")
  }
  private state: "waiting" | "ready" | "failed" | "transferred" = "waiting"
  private cause?: Error
  private validate?: () => void
  private timer?: ReturnType<typeof setTimeout>
  private readonly abort = () => this.fail(cancelled())

  constructor(
    private readonly signal: AbortSignal,
    private readonly discard: () => void,
    timeoutMs = 30_000,
  ) {
    this.ready = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
    signal.addEventListener("abort", this.abort, { once: true })
    this.timer = setTimeout(() => {
      const error = Error("Khởi tạo cảnh quá lâu. Bạn có thể thử lại.")
      error.name = "TimeoutError"
      this.fail(error)
    }, timeoutMs)
    if (signal.aborted) this.abort()
  }

  report(status: SceneReadiness) {
    if (this.state === "failed" || this.state === "transferred") return
    if (status.error) return this.fail(Error(status.error))
    if (!status.ready) {
      if (this.state === "ready")
        this.fail(Error("Cảnh đích không còn sẵn sàng."))
      return
    }
    this.validate = status.assertUsable
    this.state = "ready"
    try {
      this.assertReady()
      clearTimeout(this.timer)
      this.resolve()
    } catch {
      // assertReady has already rejected and discarded this candidate.
    }
  }

  /** Called again inside the save lock, synchronously before the durable write. */
  assertReady = () => {
    if (this.cause) throw this.cause
    if (this.signal.aborted) {
      this.fail(cancelled())
      throw this.cause
    }
    if (this.state !== "ready") throw Error("Cảnh đích chưa sẵn sàng.")
    try {
      this.validate?.()
    } catch (cause) {
      const error =
        cause instanceof Error ? cause : Error("Chưa dựng được cảnh đích.")
      this.fail(error)
      throw error
    }
  }

  /** Only after a successful durable write. Ownership moves to the visible scene. */
  transfer() {
    this.state = "transferred"
    this.detach()
  }

  dispose = () => this.fail(cancelled())

  private fail(error: Error) {
    if (this.state === "failed" || this.state === "transferred") return
    this.state = "failed"
    this.cause = error
    this.detach()
    this.discard()
    this.reject(error)
  }

  private detach() {
    clearTimeout(this.timer)
    this.signal.removeEventListener("abort", this.abort)
  }
}
