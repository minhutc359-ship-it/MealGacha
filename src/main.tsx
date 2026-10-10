import React from "react"
import ReactDOM from "react-dom/client"
import { bootstrapNative } from "./infrastructure/native/bootstrap"
import "./index.css"
import "./ui-polish.css"

void bootstrapNative()
  .then(async () => {
    const { default: App } = await import("./App")
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
  .catch((error) => {
    const root = document.getElementById("root")!
    const heading = document.createElement("h1")
    heading.textContent = "Chưa mở được kho tiến trình"
    const message = document.createElement("p")
    message.textContent =
      error instanceof Error ? error.message : "Hãy đóng và mở lại ứng dụng."
    const retry = document.createElement("button")
    retry.textContent = "Thử lại"
    retry.onclick = () => location.reload()
    const backup = document.createElement("button")
    backup.textContent = "Xuất dữ liệu gốc"
    backup.onclick = async () => {
      try {
        const raw = window.NativeProgress?.readRaw?.()
        if (!raw) throw Error("Chưa có dữ liệu gốc để xuất.")
        const { saveFile } = await import("./infrastructure/share/saveFile")
        await saveFile(
          new Blob([raw], { type: "application/json" }),
          "Soul-of-Meal-native-recovery.json",
        )
      } catch (error) {
        message.textContent =
          error instanceof Error ? error.message : "Chưa xuất được dữ liệu."
      }
    }
    root.replaceChildren(
      heading,
      message,
      retry,
      ...(window.NativeProgress?.readRaw ? [backup] : []),
    )
  })
