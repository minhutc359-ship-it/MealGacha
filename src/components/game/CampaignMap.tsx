import { useId } from "react"
import { CHAPTERS, isStageUnlocked } from "../../game/story"
import { SCHOOLS } from "../../game/catalog"

const STOPS = [
  { left: "19%", top: "22%" }, { left: "18%", top: "76%" },
  { left: "49%", top: "40%" }, { left: "62%", top: "76%" },
  { left: "79%", top: "44%" }, { left: "81%", top: "17%" },
]
const ROUTE = "M190 220 C105 385 105 600 180 760 C285 760 385 575 490 400 C565 465 625 610 620 760 C705 720 765 580 790 440 C825 335 830 235 810 170"

function LivingMapArt() {
  const id = useId().replace(/:/g, "")
  return <svg className="tcg-world-map-art" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-sea`} x2="1" y2="1"><stop stopColor="#214f58"/><stop offset="1" stopColor="#112f42"/></linearGradient>
      <linearGradient id={`${id}-land`} x2="0" y2="1"><stop stopColor="#91a574"/><stop offset="1" stopColor="#526e55"/></linearGradient>
    </defs>
    <rect width="1000" height="1000" fill={`url(#${id}-sea)`}/>
    <path d="M30 40Q260-30 445 90T960 40L980 305Q835 390 800 515T970 870L960 970Q685 1030 545 885T205 930L30 900Q100 685 45 485Z" fill={`url(#${id}-land)`} stroke="#c8c9a0" strokeWidth="8"/>
    <path d="M340 0Q280 145 390 250T355 515T330 790L490 1000" fill="none" stroke="#3a7880" strokeWidth="55"/>
    <path d="M340 0Q280 145 390 250T355 515T330 790L490 1000" fill="none" stroke="#99c0b0" strokeWidth="4" strokeDasharray="22 30"/>
    {[{x:80,y:370},{x:230,y:430},{x:580,y:145},{x:700,y:585},{x:870,y:680}].map(({x,y})=><g key={x} transform={`translate(${x} ${y})`} fill="#30584b" stroke="#acc097" strokeWidth="3"><path d="M0 70 40-25 80 70Z"/><path d="M45 85 90-40 140 85Z"/></g>)}
    <g transform="translate(105 170)" stroke="#4c4e3d" strokeWidth="4">
      <path d="M-15 40 65-25 145 40Z" fill="#bd835f"/><rect x="0" y="40" width="130" height="70" fill="#dfc798"/>
      <path d="M20 40v70m45-70v70m45-70v70"/><path d="M-15 40h160" stroke="#f1d89b" strokeWidth="12"/>
    </g>
    <g transform="translate(90 720)" stroke="#d6c59b" strokeWidth="8" fill="none"><path d="M0 30h200M45 0v120m70-120v120m60-120v120"/><path d="M25 150q65 35 140-10l-25 55H65Z" fill="#936849"/></g>
    <g transform="translate(415 285)"><rect x="10" y="50" width="135" height="80" fill="#d5bd87"/><path d="M-10 50 80-10l90 60Z" fill="#825c50"/><rect x="60" y="85" width="35" height="45" fill="#765842"/><circle cx="145" cy="-15" r="16" fill="#eed092"/><path d="M145 0v40" stroke="#654c3c" strokeWidth="4"/></g>
    <g fill="#d9e3cc" opacity=".6"><path d="M470 680q45-65 100-15 40-40 90 10 30-35 70 5v65H470Z"/><path d="M680 390q40-65 95-15 45-40 100 5v70H680Z"/><path d="M680 60q45-35 70 5 65-45 120 20v70H680Z"/></g>
    <g stroke="#91b8b4" opacity=".4" fill="none" strokeWidth="3"><path d="M70 970h160m440-60h180m-35-385h140M515 80h110"/></g>
    <rect x="12" y="12" width="976" height="976" rx="10" fill="none" stroke="#e0d2a0" strokeWidth="3"/>
  </svg>
}

type Props = {
  region: number
  onRegion: (region: number) => void
  selected: number
  onChapter: (index: number) => void
  cleared: string[]
  ending?: "remember" | "release" | null
}
export function CampaignMap({ region, onRegion, selected, onChapter, cleared, ending }: Props) {
  const start = region * 6
  const stages = CHAPTERS.slice(start, start + 6).flatMap(ch => ch.stages)
  const progress = stages.filter(s => cleared.includes(s.id)).length / stages.length * 100
  return <>
    <div className="tcg-map-regions" role="group" aria-label="Chọn miền bản đồ">
      <button type="button" aria-pressed={region === 0} onClick={() => onRegion(0)}>Miền ký ức · 01–06</button>
      <button type="button" aria-pressed={region === 1} onClick={() => onRegion(1)}>Chợ Sống · 07–12</button>
    </div>
    <div className={`tcg-world-map ${region === 1 ? "tcg-living-map" : ""}`} aria-label={region === 0 ? "Bản đồ chương 1 đến 6" : "Bản đồ chương 7 đến 12"}>
      {region === 0 ? <img className="tcg-world-map-art" src="/assets/tcg/map/meal-world-map.webp" alt="" width="1024" height="1024" decoding="async"/> : <LivingMapArt/>}
      <div className="tcg-world-map-shade" aria-hidden="true"/>
      <svg className="tcg-world-map-route" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <path className="tcg-route-underlay" pathLength="100" d={ROUTE}/>
        <path className="tcg-route-progress" pathLength="100" d={ROUTE} style={{strokeDasharray: `${region === 1 ? progress * .5 : progress} 100`}}/>
      </svg>
      {STOPS.map((style, i) => {
        const index = start + i
        const ch = CHAPTERS[index]
        const unlocked = !!ch && isStageUnlocked(ch.stages[0].id, cleared, ending)
        const count = ch?.stages.filter(s => cleared.includes(s.id)).length ?? 0
        const complete = !!ch && count === ch.stages.length
        return <button type="button" key={index} style={style}
          className={`tcg-map-stop ${!ch ? "is-coming-soon" : complete ? "is-complete" : unlocked ? "is-current" : "is-locked"}`}
          disabled={!unlocked} aria-current={selected === index ? "location" : undefined}
          aria-label={!ch ? `Chương ${index + 1}: Coming soon` : `Đến chương ${index + 1}: ${ch.title}, ${unlocked ? `${count}/${ch.stages.length} chặng đã vượt qua` : "chưa mở"}`}
          onClick={() => { if (unlocked) onChapter(index) }}>
          <span className="tcg-map-pin">{!ch ? "…" : complete ? "✓" : unlocked ? SCHOOLS[ch.school].symbol : "◇"}</span>
          <span className="tcg-map-stop-label"><small>CHƯƠNG {String(index + 1).padStart(2, "0")}</small><strong>{!ch ? "Coming soon" : ch.title}</strong></span>
        </button>
      })}
    </div>
  </>
}
