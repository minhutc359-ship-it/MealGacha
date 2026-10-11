import { actBattle, type BattleAction, type BattleFrame, type BattleEvent } from "./battle"
import { practiceBattle } from "./practice"
import type { Battle } from "./types"
import { STAGE_MAP } from "./story"
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
  frame?: BattleFrame
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
  battle.id = "intro-tcg-boss"
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
    for (let i = 0; i < result.frames.length; i++) {
      const frame = result.frames[i]
      frames.push({ at: at + i * window / result.frames.length, scene: { mode: "tcg", battle: frame.battle, event: frame.event, frame } })
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
    takeaway: "Triệu hồi → cộng hưởng/công thức → hạ Hộ vệ → kết thúc lượt → đọc phản kích → đánh chủ tướng.",
    beats: [
      beat(0, "Đối đầu Hỏa Linh", "Trận mẫu giữa ván: 7 năng lượng và Cơm tấm đã cường hóa. Hộ vệ đang chặn đường tới boss.", "TRẬN BOSS"),
      beat(2_000, "Gọi Phở bò", "Ra thẻ tốn năng lượng; quân mới thường chờ lượt sau. Phở bò mở điểm nối cho Bữa cơm nhà.", "TRIỆU HỒI"),
      beat(6_000, "Phở bò → Ấm trà ngã rẽ", "Mời ngồi lại hồi ý chí. Cộng hưởng Hải giảm 1 năng lượng và công thức Bữa cơm nhà cho thêm hồi/ chắn.", "COMBO"),
      beat(10_000, "Dậy lửa hạ Hộ vệ", "Chọn đúng nhánh phép và mục tiêu: Hai nhúm gia vị gây 3 sát thương, mở đường đánh chủ tướng.", "MỞ ĐƯỜNG"),
      beat(13_000, "Boss phản kích", "Kết thúc lượt: Than còn cháy gây sát thương, rồi boss tự ra phép. HP thay đổi theo luật trận thật.", "LƯỢT ĐỊCH"),
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
  let save = reduceAdventure(newAdventure(), { type: "start", cardId: "com-tam" }).save
  save.message = null
  save.team[0].level = 8
  save.team[0].hp = spiritMaxHp(save.team[0].cardId, 8)
  save.team[0].pp = fullPP(save.team[0].cardId, 8)
  save.team.push({ uid: "intro-grove", cardId: "goi-cuon-tom-thit", level: 12, xp: 0, hp: spiritMaxHp("goi-cuon-tom-thit", 12), pp: fullPP("goi-cuon-tom-thit", 12), status: null, statusTurns: 0 })
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
    id: "intro-adventure-keeper", kind: "keeper", cardId: "pho-bo", level: 8,
    roster: [{ cardId: "pho-bo", level: 8 }], wave: 0,
    hp: spiritMaxHp("pho-bo", 8), maxHp: spiritMaxHp("pho-bo", 8),
    activeUid: save.team[0].uid, turn: 1, playerGuard: 0, enemyGuard: 0, enemyWeaken: 0,
    attempts: 0, log: ["Người Giữ Ấn đưa Phở bò vào sân!"], enemyPP: fullPP("pho-bo", 8),
    enemyStatus: null, enemyStatusTurns: 0, participants: [save.team[0].uid],
  }
  snapshot(5_000, false, "summon", "summon")
  act({ type: "battle", move: "skill", skillId: "hearth-bowl" }); snapshot(7_000, false, "heal", "cast")
  act({ type: "battle", move: "switch", uid: "intro-grove" }); snapshot(10_000, false, "summon", "summon")
  act({ type: "battle", move: "skill", skillId: "grove-root" }); snapshot(14_000, false, "heal", "leaves")
  act({ type: "battle", move: "guard" }); snapshot(18_000, false, "heal", "shield")
  act({ type: "battle", move: "skill", skillId: "grove-leaf" }); snapshot(22_000, false, "victory", "victory")
  requireValid(!save.encounter ? null : "Adventure keeper introduction must finish its battle")
  return {
    mode: "adventure", duration: INTRO_DURATION, frames, music: "battle",
    takeaway: "Đi bằng WASD/mũi tên hoặc chọn điểm trên map; E tương tác. Trong trận: kỹ năng, đổi đội, vật phẩm, Hương Ấn.",
    beats: [
      beat(0, "Đồng hành qua Chợ Đèn", "Đi trên bản đồ cùng Vị Linh dẫn đội. Gặp NPC, vào nhà, nghỉ và chuẩn bị vật phẩm trước khi khám phá bãi cỏ.", "KHÁM PHÁ"),
      beat(5_000, "Người Giữ Ấn xuất trận", "Chiến đấu theo lượt với NPC. Chọn kỹ năng, đổi Vị Linh hoặc dùng vật phẩm; mỗi lựa chọn cho đối thủ cơ hội hành động.", "CHẠM TRÁN"),
      beat(7_000, "Gia vị gặp Hải vị", "Mâm Đồng bị kháng: sát thương ×0,67. Kỹ năng tiêu 1 PP; đừng chỉ chọn đòn mạnh nhất.", "TƯƠNG KHẮC HỆ"),
      beat(10_000, "Đổi sang Gỏi cuốn", "Gỏi cuốn hệ Thanh khắc Hải. Đổi Vị Linh cũng tốn một lượt, nên cần nhìn HP trước khi đổi.", "ĐỔI ĐỘI"),
      beat(14_000, "Rễ Giữ Vị ×1,5", "Kỹ năng Thanh đánh vào Hải có lợi thế, kèm Bám rễ rút HP cuối lượt. Người Giữ Ấn dùng lượt của mình để phản kích.", "LỢI THẾ HỆ"),
      beat(18_000, "Giữ mâm trước phản kích", "Boss cũng dùng kỹ năng và PP. Giữ mâm giảm sát thương của lượt này, bảo vệ Gỏi cuốn trước đòn tiếp theo.", "PHÒNG THỦ"),
      beat(22_000, "Lá Xoáy kết thúc thử thách", "Đòn Thanh nối sát thương Bám rễ kết thúc trận. NPC không thể thu phục; dùng Hương Ấn cho Vị Linh hoang dã và nghỉ để hồi HP/PP.", "CHIẾN THẮNG"),
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
