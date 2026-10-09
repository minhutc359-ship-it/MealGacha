import { describe, expect, it } from "vitest"
import { actBattle, startBattle } from "@/game/battle"
import { CARDS, CARD_MAP, STARTER_DECK } from "@/game/catalog"
import { SPRITE_SHEETS } from "@/game/autochess/presentation"
import { tcgCharacter, tcgCaster, tcgUnitMotion, characterPose, type CharacterMotion } from "@/game/tcgCharacterMotion"
import { characterBounds } from "@/infrastructure/assets/characterSprites"
import type { BattleUnit, School } from "@/game/types"

function unit(uid: string, cardId: string, health = 3, attack = 3, shield = 0): BattleUnit {
  return { uid, cardId, health, maxHealth: health, attack, shield, ready: true, keywords: [] }
}
function battle() {
  const b = startBattle(STARTER_DECK, null, "courage", () => .37)
  b.player.board = []; b.enemy.board = []
  b.player.maxMana = b.player.mana = 7
  return b
}
describe("shared characters in TCG", () => {
  it("every summonable card has a real measured row and valid poses, while spells use the matching caster", () => {
    const kinds: CharacterMotion[] = ["idle", "summon", "attack", "cast", "hit", "fall", "victory"]
    for (const card of CARDS) {
      const model = tcgCharacter(card)
      if (card.kind === "spell") { expect(model).toBeNull(); continue }
      expect(model).not.toBeNull()
      const row = SPRITE_SHEETS[model!.sheet].rows[model!.row]
      expect(row.frames.length).toBeGreaterThanOrEqual(7)
      const bounds = characterBounds(model!)!
      for (const frame of row.frames) {
        expect(frame[2]).toBeGreaterThan(0); expect(frame[3]).toBeGreaterThan(0)
        expect(-frame[4]).toBeGreaterThanOrEqual(bounds.left)
        expect(frame[2] - frame[4]).toBeLessThanOrEqual(bounds.right)
      }
      for (const kind of kinds) for (const age of [0, 180, 400, 620, 950, 1540, 10000]) for (const quiet of [true, false])
        expect(row.frames[characterPose(kind, age, model!.sheet !== "base", quiet)]).toBeDefined()
    }
    for (const school of ["ember", "tide", "grove", "hearth", "sugar"] as School[])
      expect(characterBounds(tcgCaster(school))).not.toBeNull()
  })
  it("reuses dedicated models for new foods and people instead of replacing them with school icons", () => {
    expect(tcgCharacter(CARD_MAP["banh-dau-xanh"])).toMatchObject({ id: "banh-dau-xanh", sheet: "fresh", row: 0 })
    expect(tcgCharacter(CARD_MAP["caravan-ferryman"])).toMatchObject({ id: "ferry" })
    expect(tcgCharacter(CARD_MAP["caravan-porter"])).toMatchObject({ id: "loc", sheet: "fresh" })
    expect(tcgCharacter(CARD_MAP["chef-nhien"])).toMatchObject({ id: "chef-nhien", sheet: "rosterA", row: 0 })
    // A food without a dedicated Auto chess unit still has a valid school spirit.
    const other = CARDS.find(c => c.kind === "unit" && c.school === "tide" && c.art?.startsWith("/assets/food/") && c.id !== "pho-bo" && !["bun-rieu", "chao-luon", "banh-tom-ho-tay"].includes(c.id))!
    expect(tcgCharacter(other)?.sheet).toBeDefined()
  })
  it("animates only the newly summoned unit from a real play frame", () => {
    const b = battle(); b.player.hand = ["banh-dau-xanh"]; b.player.board = [unit("existing", "pho-bo")]
    const { frames } = actBattle(b, { type: "play", index: 0 })
    const f = frames.find(f => f.event.kind === "play")!
    expect(tcgUnitMotion(f, f.event.source!, "player")).toEqual({ kind: "summon", delay: 0 })
    expect(tcgUnitMotion(f, "existing", "player").kind).toBe("idle")
  })
  it("plays the attack before a simultaneous lethal trade, then delays both falls until contact", () => {
    const b = battle(); b.player.board = [unit("attacker", "banh-mi", 2, 4)]; b.enemy.board = [unit("defender", "pho-bo", 3, 3)]
    const { frames } = actBattle(b, { type: "attack", uid: "attacker", target: "defender" })
    expect(tcgUnitMotion(frames[0], "attacker", "player")).toEqual({ kind: "fall", delay: 560, lead: "attack" })
    expect(tcgUnitMotion(frames[0], "defender", "enemy")).toMatchObject({ kind: "fall", delay: 560 })
    expect(b.player.board[0].health).toBe(2)
  })
  it("shows shield impact even when no health is lost, and never makes an unaffected unit cast", () => {
    const b = battle(); b.player.board = [unit("a", "banh-mi", 9, 1)]; b.enemy.board = [unit("b", "pho-bo", 9, 0, 2), unit("c", "com-tam")]
    const { frames } = actBattle(b, { type: "attack", uid: "a", target: "b" })
    expect(frames[0].battle.enemy.board[0].health).toBe(9)
    expect(tcgUnitMotion(frames[0], "a", "player").kind).toBe("attack")
    expect(tcgUnitMotion(frames[0], "b", "enemy")).toEqual({ kind: "hit", delay: 560 })
    expect(tcgUnitMotion(frames[0], "c", "enemy").kind).toBe("idle")
  })
  it("uses spell timing for casualties and keeps drawing poses independent of the saved combat", () => {
    const b = battle(); b.player.hand = ["spark"]; b.enemy.board = [unit("target", "banh-mi", 1)]
    const result = actBattle(b, { type: "play", index: 0, target: "target" })
    const before = structuredClone(result)
    for (let age = 0; age <= 1600; age += 16) {
      const cue = tcgUnitMotion(result.frames[0], "target", "enemy")
      expect(cue).toMatchObject({ kind: "fall", delay: 560 })
      characterPose(cue.kind, age, false, false)
    }
    expect(result).toEqual(before)
    expect(tcgUnitMotion(undefined, "target", "enemy").kind).toBe("idle")
  })
})
