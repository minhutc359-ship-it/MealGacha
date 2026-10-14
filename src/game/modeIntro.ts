import { actBattle, type BattleAction, type BattleFrame, type BattleEvent } from "./battle"
import { practiceBattle } from "./practice"
import type { Battle } from "./types"
import { STAGE_MAP } from "./story"
import { createAutoRun, buy, move } from "./autochess/economy"
import { advanceCombat, createCombat } from "./autochess/combat"
import type { AutoRun } from "./autochess/types"
import { newRpgSave, createRpgBattle, reduceRpg } from "./adventureRpg/engine"
import type { RpgSave } from "./adventureRpg/types"
import { newGame } from "./progression"
import { buildPool, getDishRarity } from "../domain/drawReward"
import { SEED_DISHES } from "../infrastructure/catalog/seedCatalog"
import type { RewardRarity } from "../domain/models"
import type { GameSound, MusicTrack } from "./audioScore"
import { INTRO_DURATION, type IntroMode } from "./modeIntroState"

export interface IntroBeat {
  at: number
  title: string
  text: string
  tag: string
}
export type IntroEffect = "summon" | "heal" | "fire" | "water" | "combo" | "merge" | "capture" | "victory" | "reveal"
export type IntroScene = {
  mode: "tcg"
  battle: Battle
  event?: BattleEvent
  frame?: BattleFrame
} | {
  mode: "auto"
  run: AutoRun
} | {
  mode: "adventure"
  save: RpgSave
} | {
  mode: "chest"
  phase: "choose" | "unlock" | "reveal" | "collect"
  dishId: string
  rarity: RewardRarity
  keys: number
}
export interface IntroFrame {
  at: number
  scene: IntroScene
  effect?: IntroEffect
  sound?: GameSound
}
export interface IntroClip {
  mode: IntroMode
  duration: number
  beats: IntroBeat[]
  frames: IntroFrame[]
  music: MusicTrack
  takeaway: string
}

const beat = (at: number, title: string, text: string, tag: string): IntroBeat => ({ at, title, text, tag })
const requireValid = (error: string | null | undefined) => {
  if (error) throw new Error(`Mode introduction fixture: ${error}`)
}

