import { describe, expect, it } from "vitest"
import { newWorldProgress } from "@/aw2/world/model"
import { ZONE_IDS } from "@/aw2/world/ids"
import { canStand, zoneById } from "@/aw2/world/maps"
import { describeObject } from "@/aw2/world/rules"
import {
  advanceStepPortals,
  newStepPortalLatch,
  STEP_PORTAL_RADIUS,
} from "@/aw2/world/stepPortals"

const village = () => ({ ...newWorldProgress(), x: 560, y: 192 })

describe("017D step portals", () => {
  it("fires once on an outside-to-inside edge and rearms only after leaving", () => {
    const start = village(),
      gate = zoneById(start.zoneId).objects.find(
        (object) => object.kind === "exit" && object.activation === "step",
      )!
    let latch = newStepPortalLatch(start)
    const entered = { ...start, x: gate.x - STEP_PORTAL_RADIUS }
    let result = advanceStepPortals(start, entered, latch)
    expect(result.portal?.id).toBe(gate.id)
    latch = result.latch
    result = advanceStepPortals(entered, entered, latch)
    expect(result.portal).toBeUndefined()
    const left = { ...entered, x: gate.x - STEP_PORTAL_RADIUS - 8 }
    latch = advanceStepPortals(entered, left, latch).latch
    expect(advanceStepPortals(left, entered, latch).portal?.id).toBe(gate.id)
  })

  it("never auto-fires when loading a save already inside a threshold", () => {
    const gate = zoneById(ZONE_IDS[0]).objects.find(
        (object) => object.kind === "exit" && object.activation === "step",
      )!,
      loaded = { ...newWorldProgress(), x: gate.x, y: gate.y },
      latch = newStepPortalLatch(loaded)
    expect(advanceStepPortals(loaded, loaded, latch).portal).toBeUndefined()
    expect(latch.inside).toEqual([gate.id])
  })

  it("keeps building gates and completed shortcut explicitly interactive", () => {
    const yard = zoneById(ZONE_IDS[2])
    expect(
      yard.objects
        .filter((object) => object.kind === "exit")
        .map((object) => [object.id, object.activation ?? "interact"]),
    ).toEqual([
      ["aw2-shortcut-yard-table", "interact"],
      [`${ZONE_IDS[2]}:exit:west`, "step"],
      [`${ZONE_IDS[2]}:exit:east`, "interact"],
    ])
  })

  it("places every step arrival outside every destination trigger", () => {
    for (const source of ZONE_IDS.map(zoneById))
      for (const portal of source.objects.filter(
        (object) => object.kind === "exit" && object.activation === "step",
      )) {
        expect(canStand(portal.to!, portal.spawnX!, portal.spawnY ?? 192)).toBe(
          true,
        )
        const triggers = zoneById(portal.to!).objects.filter(
          (object) => object.kind === "exit" && object.activation === "step",
        )
        expect(
          triggers.every(
            (object) =>
              Math.hypot(
                portal.spawnX! - object.x,
                (portal.spawnY ?? 192) - object.y,
              ) > STEP_PORTAL_RADIUS,
          ),
        ).toBe(true)
      }
  })

  it("leaves a locked building threshold manual without granting travel", () => {
    const locked = {
        ...newWorldProgress(),
        zoneId: ZONE_IDS[2],
        x: 208,
        y: 64,
      },
      gate = zoneById(locked.zoneId).objects.find((object) =>
        object.id.endsWith(":exit:east"),
      )!,
      before = JSON.stringify(locked),
      next = { ...locked, y: gate.y + STEP_PORTAL_RADIUS },
      result = advanceStepPortals(locked, next, newStepPortalLatch(locked))
    expect(result.portal).toBeUndefined()
    expect(gate.activation).toBe("interact")
    expect(describeObject(next, gate).actions).toEqual([])
    expect(JSON.stringify(locked)).toBe(before)
  })
})
