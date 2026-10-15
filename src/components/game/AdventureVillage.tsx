import { useEffect, useRef, useState } from "react"
import {
  ADVENTURE_VILLAGE_PLACES,
  nearbyVillagePlace,
  type AdventureHomeTab,
  type AdventureVillagePlace,
} from "../../game/adventureV560"
import type { RpgSave } from "../../game/adventureRpg/types"
import { VillageParty } from "./VillageParty"

type Point = { x: number; y: number }
type Direction = "up" | "down" | "left" | "right"
type Trip = {
  token: number
  duration: number
  place: AdventureVillagePlace | null
}

const START: Point = { x: 50, y: 84 }
const clampPoint = ({ x, y }: Point): Point => ({
  x: Math.max(8, Math.min(92, x)),
  y: Math.max(17, Math.min(88, y)),
})

export function AdventureVillage({
  save,
  quiet,
  onVisit,
}: {
  save: RpgSave
  quiet: boolean
  onVisit: (tab: Exclude<AdventureHomeTab, "village">, name: string) => void
}) {
  const world = useRef<HTMLDivElement>(null)
  const tripToken = useRef(0)
  const [position, setPosition] = useState<Point>(START)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [direction, setDirection] = useState<Direction>("up")

  useEffect(() => {
    if (!trip) return
    const handle = window.setTimeout(() => {
      setTrip((active) => (active?.token === trip.token ? null : active))
      if (trip.place) onVisit(trip.place.id, trip.place.name)
    }, trip.duration)
    return () => clearTimeout(handle)
  }, [onVisit, trip])

  const walkTo = (
    requested: Point,
    place = nearbyVillagePlace(requested),
  ) => {
    const point = clampPoint(requested)
    const dx = point.x - position.x
    const dy = point.y - position.y
    const distance = Math.hypot(dx * 1.5, dy)
    if (Math.abs(dx) > Math.abs(dy) * 0.72)
      setDirection(dx < 0 ? "left" : "right")
    else if (Math.abs(dy) > 0.5) setDirection(dy < 0 ? "up" : "down")
    const duration = quiet
      ? 120
      : Math.round(Math.max(280, Math.min(1150, distance * 12)))
    setPosition(point)
    setTrip({ token: ++tripToken.current, duration, place: place ?? null })
  }

  const pointerWalk = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return
    const rect = world.current?.getBoundingClientRect()
    if (
      !rect ||
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      return
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
        className={`rpg-village-map ${trip ? "is-walking" : ""}`}
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
      >
        <img
          className="rpg-village-backdrop"
          src="/assets/rpg/village580/crossroads.webp"
          alt=""
          aria-hidden="true"
        />
        <div
          ref={world}
          className="rpg-village-world"
          style={
            {
              "--touch-x": `${position.x}%`,
              "--touch-y": `${position.y}%`,
              "--travel-ms": `${trip?.duration ?? 0}ms`,
            } as React.CSSProperties
          }
        >
          <img
            className="rpg-village-art"
            src="/assets/rpg/village580/crossroads.webp"
            alt=""
            width="1536"
            height="1024"
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
                trip?.place?.id === place.id ? "is-destination" : ""
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
            className={`rpg-village-party facing-${direction}`}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            <VillageParty
              moving={!!trip}
              direction={direction}
              quiet={quiet}
              stamp={`village:${trip?.token ?? "idle"}`}
            />
          </div>
          <div className="rpg-village-touch-hint" aria-hidden="true">
            ◎ CHẠM ĐƯỜNG ĐI
          </div>
        </div>
      </div>
    </section>
  )
}
