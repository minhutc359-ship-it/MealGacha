import { useEffect, useRef, useState } from "react"
import type { RewardInstance } from "../../domain/models"
import { FoodImage } from "../food/FoodImage"

interface Props {
  materials: RewardInstance[]
  result: RewardInstance
  reducedMotion: boolean
  onComplete(): void
}

export function FusionRitual({ materials, result, reducedMotion, onComplete }: Props) {
  const [phase, setPhase] = useState<"materials" | "orbit" | "vortex" | "flash">("materials")
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete
  const finishedRef = useRef(false)
  const finish = () => { if (!finishedRef.current) { finishedRef.current = true; completeRef.current() } }
  useEffect(() => {
    const delays = reducedMotion ? [120, 180] : [600, 1700, 2700, 3100]
    const next = reducedMotion ? ["flash"] : ["orbit", "vortex", "flash"]
    const handles = next.map((item, index) => setTimeout(() => setPhase(item as typeof phase), delays[index]))
    handles.push(setTimeout(() => { if (!finishedRef.current) { finishedRef.current = true; completeRef.current() } }, reducedMotion ? delays[1] : delays[3]))
    return () => handles.forEach(clearTimeout)
  }, [reducedMotion])
  return <div className={`fusion-ritual phase-${phase} rarity-${result.rarity || "common"}`} role="dialog" aria-modal="true" aria-label="Nghi thức dung hợp">
    <div className="fusion-space"><div className="fusion-ring" aria-hidden="true" />
      {materials.map((reward, index) => <div className={`fusion-material material-${index + 1}`} key={reward.id}><FoodImage dishId={reward.dishId} name={reward.dish.name} imageUrl={reward.dish.imageUrl} variant="card" eager /><small>{reward.dish.name}</small></div>)}
      <div className="fusion-center" aria-hidden="true">✦</div><div className="fusion-flash" aria-hidden="true" />
    </div>
    <div className="fusion-caption"><small>FUSION MATERIAL · 3 / 3</small><h2>{phase === "flash" ? "DUNG HỢP HOÀN TẤT" : "HỘI TỤ VỊ GIÁC"}</h2><p>Ba món ăn cùng ngày đang hóa thành một phần thưởng mới.</p><button onClick={finish}>Bỏ qua hoạt cảnh</button></div>
  </div>
}
