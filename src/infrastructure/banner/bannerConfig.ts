export interface BannerConfig {
  id: string
  imageUrl: string
  enabled: boolean
  eventId?: string
  startsAt?: string
  endsAt?: string
}

export const BANNER_CONFIG: BannerConfig = {
  "id": "soul-of-meal-release",
  "imageUrl": "/assets/brand/soul-of-meal.webp",
  "enabled": true
}
