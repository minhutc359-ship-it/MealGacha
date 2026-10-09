import { AUTO_SCHOOLS, PROFESSIONS } from "../../game/autochess/catalog"

export const SCHOOL_ICONS: Record<string, string> = { ember: "♨", tide: "≈", grove: "❧", hearth: "⌂", sugar: "✿" }
const PROFESSION_ICONS: Record<string, string> = { keeper: "⚒", traveler: "➶", storyteller: "✎" }
export function traitTier(count: number, steps: readonly number[]) {
  return ["inactive", "bronze", "silver", "gold"][Math.min(3, steps.filter(step => count >= step).length)]
}
export function AutoTraits({ counts, expanded, onToggle, onDetails }: {
  counts: Record<string, number>; expanded: boolean; onToggle: () => void; onDetails: () => void
}) {
  const traits = [...Object.entries(AUTO_SCHOOLS).map(([id, def]) => ({ id, ...def, icon: SCHOOL_ICONS[id], steps: [2, 4] })),
    ...Object.entries(PROFESSIONS).map(([id, def]) => ({ id, ...def, color: "#d2c0a2", icon: PROFESSION_ICONS[id], steps: [2, 3] }))]
    .filter(trait => (counts[trait.id] ?? 0) > 0)
    .sort((a, b) => b.steps.filter(step => counts[b.id] >= step).length - a.steps.filter(step => counts[a.id] >= step).length || counts[b.id] - counts[a.id])
  return <aside className={`ac-trait-rail ${expanded ? "is-open" : ""}`} aria-label="Tộc hệ đội hình">
    <button className="ac-trait-toggle" aria-expanded={expanded} aria-controls="ac-team-traits" onClick={onToggle} title="Mở/thu gọn tộc hệ">{expanded ? "‹" : "›"}<span>Tộc & nghề</span></button>
    <div id="ac-team-traits" className="ac-trait-list">
      {traits.map(trait => {
        const count = counts[trait.id], next = trait.steps.find(step => step > count) ?? trait.steps.at(-1)!
        return <button key={trait.id} className={`ac-trait-chip is-${traitTier(count, trait.steps)}`} data-trait={trait.id}
          title={`${trait.name}: ${count}/${next}. ${trait.text}`} aria-label={`${trait.name}, ${count}/${next}, ${traitTier(count, trait.steps) === "inactive" ? "chưa kích hoạt" : "đã kích hoạt"}`} onClick={expanded ? onDetails : onToggle}>
          <i style={{ color: trait.color }}>{trait.icon}</i><b>{count}</b><span><strong>{trait.name} · {count}/{next}</strong><small>{trait.text}</small></span>
        </button>
      })}
    </div>
    <button className="ac-trait-details" onClick={onDetails} aria-label="Chi tiết hệ và tỉ lệ cửa hàng">?<span>Hiệu ứng & tỉ lệ</span></button>
  </aside>
}
