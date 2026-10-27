import type { PlaceAffordance } from "../../src/aw2/world/placeAffordance"

/** Static presentation only; the native Places panel supplies the same explanation. */
export function PlaceCue({ value }: { value?: PlaceAffordance }) {
  if (!value) return null
  return (
    <span
      className="aw2-place-cue"
      data-place-state={value.state}
      role="img"
      aria-label={value.label}
      title={value.detail}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        {value.symbol === "door" ? (
          <path d="M4 21V3h13v18M8 21V6l9-3M13 13h1M2 21h19" />
        ) : value.symbol === "lock" ? (
          <>
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
          </>
        ) : value.symbol === "check" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m7 12 3 3 7-7" />
          </>
        ) : value.symbol === "kitchen" ? (
          <path d="M3 12h18c0 5-4 8-9 8s-9-3-9-8ZM7 9V4m5 5V2m5 7V4M7 22h10" />
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m9 7 6 5-6 5" />
          </>
        )}
      </svg>
      <span className="aw2-place-cue-text" aria-hidden="true">
        {value.label}
      </span>
    </span>
  )
}

/** Run after projection. Hide whole labels instead of clipping or shifting their anchor. */
export function hideOverlappingPlaceCues(labels: Iterable<HTMLSpanElement>) {
  const occupied: DOMRect[] = []
  for (const label of labels) {
    if (
      label.style.visibility !== "visible" ||
      !label.querySelector("[data-place-state]")
    )
      continue
    const bounds = label.getBoundingClientRect()
    if (
      occupied.some(
        (other) =>
          bounds.left < other.right + 3 &&
          bounds.right > other.left - 3 &&
          bounds.top < other.bottom + 3 &&
          bounds.bottom > other.top - 3,
      )
    )
      label.style.visibility = "hidden"
    else occupied.push(bounds)
  }
}
