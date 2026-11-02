import { describe, expect, it } from "vitest"
import { Aw2ModeAdapter } from "@/aw2/modes/session"
import {
  createTableRun,
  inspectTableResult,
  type TableRun,
} from "@/aw2/modes/run"
import {
  modeStage,
  newModeProgress,
  recordModeResult,
} from "@/aw2/modes/progress"
import { earnedSummonMilestones } from "@/aw2/gacha/runtime"
import { freePlayFixture } from "./free-play-fixture"

function finish(run: TableRun) {
  if (run.mode === "tcg") {
    for (let n = 0; n < 500 && run.snapshot().match.status === "active"; n++)
      run.dispatch({ type: "recommend" })
    return run.snapshot().match.status
  }
  for (
    let steps = 0;
    steps < 1500 && run.snapshot().game.phase !== "finished";
    steps++
  ) {
    let game = run.snapshot().game
    if (game.phase === "planning") {
      for (let tries = 0; tries < 40; tries++) {
        game = run.snapshot().game
        const offers = game.offers
          .map((id, slot) => ({ id, slot }))
          .filter((v) => v.id !== null)
          .sort((a, b) => {
            const score = (id: string) =>
              game.units.filter((u) => u.spiritId === id && u.stars === 1)
                .length *
                20 +
              (!game.units.some((u) => u.spiritId === id) ? 8 : 0)
            return score(b.id!) - score(a.id!)
          })
        let bought = false
        for (const offer of offers) {
          const next = run.dispatch({ type: "buy", slot: offer.slot })
          if (!next.feedback) {
            bought = true
            break
          }
        }
        if (bought) {
          run.dispatch({ type: "arrange" })
          continue
        }
        if (game.gold < 3 || game.units.length >= 8) break
        run.dispatch({ type: "refresh" })
      }
      run.dispatch({ type: "arrange" })
      run.dispatch({ type: "start" })
    } else run.dispatch({ type: game.phase === "battle" ? "tick" : "next" })
  }
  return run.snapshot().game.status
}
describe("019B actual issued table engines and durable progression", () => {
  it.each([1, 2, 3])(
    "TCG stage%s finishes under legal coach play without a synthetic result",
    (stage) => {
      const run = createTableRun("stage-proof", "tcg", stage)
      expect(["player-win", "opponent-win", "draw"]).toContain(finish(run))
      expect(inspectTableResult(run, "stage-proof").stage).toBe(stage)
    },
  )
  it.each([1, 2, 3])(
    "Chess stage%s is winnable using legal recruitment/formation commands",
    (stage) => {
      const run = createTableRun("stage-proof", "auto-chess", stage)
      expect(finish(run)).toBe("player-win")
    },
  )
  it.each(["tcg", "auto-chess"] as const)(
    "%s snapshots cannot forge terminal results, and unfinished departure grants nothing",
    async (mode) => {
      const f = await freePlayFixture(),
        adapter = new Aw2ModeAdapter(f.store),
        entered = await adapter.enter(
          f.first.raw,
          f.first.save.progress,
          mode,
          "quick-entry",
        ),
        run = adapter.currentRun()!
      const snapshot = run.snapshot()
      if ("match" in snapshot) snapshot.match.status = "player-win"
      else snapshot.game.status = "player-win"
      await expect(adapter.complete()).rejects.toThrow(/hoàn tất/)
      expect(f.store.load()).toEqual(entered.checkpoint)
      const fake = { ...run, snapshot: () => snapshot } as TableRun
      await expect(
        f.store.finishMode(entered.checkpoint.raw, fake),
      ).rejects.toThrow(/không thuộc/)
      expect(adapter.returnToWorld()).toEqual(entered.checkpoint)
      expect(entered.checkpoint.save.modes).toEqual(newModeProgress())
    },
  )
  it.each(["tcg", "auto-chess"] as const)(
    "%s real win saves one result and a claimable first-win milestone",
    async (mode) => {
      const f = await freePlayFixture(),
        adapter = new Aw2ModeAdapter(f.store)
      const entered = await adapter.enter(
          f.first.raw,
          f.first.save.progress,
          mode,
          "quick-entry",
        ),
        run = adapter.currentRun()!
      expect(finish(run)).toBe("player-win")
      f.setItem.mockClear()
      const saved = await adapter.complete()
      expect(saved.save.modes[mode]).toEqual({
        played: 1,
        wins: 1,
        draws: 0,
        bestStage: 1,
        last: { stage: 1, outcome: "player-win" },
      })
      expect(saved.save.summons.tickets).toBe(0)
      expect(
        earnedSummonMilestones(saved.save.economy, saved.save.modes),
      ).toContain(`${mode}:1`)
      const before = run.snapshot()
      if (run.mode === "tcg") run.dispatch({ type: "rematch" })
      else run.dispatch({ type: "rematch" })
      expect(run.snapshot()).toEqual(before)
      await expect(adapter.complete()).rejects.toThrow(/đã lưu/)
      await expect(f.store.finishMode(saved.raw, run)).rejects.toThrow()
      expect(adapter.returnToWorld()).toEqual(saved)
      const again = await adapter.enter(
        saved.raw,
        saved.save.progress,
        mode,
        "quick-entry",
      )
      expect(adapter.currentRun()!.stage).toBe(2)
      expect(again.checkpoint.save.summons.tickets).toBe(0)
    },
  )
  it.each(["tcg", "auto-chess"] as const)(
    "%s terminal loss is recorded without first-win reward",
    async (mode) => {
      const f = await freePlayFixture(),
        adapter = new Aw2ModeAdapter(f.store)
      await adapter.enter(
        f.first.raw,
        f.first.save.progress,
        mode,
        "quick-entry",
      )
      const run = adapter.currentRun()!
      if (run.mode === "tcg")
        run.dispatch({
          type: "command",
          command: { type: "surrender", side: "player" },
        })
      else run.dispatch({ type: "surrender" })
      const result = await adapter.complete()
      expect(result.save.modes[mode]).toMatchObject({
        played: 1,
        wins: 0,
        bestStage: 0,
      })
      expect(
        earnedSummonMilestones(result.save.economy, result.save.modes),
      ).toEqual([])
    },
  )
  it("quota failure keeps an authentic result retryable, while stale checkpoints cannot be submitted", async () => {
    const f = await freePlayFixture(),
      adapter = new Aw2ModeAdapter(f.store)
    const entered = await adapter.enter(
        f.first.raw,
        f.first.save.progress,
        "tcg",
        "quick-entry",
      ),
      run = adapter.currentRun()!
    expect(finish(run)).toBe("player-win")
    f.fail(true)
    await expect(adapter.complete()).rejects.toMatchObject({
      code: "write-failed",
    })
    expect(f.store.load()).toEqual(entered.checkpoint)
    expect(inspectTableResult(run, entered.checkpoint.raw).outcome).toBe(
      "player-win",
    )
    f.fail(false)
    const result = await adapter.complete()
    expect(result.save.modes.tcg.wins).toBe(1)
    expect(f.memory.get("foodchest.user.v1")).toBe("original-save")
    const next = await adapter.returnToWorld()
    await adapter.enter(next.raw, next.save.progress, "tcg", "quick-entry")
    const current = f.store.load()
    if (current.status !== "ready") throw Error("not ready")
    const newer = await f.store.save(current.raw)
    const newerRun = adapter.currentRun()!
    if (newerRun.mode === "tcg")
      newerRun.dispatch({
        type: "command",
        command: { type: "surrender", side: "player" },
      })
    await expect(adapter.complete()).rejects.toMatchObject({ code: "conflict" })
    expect(f.store.load()).toEqual(newer)
  })
  it("caps stage rewards, preserves repeats and rejects stage skipping", () => {
    let progress = newModeProgress()
    expect(() => recordModeResult(progress, "tcg", 3, "player-win")).toThrow()
    for (let stage = 1; stage <= 3; stage++)
      progress = recordModeResult(progress, "tcg", stage, "player-win")
    const again = recordModeResult(progress, "tcg", 3, "player-win")
    expect(again.tcg).toMatchObject({ wins: 4, bestStage: 3, played: 4 })
    expect(modeStage(again, "tcg")).toBe(3)
    expect(() => createTableRun("raw", "bad" as never, 1)).toThrow()
  })
})
