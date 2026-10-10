import { Capacitor } from "@capacitor/core"
import { installDurableStorage } from "./durableStorage"
export async function bootstrapNative() {
  if (!Capacitor.isNativePlatform()) return
  if (!window.NativeProgress)
    throw new Error(
      "Cầu lưu Android chưa sẵn sàng. Đóng và mở lại ứng dụng; tiến trình chưa bị thay đổi.",
    )
  installDurableStorage(window.NativeProgress)
  document.documentElement.classList.add("native-app")
  const policy = document.createElement("meta")
  policy.httpEquiv = "Content-Security-Policy"
  policy.content = "frame-src 'none'; object-src 'none'"
  document.head.append(policy)
  const [{ App }, { Browser }, { gameAudio }, { useGameStore }] =
    await Promise.all([
      import("@capacitor/app"),
      import("@capacitor/browser"),
      import("../audio/gameAudio"),
      import("../../game/useGameStore"),
    ])
  App.addListener("appStateChange", ({ isActive }) => {
    gameAudio.setNativeVisible(isActive)
    window.dispatchEvent(
      new CustomEvent(isActive ? "meal:native-resume" : "meal:native-pause"),
    )
    if (!isActive) {
      const run = useGameStore.getState().save.autoChess?.run
      if (run?.phase === "combat" && !run.paused)
        useGameStore.getState().autoAction({ type: "pause", value: true })
    }
  })
  App.addListener("backButton", ({ canGoBack }) => {
    const dialogs = [
      ...document.querySelectorAll<HTMLDialogElement>("dialog[open]"),
    ]
    const top = dialogs.at(-1)
    if (top) {
      top.dispatchEvent(new Event("cancel", { cancelable: true }))
      return
    }
    if (canGoBack && location.pathname !== "/") {
      history.back()
      return
    }
    if (confirm("Đóng Soul of Meal? Tiến trình đã lưu trên thiết bị."))
      void App.exitApp()
  })
  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null
      if (!target) return
      const url = new URL(target.href, location.href)
      if (
        (url.protocol === "https:" || url.protocol === "http:") &&
        url.origin !== location.origin
      ) {
        event.preventDefault()
        void Browser.open({ url: url.href }).catch(() => {
          window.open(url.href, "_system")
        })
      }
    },
    true,
  )
}
