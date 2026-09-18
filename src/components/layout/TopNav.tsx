import { NavLink } from "react-router-dom"
import { useAppStore } from "../../store/useAppStore"
import { hasUnlimitedChestAccess } from "../../domain/achievements"
import { TranslationKey, useLanguage } from "../../i18n"

const links: { to: string; key: TranslationKey }[] = [
  { to: "/", key: "chest" },
  { to: "/collection", key: "collection" },
  { to: "/achievements", key: "achievements" },
  { to: "/wheel", key: "wheel" },
  { to: "/settings", key: "settings" },
]

export function TopNav() {
  const keys = useAppStore((state) => state.user.keys)
  const user = useAppStore((state) => state.user)
  const dishes = useAppStore((state) => state.dishes)
  const unlimited = hasUnlimitedChestAccess(user, dishes)
  const soundEnabled = useAppStore((state) => state.user.preferences.soundEnabled)
  const updatePreference = useAppStore((state) => state.updatePreference)
  const { t } = useLanguage()

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
              <span className={isActive ? "is-active" : ""}>{t(link.key)}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={`topbar-wallet ${unlimited ? "is-unlimited" : ""}`} aria-label={unlimited ? "Rương vô hạn" : `${keys} chìa khóa`}>
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
