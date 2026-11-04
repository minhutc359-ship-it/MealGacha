import { decodeAw2Save } from "../../../aw2/save/schema"
import { migrateUserState } from "../../../infrastructure/storage/repository"
import { collectedSpiritCards } from "../../../domain/spiritCollection"
import { parseGame } from "../../storage"
import { resolveCanonicalAlias } from "../catalog"
import type {
  TacticalLegacyRawSnapshot,
  TacticalMigrationPreview,
  TacticalMigrationProfile,
} from "./schema"
const parseRaw = (raw: string | null) => {
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}
const payload = (value: unknown) => {
  if (!value || typeof value !== "object") return { save: value, user: null }
  const object = value as Record<string, unknown>
  return "save" in object
    ? { save: object.save, user: object.user ?? null }
    : { save: value, user: null }
}
export function previewTacticalMigration(
  raw: TacticalLegacyRawSnapshot,
  now = new Date().toISOString(),
): TacticalMigrationPreview {
  const backup = { schemaVersion: 1 as const, capturedAt: now, raw },
    tcgValue = parseRaw(raw.tcg),
    userValue = parseRaw(raw.user)
  if (raw.tcg !== null && tcgValue === undefined)
    return {
      ok: false,
      error: "Legacy TCG save is invalid JSON.",
      backup,
      profile: null,
    }
  if (raw.user !== null && userValue === undefined)
    return {
      ok: false,
      error: "Legacy Chest save is invalid JSON.",
      backup,
      profile: null,
    }
  const decoded = payload(tcgValue),
    tcg = decoded.save === null ? null : parseGame(decoded.save),
    chestSource = userValue ?? decoded.user,
    chest = chestSource === null ? null : migrateUserState(chestSource)
  if (raw.tcg !== null && !tcg)
    return {
      ok: false,
      error: "Legacy TCG save failed validation.",
      backup,
      profile: null,
    }
  if ((raw.user !== null || decoded.user !== null) && !chest)
    return {
      ok: false,
      error: "Legacy Chest save failed validation.",
      backup,
      profile: null,
    }
  const warnings: string[] = [],
    aw2Decoded = raw.aw2 === null ? null : decodeAw2Save(raw.aw2),
    aw2 = aw2Decoded?.status === "ready" ? aw2Decoded.save : null
  if (aw2Decoded && aw2Decoded.status !== "ready")
    warnings.push(
      `AW2 save preserved as ${aw2Decoded.status}; no progress guessed.`,
    )
  const cardCopies: Record<string, number> = {}
  for (const [id, count] of Object.entries(tcg?.cards ?? {})) {
    const canonical = resolveCanonicalAlias("tcg", id)
    if (canonical && typeof count === "number") cardCopies[canonical] = count
  }
  const spiritCards = chest ? collectedSpiritCards(chest) : {},
    ownedSpiritAliases = Object.entries(spiritCards)
      .filter(([, count]) => count > 0)
      .map(([id]) => resolveCanonicalAlias("chest", id))
      .filter((id): id is string => Boolean(id))
  const autoChess = tcg?.autoChess ?? null,
    badges: string[] = [],
    autoRecord = autoChess as unknown as Record<string, unknown> | null
  if (autoRecord && Number(autoRecord.campaignCleared) > 0)
    badges.push(
      `legacy:autochess:campaign:${Number(autoRecord.campaignCleared)}`,
    )
  const profile: TacticalMigrationProfile = {
    schemaVersion: 1,
    migratedAt: now,
    tcg,
    chest,
    collection: {
      cardCopies,
      ownedSpiritAliases: [...new Set(ownedSpiritAliases)].sort(),
      tinhVi: chest
        ? Object.values(chest.fragments ?? {}).reduce(
            (sum, value) => sum + Math.max(0, value),
            0,
          )
        : 0,
    },
    legacy: { autoChess, aw2, badges, cosmetics: [], warnings },
    pvp: { importedPowerBonuses: false, importedRating: false },
  }
  return { ok: true, error: null, backup, profile }
}
