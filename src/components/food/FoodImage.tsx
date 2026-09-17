import { CSSProperties, useState } from "react"
import {
  FoodImageVariant,
  getFoodAssetUrl,
} from "../../infrastructure/assets/foodAssets"

interface Props {
  dishId: string
  name: string
  variant?: FoodImageVariant
  className?: string
  style?: CSSProperties
  eager?: boolean
}

const CATEGORY_FALLBACK = "🍴"

export function FoodImage({
  dishId,
  name,
  variant = "card",
  className = "",
  style,
  eager = false,
}: Props) {
  const [failed, setFailed] = useState(false)
  const src = getFoodAssetUrl(dishId, variant)

  if (!src || failed) {
    return (
      <div
        className={`food-image-fallback ${className}`}
        style={style}
        role="img"
        aria-label={name}
      >
        <span aria-hidden="true">{CATEGORY_FALLBACK}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      width={variant === "thumb" ? 256 : variant === "card" ? 480 : 512}
      height={variant === "card" ? 600 : variant === "thumb" ? 256 : 512}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      onError={() => setFailed(true)}
      className={`food-image ${className}`}
      style={style}
    />
  )
}
