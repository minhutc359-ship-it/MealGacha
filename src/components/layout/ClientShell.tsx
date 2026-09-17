import { ReactNode } from "react"
import { TopNav } from "./TopNav"
import { InventoryPanel } from "./InventoryPanel"
import { ActivityRail } from "./ActivityRail"
import { BottomNav } from "./BottomNav"

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <div className="loot-client">
      <div className="client-backdrop" aria-hidden="true" />
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
