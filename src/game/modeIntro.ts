import { actBattle, type BattleAction, type BattleEvent } from "./battle"
import { practiceBattle } from "./practice"
import type { Battle } from "./types"
import { createAutoRun, buy, move } from "./autochess/economy"
import { advanceCombat, createCombat } from "./autochess/combat"
import type { AutoRun } from "./autochess/types"
import { newAdventure, reduceAdventure, spiritMaxHp, type AdventureAction, type AdventureSave, type AdventureEncounter } from "./adventure"
import { fullPP } from "./adventureSkills"
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
} | {
  mode: "auto"
  run: AutoRun
} | {
  mode: "adventure"
  save: AdventureSave
  opponent?: AdventureEncounter
  exploring: boolean
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
  battle.id = "intro-tcg"
  battle.player.health = 12
  battle.player.maxHealth = 20
  battle.player.hand = ["pho-bo", "v4-crossroads-tea", "v4-two-spices"]
  battle.player.board = [{ uid: "intro-rice", cardId: "com-tam", attack: 4, health: 6, maxHealth: 6, shield: 0, ready: true, keywords: [] }]
  battle.enemy.health = 4
  battle.enemy.board = [{ uid: "intro-guard", cardId: "banh-mi", attack: 2, health: 3, maxHealth: 3, shield: 0, ready: true, keywords: ["guard"] }]
  const frames: IntroFrame[] = [{ at: 0, scene: { mode: "tcg", battle: structuredClone(battle) } }]
  const act = (at: number, action: BattleAction, effect: IntroEffect, sound: GameSound) => {
    const result = actBattle(battle, action, () => .41)
    requireValid(result.error)
    battle = result.battle
    frames.push({ at, scene: { mode: "tcg", battle: structuredClone(battle), event: result.frames[result.frames.length - 1]?.event }, effect, sound })
  }
  act(3_000, { type: "play", index: 0 }, "summon", "summon")
  act(7_000, { type: "play", index: 0, branch: "first" }, "combo", "combo")
  act(12_000, { type: "play", index: 0, branch: "first", target: "intro-guard" }, "fire", "fire")
  act(18_000, { type: "attack", uid: "intro-rice", target: "hero" }, "victory", "victory")
  return {
    mode: "tcg", duration: INTRO_DURATION, frames, music: "battle",
    takeaway: "Triệu hồi → nối hệ/công thức → chọn mục tiêu → hạ chủ tướng. Quân mới thường chờ lượt sau mới đánh.",
    beats: [
      beat(0, "Một lượt giữa ván", "Bạn có 7 năng lượng, Cơm tấm đã sẵn sàng. Hộ vệ địch chặn đường tới chủ tướng.", "ĐỌC BÀN ĐẤU"),
      beat(3_000, "Gọi Phở bò lên sân", "Ra thẻ tốn năng lượng. Phở bò tạo điểm nối cho công thức Bữa cơm nhà.", "TRIỆU HỒI"),
      beat(7_000, "Phở bò → Ấm trà ngã rẽ", "Chọn Mời ngồi lại: hồi ý chí, kích Bữa cơm nhà để hồi thêm và cho đồng minh chắn. Nối Hải vị giảm 1 năng lượng.", "COMBO · BỮA CƠM NHÀ"),
      beat(12_000, "Nêm vị, mở đường", "Chọn Dậy lửa của Hai nhúm gia vị: 3 sát thương hạ Hộ vệ. Chọn đúng nhánh và mục tiêu trước khi ra phép.", "CHỌN MỤC TIÊU"),
      beat(18_000, "Đòn kết thúc của Cơm tấm", "Hộ vệ đã rời sân. Cơm tấm dùng lượt đánh còn lại để đưa ý chí chủ tướng địch về 0.", "CHIẾN THẮNG"),
      beat(22_000, "Đến lượt bạn nối vị", "Mỗi đồng minh sẵn sàng đánh một lần mỗi lượt. Sắp thứ tự thẻ và đòn đánh để tạo lợi thế.", "SẴN SÀNG CHƠI"),
    ],
  }
}

function autoIntro(): IntroClip {
  let run = createAutoRun("survival", 431, "intro", "intro-auto")
  run.wave = 3
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
      beat(0, "Chuẩn bị quyết định trận đấu", "Đội mẫu có 3 Vị Linh. Dùng vàng của lượt chơi mua thêm Phở bò ở cửa hàng.", "MUA QUÂN"),
      beat(4_000, "Ba Phở bò → một quân 2 sao", "Ba bản sao 1 sao tự ghép thành 2 sao, tăng máu và sức mạnh. Vàng đã giảm theo giá mua.", "GHÉP SAO"),
      beat(7_000, "Tuyến trước giữ, tuyến sau đánh", "Cơm tấm đứng trước; Phở bò đánh xa và Bánh cuốn hỗ trợ phía sau. Hai Người kể giúp quân thuộc nghề này bắt đầu với thêm 15 mana.", "XẾP ĐỘI HÌNH"),
      beat(9_000, "Trận chiến tự vận hành", "Quân tự tìm đường và đánh. Thanh mana đầy sẽ tự dùng kỹ năng; liên kết hệ/nghề giúp tăng sức mạnh của đội.", "TỰ ĐỘNG CHIẾN ĐẤU"),
      beat(15_000, "Kỹ năng nối nhau giữ bàn", "Quan sát khiên, HP và mana: Cơm tấm bảo vệ đồng đội, Phở bò tung Hơi nhớ. Hiệu quả đến từ đội hình trước trận.", "HIGHLIGHT KỸ NĂNG"),
      beat(22_000, "Thắng rồi chuẩn bị vòng mới", "Giữ đội hình, mua thêm quân và phát triển liên kết ở vòng kế tiếp. Trong giao chiến, bạn chủ yếu quan sát.", "CHIẾN THẮNG"),
    ],
  }
}

