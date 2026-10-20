import {
  STARTER_SPIRIT_IDS,
  advanceCombatBattle,
  castCombatUltimate,
  createCombatBattle,
  createDevelopmentStarterSeed,
  type CombatBattle,
} from "../combat"
import { KITCHEN_BOSS_ID, ZONE_IDS } from "./ids"
import { worldProgressSchema, type WorldProgress } from "./model"
import { describeObject, INTERACT_RANGE } from "./rules"
import { zoneById } from "./maps"
import { aw2DevSaveSchema } from "../save/schema"

export const WORLD_BOSS_TUNING_ID = "aw2-world-boss-development-v1"
export interface BossEncounterView {
  battle: CombatBattle
  retreated: boolean
  committed: boolean
}
export interface WorldBossEncounter {
  snapshot(): BossEncounterView
  advance(): void
  ultimate(actorId: string): void
  retreat(): void
}
interface PrivateEncounter {
  checkpointRaw: string
  progress: WorldProgress
  battle: CombatBattle
  retreated: boolean
  committed: boolean
}
const encounters = new WeakMap<WorldBossEncounter, PrivateEncounter>()

export function bossCheckpoint(progress: WorldProgress): WorldProgress {
  const valid = worldProgressSchema.parse(progress)
  const boss = zoneById(valid.zoneId).objects.find(
    (object) => object.id === KITCHEN_BOSS_ID,
  )
  if (
    !boss ||
    Math.hypot(valid.x - boss.x, valid.y - boss.y) > INTERACT_RANGE ||
    !describeObject(valid, boss).actions.some(
      (action) => action.id === "challenge",
    )
  )
    throw Error("Chưa đủ điều kiện hoặc chưa đến gần để bắt đầu thử thách.")
  return { ...valid, x: 96, y: 192, facing: "right" }
}

/** Only rule commands can change this private battle; snapshots are detached. */
export function createWorldBossEncounter(
  checkpointRaw: string,
): WorldBossEncounter {
  const checkpoint = aw2DevSaveSchema.parse(JSON.parse(checkpointRaw))
  const valid = checkpoint.progress
  if (
    valid.zoneId !== ZONE_IDS[5] ||
    valid.questIndex !== 3 ||
    !valid.accepted ||
    valid.bossDefeated
  )
    throw Error("Điểm kiểm tra không thể mở thử thách boss.")
  const state: PrivateEncounter = {
    checkpointRaw,
    progress: structuredClone(valid),
    retreated: false,
    committed: false,
    battle: createCombatBattle({
      id: `${checkpoint.saveId}:boss:${checkpoint.revision}`,
      players: STARTER_SPIRIT_IDS.map((spiritId, slot) =>
        createDevelopmentStarterSeed(`player-${spiritId}`, spiritId, 0, {
          energy: 100,
          position: 12 + slot * 4,
        }),
      ),
      enemies: [
        {
          id: KITCHEN_BOSS_ID,
          spiritId: KITCHEN_BOSS_ID,
          boss: true,
          hp: 1000,
          maxHp: 1000,
          attack: 180,
          defense: 14,
          position: 82,
          range: 8,
          nextBasicTick: 2,
        },
      ],
    }),
  }
  const assertActive = () => {
    if (state.committed || state.retreated || state.battle.status !== "active")
      throw Error("Thử thách đã dừng.")
  }
  const encounter: WorldBossEncounter = Object.freeze({
    snapshot: () => ({
      battle: structuredClone(state.battle),
      retreated: state.retreated,
      committed: state.committed,
    }),
    advance: () => {
      assertActive()
      state.battle = advanceCombatBattle(state.battle)
    },
    ultimate: (actorId: string) => {
      assertActive()
      const actor = state.battle.actors.find(
        (candidate) => candidate.id === actorId,
      )
      const needsEnemy =
        actor?.spiritId === "aw2-lua" || actor?.spiritId === "aw2-suong"
      state.battle = castCombatUltimate(
        state.battle,
        actorId,
        needsEnemy ? KITCHEN_BOSS_ID : undefined,
      )
    },
    retreat: () => {
      assertActive()
      state.retreated = true
    },
  })
  encounters.set(encounter, state)
  return encounter
}

/** Commit failure leaves the authentic result available for a safe retry. */
export async function commitWorldBossEncounter<T>(
  encounter: WorldBossEncounter,
  checkpointRaw: string,
  commit: (progress: WorldProgress) => Promise<T>,
): Promise<T> {
  const state = encounters.get(encounter)
  if (!state || state.committed || state.checkpointRaw !== checkpointRaw)
    throw Error("Kết quả không thuộc thử thách/điểm kiểm tra AW2 hiện tại.")
  if (!state.retreated && state.battle.status === "active")
    throw Error("Trận đấu chưa kết thúc.")
  const won = !state.retreated && state.battle.status === "player-win"
  const progress = worldProgressSchema.parse({
    ...state.progress,
    bossDefeated: won,
    zoneId: won ? ZONE_IDS[5] : ZONE_IDS[2],
    x: 96,
    y: 192,
    facing: "right",
  })
  const result = await commit(progress)
  state.committed = true
  return result
}
