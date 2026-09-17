import { NavLink } from "react-router-dom"
import { useAppStore } from "../../store/useAppStore"

const links = [
  { to: "/", label: "Rương vị giác" },
  { to: "/collection", label: "Bộ sưu tập" },
  { to: "/wheel", label: "Vòng quay" },
  { to: "/settings", label: "Cài đặt" },
]

export function TopNav() {
  const keys = useAppStore((state) => state.user.keys)
  const soundEnabled = useAppStore((state) => state.user.preferences.soundEnabled)
  const updatePreference = useAppStore((state) => state.updatePreference)

  return (
    <header className="client-topbar">
      <NavLink
        to="/"
        className="brand-lockup"
        aria-label="Rương Vị Giác — Trang chủ"
      >
        <span className="brand-mark" aria-hidden="true">
          V
        </span>
        <span>
          <strong>RƯƠNG VỊ GIÁC</strong>
          <small>Mở rương, chốt món</small>
        </span>
      </NavLink>

      <nav className="client-nav" aria-label="Điều hướng chính">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === "/"}>
            {({ isActive }) => (
              <span className={isActive ? "is-active" : ""}>{link.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="topbar-wallet" aria-label={`${keys} chìa khóa`}>
        <button
          className="quick-sound-toggle"
          onClick={() => updatePreference("soundEnabled", !soundEnabled)}
          aria-label={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          aria-pressed={soundEnabled}
          title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
        >
          {soundEnabled ? "◖))" : "◖×"}
        </button>
        <span className="key-glyph" aria-hidden="true">
          ◇
        </span>
        <strong>{keys}</strong>
        <small>CHÌA</small>
      </div>
    </header>
  )
}