function adventureIntro(): IntroClip {
  let save = reduceAdventure(newAdventure(), { type: "start", cardId: "goi-cuon-tom-thit" }).save
  save.message = null
  save.team[0].level = 8
  save.team[0].hp = spiritMaxHp(save.team[0].cardId, 8)
  save.team[0].pp = fullPP(save.team[0].cardId, 8)
  save.team.push({ uid: "intro-pho", cardId: "pho-bo", level: 8, xp: 0, hp: spiritMaxHp("pho-bo", 8), pp: fullPP("pho-bo", 8), status: null, statusTurns: 0 })
  const frames: IntroFrame[] = []
  let opponent: AdventureEncounter | undefined
  const snapshot = (at: number, exploring: boolean, effect?: IntroEffect, sound?: GameSound) => {
    if (save.encounter) opponent = structuredClone(save.encounter)
    frames.push({ at, scene: { mode: "adventure", save: structuredClone(save), opponent, exploring }, effect, sound })
  }
  const act = (action: AdventureAction) => {
    const result = reduceAdventure(save, action)
    requireValid(result.error); save = result.save
  }
  snapshot(0, true)
  act({ type: "move", direction: "right" }); snapshot(1_000, true)
  act({ type: "move", direction: "right" }); snapshot(2_000, true)
  act({ type: "move", direction: "up" }); snapshot(3_000, true)
  save.encounter = {
    id: "intro-adventure-431", kind: "wild", cardId: "banh-mi", level: 8,
    hp: spiritMaxHp("banh-mi", 8), maxHp: spiritMaxHp("banh-mi", 8),
    activeUid: save.team[0].uid, turn: 1, playerGuard: 0, enemyGuard: 0, enemyWeaken: 0,
    attempts: 0, log: ["Một Bánh mì hoang dã xuất hiện!"], enemyPP: fullPP("banh-mi", 8),
    enemyStatus: null, enemyStatusTurns: 0, participants: [save.team[0].uid],
  }
  snapshot(5_000, false, "summon", "summon")
  act({ type: "battle", move: "skill", skillId: "grove-leaf" }); snapshot(7_000, false, "heal", "leaves")
  act({ type: "battle", move: "switch", uid: "intro-pho" }); snapshot(10_000, false, "summon", "summon")
  act({ type: "battle", move: "skill", skillId: "tide-wave" }); snapshot(14_000, false, "water", "water")
  act({ type: "battle", move: "befriend" }); snapshot(19_000, false, "capture", "sparkle")
  requireValid(save.team.some(member => member.cardId === "banh-mi") ? null : "Adventure demo must capture its opponent")
  snapshot(22_000, false, "victory", "victory")
  return {
    mode: "adventure", duration: INTRO_DURATION, frames, music: "battle",
    takeaway: "Đi bằng WASD/mũi tên hoặc chọn điểm trên map; E tương tác. Trong trận: kỹ năng, đổi đội, vật phẩm, Hương Ấn.",
    beats: [
      beat(0, "Đồng hành qua Chợ Đèn", "Đi trên bản đồ cùng Vị Linh dẫn đội. Gặp NPC, vào nhà, nghỉ và chuẩn bị vật phẩm trước khi khám phá bãi cỏ.", "KHÁM PHÁ"),
      beat(5_000, "Bánh mì hoang dã xuất hiện", "Chiến đấu theo lượt. Chọn kỹ năng, đổi Vị Linh hoặc dùng vật phẩm; mỗi lựa chọn cho đối thủ cơ hội hành động.", "CHẠM TRÁN"),
      beat(7_000, "Thanh vị gặp Hỏa vị", "Lá Xoáy bị kháng: sát thương ×0,67. Kỹ năng tiêu 1 PP; đừng chỉ chọn đòn mạnh nhất.", "TƯƠNG KHẮC HỆ"),
      beat(10_000, "Đổi sang Phở bò", "Phở bò hệ Hải khắc Hỏa. Đổi Vị Linh cũng tốn một lượt, nên cần nhìn HP trước khi đổi.", "ĐỔI ĐỘI"),
      beat(14_000, "Sóng Nước Dùng ×1,5", "Kỹ năng Hải đánh vào Hỏa được tăng sát thương. Hạ HP trước sẽ giúp tăng cơ hội thu phục.", "LỢI THẾ HỆ"),
      beat(19_000, "Hương Ấn mời bạn mới", "Dùng Hương Ấn để thu phục Vị Linh hoang dã. Kết quả ở đây là kịch bản mẫu; trong game có thể thất bại.", "THU PHỤC"),
      beat(22_000, "Một người bạn mới vào đội", "Xây đội tối đa 6 Vị Linh. Trở về Bếp Nghỉ để hồi HP/PP rồi tiếp tục hành trình lấy ấn.", "ĐỒNG HÀNH"),
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
