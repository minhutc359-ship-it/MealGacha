import type { GameCard } from "../../types"
import { characterVisual } from "../../characterVisuals"
import { enemyVisual } from "../../enemyVisuals"
import { spiritArt } from "../../adventureRpg/spiritArt"
import { SPRITE_SHEETS } from "../../autochess/presentation"
import type { CharacterModel } from "../../../infrastructure/assets/characterSprites"
import { TACTICAL_CARDS, TACTICAL_CARD_MAP } from "../cards"
import { TACTICAL_UNITS } from "../engine/catalog"
import type { BattleUnit } from "../engine/types"
import { ELEMENTAL_IMPACTS } from "../../visualPack"

const aliases: Record<string, string> = {
  nhien: "chef-nhien",
  hai: "chef-hai",
  moc: "chef-moc",
  lien: "chef-lien",
  bach: "chef-bach",
  van: "ca-phe-trung",
}
/** Own authored atlas first, otherwise that same spirit's rendered portrait. Never borrow a hero or a food photo. */
export function tacticalSpiritModel(
  id: string,
  name = id,
): CharacterModel | null {
  const key = aliases[id] ?? id
  const visual = characterVisual(key) ?? enemyVisual(key)
  if (visual)
    return {
      id: key,
      name: "species" in visual ? visual.species : name,
      sheet: visual.sheet,
      row: 0,
    }
  const portrait = spiritArt(key)
  const sheet = portrait?.path.match(/\/portraits-(\d+)\.webp$/)?.[1]
  return portrait && sheet
    ? {
        id: key,
        name,
        sheet: `portrait-${sheet}` as CharacterModel["sheet"],
        row: portrait.cell,
      }
    : null
}
export function tacticalCardModel(
  card: Pick<GameCard, "id" | "name" | "kind">,
) {
  return card.kind === "unit" ? tacticalSpiritModel(card.id, card.name) : null
}
export function tacticalUnitModel(unit: BattleUnit) {
  return tacticalSpiritModel(unit.cardId ?? unit.id, unit.name)
}
export function tacticalSpiritPortrait(id: string) {
  return spiritArt(aliases[id] ?? id)
}
export function tacticalModelAnimated(model: CharacterModel) {
  return !model.sheet.startsWith("portrait-")
}

const modelIds = [
  ...TACTICAL_CARDS.filter((c) => c.kind === "unit").map((c) => c.id),
  ...TACTICAL_UNITS.map((u) => u.id),
]
export const TACTICAL_MODEL_ASSETS = [
  ...new Set(
    modelIds
      .flatMap((id) => {
        const model = tacticalSpiritModel(id, TACTICAL_CARD_MAP[id]?.name ?? id)
        const portrait = tacticalSpiritPortrait(id)
        const visual = characterVisual(aliases[id] ?? id)
        return [
          model ? SPRITE_SHEETS[model.sheet].path : null,
          portrait?.path,
          visual?.effect?.path,
        ]
      })
      .filter((p): p is string => !!p)
      .concat(ELEMENTAL_IMPACTS),
  ),
].sort()
