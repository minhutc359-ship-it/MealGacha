import { Component, type ReactNode } from "react"

export class ProductionChestBoundary extends Component<{
  children: ReactNode
}, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <main className="production-start-error" role="alert">
        <h1>Chưa mở được Rương Vị Giác</h1>
        <p>Tiến trình vẫn được giữ trong trình duyệt. Tải lại để thử tiếp.</p>
        <button type="button" onClick={() => location.reload()}>
          Tải lại Rương
        </button>
        <a href="/">Trở lại Soul of Meal</a>
      </main>
    ) : (
      this.props.children
    )
  }
}
