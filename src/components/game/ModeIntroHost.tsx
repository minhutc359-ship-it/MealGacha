import { Component, lazy, Suspense, type ReactNode } from "react"
import { useModeIntroStore } from "../../game/modeIntroState"
import { Dialog } from "./Dialog"

const ModeIntroPlayer = lazy(() => import("./ModeIntroPlayer"))
const MangaIntroduction = lazy(() => import("./MangaChronicle").then(module => ({ default: module.MangaIntroduction })))
const SharedLibrary = lazy(() => import("./SharedLibrary"))

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
  const comic = useModeIntroStore((state) => state.comic)
  const comicTrigger = useModeIntroStore((state) => state.comicTrigger)
  const library = useModeIntroStore((state) => state.library)
  const cultureId = useModeIntroStore((state) => state.cultureId)
  if (!mode) return null
  return <IntroBoundary key={`${mode}-${comic}-${library}`} onClose={close}><Suspense fallback={<Dialog title="Đang mở nội dung…" onClose={close}><p>Đang chuẩn bị hành trình Vị Linh.</p></Dialog>}>
    {library ? <SharedLibrary initialTab={library} cultureId={cultureId} onClose={close} returnFocus={comicTrigger} /> : comic ? <MangaIntroduction onClose={close} returnFocus={comicTrigger} /> : <ModeIntroPlayer key={mode} mode={mode} onClose={close} />}
  </Suspense></IntroBoundary>
}
