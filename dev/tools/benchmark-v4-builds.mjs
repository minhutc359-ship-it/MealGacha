// Reproducible fixed-board sampling; this is not a human playtest or a full economy simulation.
import {createServer} from 'vite';import {writeFileSync} from 'node:fs';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
const {createAutoRun}=await server.ssrLoadModule('/src/game/autochess/economy.ts');
const {createCombat,advanceCombat}=await server.ssrLoadModule('/src/game/autochess/combat.ts');
const teams=[['banh-mi','banh-mi','chef-nhien'],['pho-bo','bun-rieu','chef-hai'],['goi-cuon','chef-moc','banh-cuon'],['com-tam','xoi','chef-bach'],['che-lam','chef-lien','com-ga'],['bun-cha','banh-xeo','ferry'],['com-tam','pho-bo','goi-cuon'],['chef-nhien','chef-hai','chef-moc'],['com-tam','com-tam','xoi'],['banh-mi','banh-mi','bun-cha'],['chef-bach','chef-lien','ferry'],['com-ga','banh-cuon','bun-rieu']];
const augments=['v4-relay','v4-heal-strike','v4-last-guard','v4-market-deal','v4-third-cast','v4-many-flavors'];const results=[];
try{for(let team=0;team<teams.length;team++){
 let wins=0,losses=0,totalTicks=0,maxTicks=0;
 for(let seed=1;seed<=100;seed++){
  let r=createAutoRun('survival',seed,'2026-10-10',`sample-${team}-${seed}`);r.scene=null;r.phase='combat';r.paused=false;r.wave=6;r.augments=[augments[team%augments.length]];
  r.roster=teams[team].map((id,i)=>({uid:`p-${i}`,id,star:2,cell:18+i+(seed%2?0:6),items:[]}));r.combat=createCombat(r);
  let guard=0;while(!r.combat.result&&guard++<100){r=advanceCombat(r,40);if(r.combat.pendingScene){r.combat.pendingScene=null}}
  if(!r.combat.result)throw Error(`stalled ${team} ${seed}`);if(r.combat.result==='win')wins++;else losses++;
  totalTicks+=r.combat.tick;maxTicks=Math.max(maxTicks,r.combat.tick);
 }
 results.push({team:teams[team],wave:6,star:2,items:[],augment:augments[team%augments.length],seeds:100,wins,losses,meanSeconds:totalTicks/100/20,maxSeconds:maxTicks/20});
}
const report={agent:'fixed-three-unit-board-v1',scope:'12 boards × 100 seeds, Survival wave6, alternating starting row. Not pairwise PvP or 200-seed TCG balance; economy smoke runs are separate.',results};writeFileSync('dev/docs/major-v400/build-sampling.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({battles:1200,stalled:0}));}finally{await server.close()}
