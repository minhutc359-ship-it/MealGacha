import { Component, type ReactNode } from "react"
import { saveFile } from "../../infrastructure/share/saveFile"

export class GameErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; message: string }> {
  state = { failed: false, message: "" }
  static getDerivedStateFromError() { return { failed: true, message: "" } }
  private backup = async () => {
    try {
      const raw: Record<string, string> = {}
      for (let i=0;i<localStorage.length;i++) {
        const key = localStorage.key(i)
        if (key?.startsWith("foodchest.")) raw[key] = localStorage.getItem(key) ?? ""
      }
      await saveFile(new Blob([JSON.stringify({kind:"Soul-of-Meal-raw-recovery",savedAt:new Date().toISOString(),storage:raw},null,2)],{type:"application/json"}),"Soul-of-Meal-raw-recovery.json")
      this.setState({ message: "Đã xuất dữ liệu gốc. Giữ file này để phục hồi; đây không phải mã tiến trình MGC1." })
    } catch { this.setState({message:"Chưa xuất được dữ liệu. Hãy giữ nguyên dữ liệu trình duyệt và thử lại."}) }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return <main className="web-error-recovery" role="alert"><h1>Giao diện gặp sự cố</h1><p>Tiến trình vẫn nằm trong trình duyệt. Bạn có thể xuất dữ liệu gốc trước khi mở lại web.</p><button onClick={this.backup}>Xuất dữ liệu gốc</button><button onClick={() => location.reload()}>Mở lại web</button><p>{this.state.message}</p><a href="/settings">Mở Cài đặt và sao lưu</a></main>
  }
}
