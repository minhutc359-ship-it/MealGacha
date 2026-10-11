import { useEffect, useRef, useState } from "react"
import { createAutoRun, move, unitRole, traitCounts, boardPieces } from "../../game/autochess/economy"
import { createCombat, advanceCombat } from "../../game/autochess/combat"
import { AUTO_SCHOOLS, PROFESSIONS, UNIT_MAP } from "../../game/autochess/catalog"
import type { AutoRun } from "../../game/autochess/types"

function example() {
  const run = createAutoRun("campaign",410,"practice","practice-auto")
  run.scene = null
  run.roster.forEach(p=>{p.cell=null})
  return run
}
export function AutoPractice() {
  const [run,setRun] = useState(example)
  const [selected,setSelected] = useState<string | null>(null)
  const [message,setMessage] = useState("")
  const [simulation,setSimulation] = useState<AutoRun | null>(null)
  const live = useRef<AutoRun | null>(null)
  useEffect(()=>{
    if(!simulation || simulation.phase !== "combat") return
    live.current = simulation
    const timer = setInterval(()=>{
      const current = live.current
      if(!current) return
      // Fast sample; the engine and RNG remain the real game rules.
      if(current.combat?.pendingScene) current.combat.pendingScene = null
      const next = advanceCombat(current,40)
      live.current = next
      if(next.combat?.result || (next.combat?.tick ?? 0)>=2400) {clearInterval(timer);setSimulation(next);live.current=null}
    },20)
    return ()=>{clearInterval(timer);live.current=null}
  },[simulation])
  const traits = traitCounts(boardPieces(run)), running=simulation?.phase === "combat" && !simulation.combat?.result && (simulation.combat?.tick ?? 0)<2400
  const place=(cell:number)=>{
    if(!selected || running) return
    const next=structuredClone(run), error=move(next,selected,cell)
    if(error){setMessage(error);return}
    setRun(next);setSimulation(null)
    const piece=next.roster.find(p=>p.uid===selected)!, role=unitRole(piece.id)
    setMessage(role === "Đỡ đòn" ? cell<24?"Đỡ đòn đã đứng hàng trước. Đặt tầm xa và hồi phục phía sau.":"Thử đưa quân đỡ đòn lên hàng trước để che cho đồng đội." : cell>=24?`${role} đã ở phía sau. Hãy quan sát khi thử trận mẫu.`:"Tầm xa và hồi phục thường cần tuyến trước bảo vệ. Thử lùi một hàng.")
  }
  return <section className="auto-practice" aria-label="Bàn tập xếp đội Auto">
    <h3>Thử xếp một mâm đầu tiên</h3><p>Bàn tập riêng, không dùng vàng hoặc ý chí của phiên đang chơi. Chọn quân rồi chọn ô; ba hàng phía bạn có 18 ô.</p>
    <div className="practice-hand">{run.roster.map(p=><button key={p.uid} aria-pressed={selected===p.uid} disabled={running} onClick={()=>setSelected(p.uid)}><strong>{UNIT_MAP[p.id].name}</strong><small>{unitRole(p.id)} · {PROFESSIONS[UNIT_MAP[p.id].profession].name}</small></button>)}</div>
    <p>↑ Phe địch · hàng trên cùng là tuyến trước</p>
    <div className="auto-practice-grid">{Array.from({length:18},(_,i)=>i+18).map(cell=>{const p=run.roster.find(p=>p.cell===cell);return <button key={cell} disabled={!selected||running} aria-label={`Ô tập ${cell}, ${p?UNIT_MAP[p.id].name:"trống"}`} onClick={()=>place(cell)}>{p?UNIT_MAP[p.id].name:"·"}</button>})}</div>
    <p role="status">{message||"Chọn Cơm tấm rồi đặt vào hàng trước; Phở bò và Bánh cuốn đứng sau."}</p>
    <p>{Object.entries(traits).map(([key,count])=>`${AUTO_SCHOOLS[key as keyof typeof AUTO_SCHOOLS]?.name ?? PROFESSIONS[key as keyof typeof PROFESSIONS]?.name}: ${count}`).join(" · ")||"Hệ và nghề sẽ hiện khi quân lên bàn."}</p>
    <button disabled={running||boardPieces(run).length!==3} onClick={()=>{const sample=structuredClone(run);sample.phase="combat";sample.combat=createCombat(sample);setSimulation(sample)}}>{running?"Đang mô phỏng nhanh…":"Thử trận mẫu bằng luật thật"}</button>
    <button disabled={running} onClick={()=>{setRun(example());setSimulation(null);setSelected(null);setMessage("")}}>Xếp lại từ đầu</button>
    {simulation&&!running&&<div aria-live="polite"><p>{simulation.combat?.result === "win"?"✓ Đội giữ được bàn mẫu.":simulation.combat?.result === "loss"?"Đội chưa giữ được bàn mẫu. Thử đổi vị trí rồi chạy lại cùng seed.":"Mẫu chưa phân thắng thua sau 120 giây giao chiến. Thử một cách xếp khác."} Không có phần thưởng hoặc thay đổi tiến trình.</p><p>{Math.round((simulation.combat?.tick??0)/20)} giây giao chiến · {simulation.combat?.actors.filter(a=>a.side==="ally"&&a.hp>0).length} đồng minh còn sống</p></div>}
  </section>
}
