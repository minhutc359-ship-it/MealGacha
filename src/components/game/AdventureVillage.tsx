import { useEffect, useRef, useState } from "react"
import {
  ADVENTURE_VILLAGE_PLACES,
  nearbyVillagePlace,
  type AdventureHomeTab,
  type AdventureVillagePlace,
} from "../../game/adventureV560"
import type { RpgSave } from "../../game/adventureRpg/types"
import { VillageParty } from "./VillageParty"

type Point = {
  x: number
  y: number
}
const START: Point = { x: 50, y: 84 }

export function AdventureVillage({
  save,
  quiet,
  onVisit,
}: {
  save: RpgSave
  quiet: boolean
  onVisit: (tab: Exclude<AdventureHomeTab, "village">, name: string) => void
}) {
  const map = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<Point>(START)
  const [destination, setDestination] = useState<AdventureVillagePlace | null>(
    null,
  )
  const [flip, setFlip] = useState(false)

  useEffect(() => {
    if (!destination) return
    const handle = window.setTimeout(
      () => {
        const next = destination
        setDestination(null)
        onVisit(next.id, next.name)
      },
      quiet ? 120 : 820,
    )
    return () => clearTimeout(handle)
  }, [destination, onVisit, quiet])

  const walkTo = (point: Point, place = nearbyVillagePlace(point)) => {
    setFlip(point.x < position.x)
    setPosition({
      x: Math.max(8, Math.min(92, point.x)),
      y: Math.max(17, Math.min(88, point.y)),
    })
    setDestination(place ?? null)
  }
  const pointerWalk = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return
    const rect = map.current?.getBoundingClientRect()
    if (!rect) return
    walkTo({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    })
  }
  return (
    <section className="rpg-village-screen" aria-label="Làng Giao Ước">
      <header className="rpg-village-title">
        <div>
          <small>ADVENTURE · CHẠM ĐỂ DI CHUYỂN</small>
          <h1>Làng Giao Ước</h1>
          <p>
            Đi cùng hai Vị Linh tới địa điểm muốn mở. Chạm biển địa điểm để dẫn
            đường nhanh.
          </p>
        </div>
        <span>Đội hiện tại · {save.formation.length}/5</span>
      </header>
      <div
        ref={map}
        className={`rpg-village-map ${destination ? "is-walking" : ""}`}
        onPointerDown={pointerWalk}
        onKeyDown={(event) => {
          const delta: Record<string, Point> = {
            ArrowUp: { x: 0, y: -7 },
            ArrowDown: { x: 0, y: 7 },
            ArrowLeft: { x: -7, y: 0 },
            ArrowRight: { x: 7, y: 0 },
          }
          const move = delta[event.key]
          if (!move) return
          event.preventDefault()
          walkTo({ x: position.x + move.x, y: position.y + move.y })
        }}
        tabIndex={0}
        role="region"
        aria-label="Bản đồ làng. Chạm hoặc dùng phím mũi tên để đi."
        style={
          {
            "--touch-x": `${position.x}%`,
            "--touch-y": `${position.y}%`,
          } as React.CSSProperties
        }
      >
        <img
          className="rpg-village-art"
          src="/assets/rpg/village580/crossroads.webp"
          alt=""
          width="960"
          height="960"
          decoding="async"
        />
        <div className="rpg-village-vignette" />
        <svg
          className="rpg-village-paths"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M50 88Q43 69 24 72M50 88Q58 69 76 73M50 88Q36 57 21 32M50 88Q65 57 77 29" />
        </svg>
        {ADVENTURE_VILLAGE_PLACES.map((place) => (
          <button
            key={place.id}
            type="button"
            className={`rpg-village-place place-${place.id} ${
              destination?.id === place.id ? "is-destination" : ""
            }`}
            style={{ left: `${place.x}%`, top: `${place.y}%` }}
            onClick={() => walkTo(place, place)}
          >
            <b>{place.symbol}</b>
            <span>
              <strong>{place.name}</strong>
              <small>{place.hint}</small>
            </span>
          </button>
        ))}
        <div
          className="rpg-village-party"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        >
          <VillageParty
            moving={!!destination}
            flip={flip}
            quiet={quiet}
            stamp={`village:${destination?.id ?? "idle"}`}
          />
        </div>
        <div className="rpg-village-touch-hint" aria-hidden="true">
          ◎ CHẠM ĐƯỜNG ĐI
        </div>
      </div>
    </section>
  )
}