function tcgIntro(): IntroClip {
  let battle = practiceBattle(2)
  battle.id = "intro-tcg-boss"
  battle.round=2;battle.turnSerial=3;battle.turnSide="player"
  battle.player.trap={uid:`t${battle.nextUid++}`,cardId:"trap-seal",setTurn:1}
  battle.stageId = "harbor-3"
  battle.opponent = STAGE_MAP["harbor-3"].opponent
  battle.seenScenes = ["awaken:harbor-3"]
  battle.player.health = 12
  battle.player.maxHealth = 20
  battle.player.hand = ["pho-bo", "v4-crossroads-tea", "v4-two-spices"]
  battle.player.board = [{ uid: "intro-rice", cardId: "com-tam", attack: 8, health: 9, maxHealth: 9, shield: 0, ready: true, keywords: [] }]
  battle.enemy.health = 8
  battle.enemy.maxHealth = 16
  battle.enemy.maxMana = 4
  battle.enemy.hand = ["v4-two-spices"]
  battle.enemy.deck = ["v4-two-spices", "banh-mi"]
  battle.enemy.board = [{ uid: "intro-guard", cardId: "banh-mi", attack: 2, health: 3, maxHealth: 3, shield: 0, ready: true, keywords: ["guard"] }]
  const frames: IntroFrame[] = [{ at: 0, scene: { mode: "tcg", battle: structuredClone(battle) } }]
  const act = (at: number, window: number, action: BattleAction) => {
    const result = actBattle(battle, action, () => .41)
    requireValid(result.error)
    battle = result.battle
    const resolvedFrames=[...result.frames]
    for(let steps=0;battle.pendingReaction&&steps<8;steps++){
      const response=actBattle(battle,{type:"react",id:battle.pendingReaction.id,activate:true},()=>.41)
      requireValid(response.error);resolvedFrames.push(...response.frames);battle=response.battle
    }
    requireValid(battle.pendingReaction?"unresolved trap response":null)
    for (let i = 0; i < resolvedFrames.length; i++) {
      const frame = resolvedFrames[i]
      frames.push({ at: at + i * window / resolvedFrames.length, scene: { mode: "tcg", battle: frame.battle, event: frame.event, frame } })
    }
    frames.push({ at: at + window, scene: { mode: "tcg", battle: structuredClone(battle) } })
  }
  act(2_000, 2_500, { type: "play", index: 0 })
  act(6_000, 3_000, { type: "play", index: 0, branch: "first" })
  act(10_000, 2_000, { type: "play", index: 0, branch: "first", target: "intro-guard" })
  act(13_000, 6_000, { type: "end" })
  act(21_000, 2_000, { type: "attack", uid: "intro-rice", target: "hero" })
  requireValid(battle.result === "win" ? null : "TCG boss introduction must win")
  return {
    mode: "tcg", duration: INTRO_DURATION, frames, music: "boss",
    takeaway: "Triệu hồi → cộng hưởng/công thức → hạ Hộ vệ → kết thúc lượt → đọc phản kích / lật bẫy → đánh chủ tướng.",
    beats: [
      beat(0, "Đối đầu Hỏa Linh", "Trận mẫu giữa ván: 7 năng lượng, Cơm tấm đã cường hóa và một bẫy úp từ lượt trước. Hộ vệ đang chặn đường tới boss.", "TRẬN BOSS"),
      beat(2_000, "Gọi Phở bò", "Ra thẻ tốn năng lượng; quân mới thường chờ lượt sau. Phở bò mở điểm nối cho Bữa cơm nhà.", "TRIỆU HỒI"),
      beat(6_000, "Phở bò → Ấm trà ngã rẽ", "Mời ngồi lại hồi ý chí. Cộng hưởng Hải giảm 1 năng lượng và công thức Bữa cơm nhà cho thêm hồi/ chắn.", "COMBO"),
      beat(10_000, "Dậy lửa hạ Hộ vệ", "Chọn đúng nhánh phép và mục tiêu: Hai nhúm gia vị gây 3 sát thương, mở đường đánh chủ tướng.", "MỞ ĐƯỜNG"),
      beat(13_000, "Boss phản kích", "Boss tự ra phép. Bẫy Niêm Phong chặn một phép; boss vẫn có thể dùng lá tiếp theo. HP và năng lượng thay đổi theo luật thật.", "LƯỢT ĐỊCH"),
      beat(19_000, "Đến lượt bạn trở lại", "Năng lượng hồi, đồng minh sẵn sàng. Hãy quan sát đòn phản kích trước khi quyết định lượt tiếp theo.", "HỒI LƯỢT"),
      beat(21_000, "Cơm tấm kết thúc trận", "Hộ vệ đã bị hạ, Cơm tấm dùng 8 công đã cường hóa để đưa ý chí Hỏa Linh về 0.", "CHIẾN THẮNG"),
    ],
  }
}

function autoIntro(): IntroClip {
  let run = createAutoRun("survival", 431, "intro", "intro-auto")
  run.wave = 5
  run.xp = 20
  for (const piece of run.roster) if (piece.id !== "pho-bo") piece.star = 2
  run.roster.push({ uid: "intro-rieu", id: "bun-rieu", star: 2, cell: 30, items: [] })
  run.roster.push({ uid: "intro-bread", id: "banh-mi", star: 2, cell: 21, items: [] })
  run.shop = ["pho-bo", "pho-bo", null, null, null]
  const frames: IntroFrame[] = []
  const snapshot = (at: number, effect?: IntroEffect, sound?: GameSound) => frames.push({ at, scene: { mode: "auto", run: structuredClone(run) }, effect, sound })
  snapshot(0)
  requireValid(buy(run, 0)); snapshot(2_000, "summon", "confirm")
  requireValid(buy(run, 1)); snapshot(4_000, "merge", "combo")
  requireValid(move(run, "p2", 32)); snapshot(7_000, "water", "select")
  run.phase = "combat"
  run.combat = createCombat(run)
  snapshot(9_000, "summon", "auto-channel")
  const simulation: AutoRun[] = [structuredClone(run)]
  while (run.phase === "combat" && (run.combat?.tick ?? 0) < 1800) {
    run = advanceCombat(run, 4)
    simulation.push(run)
  }
  requireValid(run.combat?.result === "win" ? null : "Auto demo must finish with a win")
  let seenEvent = 0
  for (let i = 1; i < simulation.length; i++) {
    const sample = simulation[i], events = sample.combat!.events.filter(event => event.id > seenEvent)
    seenEvent = sample.combat!.nextEvent - 1
    const cast = events.find(event => event.kind === "cast" && sample.combat!.actors.some(actor => actor.uid === event.source && actor.side === "ally"))
    frames.push({ at: 9_000 + i / (simulation.length - 1) * 12_500,
      scene: { mode: "auto", run: sample },
      effect: cast ? cast.school === "tide" ? "water" : "heal" : undefined,
      sound: cast ? "auto-channel" : events.some(event => event.kind === "hit") ? "auto-contact" : undefined,
    })
  }
  snapshot(22_000, "victory", "auto-victory")
  return {
    mode: "auto", duration: INTRO_DURATION, frames, music: "auto-battle",
    takeaway: "Mua 3 bản sao cùng sao để ghép → xếp quân trong 3 hàng của bạn → bắt đầu giao chiến tự động.",
    beats: [
      beat(0, "Chuẩn bị quyết định trận đấu", "Đội mẫu giữa ván đã có 5 Vị Linh. Dùng vàng của lượt chơi mua thêm Phở bò ở cửa hàng.", "MUA QUÂN"),
      beat(4_000, "Ba Phở bò → một quân 2 sao", "Ba bản sao 1 sao tự ghép thành 2 sao, tăng máu và sức mạnh. Vàng đã giảm theo giá mua.", "GHÉP SAO"),
      beat(7_000, "Tuyến trước giữ, tuyến sau đánh", "Cơm tấm đứng trước; Phở bò đánh xa và Bánh cuốn hỗ trợ phía sau. Ba Người kể nhận thêm 30 mana đầu trận; hai Hải vị giúp tích mana nhanh hơn.", "XẾP ĐỘI HÌNH"),
      beat(9_000, "Trận chiến tự vận hành", "Bắt đầu vòng boss: quân tự tìm đường, đánh và dùng kỹ năng khi đầy mana. Boss cũng tích mana và phản kích theo cùng engine.", "TỰ ĐỘNG CHIẾN ĐẤU"),
      beat(15_000, "Kỹ năng nối nhau giữ bàn", "Cơm tấm tạo khiên, Bánh cuốn hồi phục, Phở bò tung Hơi nhớ. Boss chuyển pha và tự phản kích; quan sát HP/mana của cả hai phe.", "HIGHLIGHT KỸ NĂNG"),
      beat(22_000, "Thắng rồi chuẩn bị vòng mới", "Giữ đội hình, mua thêm quân và phát triển liên kết ở vòng kế tiếp. Trong giao chiến, bạn chủ yếu quan sát.", "CHIẾN THẮNG"),
    ],
  }
}

