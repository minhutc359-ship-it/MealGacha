import { lazy, Suspense, useEffect } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { useAppStore } from "./store/useAppStore"
import { ClientShell } from "./components/layout/ClientShell"
import { Toast } from "./components/ui/Toast"
import { ChestPage } from "./pages/ChestPage"
import { AnnouncementBanner } from "./components/ui/AnnouncementBanner"

const CollectionPage = lazy(() =>
  import("./pages/CollectionPage").then((module) => ({ default: module.CollectionPage })),
)
const AchievementsPage = lazy(() =>
  import("./pages/AchievementsPage").then((module) => ({ default: module.AchievementsPage })),
)
const WheelPage = lazy(() =>
  import("./pages/WheelPage").then((module) => ({ default: module.WheelPage })),
)
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })),
)

function AppInner() {
  const init = useAppStore((s) => s.init)
  const navigate = useNavigate()

  useEffect(() => {
    init()
  }, [])

  // Cross-tab sync: reload user state when another tab mutates localStorage
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "foodchest.user.v1" && e.newValue) {
        useAppStore.setState({ user: useAppStore.getState()["user"] })
        useAppStore.getState().init()
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  useEffect(() => {
    const handler = () => navigate("/collection")
    window.addEventListener("nav:collection", handler)
    return () => window.removeEventListener("nav:collection", handler)
  }, [navigate])

  return (
    <ClientShell>
      <Toast />
      <AnnouncementBanner />
      <Suspense fallback={<div className="route-loading"><span>◇</span><p>Đang mở giao diện...</p></div>}>
        <Routes>
          <Route path="/" element={<ChestPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/wheel" element={<WheelPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </ClientShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
