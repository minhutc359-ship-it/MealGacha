import { useEffect, useState } from "react"
import { BANNER_CONFIG, BannerConfig } from "../../infrastructure/banner/bannerConfig"
import { repository } from "../../infrastructure/storage/repository"

function getBannerConfig(): BannerConfig {
  if (import.meta.env.DEV) return repository.loadBannerOverride() ?? BANNER_CONFIG
  return BANNER_CONFIG
}

function getDismissKey(bannerId: string): string {
  return `foodchest.banner.dismissed.${bannerId}`
}

export function AnnouncementBanner() {
  const [banner, setBanner] = useState<BannerConfig>(() => getBannerConfig())
  const [visible, setVisible] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    const nextBanner = getBannerConfig()
    setBanner(nextBanner)
    if (!nextBanner.enabled || !nextBanner.imageUrl) return
    setVisible(localStorage.getItem(getDismissKey(nextBanner.id)) !== "true")
  }, [])

  if (!visible || !banner.enabled || !banner.imageUrl) return null

  const closeBanner = () => {
    if (dontShowAgain) localStorage.setItem(getDismissKey(banner.id), "true")
    setVisible(false)
  }

  return (
    <div className="announcement-banner-backdrop" role="dialog" aria-modal="true" aria-label="Thông báo mới">
      <div className="announcement-banner-panel">
        <img src={banner.imageUrl} alt="Thông báo mới" />
        <div className="announcement-banner-actions">
          <label>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.target.checked)}
            />
            không hiển thị lại lần sau
          </label>
          <button onClick={closeBanner} aria-label="Tắt thông báo">×</button>
        </div>
      </div>
    </div>
  )
}