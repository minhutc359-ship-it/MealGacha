import { AUGMENTS, COSMETICS, RELICS } from "./catalog"
import {
  buy,
  autoArrange,
  move,
  sell,
  equip,
  choices,
  createAutoRun,
  refreshShop,
  boardPieces,
  seedForDay,
} from "./economy"
import {
  combatantsAlive,
  combatReady,
  combatScore,
  createCombat,
} from "./combat"
import {
  emptyAutoSave,
  type AutoMode,
  type AutoRun,
  type AutoSave,
} from "./types"
import { SCENES } from "./story"

export type AutoAction = {
  type: "start"
  mode: AutoMode
  seed: number
  day: string
  id: string
} | { type: "buy"; index: number } | {
  type: "move"
  uid: string
  cell: number | null
  swapUid?: string
} | { type: "sell"; uid: string } | {
  type: "equip"
  uid: string
  item: string
} | { type: "unequip"; uid: string; item: string } | { type: "reroll" } | {
  type: "lock"
} | { type: "xp" } | { type: "auto-place" } | { type: "battle" } | {
  type: "checkpoint"
  run: AutoRun
} | { type: "pause"; value: boolean } | { type: "next" } | {
  type: "reward"
  id: string
} | { type: "reroll-reward" } | { type: "dialogue" } | { type: "abandon" } | {
  type: "ending"
  choice: "annotations" | "hall"
} | { type: "cosmetic"; id: string } | { type: "tutorial" }

const active = (run: AutoRun | null) =>
  !!run && !["won", "lost", "abandoned"].includes(run.phase)
