import { BOSS_RULES, type StoryLine } from "./narrative"
import { NPC_NAMES } from "./characters"
import type { Battle, NpcId } from "./types"
import type { BattleEvent } from "./battle"
import type { StoryArtId } from "./storyArt"

export function battleRule(b: Battle) {
  return BOSS_RULES[b.bossRuleId ?? b.stageId ?? ""]
}
export function prepareEncounter(b: Battle): Battle {
  const ruleId = b.bossRuleId ?? b.stageId
  if (ruleId === "lantern-3")
    b.encounter = {
      kind: "protect",
      progress: 0,
      target: 3,
      integrity: 6,
      maxIntegrity: 6,
    }
  if (ruleId === "harbor-3")
    b.encounter = {
      kind: "rescue",
      progress: 0,
      target: 3,
      integrity: 0,
      maxIntegrity: 0,
    }
  b.pendingScenes = []
  b.seenScenes = []
  return b
}
export function encounterLabel(b: Battle) {
  const e = b.encounter
  if (!e) return null
  return e.kind === "protect"
    ? `Giữ bếp ${e.progress}/${e.target} · Lửa ${e.integrity}/${e.maxIntegrity}`
    : `Giải cứu ${e.progress}/${e.target} Vị Linh`
}
export function bossIntent(b: Battle) {
  const rule = battleRule(b)
  if (!rule) return null
  const strength = b.enemy.health <= b.enemy.maxHealth / 2 ? 2 : 1
  const effect =
    rule.effect === "cycle"
      ? ["burn", "heal", "draw"][(b.round - 1) % 3]
      : rule.effect
  const text =
    effect === "burn"
      ? `Gây ${strength} sát thương lên bạn`
      : effect === "heal"
        ? `Hồi ${strength * 2} ý chí`
        : effect === "draw"
          ? `Rút ${strength} lá`
          : `Đồng minh boss +${strength} chắn`
  return {
    text,
    tip:
      effect === "shield"
        ? "Dồn sát thương hoặc phép vượt Hộ vệ."
        : effect === "heal"
          ? "Chuẩn bị chuỗi sát thương trong một lượt."
          : effect === "draw"
            ? "Giữ phép quét sân và lá chắn."
            : "Đòn này nhắm trực tiếp chủ tướng. Chuẩn bị hồi phục trước khi nhường lượt.",
  }
}
// Optional encounters only exist on newly started battles; old saves retain their rules.
export function updateEncounter(
  b: Battle,
  before: Battle,
  event: BattleEvent,
): string | null {
  const e = b.encounter
  if (!e || b.result) return null
  let changed = false
  if (e.kind === "rescue") {
    const lost = before.enemy.board.filter(
      (u) => !b.enemy.board.some((next) => next.uid === u.uid),
    ).length
    if (lost) {
      e.progress = Math.min(e.target, e.progress + lost)
      changed = true
    }
  } else if (
    event.kind === "turn" &&
    event.side === "player" &&
    b.round > before.round
  ) {
    const defended = b.player.board.some((u) => u.keywords.includes("guard"))
    e.integrity = Math.max(0, e.integrity - (defended ? 0 : 2))
    e.progress = Math.min(e.target, e.progress + 1)
    changed = true
  }
  if (e.progress >= e.target && (e.kind !== "protect" || e.integrity > 0)) {
    b.result = "win"
    return e.kind === "protect"
      ? "Nồi bánh đã chín. Ký ức tìm được đường về!"
      : "Ba Vị Linh đã thoát sương. Bến cảng được mở!"
  }
  return changed
    ? e.kind === "protect" && e.integrity <= 0
      ? "Lửa đã tắt; hãy phá linh ảnh chủ tướng để thắng."
      : encounterLabel(b)
    : null
}
export function awakenedScene(b: Battle, before: Battle): string | null {
  if (
    !battleRule(b) ||
    b.result ||
    before.enemy.health <= before.enemy.maxHealth / 2 ||
    b.enemy.health > b.enemy.maxHealth / 2 ||
    b.enemy.health <= 0
  )
    return null
  const id = `awaken:${b.bossRuleId ?? b.stageId}`
  return [...(b.seenScenes ?? []), ...(b.pendingScenes ?? [])].includes(id)
    ? null
    : id
}
export function queueScene(b: Battle, id: string) {
  if (
    !(b.seenScenes ?? []).includes(id) &&
    !(b.pendingScenes ?? []).includes(id)
  )
    b.pendingScenes = [...(b.pendingScenes ?? []), id]
}
export function midScene(
  id: string,
  battle?: Battle,
): {
  title: string
  art: StoryArtId
  lines: StoryLine[]
} {
  if (id.startsWith("assist:")) {
    const npc = id.split(":")[1] as NpcId
    return {
      title: `${NPC_NAMES[npc]} · Lời hứa bên bếp`,
      art: "memory-flare",
      lines: [
        {
          speaker: NPC_NAMES[npc],
          text: "Lần trước, bạn đã ngồi lại khi tôi không biết phải bắt đầu câu chuyện từ đâu. Hôm nay để tôi giữ một góc bàn cho bạn.",
        },
        {
          speaker: "Bạn",
          text: "Tôi nhận ra tiếng ấy giữa màn sương. Bàn Ký Ức không còn chỉ có một người giữ lửa.",
        },
      ],
    }
  }
  const harbor = battle?.encounter?.kind === "rescue"
  const protect = battle?.encounter?.kind === "protect"
  return {
    title: harbor ? "Tiếng gọi dưới boong" : "Ngọn lửa tự chọn",
    art: "memory-flare",
    lines: harbor
      ? [
          {
            speaker: "Nhiên",
            text: "Sương đang cháy mạnh hơn! Nó dùng tiếng gọi của cha để giữ những Vị Linh ở lại. Phá ba linh ảnh trên sân, hoặc tháo nút thắt ở chủ tướng.",
          },
          {
            speaker: "Bạn",
            text: "Một tiếng gọi có thể là cái bẫy. Nhưng người đáp lại nó vẫn được quyền tự chọn đường về.",
          },
        ]
      : [
          {
            speaker: "Bách",
            text: protect
              ? "Boss đã thức tỉnh. Giữ lửa qua ba lần nhường lượt để thắng; Hộ vệ còn trên bàn sẽ che bếp khỏi gió sương."
              : "Boss đã thức tỉnh, nhưng sức mạnh ấy đến từ nỗi sợ mất ký ức. Đừng để nó giữ bạn mãi trong một ngày cũ. Chúng ta còn người đang đợi ở bàn ăn.",
          },
          {
            speaker: "Bạn",
            text: "Trong ánh lửa tôi thấy bàn tay bà, nhưng bàn tay đang giữ chiếc muôi là của tôi. Lần này, tôi tự chọn cách giữ bàn.",
          },
        ],
  }
}
