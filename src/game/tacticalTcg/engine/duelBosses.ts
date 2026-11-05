import type { TacticalBattleState, UnitDefinition } from "./types"
import { hurtDuel } from "./duelRules"

export const DUEL_BOSSES = [
  {
    id: "boss-lantern-fox",
    name: "Hồ Ly Mượn Lửa",
    spirit: "banh-mi",
    hp: 160,
    power: "ward",
    tell: "Cuối vòng: nhận 1 khiên. Dùng phép gỡ khiên hoặc dồn sát thương.",
  },
  {
    id: "boss-river-dragon",
    name: "Long Quân Bến Nước",
    spirit: "pho-bo",
    hp: 190,
    power: "drain",
    tell: "Cuối vòng: hút 1 HP chủ tướng, tự hồi 1 HP. Đánh nhanh hoặc giữ hồi phục.",
  },
  {
    id: "boss-kiln-phoenix",
    name: "Phượng Lửa Lò Gốm",
    spirit: "banh-xeo",
    hp: 180,
    power: "burn",
    tell: "Cuối vòng: thiêu đốt quân có công cao nhất 1×2. Giải trạng thái hoặc đổi quân.",
  },
  {
    id: "boss-bronze-lion",
    name: "Sơn Vương Trống Đồng",
    spirit: "com-tam",
    hp: 210,
    power: "sweep",
    tell: "Mỗi vòng chẵn: gây 1 sát thương mọi đồng minh. Khiên và hồi phục sẽ giữ bàn.",
  },
  {
    id: "boss-lotus-rabbit",
    name: "Ngọc Thố Mùa Trăng",
    spirit: "banh-cuon",
    hp: 200,
    power: "freeze",
    tell: "Mỗi vòng thứ ba: khóa quân có công cao nhất một vòng. Mang Khăn Ấm để giải.",
  },
  {
    id: "boss-night-owl",
    name: "Cú Giữ Lời Hẹn",
    spirit: "caravan-pastry",
    hp: 210,
    power: "draw",
    tell: "Cuối vòng: rút thêm 1 lá. Ép chủ tướng khi không còn Hộ vệ để cắt thế kéo dài.",
  },
  {
    id: "boss-village-turtle",
    name: "Huyền Quy Cổng Làng",
    spirit: "banh-chung",
    hp: 250,
    power: "ward",
    tell: "Cuối vòng: nhận 1 khiên; mỗi pha còn được tăng khiên. Dùng Xuyên phá hoặc xóa khiên.",
  },
  {
    id: "boss-five-kirin",
    name: "Kỳ Lân Ngũ Sắc",
    spirit: "com-lang-vong",
    hp: 280,
    power: "regenerate",
    tell: "Cuối vòng: hồi 2 HP. Phối hợp phép và Tuyệt kỹ trong cùng lượt để vượt hồi phục.",
  },
] as const
export const DUEL_BOSS_UNITS: UnitDefinition[] = DUEL_BOSSES.map((b) => ({
  id: b.id,
  name: b.name,
  role: "guardian",
  traits: ["Thủ lĩnh", "Hộ Vệ"],
  maxHp: b.hp,
  attack: b.hp < 220 ? 24 : 36,
  ultimatePower: 54,
  art: "",
}))
/** One public telegraphed mechanic per boss, applied exactly once by the round command. */
export function resolveDuelBossRound(s: TacticalBattleState) {
  const boss = s.units.find(
      (u) => u.instanceId === s.boss?.unitId && !u.defeated,
    ),
    spec = DUEL_BOSSES.find((v) => v.id === boss?.id)
  if (!boss || !spec) return
  const foes = s.units
    .filter((u) => u.side === "player" && !u.defeated)
    .sort((a, b) => b.attack - a.attack)
  if (spec.power === "ward") boss.shield += 1
  if (spec.power === "regenerate") boss.hp = Math.min(boss.maxHp, boss.hp + 2)
  if (spec.power === "drain") {
    boss.hp = Math.min(boss.maxHp, boss.hp + 1)
    s.commanders.player.hp = Math.max(0, s.commanders.player.hp - 1)
  }
  if (spec.power === "burn" && foes[0])
    foes[0].burn = { damage: 1, remaining: 2 }
  if (spec.power === "freeze" && s.round % 3 === 0 && foes[0])
    foes[0].stunnedUntil = s.round + 1
  if (spec.power === "sweep" && s.round % 2 === 0)
    for (const u of foes) hurtDuel(u, 1)
  if (spec.power === "draw") {
    const owner = s.cardGame!.sides.enemy,
      id = owner.deck.shift()
    if (id) (owner.hand.length < 8 ? owner.hand : owner.discard).push(id)
  }
  s.log.push({ id: `${s.log.length}`, text: `${spec.name}: ${spec.tell}` })
}