export const hasActiveAutoRun = active
function finish(save: AutoSave, run: AutoRun) {
  if (run.finished || !["won", "lost", "abandoned"].includes(run.phase)) return
  run.finished = true
  const records = [
    {
      id: run.id,
      mode: run.mode,
      seed: run.seed,
      rulesVersion: run.rulesVersion,
      day: run.day,
      score: run.score,
      wave: run.bestWave,
      seconds: Math.floor(run.activeTicks / 20),
      result: run.phase as "won" | "lost" | "abandoned",
      team: boardPieces(run).map((p) => `${p.id}:${p.star}`),
    },
    ...save.records.filter((r) => r.id !== run.id),
  ].sort((a, b) => b.score - a.score || b.wave - a.wave)
  save.records = (["campaign", "survival", "daily"] as const).flatMap(
    (mode) => {
      const days = new Set<string>()
      return records
        .filter((r) => {
          if (r.mode !== mode || (mode === "daily" && days.has(r.day)))
            return false
          days.add(r.day)
          return true
        })
        .slice(0, 20)
    },
  )
}
function settle(save: AutoSave, run: AutoRun) {
  const b = run.combat
  if (!b || b.settled) return
  const allies = combatantsAlive(b, "ally"),
    enemies = combatantsAlive(b, "enemy")
  const result = !allies
    ? "loss"
    : !enemies
      ? "win"
      : b.tick >= 1100 || b.result === "loss"
        ? "loss"
        : null
  if (!result) {
    b.result = null
    run.phase = "combat"
    return
  }
  b.result = result
  b.settled = true
  b.pendingScene = null
  const won = result === "win",
    alreadyPaid = run.paidWaves.includes(run.wave)
  const points = won && !alreadyPaid ? combatScore(run) : 0
  const interest = Math.min(3, Math.floor(run.gold / 10))
  const gold =
    5 + (won ? 1 : 0) + interest + (run.augments.includes("another") ? 2 : 0)
  const damage = won ? 0 : Math.min(25, 5 + 2 * enemies)
  run.gold += gold
  run.xp = Math.min(1000, run.xp + 2)
  run.health = Math.max(0, run.health - damage)
  run.score += points
  if (won && !alreadyPaid) {
    run.paidWaves.push(run.wave)
    run.bestWave = Math.max(run.bestWave, run.wave)
    save.seals += Math.max(1, Math.floor(points / 150))
  }
  if (won && run.mode === "campaign" && run.wave <= save.campaignCleared + 1)
    save.campaignCleared = Math.max(save.campaignCleared, run.wave)
  const rat = b.actors.some((a) => a.id === "rat" && a.hp > 0)
  const reason = won
    ? "Vị Linh giữ được bàn. Quân bị hạ sẽ trở lại ở vòng chuẩn bị."
    : b.tick >= 1100
      ? "Hết 55 giây: vòng thua. Tăng sát thương, ghép sao hoặc đổi hướng build để kết thúc trước cuồng nộ."
      : rat
        ? "Chuột Tro còn sống và săn tuyến sau. Đặt hộ vệ cạnh carry hoặc đảo vị trí trước trận."
        : "Đội hình đã bị hạ. Ghép sao tuyến trước, dùng khiên/hồi phục và giữ carry sau hộ vệ."
  run.lastResult = {
    id: b.id,
    wave: run.wave,
    result,
    seconds: b.tick / 20,
    survivors: allies,
    points,
    damage,
    gold,
    reason,
  }
  run.log = [
    `${won ? "Thắng" : "Thua"} đợt ${run.wave} · ${points} điểm · ${gold} vàng`,
    ...run.log,
  ].slice(0, 20)
  run.pendingRewards =
    won && !alreadyPaid
      ? [
          ...(run.wave % 3 === 0 ? ["relic" as const] : []),
          ...(b.boss ? ["augment" as const] : []),
        ]
      : []
  if (run.health <= 0) {
    run.phase = "lost"
    finish(save, run)
  } else if (won && run.mode === "campaign" && run.wave === 12) {
    run.phase = "won"
    run.scene = "ending"
    run.sceneLine = 0
    finish(save, run)
  } else run.phase = "result"
}
function prepare(run: AutoRun) {
  run.phase = "prepare"
  run.combat = null
  run.reward = null
  run.paused = false
  if (!run.locked) refreshShop(run)
  run.freeReroll = run.augments.includes("shift")
  const scene = `intro-${run.wave}`
  if (
    run.mode === "campaign" &&
    SCENES[scene] &&
    !run.seenScenes.includes(scene)
  ) {
    run.scene = scene
    run.sceneLine = 0
  }
}
function offerReward(run: AutoRun) {
  const kind = run.pendingRewards.shift()
  if (!kind) {
    prepare(run)
    return
  }
  const opts = choices(run, kind)
  if (!opts.length) {
    offerReward(run)
    return
  }
  run.phase = "reward"
  run.reward = { kind, choices: opts }
}
export function reduceAuto(
  input: AutoSave | undefined,
  action: AutoAction,
): { save: AutoSave; error: string | null } {
  const original = input ?? emptyAutoSave(),
    fail = (error: string) => ({ save: original, error })
  const save = structuredClone(original)
  if (action.type === "tutorial") {
    save.tutorialSeen = true
    return { save, error: null }
  }
  if (action.type === "cosmetic") {
    const item = COSMETICS.find((c) => c.id === action.id)
    if (action.id === "market") {
      save.board = "market"
      return { save, error: null }
    }
    if (!item) return fail("Bàn không tồn tại.")
    if (!save.cosmetics.includes(item.id)) {
      if (save.seals < item.cost) return fail("Chưa đủ Ấn Chợ.")
      save.seals -= item.cost
      save.cosmetics.push(item.id)
    }
    save.board = item.id
    return { save, error: null }
  }
  if (action.type === "start") {
    if (active(save.run))
      return fail(
        "Phiên chợ đang diễn ra. Tiếp tục hoặc kết thúc lượt hiện tại trước.",
      )
    save.run = createAutoRun(
      action.mode,
      action.mode === "daily" ? seedForDay(action.day) : action.seed,
      action.day,
      action.id,
    )
    return { save, error: null }
  }
  const run = save.run
  if (!run) return fail("Hãy bắt đầu một phiên chợ.")
  if (action.type === "checkpoint") {
    const next = action.run
    if (
      run.phase !== "combat" ||
      next.id !== run.id ||
      next.rounds !== run.rounds ||
      next.combat?.id !== run.combat?.id ||
      (next.combat?.tick ?? -1) < (run.combat?.tick ?? 0)
    )
      return fail("Bản lưu trận cũ đã được bỏ qua.")
    save.run = structuredClone(next)
    if (next.combat?.result || next.phase === "result") settle(save, save.run)
    return { save, error: null }
  }
  if (action.type === "dialogue") {
    const key = run.combat?.pendingScene ?? run.scene,
      scene = key ? SCENES[key] : null
    if (!scene || !key) return fail("Không có hội thoại đang chờ.")
    run.sceneLine++
    if (run.sceneLine >= scene.lines.length) {
      run.seenScenes = [...new Set([...run.seenScenes, key])]
      run.sceneLine = 0
      if (run.combat?.pendingScene) run.combat.pendingScene = null
      else run.scene = null
    }
    return { save, error: null }
  }
  if (action.type === "ending") {
    if (run.phase !== "won" || run.mode !== "campaign" || run.scene)
      return fail("Hãy kết thúc câu chuyện sau chiến thắng trước.")
    save.ending = action.choice
    return { save, error: null }
  }
  if (action.type === "abandon") {
    if (!active(run)) return fail("Lượt chơi đã kết thúc.")
    run.phase = "abandoned"
    run.paused = true
    run.scene = null
    if (run.combat) run.combat.pendingScene = null
    finish(save, run)
    return { save, error: null }
  }
  if (action.type === "pause") {
    if (run.phase !== "combat") return fail("Chỉ tạm dừng khi giao chiến.")
    run.paused = action.value
    return { save, error: null }
  }
  if (action.type === "next") {
    if (run.phase !== "result" || !run.combat?.settled || !run.lastResult)
      return fail("Vòng chưa được chốt.")
    if (run.mode !== "campaign" || run.lastResult.result === "win") run.wave++
    offerReward(run)
    return { save, error: null }
  }
  if (action.type === "reward") {
    if (run.phase !== "reward" || !run.reward?.choices.includes(action.id))
      return fail("Lựa chọn không hợp lệ.")
    if (run.reward.kind === "augment") {
      run.augments.push(action.id)
      if (action.id === "another") run.relicReroll = true
    } else if (run.inventory.length < 120) run.inventory.push(action.id)
    else save.seals += 2
    offerReward(run)
    return { save, error: null }
  }
  if (action.type === "reroll-reward") {
    if (
      run.phase !== "reward" ||
      run.reward?.kind !== "relic" ||
      !run.relicReroll
    )
      return fail("Không còn lượt đổi di vật.")
    run.reward.choices = choices(run, "relic")
    run.relicReroll = false
    return { save, error: null }
  }
  if (run.phase !== "prepare" || run.scene)
    return fail("Chỉ thay đổi đội hình ở vòng chuẩn bị.")
  let error: string | null = null
  switch (action.type) {
    case "auto-place":
      error = autoArrange(run)
      break
    case "buy":
      error = buy(run, action.index)
      break
    case "move":
      error = move(run, action.uid, action.cell, action.swapUid)
      break
    case "sell":
      sell(run, action.uid)
      break
    case "equip":
      error = equip(run, action.uid, action.item)
      break
    case "unequip": {
      const p = run.roster.find((p) => p.uid === action.uid),
        i = p?.items.indexOf(action.item) ?? -1
      if (p && i >= 0) {
        p.items.splice(i, 1)
        run.inventory.push(action.item)
      }
      break
    }
    case "reroll":
      if (run.gold < 2 && !run.freeReroll) error = "Đổi cửa hàng cần 2 vàng."
      else {
        if (run.freeReroll) run.freeReroll = false
        else run.gold -= 2
        refreshShop(run)
      }
      break
    case "lock":
      run.locked = !run.locked
      break
    case "xp":
      if (run.xp >= 62) error = "Bàn đã đạt tối đa 7 quân."
      else if (run.gold < 4) error = "Cần 4 vàng để mua 4 XP."
      else {
        run.gold -= 4
        run.xp = Math.min(1000, run.xp + 4)
      }
      break
    case "battle":
      if (!combatReady(run))
        error =
          "Đặt ít nhất một quân lên bàn và đọc hết thoại trước khi xuất trận."
      else {
        run.rounds++
        run.phase = "combat"
        run.paused = false
        run.combat = createCombat(run)
      }
      break
  }
  return error ? fail(error) : { save, error: null }
}
export function rewardDefinition(id: string) {
  return [...RELICS, ...AUGMENTS].find((r) => r.id === id)
}
