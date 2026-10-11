import { useState } from "react"
import { CARD_MAP } from "../../game/catalog"
import { cardCost, type BattleAction } from "../../game/battle"
import { PRACTICE_LESSONS, practiceAction, practiceBattle, practiceCardName, practiceSolved } from "../../game/practice"
import { frameSounds } from "../../game/audioScore"
import { gameAudio } from "../../infrastructure/audio/gameAudio"

export function PracticeTable() {
  const [lesson,setLesson] = useState(0)
  const [battle,setBattle] = useState(() => practiceBattle(0))
  const [card,setCard] = useState<number | null>(null)
  const [attacker,setAttacker] = useState<string | null>(null)
  const [branch,setBranch] = useState<"first" | "second" | undefined>()
  const [message,setMessage] = useState("")
  const [hint,setHint] = useState(false)
  const current = PRACTICE_LESSONS[lesson], selected = card === null ? null : CARD_MAP[battle.player.hand[card]]
  const solved = practiceSolved(lesson,battle)
  const reset = (next: number) => { setLesson(next);setBattle(practiceBattle(next));setCard(null);setAttacker(null);setBranch(undefined);setMessage("");setHint(false) }
  const act = (action: BattleAction) => {
    const result = practiceAction(battle,action)
    if (result.error) {setMessage(result.error);return}
    setBattle(result.battle);setCard(null);setAttacker(null);setBranch(undefined)
    setMessage(result.frames.at(-1)?.event.label ?? "Đã thực hiện nước đi.")
    const sounds = result.frames.flatMap(frameSounds)
    if (sounds[0]) gameAudio.play(sounds[0].cue)
  }
  const target = (uid: string) => {
    if (attacker) act({type:"attack",uid:attacker,target:uid})
    else if (card !== null) act({type:"play",index:card,target:uid,branch})
    else setMessage("Chọn đồng minh hoặc lá bài trước, rồi chọn mục tiêu.")
  }
  return <section className="practice-table" aria-label="Bàn tập TCG">
    <span className="tcg-kicker">BÀN TẬP · THỬ NƯỚC ĐI THẬT</span><h2>Ba công thức đầu tiên</h2>
    <p>Bài tập riêng: không tiêu xu, không thay bộ bài và không nhận thưởng chiến dịch.</p>
    <div className="practice-tabs">{PRACTICE_LESSONS.map((item,i)=><button key={item.title} aria-pressed={lesson===i} onClick={()=>reset(i)}>{i+1} · {item.title}</button>)}</div>
    <h3>{current.title}</h3><p>{current.goal}</p>
    <div className="practice-enemy"><button onClick={()=>target("hero")} disabled={solved}>Chủ tướng địch · {battle.enemy.health} ý chí</button>{battle.enemy.board.map(u=><button key={u.uid} onClick={()=>target(u.uid)} disabled={solved}>{practiceCardName(u.cardId)} · {u.health} máu · {u.keywords.includes("guard")?"Hộ vệ":"Địch"}</button>)}</div>
    <p>Bạn: {battle.player.health}/{battle.player.maxHealth} ý chí · {battle.player.mana} năng lượng</p>
    <div className="practice-allies">{battle.player.board.map(u=><button key={u.uid} disabled={solved||!u.ready} aria-pressed={attacker===u.uid} onClick={()=>{setAttacker(u.uid);setCard(null);setMessage("Chọn mục tiêu địch cho đòn đánh.")}}>{practiceCardName(u.cardId)} · ⚔{u.attack} · ♥{u.health} · {u.ready?"Sẵn sàng":"Đã đánh"}</button>)}</div>
    <div className="practice-hand">{battle.player.hand.map((id,i)=><button key={`${id}-${i}`} aria-pressed={card===i} disabled={solved} onClick={()=>{setCard(i);setAttacker(null);setBranch(undefined);setMessage(CARD_MAP[id].text)}}>{CARD_MAP[id].name} · {cardCost(battle.player,CARD_MAP[id])} NL</button>)}</div>
    {selected && <div className="practice-selection"><p>{selected.text}</p>{selected.choices?.map((option,i)=><button key={option.label} aria-pressed={branch===(i===0?"first":"second")} onClick={()=>setBranch(i===0?"first":"second")}>{option.label} · {option.text}</button>)}<button disabled={!!selected.choices&&!branch} onClick={()=>act({type:"play",index:card!,target:"hero",branch})}>Xác nhận dùng {selected.name}</button></div>}
    <p role="status" aria-live="polite">{solved?"✓ Đã hoàn thành. Bạn vừa áp dụng đúng luật của trận đấu!":message||"Chọn quân hoặc thẻ để bắt đầu."}</p>
    <div className="practice-actions"><button onClick={()=>setHint(!hint)} aria-expanded={hint}>Gợi ý</button><button onClick={()=>reset(lesson)}>Làm lại bài này</button>{solved&&lesson<2&&<button onClick={()=>reset(lesson+1)}>Bài tiếp theo →</button>}</div>
    {hint&&<p className="practice-hint">{current.hint}</p>}
  </section>
}
