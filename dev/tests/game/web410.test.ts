import { describe, expect, it } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { createHash } from "node:crypto"
import { practiceBattle, practiceAction, practiceSolved } from "@/game/practice"
import { storyLines, campaignProgress } from "@/game/storyPresentation"
import { newGame } from "@/game/progression"
import { STAGES } from "@/game/story"
import { stemPaths } from "@/game/adaptiveScore"
import { streamingMusicPath, WEB_SCORES } from "@/game/webSoundtrack"
import { createAutoRun, move } from "@/game/autochess/economy"
import { createCombat, advanceCombat } from "@/game/autochess/combat"
import { recapAdvice } from "@/game/autochess/recapAdvice"

describe("web 4.1 practice uses actual rules",()=>{
  it("rejects a hero attack through guard, then allows two legal attacks to solve lesson",()=>{
    const b=practiceBattle(0),raw=JSON.stringify(b)
    const blocked=practiceAction(b,{type:"attack",uid:"practice-pho",target:"hero"})
    expect(blocked.error).toBeTruthy();expect(JSON.stringify(b)).toBe(raw)
    const opened=practiceAction(b,{type:"attack",uid:"practice-pho",target:"practice-guard"})
    expect(opened.error).toBeNull();expect(opened.battle.enemy.board).toHaveLength(0)
    const won=practiceAction(opened.battle,{type:"attack",uid:"practice-rice",target:"hero"})
    expect(practiceSolved(0,won.battle)).toBe(true);expect(JSON.stringify(b)).toBe(raw)
  })
  it("Nêm must choose a branch and damage bypasses guard; cancelling cannot consume mana",()=>{
    const b=practiceBattle(1)
    expect(practiceAction(b,{type:"play",index:0,target:"hero"}).error).toBeTruthy()
    expect(b.player.mana).toBe(2)
    const hit=practiceAction(b,{type:"play",index:0,target:"hero",branch:"first"})
    expect(hit.error).toBeNull();expect(practiceSolved(1,hit.battle)).toBe(true)
  })
  it("a food followed by the healing branch really triggers Bữa cơm nhà",()=>{
    const b=practiceBattle(2)
    const food=practiceAction(b,{type:"play",index:0})
    expect(food.error).toBeNull()
    const healed=practiceAction(food.battle,{type:"play",index:0,branch:"first",target:"hero"})
    expect(healed.error).toBeNull();expect(practiceSolved(2,healed.battle)).toBe(true)
    expect(healed.battle.player.health).toBeGreaterThan(20)
  })
  it("Auto sample moves and simulates a cloned team without modifying the real run",()=>{
    const real=createAutoRun("survival",410,"2026-10-11","real-run"),raw=JSON.stringify(real)
    const sample=structuredClone(real)
    expect(move(sample,sample.roster[1].uid,32)).toBeNull()
    sample.phase="combat";sample.combat=createCombat(sample)
    const next=advanceCombat(sample,40)
    expect(next.combat!.tick).toBeGreaterThan(0)
    expect(JSON.stringify(real)).toBe(raw);expect(real.health).toBe(3)
  })
})
describe("story and score continuity",()=>{
  it("counts real stages once without changing the intentional legacy 18-stage quest",()=>{
    expect(campaignProgress([...STAGES.map(s=>s.id),STAGES[0].id,"unknown"])).toEqual({cleared:27,total:27})
    const save=newGame();save.storyEnding="release";save.story400={version:1,giftClaimed:false,choices:{},seenScenes:[],claimedRewards:[],originEnding:"release",decisions:{"living-market":"listen","tomorrow-table":"open"}}
    const before=JSON.stringify(save)
    expect(storyLines("living-market-1",save,"before").map(l=>l.text).join(" ")).toContain("Mai đã được tiễn đi")
    expect(storyLines("living-market-1",save,"before").some(l=>l.text.includes("cháo không có gừng"))).toBe(true)
    expect(storyLines("tomorrow-table-3",save,"after").some(l=>l.text.includes("trang giấy còn trống"))).toBe(true)
    expect(JSON.stringify(save)).toBe(before)
  })
  it("provides distinct regional short stems and long-score files for both styles",()=>{
    const paths=new Set<string>()
    for(const region of ["market","harbor","kitchen"] as const) for(const style of ["original","8bit"] as const) {
      for(const path of stemPaths(style,`v4-${region}-tension`)) {expect(existsSync(`public/${path}`)).toBe(true);paths.add(path)}
    }
    expect(paths.size).toBe(18)
    for(const key of Object.keys(WEB_SCORES) as Array<keyof typeof WEB_SCORES>) for(const style of ["original","8bit"] as const) {
      const path=streamingMusicPath(style==="8bit"?`8bit-${key}`:key)!
      expect(readFileSync(`public/${path}`).subarray(0,3).toString()).toBe("ID3")
    }
    const report=JSON.parse(readFileSync('dev/docs/web-v410/audio-manifest.json','utf8'))
    expect(report.files).toHaveLength(36)
    for(const file of report.files) {
      const bytes=readFileSync(file.path)
      expect(bytes.length).toBe(file.bytes)
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(file.sha256)
      expect(file.peak).toBeLessThan(.8);expect(file.rms).toBeGreaterThan(.015);expect(file.sampleRate).toBe(44100)
    }
  })
  it("recap suggestions read completed events without touching resources",()=>{
    const run=createAutoRun("campaign",410,"2026-10-11","recap")
    run.scene=null;run.combat=createCombat(run)
    run.lastResult={id:run.combat.id,wave:1,result:"loss",seconds:20,survivors:2,points:0,damage:9,gold:5,reason:"test"}
    const actor=run.combat.actors.find(a=>a.side==="ally")!
    actor.hp=0;actor.casts=0
    run.combat.recap={[actor.uid]:{damage:125,healing:0,shielding:0,blocked:0}}
    const raw=JSON.stringify(run),advice=recapAdvice(run)
    expect(advice.some(a=>a.text.includes("125"))).toBe(true)
    expect(advice.some(a=>a.title==="Chưa kịp tung kỹ năng")).toBe(true)
    expect(JSON.stringify(run)).toBe(raw)
  })
})
