import { NavLink } from "react-router-dom"
import { useAppStore } from "../../store/useAppStore"
import { hasUnlimitedChestAccess } from "../../domain/achievements"
import { BrandMark } from "./BrandMark"
import { ModeSwitch } from "./ModeSwitch"

const links = [
  { to: "/", label: "Game thẻ bài" },
  { to: "/chest", label: "Rương vị giác" },
  { to: "/collection", label: "Hồ sơ vị giác" },
  { to: "/achievements", label: "Thành tựu" },
  { to: "/wheel", label: "Vòng quay" },
  { to: "/settings", label: "Cài đặt" },
]

export function TopNav() {
  const keys = useAppStore((state) => state.user.keys)
  const user = useAppStore((state) => state.user)
  const dishes = useAppStore((state) => state.dishes)
  const unlimited = hasUnlimitedChestAccess(user, dishes)
  const soundEnabled = useAppStore(
    (state) => state.user.preferences.soundEnabled,
  )
  const updatePreference = useAppStore((state) => state.updatePreference)

  return (
    <header className="client-topbar">
      <NavLink
        to="/chest"
        className="brand-lockup"
        aria-label="Soul of Meal — Rương vị giác"
      >
        <BrandMark />
        <span>
          <strong>SOUL OF MEAL</strong>
          <small>RƯƠNG VỊ GIÁC</small>
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

      <div
        className={`topbar-wallet ${unlimited ? "is-unlimited" : ""}`}
        aria-label={unlimited ? "Rương vô hạn" : `${keys} chìa khóa`}
      >
        <ModeSwitch mode="chest" />
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
        <strong>{unlimited ? "∞" : keys}</strong>
        <small>{unlimited ? "VÔ HẠN" : "CHÌA"}</small>
      </div>
    </header>
  )
}
