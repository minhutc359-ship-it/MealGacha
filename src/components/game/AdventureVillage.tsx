import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  ADVENTURE_VILLAGE_PLACES,
  type AdventureHomeTab,
} from "../../game/adventureV560"
import type { RpgSave } from "../../game/adventureRpg/types"
import {
  VILLAGE_NPCS,
  VILLAGE_START,
  villageFacing,
  villagePath,
  villageTrip,
  type VillageFacing,
  type VillagePoint,
} from "../../game/villageRpg"
import { unitCharacter } from "../../infrastructure/assets/characterSprites"
import { CharacterSprite } from "./CharacterSprite"
import { VillageParty } from "./VillageParty"
import { VillageWalker } from "./VillageWalker"

type Npc = typeof VILLAGE_NPCS[number]
type Trip = ReturnType<typeof villageTrip> & {
  path: VillagePoint[]
  token: number
  npc?: Npc
}
const idleLines = [
  "Lửa Nhỏ: Cho tớ một miếng bánh nhé!",
  "Lam Lam: Đi chậm thôi, chờ tớ với!",
  "Hai bạn nhỏ chạm tay, một tia sáng ấm áp bật lên.",
]
export function AdventureVillage({
  save,
  quiet,
  onVisit,
}: {
  save: RpgSave
  quiet: boolean
  onVisit: (tab: Exclude<AdventureHomeTab, "village">, name: string) => void
}) {
  const dialogue = useRef<HTMLElement>(null)
  const world = useRef<HTMLDivElement>(null),
    party = useRef<HTMLDivElement>(null),
    active = useRef<Trip | null>(null),
    token = useRef(0)
  const [position, setPosition] = useState<VillagePoint>(VILLAGE_START),
    [trip, setTrip] = useState<Trip | null>(null)
  const [direction, setDirection] = useState<VillageFacing>("up"),
    [conversation, setConversation] = useState<Npc | null>(null)
  const [idle, setIdle] = useState(0),
    [expression, setExpression] = useState(false)
  useEffect(() => {
    if (conversation) {
      dialogue.current?.scrollIntoView({ block: "nearest", behavior: "auto" })
      dialogue.current
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true })
    }
  }, [conversation])
  const currentPoint = (): VillagePoint => {
    // Read the displayed pose, not wall time: WAAPI can start a frame late on
    // a busy device. A new route must begin exactly where the party is drawn.
    if (active.current && party.current && world.current) {
      const style = getComputedStyle(party.current)
      return {
        x: (parseFloat(style.left) / world.current.clientWidth) * 100,
        y: (parseFloat(style.top) / world.current.clientHeight) * 100,
      }
    }
    return position
  }
  const walkTo = (point: VillagePoint, npc?: Npc) => {
    const from = currentPoint(),
      path = villagePath(from, point)
    if (path.length < 2) {
      setConversation(npc ?? null)
      return
    }
    const next = {
      ...villageTrip(path, quiet),
      path,
      token: ++token.current,
      npc,
    }
    setPosition(from)
    setConversation(null)
    setExpression(false)
    active.current = next
    setTrip(next)
  }
  useLayoutEffect(() => {
    if (!trip || !party.current) return
    const animation = party.current.animate(
      trip.path.map((p, i) => ({
        left: `${p.x}%`,
        top: `${p.y}%`,
        offset: trip.offsets[i],
      })),
      { duration: trip.duration, easing: "linear", fill: "forwards" },
    )
    const timers = trip.path
      .slice(1)
      .map((p, i) =>
        window.setTimeout(
          () => setDirection(villageFacing(trip.path[i], p)),
          trip.offsets[i] * trip.duration,
        ),
      )
    animation.onfinish = () => {
      setPosition(trip.path.at(-1)!)
      active.current = null
      setTrip(null)
      setConversation(trip.npc ?? null)
      setDirection("down")
    }
    return () => {
      animation.cancel()
      timers.forEach(clearTimeout)
    }
  }, [trip])
  useEffect(() => {
    if (trip || conversation || quiet) return
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setIdle((n) => (n + 1) % 3)
        setExpression(true)
      }
    }, 6500)
    return () => clearInterval(timer)
  }, [trip, conversation, quiet])
  useEffect(() => {
    if (!expression) return
    const timer = window.setTimeout(() => setExpression(false), 3500)
    return () => clearTimeout(timer)
  }, [expression, idle])
  const play = (friend?: number) => {
    if (trip) return
    setIdle((n) => friend ?? (n + 1) % 3)
    setExpression(true)
  }
  return (
    <section
      className={`rpg-village-screen ${quiet ? "is-quiet" : ""}`}
      aria-label="Làng Giao Ước"
    >
      <header className="rpg-village-title">
        <div>
          <small>ADVENTURE · LÀNG GIAO ƯỚC</small>
          <h1>Một nơi để trở về</h1>
          <p>Chạm đường để đi, hoặc chọn NPC để dẫn đường.</p>
        </div>
        <span>Đội hiện tại · {save.formation.length}/5</span>
      </header>
      <div
        className={`rpg-village-map ${trip ? "is-walking" : ""}`}
        tabIndex={0}
        role="region"
        aria-label="Bản đồ làng. Chạm đường hoặc dùng phím mũi tên để đi."
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return
          const r = world.current?.getBoundingClientRect()
          if (r)
            walkTo({
              x: ((e.clientX - r.left) / r.width) * 100,
              y: ((e.clientY - r.top) / r.height) * 100,
            })
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          const delta: Record<string, VillagePoint> = {
            ArrowUp: { x: 0, y: -10 },
            ArrowDown: { x: 0, y: 10 },
            ArrowLeft: { x: -10, y: 0 },
            ArrowRight: { x: 10, y: 0 },
          }
          const d = delta[e.key]
          if (d) {
            e.preventDefault()
            const p = currentPoint()
            walkTo({ x: p.x + d.x, y: p.y + d.y })
          }
        }}
      >
        <div ref={world} className="rpg-village-world">
          <img
            className="rpg-village-art"
            src="/assets/rpg/village580/crossroads.webp"
            alt="Làng giữa vườn tre, con đường nối bốn ngôi nhà"
            width="1536"
            height="1024"
          />
          <div className="rpg-village-vignette" />
          {VILLAGE_NPCS.map((npc) => (
            <button
              type="button"
              key={npc.id}
              className={`rpg-village-place village-npc ${
                trip?.npc?.id === npc.id ? "is-destination" : ""
              }`}
              style={{ left: `${npc.x}%`, top: `${npc.y}%` }}
              onClick={() => walkTo(npc.stop, npc)}
              aria-label={`Đến gặp ${npc.name}`}
            >
              <span className="village-npc-body">
                {npc.art === "bach" ? (
                  <CharacterSprite
                    model={unitCharacter("chef-bach")}
                    stamp="village-bach"
                    quiet={quiet}
                  />
                ) : (
                  <VillageWalker id={npc.art} direction="down" quiet={quiet} />
                )}
              </span>
              <strong>
                {npc.name}
                <i>…</i>
              </strong>
            </button>
          ))}
          <div
            ref={party}
            className={`rpg-village-party facing-${direction}`}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            {expression && !trip && (
              <span className="village-expression" aria-hidden="true">
                {["♡", "♪", "✦"][idle]}
              </span>
            )}
            <VillageParty
              directional
              moving={!!trip}
              direction={direction}
              quiet={quiet}
              stamp={`village:${trip?.token ?? "idle"}`}
              idleAction={
                expression ? ["feed", "play", "cheer"][idle] : undefined
              }
              onCompanion={play}
            />
          </div>
          {trip && (
            <span className="village-travel-label">
              {trip.npc
                ? `Đang tới gặp ${trip.npc.name}…`
                : "Hai Vị Linh đang theo bạn"}
            </span>
          )}
        </div>
      </div>
      <div className="village-social">
        <p aria-live="polite">
          {expression ? idleLines[idle] : "Lửa Nhỏ và Lam Lam đang chờ bạn."}
        </p>
        <button type="button" disabled={!!trip} onClick={() => play()}>
          Gọi Vị Linh ♡
        </button>
      </div>
      {conversation && (
        <section
          ref={dialogue}
          onKeyDown={(e) => {
            if (e.key === "Escape") setConversation(null)
          }}
          className="village-conversation"
          role="dialog"
          aria-label={`Trò chuyện với ${conversation.name}`}
        >
          <small>{conversation.job}</small>
          <h2>{conversation.name}</h2>
          <p>{conversation.greeting}</p>
          <div>
            <button
              type="button"
              onClick={() =>
                onVisit(
                  conversation.id,
                  ADVENTURE_VILLAGE_PLACES.find(
                    (p) => p.id === conversation.id,
                  )!.name,
                )
              }
            >
              {conversation.action}
            </button>
            <button type="button" onClick={() => setConversation(null)}>
              Để sau
            </button>
          </div>
        </section>
      )}
      <nav className="village-directory" aria-label="Người trong làng">
        {VILLAGE_NPCS.map((npc) => (
          <button
            type="button"
            key={npc.id}
            onClick={() => walkTo(npc.stop, npc)}
          >
            <strong>{npc.name}</strong>
            <span>
              {ADVENTURE_VILLAGE_PLACES.find((p) => p.id === npc.id)!.name}
            </span>
            <small>{npc.job} →</small>
          </button>
        ))}
      </nav>
    </section>
  )
}
