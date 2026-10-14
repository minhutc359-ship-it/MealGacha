import { afterAll, beforeAll, expect, it, vi } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { SpiritSprite, HumanSprite } from "@/components/game/AdventureArt"
import { ADVENTURE_AREAS, ADVENTURE_STARTERS } from "@/game/adventure"
import { CARD_MAP } from "@/game/catalog"
import { tcgCharacter } from "@/game/tcgCharacterMotion"
import { useGameStore } from "@/game/useGameStore"
beforeAll(() => vi.stubGlobal("document", {hidden:false}))
afterAll(() => vi.unstubAllGlobals())
it("every Adventure species renders the same model as TCG without mutating save", () => {
 const save = JSON.stringify(useGameStore.getState().save)
 const ids = new Set([...ADVENTURE_STARTERS,...ADVENTURE_AREAS.flatMap(area=>[...area.encounters,area.keeper.cardId])])
 for(const cardId of ids){
  const model = tcgCharacter(CARD_MAP[cardId])
  const html = renderToStaticMarkup(createElement(SpiritSprite,{cardId,motion:"cast",stamp:"test"}))
  expect(html).toContain(`Vị Linh ${CARD_MAP[cardId].name}`)
  if(model){expect(html).toContain(`data-character="${model.id}"`);expect(html).toContain(`data-sheet="${model.sheet}"`);expect(html).toContain('data-motion="cast"')}
 }
 expect(JSON.stringify(useGameStore.getState().save)).toBe(save)
})
it("keepers share the animated chef atlas and player uses the four-direction heroine atlas",()=>{
 for(const character of ["bach","hai","moc","nhien","lien"] as const){
  expect(renderToStaticMarkup(createElement(HumanSprite,{character}))).toContain(`data-character="chef-${character}"`)
 }
 const html=renderToStaticMarkup(createElement(HumanSprite,{character:"hero",direction:"up",frame:3}))
 expect(html).toContain('data-facing="up"');expect(html).toContain('/assets/adventure/hero-v440.webp');expect(html).toContain('background-position:100% 100%')
})
