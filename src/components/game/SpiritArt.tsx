import {useEffect, useRef, useState} from "react"
import { spiritArt, SPIRIT_SKILLS } from "../../game/adventureRpg/spiritArt"
export function SpiritArt({id, className = "", label}: {id: string; className?: string; label?: string}) {
 const node = useRef<HTMLSpanElement>(null), [visible,setVisible] = useState(false)
 useEffect(()=>{const observer = new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setVisible(true);observer.disconnect()}},{rootMargin:"160px"});if(node.current) observer.observe(node.current);return ()=>observer.disconnect()},[])
 const art = spiritArt(id)
 return <span ref={node} className={`rpg-spirit-art ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} ><span className="rpg-spirit-image" style={art && visible ? {backgroundImage: `url(${art.path})`, backgroundPosition: `${art.cell % 4 * 100 / 3}% ${Math.floor(art.cell / 4) * 100 / 3}%`} : undefined} /></span>
}
export function SkillArt({index}: {index: number}) {
 return <span className="rpg-skill-art" aria-hidden="true" style={{backgroundImage: `url(${SPIRIT_SKILLS})`, backgroundPosition: `${index % 8 * 100 / 7}% ${Math.floor(index / 8) * 100 / 7}%`}} />
}
