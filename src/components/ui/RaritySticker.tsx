import { RewardRarity } from "../../domain/models"

const PRICE_LABELS = ["N", "R", "SR", "UR"]

export function getPriceSticker(priceTier?: 1 | 2 | 3 | 4): string {
  return PRICE_LABELS[Math.min(Math.max((priceTier ?? 1) - 1, 0), 3)]
}

export function RaritySticker({
  priceTier,
  rarity,
}: {
  priceTier?: 1 | 2 | 3 | 4
  rarity: RewardRarity
}) {
  return (
    <span className={`rarity-sticker rarity-sticker-${rarity}`} aria-label={`Bậc ${getPriceSticker(priceTier)}`}>
      {getPriceSticker(priceTier)}
    </span>
  )
}