function adventureIntro(): IntroClip {
  const game = newGame()
  let save = newRpgSave(game)
  for (const hero of save.roster) { hero.level = 8; hero.rank = 2; hero.skills = [3, 3, 3, 2] }
  for (let i = 1; i <= 5; i++) save.stars[`lantern-${i}`] = 1
  save = reduceRpg(save, { type: "start", stageId: "lantern-6" }, game).save
  const waves = save.run!.battle.waves.slice(-1)
  save.run!.battle = createRpgBattle(save, waves, "intro-rpg-boss")
  const frames: IntroFrame[] = [{ at: 0, scene: { mode: "adventure", save: structuredClone(save) } }]
  const simulation: { save: RpgSave; sound?: GameSound }[] = []
  let guarded = false
  for (let step = 0; step < 720 && !save.run!.battle.result; step++) {
    const b = save.run!.battle
    if (b.warning && b.tick >= b.guardReady) { save = reduceRpg(save, { type: "guard", row: b.warning.row }, game).save; guarded = true }
    const ready = save.run!.battle.actors.find(a => a.side === "ally" && a.hp > 0 && a.energy >= 100 && !a.stun)
    if (ready) save = reduceRpg(save, { type: "burst", uid: ready.uid }, game).save
    save = reduceRpg(save, { type: "tick", steps: 1 }, game).save
    const latest = save.run!.battle.events.filter(e => e.tick === save.run!.battle.tick)
    simulation.push({ save: structuredClone(save), sound: latest.some(e => e.kind === "burst") ? "combo" : latest.some(e => e.kind === "boss") ? "auto-boss" : latest.some(e => e.kind === "skill") ? "auto-channel" : undefined })
  }
  requireValid(save.run!.battle.result === "win" && guarded ? null : "Adventure squad demo must guard a boss attack and win")
  save = reduceRpg(save, { type: "settle" }, game).save
  simulation[simulation.length - 1] = { save: structuredClone(save), sound: "auto-victory" }
  for (let i = 0; i < simulation.length; i++) frames.push({ at: 1_500 + i / simulation.length * 21_000, scene: { mode: "adventure", save: simulation[i].save }, sound: simulation[i].sound })
  return {
    mode: "adventure", duration: INTRO_DURATION, frames, music: "auto-boss",
    takeaway: "Xếp 2 người tuyến trước + 3 người tuyến sau → canh tuyệt kỹ và che chắn boss → farm dungeon → nâng cấp đội.",
    beats: [
      beat(0, "Năm Vị Linh, một giao ước", "Trận mẫu dùng đúng đội hình và sân đấu Adventure. Cơm tấm giữ tuyến trước; Phở bò và người hồi phục hỗ trợ phía sau.", "ĐỘI HÌNH"),
      beat(4_000, "Kỹ năng vận hành theo nhịp", "Đòn thường và hai kỹ năng tự động giúp tích năng lượng. Mỗi vai trò có kỹ năng hồi phục, tạo khiên hoặc gây sát thương khác nhau.", "TỰ ĐỘNG"),
      beat(8_000, "Boss báo trước đòn lớn", "Boss đánh dấu tuyến trước khi tấn công. Che đúng tuyến giảm 65% sát thương trong 3 giây; lần tiếp theo cần chờ hồi 12 giây.", "BOSS PHẢN KÍCH"),
      beat(12_000, "Nối tuyệt kỹ", "Đầy 100 năng lượng: chạm Vị Linh để dùng tuyệt kỹ. Hồi phục, khiên và đòn diện rộng nối nhau giữ đội đứng vững.", "COMBO ĐỘI"),
      beat(17_000, "Con nước đổi hướng", "Boss đổi pha ở nửa HP và nhắm tuyến sau. Theo cảnh báo để đổi che chắn, giữ tuyệt kỹ hồi phục cho người đang cần.", "ĐỔI PHA"),
      beat(22_500, "Farm rồi viết tiếp câu chuyện", "Chiến thắng mở màn kế. Ba dungeon cung cấp Sổ kinh nghiệm, Sách kỹ năng và nguyên liệu trang bị; mọi thưởng trong demo đều là dữ liệu mẫu.", "PHÁT TRIỂN ĐỘI"),
    ],
  }
}

