let pending: Promise<HTMLImageElement | null> | null = null
/** Optional same-origin branding; missing art must never prevent sharing a result. */
export function loadBrandImage(): Promise<HTMLImageElement | null> {
  return pending ??= new Promise(resolve => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = "/assets/brand/soul-of-meal.webp"
  })
}
