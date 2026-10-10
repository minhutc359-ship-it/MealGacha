import { boardPieces } from "./economy"
import { OVERTIME_TICKS } from "./config"
import { canRetry } from "./willpower"
import type { AutoRun, AutoSave } from "./types"

export function finishRun(save: AutoSave, run: AutoRun) {
  if (run.finished || !["won", "lost", "abandoned"].includes(run.phase)) return
  run.finished = true
  const records = [
    { id: run.id, mode: run.mode, seed: run.seed, rulesVersion: run.rulesVersion, day: run.day,
      score: run.score, wave: run.bestWave, seconds: Math.floor(run.activeTicks / 20),
      result: run.phase as "won" | "lost" | "abandoned",
      team: boardPieces(run).map(p => `${p.id}:${p.star}`) },
    ...save.records.filter(record => record.id !== run.id),
  ].sort((a, b) => b.score - a.score || b.wave - a.wave)
  save.records = (["campaign", "survival", "daily"] as const).flatMap(mode => {
    const days = new Set<string>()
    return records.filter(record => {
      if (record.mode !== mode || mode === "daily" && days.has(record.day)) return false
      days.add(record.day)
      return true
    }).slice(0, 20)
  })
}

// Normalize only old, unacknowledged loss results; preserve past completed runs.
export function normalizeAutoOutcome(save: AutoSave): AutoSave {
  const run = save.run, battle = run?.combat, result = run?.lastResult
  if (!run || run.finished || ["won", "lost", "abandoned"].includes(run.phase)) return save
  const oldLoss = run.phase === "result" && battle?.settled && result?.result === "loss"
  const allies = battle?.actors.some(actor => actor.side === "ally" && actor.hp > 0)
  const enemies = battle?.actors.some(actor => actor.side === "enemy" && actor.hp > 0)
  if (oldLoss && allies && enemies && battle.tick >= OVERTIME_TICKS) {
    // Undo the old timeout's round payout/penalty, then resume the same snapshot.
    run.gold = Math.max(0, run.gold - result.gold)
    run.xp = Math.max(0, run.xp - 2)
    run.health = Math.min(100, run.health + result.damage)
    battle.result = null
    battle.settled = false
    battle.pendingScene = null
    run.phase = "combat"
    run.paused = true
    run.lastResult = null
    run.pendingRewards = []
    run.reward = null
    run.log = ["Trận cũ đã bỏ xử thua ở 55 giây. Tiếp tục ở tốc độ ×3.", ...run.log.slice(1)].slice(0, 20)
  }
  // Explicit marker makes this conversion idempotent across autosave/import.
  // Historical completed runs keep their original rules and records.
  if (!run.willpowerVersion) {
    if (run.mode === "survival") {
      const pendingDefeat = oldLoss && !allies
      const before = run.health + (pendingDefeat ? result.damage : 0)
      run.health = Math.max(0, Math.min(3, Math.ceil(before * 3 / 100)) - (pendingDefeat ? 1 : 0))
      if (pendingDefeat) result.damage = 1
    }
    run.willpowerVersion = 1
  }
  if (oldLoss && !allies) {
    run.phase = canRetry(run) ? "result" : "lost"
    run.paused = false
    run.scene = null
    battle.pendingScene = null
    run.pendingRewards = []
    run.reward = null
    if (!canRetry(run)) finishRun(save, run)
  }
  if (run.health === 0 && !run.finished) {
    run.phase = "lost"
    run.scene = null
    run.paused = false
    run.pendingRewards = []
    run.reward = null
    if (battle) battle.pendingScene = null
    finishRun(save, run)
  }
  return save
}
