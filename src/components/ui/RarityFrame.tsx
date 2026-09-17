import { ReactNode } from "react"
import { RewardRarity } from "../../domain/models"

export const RARITY_LABELS: Record<RewardRarity, string> = {
  common: "Phổ biến",
  rare: "Hiếm",
  epic: "Sử thi",
  diamond: "Kim cương",
}

export function RarityFrame({
  rarity = "common",
  children,
  className = "",
}: {
  rarity?: RewardRarity
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rarity-frame rarity-${rarity} ${className}`}>
      {children}
    </div>
  )
}
