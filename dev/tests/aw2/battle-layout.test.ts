import { describe, expect, it } from "vitest"
import { createBattlePreviewSession } from "../../aw2/battleSession"
import {
  actorDisplayScale,
  actorStatus,
  projectBattle,
  projectCompactBattle,
  recentActorOutcomes,
} from "../../aw2/battleLayout"
import { STARTER_ASSETS } from "../../../src/aw2/assets/starters"

describe("AW2-004H presentation depth and readable outcomes", () => {
  it("keeps compact actors in the viewport, stable by slot and proportional to actual progress", () => {
    const { battle } = createBattlePreviewSession(5)
    const before = JSON.stringify(battle)
    for (const [width, height] of [
      [300, 150],
      [374, 430],
      [828, 180],
      [1264, 450],
    ]) {
      const view = projectCompactBattle(battle.actors, width, height)
      expect(view).toEqual(
        projectCompactBattle([...battle.actors].reverse(), width, height),
      )
      for (const actor of battle.actors) {
        const point = view.points[actor.id]
        expect(point.x).toBeGreaterThanOrEqual(64)
        expect(point.x).toBeLessThanOrEqual(width - 64)
        expect(point.y).toBeGreaterThan(32)
        expect(point.y).toBeLessThan(height - 32)
        for (const other of battle.actors) {
          expect(view.points[other.id].x - point.x).toBeCloseTo(
            ((other.position - actor.position) * (width - 128)) / 100,
          )
          if (actor.side === other.side && actor.id !== other.id)
            expect(view.points[other.id].y).not.toBe(point.y)
        }
      }
    }
    expect(JSON.stringify(battle)).toBe(before)
  })
  it("separates converged actors without modifying core position or actor order", () => {
    const { battle } = createBattlePreviewSession(5)
    battle.actors.forEach((actor) => (actor.position = 50))
    const original = JSON.stringify(battle)
    const view = projectBattle(battle.actors, 320)
    expect(
      new Set(Object.values(view.points).map((point) => point.y)).size,
    ).toBe(8)
    expect(
      new Set(Object.values(view.points).map((point) => point.x)).size,
    ).toBe(1)
    expect(JSON.stringify(battle)).toBe(original)
    const afterDefeat = structuredClone(battle)
    afterDefeat.actors[0].hp = 0
    expect(projectBattle(afterDefeat.actors.reverse(), 320)).toEqual(view)
  })

  it("keeps horizontal ordering, distance ratios and stable lanes at every width", () => {
    const { battle } = createBattlePreviewSession(5)
    for (const width of [240, 288, 358, 734, 960, 1200]) {
      const view = projectBattle(battle.actors, width)
      for (const actor of battle.actors) {
        const point = view.points[actor.id]
        expect(point.x).toBeGreaterThanOrEqual(64)
        expect(point.x).toBeLessThanOrEqual(view.width - 64)
        expect(point.y + 32).toBeLessThan(view.height)
        expect(point.lane).toBe(
          projectBattle(battle.actors, 960).points[actor.id].lane,
        )
        for (const other of battle.actors) {
          expect(view.points[other.id].x - point.x).toBeCloseTo(
            ((other.position - actor.position) * (view.width - 128)) / 100,
          )
        }
      }
    }
  })

  it("fits every reference source cell with room for pose motion inside its depth lane", () => {
    for (const manifest of Object.values(STARTER_ASSETS)) {
      const scale = actorDisplayScale(manifest)
      for (const frame of Object.values(manifest.frames).filter((frame) =>
        frame.asset.startsWith("battle"),
      )) {
        expect(
          Math.max(frame.width, frame.height) *
            (frame.renderScale ?? 1) *
            scale,
        ).toBeLessThanOrEqual(72.00001)
      }
    }
  })

  it("uses real active statuses with exact expiry and defeat precedence", () => {
    const actor = createBattlePreviewSession(5).battle.actors[0]
    Object.assign(actor, {
      shield: 15,
      slowUntilTick: 8,
      weakenUntilTick: 7,
      interruptGuardCharges: 1,
      interruptGuardUntilTick: 9,
    })
    expect(actorStatus(actor, 7)).toEqual(["Khiên 15", "Chậm", "Chống ngắt"])
    expect(actorStatus(actor, 9)).toEqual(["Khiên 15"])
    actor.hp = 0
    expect(actorStatus(actor, 7)).toEqual(["Đã gục"])
  })

  it("bounds outcomes per real recipient, suppresses verbose/future/old/terminal items", () => {
    const { presentation } = createBattlePreviewSession(5)
    presentation.floating = Array.from({ length: 20 }, (_, serial) => ({
      serial,
      tick: 4,
      kind: "hit",
      amount: serial,
      targetId: "a",
      text: "long renderer-independent text",
    }))
    presentation.floating.push({
      serial: 20,
      tick: 4,
      kind: "status",
      text: "verbose status",
      targetId: "a",
    })
    presentation.floating.push({
      serial: 21,
      tick: 6,
      kind: "hit",
      text: "future",
      amount: 100,
      targetId: "a",
    })
    expect(
      recentActorOutcomes(presentation, "a", 5).map((item) => item.serial),
    ).toEqual([18, 19])
    expect(recentActorOutcomes(presentation, "b", 5)).toEqual([])
    expect(recentActorOutcomes(presentation, "a", 8)).toEqual([])
    presentation.terminal = { serial: 22, tick: 5, text: "draw" }
    expect(recentActorOutcomes(presentation, "a", 5)).toEqual([])
  })
})
