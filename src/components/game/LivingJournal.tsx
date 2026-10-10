import { LIVING_CHOICES } from "../../game/livingChoices"
import { isStageUnlocked } from "../../game/story"
import { useGameStore } from "../../game/useGameStore"

export function LivingJournal({ chapter }: { chapter?: string }) {
  const save=useGameStore(s=>s.save)
  const choose=useGameStore(s=>s.chooseLivingPath)
  const busy=!!save.battle && !save.battle.result
  return <section className="living-journal" aria-label="Sổ Chợ Sống">
    <h2>Sổ Chợ Sống</h2><p>Lắng nghe theo cách bạn chọn. Đọc lại không cấp thưởng; kết thúc cũ và bộ bài được giữ.</p>
    {LIVING_CHOICES.filter(c=>!chapter || c.id===chapter).map(c=>{
      const unlocked=isStageUnlocked(c.stage,save.clearedStages,save.storyEnding)
      const decision=save.story400?.decisions?.[c.id]
      return <article key={c.id}><h3>{c.title}</h3>
        {!unlocked ? <p>Hoàn thành phần truyện trước để mở trang này.</p> : <>
          <div className="living-choice-grid">{c.options.map(o=><button type="button" className="tcg-button ghost" key={o.id} disabled={busy} aria-pressed={decision===o.id} onClick={()=>choose(c.id,o.id)}><strong>{o.name}</strong><small>{o.text}</small></button>)}</div>
          {busy && <p>Hoàn thành trận hiện tại trước khi đổi cách kể.</p>}
          {c.options.filter(o=>decision===o.id).map(o=><div className="living-choice-copy" key={o.id}>{o.lines.map((l,i)=><p key={i}><strong>{l.speaker}:</strong> {l.text}</p>)}</div>)}
        </>}
      </article>
    })}
  </section>
}
