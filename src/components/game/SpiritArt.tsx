import {useEffect, useRef, useState} from "react"
import { spiritArt, SPIRIT_SKILLS } from "../../game/adventureRpg/spiritArt"
const AWAKENING_MEDIA = "/assets/rpg/awakening530"
export function SpiritArt({id, className = "", label}: {id: string; className?: string; label?: string}) {
 const node = useRef<HTMLSpanElement>(null), [visible,setVisible] = useState(false)
 useEffect(()=>{const observer = new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setVisible(true);observer.disconnect()}},{rootMargin:"160px"});if(node.current) observer.observe(node.current);return ()=>observer.disconnect()},[])
 const art = spiritArt(id)
 return <span ref={node} className={`rpg-spirit-art ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} ><span className="rpg-spirit-image" style={art && visible ? {backgroundImage: `url(${art.path})`, backgroundPosition: `${art.cell % 4 * 100 / 3}% ${Math.floor(art.cell / 4) * 100 / 3}%`} : undefined} /></span>
}
export function SkillArt({index}: {index: number}) {
 if(index >= 64) {const cell=index-64;return <span className="rpg-skill-art is-awakened" aria-hidden="true" style={{backgroundImage:`url(${AWAKENING_MEDIA}/sigils.webp)`,backgroundSize:"1200% 1200%",backgroundPosition:`${cell % 12 * 100 / 11}% ${Math.floor(cell / 12) * 100 / 11}%`}} />}
 return <span className="rpg-skill-art" aria-hidden="true" style={{backgroundImage: `url(${SPIRIT_SKILLS})`, backgroundPosition: `${index % 8 * 100 / 7}% ${Math.floor(index / 8) * 100 / 7}%`}} />
}
