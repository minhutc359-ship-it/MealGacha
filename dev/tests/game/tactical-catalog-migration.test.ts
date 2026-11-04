import { describe, expect, it } from "vitest"
import {
  AW2_LEGACY_SPIRIT_IDS,
  TACTICAL_CATALOG,
  resolveCanonicalAlias,
} from "@/game/tacticalTcg/catalog"
import {
  migrateTacticalStorage,
  TACTICAL_LEGACY_BACKUP_KEY,
  TACTICAL_MIGRATION_RECEIPT_KEY,
  TACTICAL_PROFILE_KEY,
} from "@/game/tacticalTcg/migration"
class Storage {
  data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
}
describe("canonical catalog and migration", () => {
  it("covers every TCG card and all twelve AW2 aliases", () => {
    expect(TACTICAL_CATALOG.cards.length).toBeGreaterThan(0)
    expect(AW2_LEGACY_SPIRIT_IDS).toHaveLength(12)
    for (const id of AW2_LEGACY_SPIRIT_IDS)
      expect(resolveCanonicalAlias("aw2", id)).toMatch(/^spirit:/)
  })
  it("migrates an empty device once with backup and PvP isolation", () => {
    const storage = new Storage()
    expect(migrateTacticalStorage(storage).status).toBe("migrated")
    expect(migrateTacticalStorage(storage).status).toBe("existing")
    expect(storage.getItem(TACTICAL_LEGACY_BACKUP_KEY)).not.toBeNull()
    expect(storage.getItem(TACTICAL_MIGRATION_RECEIPT_KEY)).not.toBeNull()
    expect(JSON.parse(storage.getItem(TACTICAL_PROFILE_KEY)!).pvp).toEqual({
      importedPowerBonuses: false,
      importedRating: false,
    })
  })
})
