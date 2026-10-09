import { boardPieces } from "./economy"
import { OVERTIME_TICKS } from "./config"
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
  if (!run || run.phase !== "result" || run.finished || !battle?.settled || result?.result !== "loss") return save
  const allies = battle.actors.some(actor => actor.side === "ally" && actor.hp > 0)
  const enemies = battle.actors.some(actor => actor.side === "enemy" && actor.hp > 0)
  if (allies && enemies && battle.tick >= OVERTIME_TICKS) {
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
  } else if (!allies) {
    run.phase = "lost"
    run.paused = false
    run.scene = null
    battle.pendingScene = null
    run.pendingRewards = []
    run.reward = null
    finishRun(save, run)
  }
  return save
}
