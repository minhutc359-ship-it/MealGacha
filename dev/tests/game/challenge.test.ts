import { describe, expect, it } from "vitest"
import { startBattle, actBattle } from "@/game/battle"
import { STARTER_DECK, CARD_MAP } from "@/game/catalog"
import { STAGES } from "@/game/story"
import { startSideQuest, startWeekly } from "@/game/journeys"
import { createExpedition, enterRunNode, startRunBattle } from "@/game/expedition"
import { createAutoRun, benchLayout, move, levelProgress } from "@/game/autochess/economy"
import { createCombat } from "@/game/autochess/combat"
import { AUTO_UNITS, UNIT_MAP } from "@/game/autochess/catalog"
import { emptyAutoSave } from "@/game/autochess/types"
import { autoRunSchema } from "@/game/autochess/schema"
import { reduceAuto } from "@/game/autochess/reducer"
import { DISTINCT_MODELS, unitCharacter, fitCharacter } from "@/infrastructure/assets/characterSprites"
import { tcgCharacter } from "@/game/tcgCharacterMotion"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { createSaveCode, readSaveCode } from "@/game/saveCode"

const initial = () => createAutoRun("survival", 42, "2026-10-09", "challenge")
function withBench() {
  const r = initial()
  for (const id of ["banh-mi", "bun-rieu", "chef-moc"]) {
    r.roster.push({uid:`p${r.nextUid++}`, id, star:1, cell:null, items:[]}); r.pool[id]--
  }
  return r
}
describe("challenge without changing existing battles", () => {
  it("raises each new TCG leader's endurance by 30% and retains player/card rules", () => {
    for (const stage of STAGES) {
      const b = startBattle(STARTER_DECK, stage.id, "courage", () => .37)
      const old = 25 + Math.floor(stage.index/3)*2 + (stage.boss ? 3 : 0)
      expect(b.enemy.maxHealth).toBe(Math.round(old*1.3)); expect(b.enemy.health).toBe(b.enemy.maxHealth)
      expect(b.player.health).toBe(34); expect(b.enemyChallenge).toBe(1.3)
    }
    const b = startBattle(STARTER_DECK, null); b.enemy.hand=["pho-bo"]; b.enemy.deck=[]
    const next = actBattle(b,{type:"end"}).battle
    expect(next.enemy.board[0].attack).toBe(CARD_MAP["pho-bo"].attack)
    expect(next.enemy.board[0].maxHealth).toBe(CARD_MAP["pho-bo"].health)
    expect(startSideQuest(STARTER_DECK,"bach","share").enemy.maxHealth).toBe(31)
    expect(startWeekly(2,"2026-10-09").enemy.maxHealth).toBe(42)
    const exp = enterRunNode(createExpedition(STARTER_DECK,42),"0-0")
    expect(startRunBattle(exp).enemy.maxHealth).toBe(31)
  })
  it("gives Auto chess a 1.3 durability × output budget without weakening 3-star allies", () => {
    for (const mode of ["campaign","survival","daily"] as const) {
      const run = initial(); run.mode=mode; run.wave=12; run.activeTicks=1200
      const old=createCombat({...run,rulesVersion:1}), next=createCombat({...run,rulesVersion:2})
      const enemies=old.actors.filter(a=>a.side==="enemy")
      for (const enemy of enemies) {
        const boosted=next.actors.find(a=>a.uid===enemy.uid)!
        expect(boosted.maxHp/enemy.maxHp*boosted.attack/enemy.attack).toBeCloseTo(1.3,2)
        expect(boosted.power/enemy.power).toBeCloseTo(Math.sqrt(1.3),5)
      }
      expect(next.actors.filter(a=>a.side==="ally")).toEqual(old.actors.filter(a=>a.side==="ally"))
    }
  })
  it("accepts legacy runs and upgrades only on the next battle; new slot data survives save-code transfer", async () => {
    const r=withBench(); r.rulesVersion=1
    const b=startBattle(STARTER_DECK,null); delete b.enemyChallenge; b.enemy.health=b.enemy.maxHealth=30
    const save={...newGame(),battle:b,autoChess:{...emptyAutoSave(),run:r}}
    expect(parseGame(save)?.battle?.enemy.maxHealth).toBe(30)
    const started=reduceAuto(save.autoChess,{type:"battle"}).save.run!
    expect(started.rulesVersion).toBe(2); expect(r.rulesVersion).toBe(1)
    expect(move(r,r.roster[3].uid,null,undefined,5)).toBeNull()
    const transferred=await readSaveCode(await createSaveCode(save))
    expect(transferred.save.autoChess?.run?.roster.find(p=>p.uid===r.roster[3].uid)?.benchSlot).toBe(5)
    expect(transferred.save.battle?.enemy.maxHealth).toBe(30)
  })
})
describe("formation editing and visible level progress", () => {
  it("persists empty bench positions and swaps bench/bench and full-board/bench without losing pieces", () => {
    const r=withBench(), a=r.roster[3], b=r.roster[4], board=r.roster[0]
    const before=structuredClone(r)
    expect(move(r,a.uid,null,undefined,5)).toBeNull(); expect(benchLayout(r)[5]?.uid).toBe(a.uid)
    expect(benchLayout(r)[0]).toBeUndefined()
    expect(move(r,b.uid,null,undefined,5)).toBeNull(); expect(benchLayout(r)[1]?.uid).toBe(a.uid)
    expect(benchLayout(r)[5]?.uid).toBe(b.uid)
    expect(move(r,b.uid,board.cell)).toBeNull(); expect(benchLayout(r)[5]?.uid).toBe(board.uid)
    expect(move(r,b.uid,null,undefined,5)).toBeNull(); expect(board.cell).toBe(20)
    expect(r.pool).toEqual(before.pool); expect(r.gold).toBe(before.gold)
    expect(r.roster.map(({cell,benchSlot,...p})=>p)).toEqual(before.roster.map(({cell,benchSlot,...p})=>p))
    expect(autoRunSchema.safeParse(r).success).toBe(true)
    const parsed=parseGame({...newGame(),autoChess:{...emptyAutoSave(),run:r}})!
    expect(benchLayout(parsed.autoChess!.run!)[5]?.uid).toBe(b.uid)
  })
  it("refuses invalid slots, forbidden deployments and dragging during combat atomically", () => {
    const r=withBench(), uid=r.roster[3].uid, before=structuredClone(r)
    expect(move(r,uid,null,undefined,6)).toBeTruthy(); expect(r).toEqual(before)
    expect(move(r,uid,18)).toBeTruthy(); expect(r).toEqual(before)
    const started=reduceAuto({...emptyAutoSave(),run:r},{type:"battle"}).save
    const out=reduceAuto(started,{type:"move",uid,cell:null,benchSlot:4})
    expect(out.error).toBeTruthy(); expect(out.save).toBe(started)
  })
  it("shows the exact remaining XP at every level boundary and caps the final bar", () => {
    const samples=[0,7,8,19,20,37,38,61,62,1000].map(levelProgress)
    expect(samples.map(s=>s.remaining)).toEqual([8,1,12,1,18,1,24,1,0,0])
    expect(samples.map(s=>s.level)).toEqual([3,3,4,4,5,5,6,6,7,7])
    expect(samples[2].percent).toBe(0); expect(samples[8].percent).toBe(100)
  })
})
describe("recognizable shared models and mirrored fitting", () => {
  it("assigns a unique real atlas row to every Auto chess unit and shares it with its TCG card", () => {
    const keys=AUTO_UNITS.map(u=>{const m=unitCharacter(u.id); return `${m.sheet}:${m.row}`})
    expect(new Set(keys).size).toBe(AUTO_UNITS.length)
    expect(Object.keys(DISTINCT_MODELS)).toHaveLength(28)
    for (const u of AUTO_UNITS) if(CARD_MAP[u.id]) expect(tcgCharacter(CARD_MAP[u.id])).toEqual(unitCharacter(u.id))
    expect(tcgCharacter(CARD_MAP["caravan-herbalist"])?.row).not.toBe(tcgCharacter(CARD_MAP["caravan-gardener"])?.row)
  })
  it("fits every pose and both horizontal directions inside portrait and landscape cell widths", () => {
    for (const unit of AUTO_UNITS) for (const width of [28,42,64,96]) for(const flip of [false,true]) {
      const m=unitCharacter(unit.id), f=fitCharacter(m,width*.9,width*.75,flip), direction=flip?-1:1
      for(const frame of f.bounds.row.frames) {
        const extents=[-frame[4],frame[2]-frame[4]].map(x=>direction*x*f.scale+f.offsetX)
        expect(Math.min(...extents)).toBeGreaterThanOrEqual(-width*.45-1e-6)
        expect(Math.max(...extents)).toBeLessThanOrEqual(width*.45+1e-6)
        expect(-frame[5]*f.scale+f.offsetY).toBeGreaterThanOrEqual(-width*.75-1e-6)
        expect((frame[3]-frame[5])*f.scale+f.offsetY).toBeLessThanOrEqual(1e-6)
      }
    }
    expect(unitCharacter("pho-bo").showcase).toBe("/assets/tcg/spirits/tide.webp")
  })
})
