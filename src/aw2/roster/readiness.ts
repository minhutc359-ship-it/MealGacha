import { ROSTER_ASSETS } from "../assets/roster"
import { BATTLE_STATES, DIRECTIONS, SKILL_SLOTS } from "../assets/types"
import { COMBAT_KITS } from "../combat/roster"
import { ROSTER, SPIRIT_IDS } from "../world/ids"

export const CHARACTER_READINESS_ID = "aw2-character-readiness-v1" as const
export const CHARACTER_ACCEPTANCE_NOT_RUN = "NOT_RUN" as const
export type CharacterAcceptanceStatus = "NOT_RUN" | "PASS" | "FAIL" | "BLOCKED"
const REQUIRED_ASSETS = [
  "reference",
  "world",
  "battle",
  "portrait",
  "fx",
] as const

export interface CharacterReadinessRecord {
  spiritId: typeof SPIRIT_IDS[number]
  displayName: string
  rarity: string
  role: string
  recipeAffiliation: string
  manifest: {
    version: number
    artVariantId: string
    status: string
    assetCount: number
    frameCount: number
    referencePackageReady: boolean
  }
  combat: {
    kitPresent: boolean
    skillSlots: number
    skillIdsValid: boolean
  }
  provenance: {
    complete: boolean
    externalReferenceCount: number
    licenseStatus: string
    commercialRelease: string
  }
  acceptance: {
    fullCharacterComplete: boolean
    independentArtReview: CharacterAcceptanceStatus
    physicalDevice: CharacterAcceptanceStatus
    humanAudioReview: CharacterAcceptanceStatus
    rightsCleared: boolean
  }
  technicalReferenceReady: boolean
  releaseReady: boolean
}

export interface CharacterReadinessInventory {
  id: typeof CHARACTER_READINESS_ID
  records: CharacterReadinessRecord[]
  summary: {
    total: number
    technicalReferenceReady: number
    fullCharacterComplete: number
    rightsCleared: number
    releaseReady: number
    independentArtReview: CharacterAcceptanceStatus
    physicalDevice: CharacterAcceptanceStatus
    humanAudioReview: CharacterAcceptanceStatus
  }
}

const nonEmpty = (value: string) => value.trim().length > 0

function readinessRecord(
  roster: typeof ROSTER[number],
): CharacterReadinessRecord {
  const manifest = ROSTER_ASSETS[roster.spiritId]
  const identityMatches =
    manifest?.spiritId === roster.spiritId &&
    manifest.displayName === roster.displayName &&
    manifest.artVariantId === "base-v1"
  const requiredAssets = REQUIRED_ASSETS.every((key) => {
    const asset = manifest?.assets[key]
    return (
      asset?.id.startsWith(`${roster.spiritId}:`) &&
      asset.url.startsWith("/") &&
      /^[a-f0-9]{64}$/.test(asset.sha256) &&
      asset.bytes > 0
    )
  })
  const directions = DIRECTIONS.every(
    (direction) =>
      manifest?.world[direction]?.walk.length >= 3 &&
      !!manifest.frames[manifest.world[direction].idle],
  )
  const battleStates = BATTLE_STATES.every(
    (state) =>
      manifest?.battle[state]?.frames.length > 0 &&
      manifest.battle[state].motion.length > 0,
  )
  const skillIdsValid = SKILL_SLOTS.every(
    (slot) => manifest?.skills[slot]?.id === `${roster.spiritId}:skill:${slot}`,
  )
  const provenanceComplete =
    !!manifest &&
    [
      manifest.provenance.generator,
      manifest.provenance.model,
      manifest.provenance.date,
      manifest.provenance.prompts,
      manifest.provenance.referenceAsset,
      manifest.provenance.audio,
      manifest.provenance.processing,
      manifest.provenance.licenseStatus,
      manifest.provenance.commercialRelease,
    ].every(nonEmpty) &&
    Array.isArray(manifest.provenance.externalReferences)
  const kitPresent = Object.prototype.hasOwnProperty.call(
    COMBAT_KITS,
    roster.spiritId,
  )
  const referencePackageReady =
    identityMatches &&
    requiredAssets &&
    directions &&
    battleStates &&
    skillIdsValid &&
    provenanceComplete
  const rightsCleared =
    manifest.provenance.licenseStatus === "CLEARED" &&
    manifest.provenance.commercialRelease === "CLEARED"
  const acceptance: CharacterReadinessRecord["acceptance"] = {
    fullCharacterComplete: manifest.fullCharacterComplete,
    independentArtReview: CHARACTER_ACCEPTANCE_NOT_RUN,
    physicalDevice: CHARACTER_ACCEPTANCE_NOT_RUN,
    humanAudioReview: CHARACTER_ACCEPTANCE_NOT_RUN,
    rightsCleared,
  }
  const technicalReferenceReady = referencePackageReady && kitPresent
  return {
    spiritId: roster.spiritId,
    displayName: roster.displayName,
    rarity: roster.rarity,
    role: roster.role,
    recipeAffiliation: roster.recipeAffiliation,
    manifest: {
      version: manifest.version,
      artVariantId: manifest.artVariantId,
      status: manifest.status,
      assetCount: Object.keys(manifest.assets).length,
      frameCount: Object.keys(manifest.frames).length,
      referencePackageReady,
    },
    combat: {
      kitPresent,
      skillSlots: Object.keys(manifest.skills).length,
      skillIdsValid,
    },
    provenance: {
      complete: provenanceComplete,
      externalReferenceCount: manifest.provenance.externalReferences.length,
      licenseStatus: manifest.provenance.licenseStatus,
      commercialRelease: manifest.provenance.commercialRelease,
    },
    acceptance,
    technicalReferenceReady,
    releaseReady:
      technicalReferenceReady &&
      acceptance.fullCharacterComplete &&
      acceptance.independentArtReview === "PASS" &&
      acceptance.physicalDevice === "PASS" &&
      acceptance.humanAudioReview === "PASS" &&
      acceptance.rightsCleared,
  }
}

