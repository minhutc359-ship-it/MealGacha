import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { BANNER_CONFIG, BannerConfig } from "../../infrastructure/banner/bannerConfig"
import { repository } from "../../infrastructure/storage/repository"
import { getAnnouncementEvent } from "../../domain/events"
import { useAppStore } from "../../store/useAppStore"

function AnnouncementDialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current!, previous = document.activeElement as HTMLElement | null
    el.showModal()
    el.querySelector<HTMLButtonElement>('button')?.focus({preventScroll: true})
    return () => { el.close(); if (previous?.isConnected) previous.focus({preventScroll: true}) }
  }, [])
  return <dialog ref={ref} className="announcement-banner-backdrop" aria-label="Thông báo mới" onKeyDown={e => {
    if (e.key !== 'Tab') return
    const controls = [...e.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled)')]
    const first = controls[0], last = controls.at(-1)
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
  }} onCancel={e => { e.preventDefault(); onClose() }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>{children}</dialog>
}

interface AnnouncementContent {
  id: string
  imageUrl: string
  title?: string
  eventId?: string
}

function getBannerConfig(): BannerConfig {
  if (import.meta.env.DEV) return repository.loadBannerOverride() ?? BANNER_CONFIG
  return BANNER_CONFIG
}

function getDismissKey(bannerId: string): string {
  return `foodchest.banner.dismissed.${bannerId}`
}

export function AnnouncementBanner() {
  const dishes = useAppStore((state) => state.dishes)
  const [banner, setBanner] = useState<AnnouncementContent | null>(null)
  const [visible, setVisible] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const dismissedThisVisit = useRef(new Set<string>())

  useEffect(() => {
    const refresh = () => {
      const configured = getBannerConfig()
      const now = new Date()
      const event = getAnnouncementEvent(dishes, now)
      const fallbackActive = configured.imageUrl && !configured.eventId &&
        (!configured.startsAt || now >= new Date(configured.startsAt)) &&
        (!configured.endsAt || now <= new Date(configured.endsAt))
      const next: AnnouncementContent | null = !configured.enabled ? null : event?.bannerImage
        ? { id: `event-${event.id}-${event.startsAt ?? "always"}`, imageUrl: event.bannerImage, title: event.title, eventId: event.id }
        : fallbackActive ? { id: configured.id, imageUrl: configured.imageUrl } : null
      setBanner(next)
      setVisible(Boolean(next && !dismissedThisVisit.current.has(next.id) && localStorage.getItem(getDismissKey(next.id)) !== "true"))
    }

    refresh()
    const interval = window.setInterval(refresh, 60_000)
    window.addEventListener("storage", refresh)
    window.addEventListener("mealgacha:event-preview-changed", refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("storage", refresh)
      window.removeEventListener("mealgacha:event-preview-changed", refresh)
    }
  }, [dishes])

  if (!visible || !banner) return null

  const closeBanner = () => {
    dismissedThisVisit.current.add(banner.id)
    if (dontShowAgain) localStorage.setItem(getDismissKey(banner.id), "true")
    setDontShowAgain(false)
    setVisible(false)
  }

  return createPortal(
    <AnnouncementDialog onClose={closeBanner}>
      <div className={`announcement-banner-panel ${banner.eventId ? "is-event" : ""}`}>
        <div className="announcement-banner-visual">
          <img src={banner.imageUrl} alt={banner.title ? `Ảnh sự kiện ${banner.title}` : "Thông báo mới"} />
          {banner.title && <div className="announcement-banner-heading"><small>✦ SỰ KIỆN ĐANG DIỄN RA</small><h2>{banner.title}</h2></div>}
        </div>
        <div className="announcement-banner-actions">
          <Link to={banner.eventId ? `/chest?event=${encodeURIComponent(banner.eventId)}` : "/events"} onClick={closeBanner}>{banner.eventId ? "Mở rương sự kiện →" : "Xem sự kiện →"}</Link>
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
    </AnnouncementDialog>,
    document.body,
  )
}
