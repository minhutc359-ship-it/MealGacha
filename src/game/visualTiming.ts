import { VISUAL_CONTACT } from "./characterVisuals"
export const TCG_VISUAL_CONTACT = VISUAL_CONTACT.tcg
export function rpgVisualContact(animation?: string) { return animation === "ultimate" ? VISUAL_CONTACT.ultimate : animation !== undefined && animation !== "attack" ? VISUAL_CONTACT.cast : VISUAL_CONTACT.attack }