export function characterReadinessInventory(): CharacterReadinessInventory {
  const records = ROSTER.map(readinessRecord)
  return {
    id: CHARACTER_READINESS_ID,
    records,
    summary: {
      total: records.length,
      technicalReferenceReady: records.filter(
        (record) => record.technicalReferenceReady,
      ).length,
      fullCharacterComplete: records.filter(
        (record) => record.acceptance.fullCharacterComplete,
      ).length,
      rightsCleared: records.filter((record) => record.acceptance.rightsCleared)
        .length,
      releaseReady: records.filter((record) => record.releaseReady).length,
      independentArtReview: CHARACTER_ACCEPTANCE_NOT_RUN,
      physicalDevice: CHARACTER_ACCEPTANCE_NOT_RUN,
      humanAudioReview: CHARACTER_ACCEPTANCE_NOT_RUN,
    },
  }
}

export function serializeCharacterReadiness(
  inventory: CharacterReadinessInventory = characterReadinessInventory(),
): string {
  return JSON.stringify(inventory)
}

export function validateCharacterReadinessInventory(
  inventory: CharacterReadinessInventory = characterReadinessInventory(),
): string[] {
  const issues: string[] = []
  if (inventory.id !== CHARACTER_READINESS_ID)
    issues.push("Character readiness ID không khớp.")
  const ids = inventory.records.map((record) => record.spiritId)
  if (
    ids.length !== SPIRIT_IDS.length ||
    new Set(ids).size !== SPIRIT_IDS.length ||
    ids.some((id, index) => id !== SPIRIT_IDS[index])
  )
    issues.push("Inventory phải có đúng 12 ID canon theo thứ tự roster.")
  for (const record of inventory.records) {
    const roster = ROSTER.find((item) => item.spiritId === record.spiritId)
    if (!roster || roster.displayName !== record.displayName)
      issues.push(`${record.spiritId} không khớp identity canon.`)
    if (
      !record.manifest.referencePackageReady ||
      !record.combat.kitPresent ||
      record.combat.skillSlots !== SKILL_SLOTS.length ||
      !record.combat.skillIdsValid ||
      !record.provenance.complete
    )
      issues.push(`${record.spiritId} chưa đủ reference package kỹ thuật.`)
    if (
      record.acceptance.rightsCleared !==
      (record.provenance.licenseStatus === "CLEARED" &&
        record.provenance.commercialRelease === "CLEARED")
    )
      issues.push(`${record.spiritId} có rights status không nhất quán.`)
    if (
      record.releaseReady &&
      (!record.technicalReferenceReady ||
        !record.acceptance.fullCharacterComplete ||
        record.acceptance.independentArtReview !== "PASS" ||
        record.acceptance.physicalDevice !== "PASS" ||
        record.acceptance.humanAudioReview !== "PASS" ||
        !record.acceptance.rightsCleared)
    )
      issues.push(`${record.spiritId} không được nâng release readiness.`)
  }
  const counts = {
    total: inventory.records.length,
    technicalReferenceReady: inventory.records.filter(
      (record) => record.technicalReferenceReady,
    ).length,
    fullCharacterComplete: inventory.records.filter(
      (record) => record.acceptance.fullCharacterComplete,
    ).length,
    rightsCleared: inventory.records.filter(
      (record) => record.acceptance.rightsCleared,
    ).length,
    releaseReady: inventory.records.filter((record) => record.releaseReady)
      .length,
  }
  for (const [key, value] of Object.entries(counts))
    if (inventory.summary[(key as keyof typeof counts)] !== value)
      issues.push(`Summary ${key} không khớp inventory.`)
  return issues
}
