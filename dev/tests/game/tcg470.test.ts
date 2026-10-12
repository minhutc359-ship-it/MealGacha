import { beforeEach, describe, expect, it } from "vitest"
import { actBattle, startBattle, opponentDeck, playDrawRisk } from "@/game/battle"
import { CARD_MAP, CARDS, STARTER_DECK, LEGACY_STARTER_DECK, LEGACY_STARTER_IDS, TCG470_GIFT_IDS, deckErrors } from "@/game/catalog"
import { boardLimit, nextFatigueDamage, type TcgRulesVersion } from "@/game/tcgRules"
import { completeDeck, suggestDeck } from "@/game/deckStrategy"
import { getBattleHint } from "@/game/battleCoach"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { createExpedition, enterRunNode, startRunBattle } from "@/game/expedition"
import { STAGES } from "@/game/story"
import { useGameStore } from "@/game/useGameStore"
import { clearProtectedState } from "@/infrastructure/storage/protectedStorage"
import type { BattleUnit, Battle } from "@/game/types"
const owned = Object.fromEntries(CARDS.map(c => [c.id,2]))
const random = (seed: number) => () => ((seed = (Math.imul(seed,1664525)+1013904223) >>> 0) / 4294967296)
const unit = (uid: string, cardId = "banh-mi", guard = false): BattleUnit => ({uid,cardId,attack:1,health:5,maxHealth:5,shield:0,ready:false,keywords:guard?["guard"]:[]})
function arena(version: TcgRulesVersion = 470) {
  const b = startBattle(version >= 470 ? STARTER_DECK : LEGACY_STARTER_DECK, null,"courage",random(7),false,version)
  b.player.mana = b.player.maxMana = 7
  b.enemy.hand = []; b.enemy.deck = ["herb"]
  b.tactic = {status:"chosen",choice:"shelter"}
  return b
}
beforeEach(() => {
  const memory = new Map<string,string>()
  Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k),clear:()=>memory.clear(),key:(i:number)=>[...memory.keys()][i]??null,get length(){return memory.size}}})
  clearProtectedState()
})
describe("4.7 battle rules and preservation", () => {
  it.each([350,400,450,470] as TcgRulesVersion[])("uses the saved %i board limit and round-trips without upgrading", version => {
    const b = arena(version), limit = boardLimit(b)
    b.player.board = Array.from({length:limit-1},(_,i)=>unit(`p${i}`))
    b.player.hand = ["caravan-scout", "banh-mi"]
    const next = actBattle(b,{type:"play",index:0})
    expect(next.error).toBeNull(); expect(next.battle.player.board).toHaveLength(limit)
    expect(actBattle(next.battle,{type:"play",index:0}).error).toContain(`${limit}`)
    const restored = parseGame({...newGame(),battle:next.battle})
    expect(restored?.battle).toEqual(next.battle)
    const corrupt = structuredClone(next.battle);corrupt.player.board.push(unit("excess"))
    expect(parseGame({...newGame(),battle:corrupt})).toBeNull()
  })
  it.each([350,400,450] as TcgRulesVersion[])("keeps the %i expedition deck and future encounters at 18 cards", version => {
    const run = {...createExpedition(LEGACY_STARTER_DECK,7),rulesVersion:version}
    const save = {...newGame(),expedition:run}
    expect(parseGame(save)?.expedition?.deck).toEqual(LEGACY_STARTER_DECK)
    const b = startRunBattle(enterRunNode(run,"0-0"),random(9))
    expect(b.rulesVersion).toBe(version);expect(b.player.deck.length+b.player.hand.length).toBe(18)
    expect(b.enemy.deck.length+b.enemy.hand.length).toBe(18)
  })
  it("keeps new expedition encounters at 24 cards and rejects mismatched rules", () => {
    const run = enterRunNode(createExpedition(STARTER_DECK,7),"0-0"), b = startRunBattle(run,random(9))
    expect(b.rulesVersion).toBe(470);expect(b.player.deck.length+b.player.hand.length).toBe(24)
    expect(b.enemy.deck.length+b.enemy.hand.length).toBe(24)
    expect(parseGame({...newGame(),expedition:run,battle:b})).not.toBeNull()
    expect(parseGame({...newGame(),expedition:run,battle:{...b,rulesVersion:450}})).toBeNull()
    expect(parseGame({...newGame(),expedition:{...createExpedition(STARTER_DECK),deck:LEGACY_STARTER_DECK}})).toBeNull()
  })
  it("revives into the fourth slot and requires the full current board for moonward's draw", () => {
    const b=arena(); b.player.board=[unit("a"),unit("b"),unit("c")];b.player.graveyard=["pho-bo"];b.player.hand=["sea-memory"]
    const revived = actBattle(b,{type:"play",index:0});expect(revived.error).toBeNull();expect(revived.battle.player.board).toHaveLength(4)
    expect(revived.battle.player.board[3]).toMatchObject({health:2,ready:false})
    const cast = (count:number) => {const a=arena();a.player.board=Array.from({length:count},(_,i)=>unit(`a${i}`));a.player.hand=["moon-banquet"];a.player.deck=["spark"];return actBattle(a,{type:"play",index:0}).battle}
    expect(cast(3).player.deck).toHaveLength(1);expect(cast(4).player.deck).toHaveLength(0)
  })
  it("resumes a persisted trap reaction against the fourth enemy attacker exactly once", () => {
    let b = arena();b.enemy.board=Array.from({length:4},(_,i)=>({...unit(`e${i}`),attack:1,ready:true}))
    b.player.hand=["trap-lid"]
    b=actBattle(b,{type:"play",index:0}).battle;b=actBattle(b,{type:"end"}).battle
    for(let i=0;i<3;i++){expect(b.pendingReaction).toBeDefined();b=actBattle(b,{type:"react",id:b.pendingReaction!.id,activate:false}).battle}
    expect(b.pendingReaction?.intent.source).toBe("e3");expect(b.enemyPhase?.cursor).toBe(4)
    const restored=parseGame({...newGame(),battle:b})!.battle!
    const health=restored.player.health,id=restored.pendingReaction!.id
    const out=actBattle(restored,{type:"react",id,activate:true})
    expect(out.error).toBeNull();expect(out.battle.player.health).toBe(health)
    expect(out.battle.pendingReaction).toBeUndefined();expect(out.battle.enemyPhase).toBeUndefined()
    expect(out.frames.filter(f=>f.event.kind==="trap")).toHaveLength(1)
    expect(actBattle(out.battle,{type:"react",id,activate:true}).error).toBeTruthy()
    expect(parseGame({...newGame(),battle:out.battle})).not.toBeNull()
  })
  it("AI can summon its fourth unit but never a fifth", () => {
    const b=arena();b.enemy.maxMana=7;b.enemy.board=[unit("a"),unit("b"),unit("c")];b.enemy.hand=["caravan-scout","caravan-scout"]
    const out=actBattle(b,{type:"end"});expect(out.error).toBeNull()
    expect(out.battle.enemy.board).toHaveLength(4);expect(out.battle.enemy.hand.filter(id=>id==="caravan-scout")).toHaveLength(1)
  })
  it.each([350,400,450,470] as TcgRulesVersion[])("applies %i fatigue symmetrically to both sides", version => {
    let b=arena(version);b.player.deck=[];b.enemy.deck=[];b.player.hand=[];b.enemy.hand=[]
    b.player.health=b.player.maxHealth=b.enemy.health=b.enemy.maxHealth=80
    const losses:number[]=[]
    for(let i=0;i<5;i++){const old=b.player.health;b=actBattle(b,{type:"end"}).battle;losses.push(old-b.player.health);expect(b.enemy.health).toBe(b.player.health)}
    expect(losses).toEqual(version>=470?[1,2,3,3,3]:[1,2,3,4,5])
    expect(b.player.fatigue).toBe(5);expect(nextFatigueDamage(b,b.player)).toBe(version>=470?3:6)
    expect(parseGame({...newGame(),battle:b})?.battle?.player.fatigue).toBe(5)
  })
  it("forecasts draw spells, indirect engine draws and a lethal draw without leaking hidden traps", () => {
    const b=arena();b.player.hand=["recipe-scroll"];b.player.deck=["spark"];b.player.fatigue=2
    const snapshot=JSON.stringify(b)
    expect(playDrawRisk(b,0)).toEqual({missed:2,damage:6,lethal:false});expect(JSON.stringify(b)).toBe(snapshot)
    b.player.health=5;expect(playDrawRisk(b,0)?.lethal).toBe(true)
    b.player.health=30;b.player.deck=[];b.player.hand=["sugar-veil"];b.player.spellsThisTurn=1;b.player.board=[unit("ally")]
    expect(playDrawRisk(b,0)?.missed).toBe(1)
    b.round=2;b.turnSerial=3;b.enemy.trap={uid:"t9",cardId:"trap-seal",setTurn:2};b.nextUid=10
    const risk=playDrawRisk(b,0);b.enemy.trap.cardId="trap-mirror";expect(playDrawRisk(b,0)).toEqual(risk)
  })
})
describe("24-card construction and old collections", () => {
  it("creates a legal 24-card starter and builds every suggested style legally", () => {
    expect(STARTER_DECK).toHaveLength(24);expect(deckErrors(STARTER_DECK,newGame().cards)).toEqual([])
    for(const style of ["balanced","rush","guard","sustain","cycle","rebirth","spellcraft","seasoning","steeping","traps"] as const){const deck=suggestDeck(owned,style);expect(deck).toHaveLength(24);expect(deckErrors(deck,owned)).toEqual([])}
  })
  it("completes an old deck by appending owned cards and grants the six-card gift once", () => {
    const save={...newGame(),tcg470:undefined,cards:Object.fromEntries(LEGACY_STARTER_IDS.map(id=>[id,2])),decks:[{id:"old",name:"Cũ",cards:[...LEGACY_STARTER_DECK]}],activeDeckId:"old",battle:arena(450)}
    const restored=parseGame(save)!;useGameStore.setState({save:restored})
    const before=structuredClone(restored);expect(useGameStore.getState().claimTcg470Gift()).toBe(true)
    const gifted=structuredClone(useGameStore.getState().save)
    expect(gifted.decks).toEqual(before.decks);expect(gifted.battle).toEqual(before.battle)
    expect([gifted.coins,gifted.xp,gifted.dust,gifted.adventure,gifted.autoChess]).toEqual([before.coins,before.xp,before.dust,before.adventure,before.autoChess])
    for(const id of TCG470_GIFT_IDS)expect(gifted.cards[id]).toBe(2)
    useGameStore.getState().claimTcg470Gift();expect(useGameStore.getState().save).toEqual(gifted)
    const filled=completeDeck(before.decks[0].cards,gifted.cards)
    expect(filled.slice(0,18)).toEqual(LEGACY_STARTER_DECK);expect(deckErrors(filled,gifted.cards)).toEqual([])
    expect(useGameStore.getState().saveDeck("old","Cũ",filled)).toBe(true)
    expect(parseGame(useGameStore.getState().save)?.decks[0].cards).toEqual(filled)
  })
  it("gives every opponent 24 cards with at most two copies, retaining old 18-card opponents", () => {
    for(const stage of STAGES)for(let seed=1;seed<=10;seed++){
      const deck=opponentDeck(stage.id,random(seed),470);expect(deck).toHaveLength(24);expect(deckErrors(deck,owned)).toEqual([])
      expect(opponentDeck(stage.id,random(seed),450)).toHaveLength(18)
    }
  })
  it("resolves 60 seeded full games with legal hints, reactions, four-slot snapshots and no stalled matches", () => {
    let wins=0,reactions=0
    for(let seed=1;seed<=60;seed++){
      let b:Battle=startBattle(suggestDeck(owned,seed%2?"traps":"spellcraft"),STAGES[(seed-1)%STAGES.length].id,"courage",random(seed))
      for(let i=0;!b.result&&i<600;i++){
        expect(parseGame({...newGame(),cards:owned,battle:b})).not.toBeNull()
        expect(b.player.board.length).toBeLessThanOrEqual(4);expect(b.enemy.board.length).toBeLessThanOrEqual(4)
        const action=b.pendingReaction?{type:"react" as const,id:b.pendingReaction.id,activate:true}:b.tactic?.status==="pending"?{type:"tactic" as const,id:"shelter" as const}:getBattleHint(b)?.action??{type:"end" as const}
        if(b.pendingReaction)reactions++
        const out=actBattle(b,action);expect(out.error).toBeNull();b=out.battle
      }
      expect(b.result).not.toBeNull();if(b.result==="win")wins++
    }
    expect(wins).toBeGreaterThan(0);expect(reactions).toBeGreaterThan(0)
  },20_000)
})
