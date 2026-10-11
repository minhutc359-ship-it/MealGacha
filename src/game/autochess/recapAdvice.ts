import { UNIT_MAP } from "./catalog"
import type { AutoRun } from "./types"

/** Evidence from the completed combat, not a claim about optimal builds. */
export function recapAdvice(run: AutoRun): Array<{title:string;text:string}> {
  const combat = run.combat
  if (!combat?.recap || !run.lastResult) return []
  const allies = combat.actors.filter(actor=>actor.side === "ally")
  const enemies = combat.actors.filter(actor=>actor.side === "enemy"&&actor.hp>0)
  const ranked = allies.map(actor=>({actor,stats:combat.recap![actor.uid]})).filter(row=>row.stats).sort((a,b)=>b.stats.damage-a.stats.damage)
  const result: Array<{title:string;text:string}> = []
  if (ranked[0]) {
    const top=ranked[0]
    result.push({title:"Nguồn sát thương chính",text:`${UNIT_MAP[top.actor.id]?.name ?? top.actor.id} gây ${Math.round(top.stats.damage)} sát thương máu. Thử bảo vệ quân này bằng tuyến trước; số này không gồm sát thương bị chắn.`})
  }
  const noCast = allies.filter(actor=>actor.casts===0&&actor.hp<=0)
  if(noCast.length) result.push({title:"Chưa kịp tung kỹ năng",text:`${noCast.map(a=>UNIT_MAP[a.id]?.name ?? a.id).slice(0,3).join(", ")} bị hạ trước khi tung kỹ năng. Thử lùi quân tầm xa/hồi phục, tăng chống chịu tuyến trước hoặc chọn nguồn mana phù hợp.`})
  else if(enemies.length) result.push({title:"Địch còn giữ bàn",text:`Còn ${enemies.length} quân địch sau trận. Thử tập trung sát thương vào một cánh và xem chiêu boss trước khi dàn đội; đây là gợi ý để thử lại, không tự đổi đội hình.`})
  const support = ranked.find(row=>row.stats.healing+row.stats.blocked>0)
  if(support) result.push({title:"Một điểm tựa của đội",text:`${UNIT_MAP[support.actor.id]?.name ?? support.actor.id} hồi ${Math.round(support.stats.healing)} máu và đỡ ${Math.round(support.stats.blocked)} sát thương bằng chắn. So sánh sau khi đổi vị trí để biết đội có trụ lâu hơn không.`})
  return result.slice(0,3)
}
