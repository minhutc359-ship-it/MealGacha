export interface BannerConfig {
  id: string
  imageUrl: string
  enabled: boolean
}

// Commit the image in public/assets/banners and update this config to publish a banner.
export const BANNER_CONFIG: BannerConfig = {
  id: "none",
  imageUrl: "",
  enabled: false,
}
