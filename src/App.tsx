import { lazy, Suspense, useEffect } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom"
import { useAppStore } from "./store/useAppStore"
import { ClientShell } from "./components/layout/ClientShell"
import { Toast } from "./components/ui/Toast"
import { AnnouncementBanner } from "./components/ui/AnnouncementBanner"

const ChestPage = lazy(() => import("./pages/ChestPage").then(module => ({ default: module.ChestPage })))

const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
)
const AchievementsPage = lazy(() =>
  import("./pages/AchievementsPage").then((module) => ({
    default: module.AchievementsPage,
  })),
)
const WheelPage = lazy(() =>
  import("./pages/WheelPage").then((module) => ({ default: module.WheelPage })),
)
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
)
const DailyQuizPage = lazy(() =>
  import("./pages/DailyQuizPage").then((module) => ({
    default: module.DailyQuizPage,
  })),
)
const TasteSwipePage = lazy(() =>
  import("./pages/TasteSwipePage").then((module) => ({
    default: module.TasteSwipePage,
  })),
)
const EventsPage = lazy(() =>
  import("./pages/EventsPage").then((module) => ({
    default: module.EventsPage,
  })),
)
const TCGPage = lazy(() =>
  import("./pages/TCGPage").then((module) => ({ default: module.TCGPage })),
)
const AutoChessPage = lazy(() =>
  import("./pages/AutoChessPage").then((module) => ({
    default: module.AutoChessPage,
  })),
)

const LegalPage = lazy(() => import("./pages/LegalPage").then(module => ({ default: module.LegalPage })))

function AppInner() {
  const init = useAppStore((s) => s.init)
  const navigate = useNavigate()
  const location = useLocation()

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

  if (location.pathname.startsWith("/legal/")) return <Suspense fallback={<div className="route-loading">Đang mở chính sách…</div>}><LegalPage /></Suspense>

  if (
    location.pathname === "/" ||
    location.pathname === "/game" ||
    location.pathname === "/autochess"
  )
    return (
      <Suspense
        fallback={
          <div className="route-loading">
            <span>✦</span>
            <p>Đang mở thế giới vị giác…</p>
          </div>
        }
      >
        {location.pathname === "/autochess" ? <AutoChessPage /> : <TCGPage />}
      </Suspense>
    )

  return (
    <ClientShell>
      <Toast />
      <AnnouncementBanner />
      <Suspense
        fallback={
          <div className="route-loading">
            <span>◇</span>
            <p>Đang mở giao diện...</p>
          </div>
        }
      >
        <Routes>
          <Route path="/chest" element={<ChestPage />} />
          <Route path="/collection" element={<ProfilePage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/wheel" element={<WheelPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/daily-quiz" element={<DailyQuizPage />} />
          <Route path="/taste-swipe" element={<TasteSwipePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
