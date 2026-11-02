import { createElement } from "react"
import { createHash } from "node:crypto"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { CharacterReadinessDisclosure } from "../../aw2/CharacterReadinessDisclosure"
import {
  CHARACTER_READINESS_ID,
  characterReadinessInventory,
  serializeCharacterReadiness,
  validateCharacterReadinessInventory,
} from "@/aw2/roster/readiness"
import { SPIRIT_IDS } from "@/aw2/world/ids"

describe("AW2 12-character readiness inventory", () => {
  it("records all canon identities and technical reference packages", () => {
    const inventory = characterReadinessInventory()
    expect(inventory.id).toBe(CHARACTER_READINESS_ID)
    expect(inventory.records.map((record) => record.spiritId)).toEqual(
      SPIRIT_IDS,
    )
    expect(inventory.summary).toMatchObject({
      total: 12,
      technicalReferenceReady: 12,
      fullCharacterComplete: 0,
      rightsCleared: 0,
      releaseReady: 0,
      independentArtReview: "NOT_RUN",
      physicalDevice: "NOT_RUN",
      humanAudioReview: "NOT_RUN",
    })
    expect(validateCharacterReadinessInventory(inventory)).toEqual([])
  })

  it("keeps every full DoD and rights blocker explicit", () => {
    for (const record of characterReadinessInventory().records) {
      expect(record.manifest.referencePackageReady).toBe(true)
      expect(record.combat).toMatchObject({
        kitPresent: true,
        skillSlots: 4,
        skillIdsValid: true,
      })
      expect(record.provenance).toMatchObject({
        complete: true,
        externalReferenceCount: 0,
        licenseStatus: "REVIEW_REQUIRED",
        commercialRelease: "NOT_CLEARED",
      })
      expect(record.acceptance).toEqual({
        fullCharacterComplete: false,
        independentArtReview: "NOT_RUN",
        physicalDevice: "NOT_RUN",
        humanAudioReview: "NOT_RUN",
        rightsCleared: false,
      })
      expect(record.releaseReady).toBe(false)
    }
  })

  it("reports independent identity, reference, rights, release and summary drift", () => {
    const changed = structuredClone(characterReadinessInventory()) as any
    changed.records[0].displayName = "Sai identity"
    changed.records[0].manifest.referencePackageReady = false
    changed.records[0].technicalReferenceReady = false
    changed.records[0].acceptance.rightsCleared = true
    changed.records[0].releaseReady = true
    changed.summary.technicalReferenceReady = 12
    expect(validateCharacterReadinessInventory(changed)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("identity canon"),
        expect.stringContaining("reference package"),
        expect.stringContaining("rights status"),
        expect.stringContaining("release readiness"),
        expect.stringContaining("Summary technicalReferenceReady"),
      ]),
    )
  })

  it("locks deterministic readiness serialization", () => {
    expect(
      createHash("sha256").update(serializeCharacterReadiness()).digest("hex"),
    ).toBe("f023eec9896ec734735fd120306e7c7202acd73424c56de42996f57810e16e4c")
  })

  it("renders an honest in-game disclosure", () => {
    const html = renderToStaticMarkup(
      createElement(CharacterReadinessDisclosure),
    )
    expect(html).toContain("Reference kỹ thuật")
    expect(html).toContain("<strong>12/12</strong>")
    expect(html).toContain("Full-character DoD")
    expect(html).toContain("<strong>0/12</strong>")
    expect(html).toContain("NOT_RUN")
    expect(html).toContain("Release-ready")
  })
})
