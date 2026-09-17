import { ReactNode } from "react"
import { TopNav } from "./TopNav"
import { InventoryPanel } from "./InventoryPanel"
import { ActivityRail } from "./ActivityRail"
import { BottomNav } from "./BottomNav"
import { useAppStore } from "../../store/useAppStore"

export function ClientShell({ children }: { children: ReactNode }) {
  const ritualActive = useAppStore((state) => Boolean(state.pendingRevealRewardId))

  return (
    <div className={`loot-client ${ritualActive ? "is-ritual-active" : ""}`}>
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
