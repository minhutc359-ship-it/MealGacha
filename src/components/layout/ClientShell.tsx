import { ReactNode, useEffect } from "react"
import { TopNav } from "./TopNav"
import { InventoryPanel } from "./InventoryPanel"
import { ActivityRail } from "./ActivityRail"
import { BottomNav } from "./BottomNav"
import { useAppStore } from "../../store/useAppStore"
import { playClickSound, preloadClickSounds } from "../../infrastructure/audio/soundEngine"
import { TITLES } from "../../domain/titles"

export function ClientShell({ children }: { children: ReactNode }) {
  const ritualActive = useAppStore((state) => Boolean(state.pendingRevealRewardId))
  const soundEnabled = useAppStore((state) => state.user.preferences.soundEnabled)
  const equippedTitleId = useAppStore((state) => state.user.equippedTitleId)
  const theme = TITLES.find((title) => title.id === equippedTitleId)?.reward.background ?? "starter"

  useEffect(() => {
    document.documentElement.dataset.titleTheme = theme
    return () => { delete document.documentElement.dataset.titleTheme }
  }, [theme])

  useEffect(() => {
    preloadClickSounds()
  }, [])

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof Element)) return

    if (target.closest(".client-nav a, .mobile-bottom-nav a")) {
      playClickSound("function", soundEnabled)
      return
    }

    if (target.closest("button, a, input, select, textarea, summary, [role='button'], [tabindex]")) {
      playClickSound("choose", soundEnabled)
      return
    }

    playClickSound("normal", soundEnabled)
  }

  return (
    <div
      className={`loot-client ${ritualActive ? "is-ritual-active" : ""}`}
      data-title-theme={theme}
      onClickCapture={handleClickCapture}
    >
      <div className="client-backdrop" aria-hidden="true" />
      <div className="cinematic-curtain" aria-hidden="true" />
      <TopNav />
      <div className="client-layout">
        <InventoryPanel />
        <main className="client-stage">{children}</main>
        <ActivityRail />
      </div>
      <BottomNav />
    </div>
  )
}
