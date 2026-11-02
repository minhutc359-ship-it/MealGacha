import { Component, type ReactNode } from "react"
import { createAw2TelemetryEvent } from "./performance"

export type Aw2IncidentCode = "AW2-UI-CHUNK" | "AW2-UI-RANGE" | "AW2-UI-RENDER" | "AW2-UI-UNKNOWN"

/** Error names are finite; message, stack, URL and save bytes are never retained. */
export function safeAw2Incident(error: unknown): Aw2IncidentCode {
  if (!(error instanceof Error)) return "AW2-UI-UNKNOWN"
  if (error.name === "ChunkLoadError") return "AW2-UI-CHUNK"
  if (error.name === "RangeError") return "AW2-UI-RANGE"
  if (error.name === "TypeError") return "AW2-UI-RENDER"
  return "AW2-UI-UNKNOWN"
}

export function Aw2RecoveryFallback({
  incident,
}: {
  incident: Aw2IncidentCode
}) {
  return (
    <main className="production-start-error" role="alert">
      <h1>Giao diện hành trình gặp sự cố</h1>
      <p>
        Màn phục hồi này không sửa, xóa hoặc xuất bản lưu. Hãy tải lại để đọc
        tiến trình hiện có.
      </p>
      <p>
        Mã sự cố: <code>{incident}</code>
      </p>
      <button type="button" onClick={() => location.reload()}>
        Tải lại hành trình
      </button>
      <a href="/">Về hành trình mới</a>
      <a href="/chest">Mở Rương Vị Giác original</a>
    </main>
  )
}

export class Aw2ErrorBoundary extends Component<{ children: ReactNode }, {
  failed: boolean
  incident: Aw2IncidentCode
}> {
  state = { failed: false, incident: "AW2-UI-UNKNOWN" as Aw2IncidentCode }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    this.setState({ incident: safeAw2Incident(error) })
    // Local scalar construction proves the privacy boundary; no storage/network sink exists.
    createAw2TelemetryEvent({
      metric: "render_failure_count",
      route: "world",
      value: 1,
    })
  }

  render() {
    return this.state.failed ? (
      <Aw2RecoveryFallback incident={this.state.incident} />
    ) : (
      this.props.children
    )
  }
}
