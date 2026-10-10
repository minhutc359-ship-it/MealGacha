// Fixed heuristic matchup sampling; coach and enemy AI differ, so win rate is not a fair-PvP rating.
import {createServer} from 'vite';import {writeFileSync} from 'node:fs';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{
 const {CARDS}=await server.ssrLoadModule('/src/game/catalog.ts'),{suggestDeck}=await server.ssrLoadModule('/src/game/deckStrategy.ts'),{startBattle,actBattle}=await server.ssrLoadModule('/src/game/battle.ts'),{getBattleHint}=await server.ssrLoadModule('/src/game/battleCoach.ts');
 const owned=Object.fromEntries(CARDS.map(c=>[c.id,2])),styles=['seasoning','steeping','rebirth','spellcraft'],decks=Object.fromEntries(styles.map(s=>[s,suggestDeck(owned,s)])),results=[];
 for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
  let wins=0,losses=0,guards=0,rounds=0,seasoned=0,steeped=0;
  for(let seed=1;seed<=200;seed++){
   let state=seed;const rng=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};const side=seed%2,[a,b]=side?[styles[j],styles[i]]:[styles[i],styles[j]];
   let battle=startBattle(decks[a],null,'wisdom',rng);battle.opening=undefined;const enemy=[...decks[b]];for(let k=enemy.length-1;k>0;k--){const z=Math.floor(rng()*(k+1));[enemy[k],enemy[z]]=[enemy[z],enemy[k]]}battle.enemy.hand=enemy.splice(0,4);battle.enemy.deck=enemy;
   let steps=0;while(!battle.result&&steps++<400){const hint=getBattleHint(battle);const action=battle.tactic?.status==='pending'?{type:'tactic',id:'shelter'}:(hint?.action??{type:'end'});if(action.type==='play'){const c=CARDS.find(c=>c.id===battle.player.hand[action.index]);if(c.choices)seasoned++;if(c.ability?.startsWith('steep-'))steeped++}const next=actBattle(battle,action);if(next.error)throw Error(next.error);battle=next.battle}
   if(!battle.result)guards++;else if((battle.result==='win')!==(!!side))wins++;else losses++;rounds+=battle.round;
  }
  results.push({pair:[styles[i],styles[j]],seeds:200,alternatingSides:true,firstDeckWins:wins,firstDeckLosses:losses,guardStops:guards,meanRounds:rounds/200,playerSeasonings:seasoned,playerSteepings:steeped});
 }
 const report={agent:'coach-v1 versus built-in enemy AI; 400-action guard; full ownership suggested decks',scope:'6 pairs × 200 seeds. Unequal agent policies and no human playtest; rates are diagnostic, not competitive balance certification.',decks,results};writeFileSync('dev/docs/major-v400/deck-sampling.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({matches:1200,guardStops:results.reduce((n,r)=>n+r.guardStops,0)}));
}finally{await server.close()}
