import { AUTO_SCHOOLS, UNIT_MAP, MONSTER_MAP, SKILL_LABELS } from "../../game/autochess/catalog"
import { ITEM_MAP } from "../../game/autochess/items"
import type { Actor, Piece } from "../../game/autochess/types"
import { AutoPortrait, AutoMonsterPortrait } from "./AutoArt"

export function QuickUnitInfo({ id, piece, actor }: { id: string; piece?: Piece; actor?: Actor }) {
  const def = UNIT_MAP[id] ?? MONSTER_MAP[id]
  if (!def) return null
  const star = piece?.star ?? actor?.star ?? 1
  return <section className="ac-quick-info" role="tooltip" aria-live="polite" style={{ borderColor: AUTO_SCHOOLS[def.school].color }}>
    <header>
      {UNIT_MAP[id] ? <AutoPortrait index={UNIT_MAP[id].portrait} /> : <AutoMonsterPortrait id={id} label={def.name} />}
      <div><small>{AUTO_SCHOOLS[def.school].name}</small><strong>{def.name}</strong><b>{"★".repeat(star)}</b></div>
    </header>
    <div className="ac-quick-stats"><span>♥ {actor ? `${actor.hp}/${actor.maxHp}` : Math.round(def.hp * [1, 1.7, 2.9][star - 1])}</span><span>⚔ {Math.round(actor?.attack ?? def.attack * [1, 1.5, 2.25][star - 1])}</span><span>◈ {actor?.armor ?? def.armor}</span><span>Tầm {def.range}</span></div>
    <strong>{SKILL_LABELS[def.skill]}</strong><p>{def.text}</p>
    {!!piece?.items.length && <small>{piece.items.map(item => ITEM_MAP[item]?.name).join(" · ")}</small>}
    <footer>Thả tay để đóng · kéo ngay để xếp quân</footer>
  </section>
}
