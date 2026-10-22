import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import {
  STARTER_SPIRIT_IDS,
  advanceCombatBattle,
  castCombatUltimate,
  cleanseMuoiMarks,
  createCombatBattle,
  createCombatPresentation,
  createDevelopmentCombatSeed,
  experienceToReachLevel,
  reduceCombatPresentation,
  type CombatSpiritId,
  type CombatBattle,
  type CombatPresentation,
} from "../../src/aw2/combat"

export interface BattlePreviewSession {
  level: number
  battle: CombatBattle
  presentation: CombatPresentation
  message: string
  practice?: "muoi"
}

interface AdvanceCommand {
  type: "advance"
  manual?: boolean
}

interface ResetCommand {
  type: "reset"
  practice?: "muoi"
  level: number
}

interface UltimateCommand {
  type: "ultimate"
  actorId: string
  targetId?: string
}

interface CleanseCommand {
  type: "cleanse"
  targetId: string
}

export type BattlePreviewCommand = AdvanceCommand | ResetCommand | UltimateCommand | CleanseCommand

export function createBattlePreviewSession(
  level: number,
  practice?: "muoi",
): BattlePreviewSession {
  const experience = experienceToReachLevel(level)
  const identities: readonly CombatSpiritId[] =
    practice === "muoi"
      ? [...STARTER_SPIRIT_IDS.slice(0, 4), "aw2-muoi"]
      : STARTER_SPIRIT_IDS
  const players = identities.map((spiritId, slot) =>
    createDevelopmentCombatSeed(`player-${spiritId}`, spiritId, experience, {
      position: 12 + slot * 4,
      energy: 100,
      nextBasicTick: 1 + slot,
      nextAutoTick: 3 + slot,
    }),
  )
  const enemyScale = 1 + (level - 1) * 0.035
  const battle = createCombatBattle({
    id: `aw2-007b-${practice ?? "starter"}-level-${level}`,
    players,
    enemies: [
      {
        id: "enemy-than",
        spiritId: "aw2-than",
        position: practice ? 58 : 82,
        hp: Math.round(440 * enemyScale),
        maxHp: Math.round(440 * enemyScale),
        attack: Math.round(27 * enemyScale),
        defense: Math.round(18 * enemyScale),
        nextBasicTick: 2,
        nextAutoTick: 5,
      },
      {
        id: "enemy-suong",
        spiritId: "aw2-suong",
        boss: true,
        position: practice ? 64 : 88,
        hp: Math.round(620 * enemyScale),
        maxHp: Math.round(620 * enemyScale),
        attack: Math.round(32 * enemyScale),
        defense: Math.round(14 * enemyScale),
        range: 42,
        projectileTicks: 2,
        nextBasicTick: 1,
        nextAutoTick: 4,
      },
      {
        id: "enemy-lua",
        spiritId: "aw2-lua",
        position: practice ? 52 : 76,
        hp: Math.round(360 * enemyScale),
        maxHp: Math.round(360 * enemyScale),
        attack: Math.round(34 * enemyScale),
        defense: Math.round(10 * enemyScale),
        nextBasicTick: 3,
        nextAutoTick: 6,
      },
    ],
  })
  return {
    level,
    ...(practice ? { practice } : {}),
    battle,
    presentation: createCombatPresentation(),
    message: "Auto combat đang chạy.",
  }
}

/** One pure transition keeps controls, combat truth and its event view coherent. */
export function reduceBattlePreviewSession(
  current: BattlePreviewSession,
  command: BattlePreviewCommand,
): BattlePreviewSession {
  if (command.type === "reset")
    return {
      ...createBattlePreviewSession(
        command.level,
        command.practice ?? current.practice,
      ),
      message: `Đã tạo trận development cấp ${command.level}; chưa ghi save/XP.`,
    }

  if (command.type === "advance" && current.battle.status !== "active")
    return current

  try {
    let battle: CombatBattle
    let message = current.message
    if (command.type === "advance") {
      battle = advanceCombatBattle(current.battle)
      if (command.manual) message = "Đã xử lý đúng một tick từ combat core."
    } else if (command.type === "cleanse") {
      if (current.practice !== "muoi")
        throw Error("Tẩy dấu chỉ có trong trận luyện Muối Đen.")
      battle = cleanseMuoiMarks(current.battle, command.targetId)
      message = "Đối thủ đã tẩy dấu gia vị; đòn thường không tự áp lại dấu."
    } else {
      const actor = current.battle.actors.find(
        (candidate) => candidate.id === command.actorId,
      )
      const target = current.battle.actors.find(
        (candidate) =>
          candidate.side === "enemy" &&
          candidate.hp > 0 &&
          (!command.targetId || candidate.id === command.targetId),
      )
      const needsEnemy = ["aw2-lua", "aw2-suong", "aw2-muoi"].includes(
        actor?.spiritId ?? "",
      )
      battle = castCombatUltimate(
        current.battle,
        command.actorId,
        needsEnemy ? target?.id : undefined,
      )
      message = `${ROSTER_ASSETS[actor!.spiritId].displayName} đã bắt đầu tuyệt kỹ.`
    }
    return {
      ...current,
      battle,
      presentation: reduceCombatPresentation(
        current.presentation,
        battle.events,
      ),
      message,
    }
  } catch (cause) {
    return {
      ...current,
      message:
        cause instanceof Error ? cause.message : "Không thể xử lý trận đấu.",
    }
  }
}
