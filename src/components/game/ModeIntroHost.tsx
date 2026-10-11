import { Component, lazy, Suspense, type ReactNode } from "react"
import { useModeIntroStore } from "../../game/modeIntroState"
import { Dialog } from "./Dialog"

const ModeIntroPlayer = lazy(() => import("./ModeIntroPlayer"))

class IntroBoundary extends Component<{ children: ReactNode; onClose: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <Dialog title="Chưa mở được giới thiệu" onClose={this.props.onClose}><p>Đóng màn này để tiếp tục chơi. Mở lại trang nếu nội dung chưa tải được.</p><button type="button" onClick={this.props.onClose}>Trở về game</button></Dialog>
    return this.props.children
  }
}

export function ModeIntroHost() {
  const mode = useModeIntroStore((state) => state.mode)
  const close = useModeIntroStore((state) => state.close)
  if (!mode) return null
  return <IntroBoundary key={mode} onClose={close}><Suspense fallback={<Dialog title="Đang chuẩn bị giới thiệu…" onClose={close}><p>Đang mở sân khấu và mô hình Vị Linh.</p></Dialog>}>
    <ModeIntroPlayer key={mode} mode={mode} onClose={close} />
  </Suspense></IntroBoundary>
}