function chestIntro(): IntroClip {
  const dish = buildPool(SEED_DISHES, "breakfast", [], undefined, new Date("2026-01-01T00:00:00Z")).find(item => item.id === "pho-bo")
  if (!dish) throw new Error("Breakfast introduction dish missing")
  const rarity = getDishRarity(dish), cost = Number(import.meta.env.VITE_CHEST_COST || 1)
  const scene = (phase: "choose" | "unlock" | "reveal" | "collect"): IntroScene => ({ mode: "chest", phase, dishId: dish.id, rarity, keys: phase === "choose" ? 3 : 3 - cost })
  return {
    mode: "chest", duration: INTRO_DURATION, music: "story-warm",
    takeaway: "Chọn bữa → mở rương bằng chìa → xem món/độ hiếm → quản lý trong Hồ sơ vị giác. Rương tập trung vào sưu tầm.",
    frames: [
      { at: 0, scene: scene("choose") },
      { at: 5_000, scene: scene("unlock"), effect: "summon", sound: "confirm" },
      { at: 11_000, scene: scene("reveal"), effect: "reveal", sound: "sparkle" },
      { at: 18_000, scene: scene("collect"), effect: "combo", sound: "combo" },
    ],
    beats: [
      beat(0, "Chọn bữa, chọn hương vị", "Chọn Sáng, Trưa hoặc Tối để mở đúng nhóm món. Demo dùng bữa Sáng và một món mẫu.", "CHỌN BỮA"),
      beat(5_000, "Chìa chạm rương", `Mỗi lần mở thường dùng ${cost} chìa. Khi mở khóa rương vô hạn, bạn có thể mở mà không mất chìa.`, "MỞ RƯƠNG"),
      beat(11_000, "Phở bò bước ra ánh sáng", "Tên món, artwork và độ hiếm hiện ra. Món demo được chọn sẵn để minh họa; xem tỷ lệ thật trong bảng Tỷ lệ.", "HIỆN MÓN"),
      beat(18_000, "Bộ sưu tập thêm một hương vị", "Món đã mở nằm trong Hồ sơ vị giác. Đánh dấu yêu thích, quản lý món và tích lũy bộ sưu tập.", "SƯU TẦM"),
      beat(22_000, "Sẵn sàng mở bữa của bạn", "Đây là màn minh họa: không tiêu chìa thật, không nhận món hay thay đổi bộ sưu tập đang có.", "SẴN SÀNG CHƠI"),
    ],
  }
}

export function buildModeIntro(mode: IntroMode): IntroClip {
  return { tcg: tcgIntro, auto: autoIntro, adventure: adventureIntro, chest: chestIntro }[mode]()
}

export function introAt<T extends { at: number }>(items: T[], elapsed: number): T {
  let current = items[0]
  for (const item of items) {
    if (item.at > elapsed) break
    current = item
  }
  return current
}
