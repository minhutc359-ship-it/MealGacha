export type CanonicalSource = "tcg" | "chest" | "autochess" | "aw2"
export interface CanonicalEntry {
  id: string
  name: string
  aliases: string[]
}
export interface CanonicalCard extends CanonicalEntry {
  legacyId: string
  school: string
  rarity: string
  kind: string
  art: string
  spiritId: string | null
}
export interface CanonicalSpirit extends CanonicalEntry {
  rarity: string | null
  role: string | null
  traits: string[]
  skills: string[]
  art: string[]
  sources: CanonicalSource[]
}
export interface CanonicalTrait extends CanonicalEntry {}
export interface CanonicalSkill extends CanonicalEntry {}
export interface TacticalCanonicalCatalog {
  schemaVersion: 1
  cards: CanonicalCard[]
  spirits: CanonicalSpirit[]
  traits: CanonicalTrait[]
  skills: CanonicalSkill[]
  aliases: Record<string, string>
}
