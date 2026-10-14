import {createServer} from 'vite'
import {writeFileSync} from 'node:fs'
const server=await createServer({configFile:'dev/tools/vite.pvp-qa.config.ts',server:{middlewareMode:true}})
try{
 const {newGame}=await server.ssrLoadModule('/src/game/progression.ts'),{newRpgSave,reduceRpg}=await server.ssrLoadModule('/src/game/adventureRpg/engine.ts'),{RPG_STAGE_IDS,rpgStage}=await server.ssrLoadModule('/src/game/adventureRpg/content.ts')
 const rows=[]
 for(const id of ['lantern-1','lantern-6','lantern-6','harbor-6','garden-6','tide-6']){
  const g=newGame(),stage=rpgStage(id),s=newRpgSave(g),prepared=rows.length>=2
  s.cinematics=false
  for(const prev of RPG_STAGE_IDS){if(prev===id)break;s.stars[prev]=1}
  for(const h of s.roster)if(prepared){h.level=stage.level;h.rank=3;h.skills=[6,6,6,6];h.gear=[3,3,2]}
  let run=reduceRpg(s,{type:'start',stageId:id},g).save;run=reduceRpg(run,{type:'auto'},g).save
  for(let guard=0;guard<720&&!run.run.battle.result;guard++){
   const b=run.run.battle,priority=b.actors.find(a=>a.side==='enemy'&&a.hp>0&&a.style==='mender')??b.actors.find(a=>a.side==='enemy'&&a.hp>0&&a.style==='hexer')
   if(priority&&b.focus!==priority.uid)run=reduceRpg(run,{type:'focus',uid:priority.uid},g).save
   if(b.warning&&b.tick>=b.guardReady)run=reduceRpg(run,{type:'guard',row:b.warning.row},g).save
   run=reduceRpg(run,{type:'tick',steps:1},g).save
  }
  rows.push({id,prepared,level:prepared?stage.level:1,skills:prepared?6:1,gear:prepared?[3,3,2]:[0,0,0],result:run.run.battle.result,simulatedSeconds:run.run.battle.tick/4,survivors:run.run.battle.actors.filter(a=>a.side==='ally'&&a.hp>0).length})
 }
 if(rows[0].result!=='win'||rows[0].simulatedSeconds<=30||rows[1].result!=='loss'||rows.slice(2).some(r=>r.result!=='win'))throw Error(JSON.stringify(rows))
 writeFileSync('dev/docs/web-v530/balance-qa.json',JSON.stringify({excludesCinematicWallTime:true,manualFocusAndGuard:true,rows},null,2)+'\n');console.log(JSON.stringify(rows))
}finally{await server.close()}
