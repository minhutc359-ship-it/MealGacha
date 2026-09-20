import { NavLink } from "react-router-dom"

const tabs = [
  {
    to: "/",
    label: "Rương",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <rect
          x="2"
          y="8"
          width="20"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
        <path
          d="M2 11h20M8 8V6a4 4 0 018 0v2"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round"
        />
        <circle cx="12" cy="15" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: "/collection",
    label: "Hồ sơ",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <rect
          x="3"
          y="5"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.2 : 0}
        />
        <rect
          x="14"
          y="5"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.2 : 0}
        />
        <rect
          x="3"
          y="16"
          width="7"
          height="3"
          rx="1.5"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.2 : 0}
        />
        <rect
          x="14"
          y="16"
          width="7"
          height="3"
          rx="1.5"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.2 : 0}
        />
      </svg>
    ),
  },
  {
    to: "/achievements",
    label: "Thành tựu",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path
          d="M8 4h8v5a4 4 0 01-8 0V4zM8 6H5v2a4 4 0 004 4M16 6h3v2a4 4 0 01-4 4M12 13v4M8 20h8M10 17h4"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/wheel",
    label: "Vòng quay",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
        />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <path
          d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Cài đặt",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle
          cx="12"
          cy="12"
          r="3"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
        />
        <path
          d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export function BottomNav() {
  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        borderColor: "var(--title-accent, rgba(0,212,255,0.12))",
        background: "var(--title-deep, rgba(8,12,24,0.95))",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="flex max-w-md mx-auto">
        {tabs.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className="flex-1">
            {({ isActive }) => (
              <div
                className={`flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  isActive ? "text-[var(--title-accent,#00d4ff)]" : "text-[#6b7f99]"
                }`}
              >
                {icon(isActive)}
                <span className="text-[10px] font-medium leading-none">
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
