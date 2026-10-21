export const AW2_MODES = [
  { id: "tcg", name: "TCG", portalId: "aw2-npc-ban-bai" },
  { id: "auto-chess", name: "Auto Chess", portalId: "aw2-npc-ban-co" },
] as const

export type Aw2ModeId = typeof AW2_MODES[number]["id"]
export type ModeEntry = "portal" | "quick-entry"
export const modeForPortal = (objectId: string) =>
  AW2_MODES.find((mode) => mode.portalId === objectId)
