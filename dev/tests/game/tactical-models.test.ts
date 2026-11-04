import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { existsSync, writeFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { TACTICAL_CARDS, TACTICAL_CARD_MAP } from "@/game/tacticalTcg/cards"
import { TACTICAL_DECK_LIBRARY } from "@/game/tacticalTcg/deckLibrary"
import { TACTICAL_UNITS, createTacticalBattle, playAutomaticRound, reduceTacticalBattle, type TacticalBattleState } from "@/game/tacticalTcg/engine"
import { emptyCardCell } from "@/game/tacticalTcg/engine/cardRuntime"
import { tacticalSpiritModel, tacticalModelAnimated, TACTICAL_MODEL_ASSETS } from "@/game/tacticalTcg/presentation/models"
import { tacticalTransition, tacticalUnitMotion } from "@/game/tacticalTcg/presentation/transitions"
import { TacticalCardFace } from "@/components/game/TacticalTable"
import { GameCardView } from "@/components/game/GameCardView"
import { isProductionPublicAssetPath } from "../../tools/production-public-assets"
import modelAssets from "@/game/tacticalTcg/presentation/model-assets.json"

describe("Tactical rendered spirits and truthful combat presentation", () => {
  it("resolves every unit to its own atlas or rendered portrait and packages every dependency", () => {
    expect(modelAssets).toEqual(TACTICAL_MODEL_ASSETS)
    const roster = TACTICAL_CARDS.filter(c=>c.kind==="unit").map(c=>({id:c.id,model:tacticalSpiritModel(c.id,c.name)}))
    for (const entry of [...roster,...TACTICAL_UNITS.map(u=>({id:u.id,model:tacticalSpiritModel(u.id,u.name)}))]) expect(entry.model,entry.id).not.toBeNull()
    for (const path of TACTICAL_MODEL_ASSETS) {
      expect(existsSync(`public${path}`),path).toBe(true)
      expect(isProductionPublicAssetPath(path.slice(1)),path).toBe(true)
      expect(path).not.toContain("/food/")
      expect(path).not.toContain("/autochess/")
    }
    expect(isProductionPublicAssetPath("assets/characters/not-a-tactical-model.webp")).toBe(false)
    expect(tacticalSpiritModel("not-a-spirit")).toBeNull()
    if (process.env.TCG_WRITE_EVIDENCE) writeFileSync("docs/tactical-tcg/evidence/TCG-008-models.json",JSON.stringify({base:"d8326dc",roster:roster.map(({id,model})=>({id,model:model?.id,sheet:model?.sheet,animated:model? tacticalModelAnimated(model):false})),assets:TACTICAL_MODEL_ASSETS},null,2)+"\n")
  })
  it("shows rendered Vị Linh rather than dish photos on battle, collection and deck cards", () => {
    for (const card of TACTICAL_CARDS.filter(c=>c.kind==="unit")) {
      for (const html of [renderToStaticMarkup(createElement(TacticalCardFace,{card})),renderToStaticMarkup(createElement(GameCardView,{card,spiritArt:true}))]) {
        expect(html,card.id).toContain("tactical-spirit-portrait")
        expect(html,card.id).not.toContain("/assets/food/")
      }
    }
  })
  it("derives summon, attack, hit, fall, upgrade, ultimate, recipe and movement from legal commands without changing battle state", () => {
    const observed = new Set<string>()
    let serial=0
    const check = (before:TacticalBattleState, after:TacticalBattleState) => {
      const frozen=JSON.stringify([before,after]), t=tacticalTransition(before,after)
      if (!t) return
      observed.add(t.kind)
      if(t.combo) observed.add(t.combo.name)
      if(t.kind==="attack"||t.kind==="ultimate") {
        expect(before.units.some(u=>u.instanceId===t.sourceId)).toBe(true)
        expect(t.duration).toBeGreaterThanOrEqual(t.contact+900)
      }
      for(const delta of t.deltas){
        const old=before.units.find(u=>u.instanceId===delta.id), unit=after.units.find(u=>u.instanceId===delta.id)
        if(!unit) continue
        expect(delta.hp).toBe(unit.hp-(old?.hp??0))
        const cue=tacticalUnitMotion(unit,t,after.winner)
        if(delta.fallen){expect(cue.motion).toBe("fall");expect(cue.delay).toBe(t.contact);observed.add("fall")}
        else if(delta.hp<0&&t.sourceId!==unit.instanceId){expect(cue.motion).toBe("hit");expect(cue.delay).toBe(t.contact);observed.add("hit")}
      }
      expect(JSON.stringify([before,after])).toBe(frozen)
      expect(tacticalTransition(after,after)).toBeNull()
    }
    for(const deck of TACTICAL_DECK_LIBRARY) for(let seed=1;seed<=4;seed++) {
      let state=createTacticalBattle({battleId:`motion:${deck.id}:${seed}`,deck:deck.cards,seed})
      for(let tick=0;tick<18&&state.phase!=="result";tick++) {
        if(state.phase==="planning") {
          for(let play=0;play<8;play++){
            let played=false
            for(let handIndex=0;handIndex<state.cardGame!.sides.player.hand.length;handIndex++) {
              const card=TACTICAL_CARD_MAP[state.cardGame!.sides.player.hand[handIndex]],same=state.units.find(u=>!u.defeated&&u.side==="player"&&u.cardId===card.id&&u.star===1)
              const next=reduceTacticalBattle(state,{id:`card:${serial++}`,type:"play-card",side:"player",handIndex,cell:same?.cell??emptyCardCell(state,"player",card.tacticalRole!=="guardian")??undefined,column:0})
              check(state,next)
              if(next!==state){state=next;played=true;break}
            }
            if(!played)break
          }
          const mover=state.units.find(u=>u.side==="player"&&!u.defeated), cell=emptyCardCell(state,"player")
          if(mover&&cell){const next=reduceTacticalBattle(state,{id:`move:${state.round}:${mover.instanceId}:${cell.row}:${cell.column}`,type:"move",unitId:mover.instanceId,cell});check(state,next);state=next}
        } else for(const unit of state.units.filter(u=>u.side==="player"&&!u.defeated&&u.energy>=100)) {
          const next=reduceTacticalBattle(state,{id:`ultimate:${state.round}:${unit.instanceId}`,type:"ultimate",unitId:unit.instanceId});check(state,next);state=next
        }
        let prior=state
        const next=playAutomaticRound(state,frame=>{check(prior,frame);prior=frame})
        if(prior===state)check(state,next)
        state=next
      }
    }
    for(const kind of ["summon","upgrade","attack","ultimate","spell","trap","move","hit","fall","CÔNG THỨC ĐỒNG VỊ","MÂM CHUNG"])expect(observed.has(kind),`${kind}: ${[...observed]}`).toBe(true)
  })
})
