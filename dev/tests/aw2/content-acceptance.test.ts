import { createHash } from "node:crypto"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ContentAcceptanceDisclosure } from "../../aw2/ContentAcceptanceDisclosure"
import {
  CONTENT_ACCEPTANCE_ID,
  CONTENT_ACCEPTANCE_PUBLIC_SUMMARY,
  contentAcceptanceSnapshot,
  serializeContentAcceptance,
  validateContentAcceptance,
} from "@/aw2/world/contentAcceptance"
import { QUEST_IDS, SPIRIT_IDS, ZONE_IDS } from "@/aw2/world/ids"
import { NPC_LIFE_SCHEDULES } from "@/aw2/world/npcLife"
import { ROOMS } from "@/aw2/world/interiorLayout"

describe("AW2 content acceptance contract", () => {
  it("covers the complete authored canon without placeholders", () => {
    const snapshot = contentAcceptanceSnapshot()
    expect(snapshot.id).toBe(CONTENT_ACCEPTANCE_ID)
    expect(snapshot.zones.map((item) => item.id)).toEqual(ZONE_IDS)
    expect(snapshot.rooms.map((item) => item.id)).toEqual(
      ROOMS.map((room) => room.id),
    )
    expect(snapshot.npcs.map((item) => item.id)).toEqual(
      NPC_LIFE_SCHEDULES.map((npc) => npc.entityId),
    )
    expect(snapshot.quests.map((item) => item.id)).toEqual(QUEST_IDS)
    expect(snapshot.spirits.map((item) => item.id)).toEqual(SPIRIT_IDS)
    expect(snapshot.summary).toEqual({
      ...CONTENT_ACCEPTANCE_PUBLIC_SUMMARY,
      reachableZones: 6,
      technicalReady: true,
      releaseReady: false,
    })
    expect(snapshot.placeholderHits).toEqual([])
    expect(validateContentAcceptance(snapshot)).toEqual([])
  })

  it("verifies every room, NPC and quest projection", () => {
    const snapshot = contentAcceptanceSnapshot()
    expect(snapshot.rooms.every((room) => room.spawnSafe)).toBe(true)
    expect(snapshot.npcs.every((npc) => npc.entityPresent)).toBe(true)
    for (const quest of snapshot.quests) {
      expect(quest.title).not.toBe("")
      expect(quest.objective).not.toBe("")
      expect(Object.values(quest.reward).every((value) => value >= 0)).toBe(
        true,
      )
    }
  })

  it("locks reciprocal portal and return-route coverage", () => {
    const snapshot = contentAcceptanceSnapshot()
    expect(snapshot.portals).toHaveLength(12)
    expect(snapshot.portals.every((portal) => portal.returnVerified)).toBe(true)
    expect(snapshot.reachableZoneIds).toEqual(ZONE_IDS)
    for (const portal of snapshot.portals) {
      const reverse = snapshot.portals.find(
        (candidate) => candidate.id === portal.reversePortalId,
      )
      expect(reverse).toMatchObject({
        from: portal.destination,
        destination: portal.from,
        reversePortalId: portal.id,
      })
    }
  })

  it("reports independent canon, entity, route, copy and summary drift", () => {
    const changed = structuredClone(contentAcceptanceSnapshot()) as any
    changed.zones[0].id = "aw2-zone-wrong"
    changed.npcs[0].entityPresent = false
    changed.quests[0].grantId = "aw2-grant-wrong"
    changed.portals[0].returnVerified = false
    changed.copy[0].text = "TODO placeholder"
    changed.summary.zones = 99
    changed.summary.releaseReady = true
    expect(validateContentAcceptance(changed)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Zone không khớp canon"),
        expect.stringContaining("entity NPC"),
        expect.stringContaining("copy/grant/reward"),
        expect.stringContaining("return route"),
        expect.stringContaining("placeholder"),
        expect.stringContaining("Summary zones"),
        expect.stringContaining("release-ready"),
      ]),
    )
  })

  it("locks deterministic content serialization", () => {
    expect(
      createHash("sha256").update(serializeContentAcceptance()).digest("hex"),
    ).toBe("40bce3b43a642f92635c2f9502ed687abccc999636a85a76147c95c103badd5e")
  })

  it("renders a technically complete but human-unapproved disclosure", () => {
    const html = renderToStaticMarkup(
      createElement(ContentAcceptanceDisclosure),
    )
    expect(html).toContain("Contract kỹ thuật")
    expect(html).toContain("PASS")
    expect(html).toContain("6 vùng")
    expect(html).toContain("8 NPC")
    expect(html).toContain("12/12")
    expect(html).toContain("NOT_RUN")
  })
})
