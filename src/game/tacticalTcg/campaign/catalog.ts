import type { CreateBattleOptions } from "../engine"
import { TACTICAL_STARTER, TACTICAL_CARD_MAP } from "../cards"
import { TACTICAL_SCENES } from "./story"

export interface TacticalCampaignNode {
  id: string
  act: 1 | 2 | 3 | 4
  title: string
  kind: "story" | "battle" | "boss"
  prerequisite: string | null
  mangaChapterId: string
  battle: Omit<CreateBattleOptions, "battleId" | "nodeId"> | null
}

export const TACTICAL_CAMPAIGN_NODES: TacticalCampaignNode[] = [
  {
    id: "act-1-hearth",
    act: 1,
    title: "Bếp lửa thức giấc",
    kind: "battle",
    prerequisite: null,
    mangaChapterId: "manga:act-1",
    battle: { seed: 101 },
  },
  {
    id: "act-1-salt-gate",
    act: 1,
    title: "Cổng Muối Trắng",
    kind: "boss",
    prerequisite: "act-1-hearth",
    mangaChapterId: "manga:act-2",
    battle: {
      seed: 111,
      boss: { definitionId: "aroma-regent", title: "Hương Vương" },
      enemy: [
        { definitionId: "salt-scarab", cell: { row: 0, column: 0 } },
        { definitionId: "salt-scarab", cell: { row: 0, column: 2 } },
        { definitionId: "aroma-regent", cell: { row: 1, column: 1 }, star: 2 },
      ],
    },
  },
  {
    id: "act-2-kiln",
    act: 2,
    title: "Lò nung ký ức",
    kind: "battle",
    prerequisite: "act-1-salt-gate",
    mangaChapterId: "manga:act-2",
    battle: { seed: 202 },
  },
  {
    id: "act-2-knight",
    act: 2,
    title: "Kỵ sĩ không vị",
    kind: "boss",
    prerequisite: "act-2-kiln",
    mangaChapterId: "manga:act-3",
    battle: {
      seed: 222,
      boss: { definitionId: "kiln-knight", title: "Kỵ Sĩ Không Vị" },
    },
  },
  {
    id: "act-3-cloud",
    act: 3,
    title: "Mâm mây thất lạc",
    kind: "battle",
    prerequisite: "act-2-knight",
    mangaChapterId: "manga:act-3",
    battle: { seed: 303 },
  },
  {
    id: "act-3-regent",
    act: 3,
    title: "Yến tiệc Hương Vương",
    kind: "boss",
    prerequisite: "act-3-cloud",
    mangaChapterId: "manga:act-4",
    battle: {
      seed: 333,
      boss: { definitionId: "aroma-regent", title: "Hương Vương" },
    },
  },
  {
    id: "act-4-vow",
    act: 4,
    title: "Giao ước Linh Vị",
    kind: "story",
    prerequisite: "act-3-regent",
    mangaChapterId: "manga:act-4",
    battle: null,
  },
  {
    id: "act-4-last-table",
    act: 4,
    title: "Mâm Chung cuối cùng",
    kind: "boss",
    prerequisite: "act-4-vow",
    mangaChapterId: "manga:ending",
    battle: {
      seed: 444,
      boss: { definitionId: "aroma-regent", title: "Hương Vương Tận Cùng" },
    },
  },
]

// Preserve shipped node IDs while giving each encounter its own deck and reward.
for (const node of TACTICAL_CAMPAIGN_NODES) {
  if (!node.battle) continue
  const additions =
    node.act === 1
      ? ["trap-ward", "herb"]
      : node.act === 2
        ? ["wok-storm", "trap-embers"]
        : node.act === 3
          ? ["recipe-scroll", "sugar-veil"]
          : ["family-table", "trap-mirror"]
  const noviceDeck = [
    "pho-bo",
    "banh-mi",
    "caravan-scout",
    "caravan-herbalist",
    "bun-rieu",
    "cha-ca-la-vong",
    "banh-xeo",
    "spark",
    "herb",
    "seasoning",
    "trap-ward",
    "sugar-veil",
  ]
  const ids = (
    node.act === 1
      ? noviceDeck
      : [...new Set([...additions, ...TACTICAL_STARTER])]
  )
    .filter((id) => TACTICAL_CARD_MAP[id])
    .slice(0, 12)
  node.battle.enemyDeck = ids.flatMap((id) => [id, id])
  node.battle.rewardCardId = TACTICAL_SCENES[node.id].rewardCardId
  node.battle.enemyManaPenalty =
    node.act === 1 || node.id === "act-2-kiln" || node.id === "act-3-regent"
      ? 1
      : 0
}

export function isCampaignNodeAvailable(
  node: TacticalCampaignNode,
  completed: readonly string[],
) {
  return node.prerequisite === null || completed.includes(node.prerequisite)
}
