import { CARD_MAP } from "../catalog"
import { tcgCharacter } from "../tcgCharacterMotion"
import {
  monsterCharacter,
  type CharacterModel,
} from "../../infrastructure/assets/characterSprites"

/** Adventure always uses the authored HD atlas; canvas DPR handles light mode. */
export function adventureCharacterModel(
  id: string,
  side: "ally" | "enemy",
): CharacterModel {
  return side === "ally" ? tcgCharacter(CARD_MAP[id])! : monsterCharacter(id)
}
