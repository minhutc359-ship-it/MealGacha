import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import { useGameStore } from "../../game/useGameStore"
import { useAppStore } from "../../store/useAppStore"
import { useModeIntroStore } from "../../game/modeIntroState"
import { ADVENTURE_MAP_BY_ID, canWalk, pathTo } from "../../game/adventureWorld"
import {
  ADVENTURE_AREA_MAP,
  DELTAS,
  type AdventureDirection,
  type AdventureSave,
} from "../../game/adventure"
import {
  AdventureStepper,
  DIRECTION_KEYS,
  RUN_STEP_MS,
  WALK_STEP_MS,
  type Point,
} from "../../game/adventurePresentation"
import { mountAdventureRenderer } from "../../game/adventureRenderer"
import { HumanSprite } from "./AdventureArt"
import { CharacterPortrait } from "./CharacterPortrait"
import "../../game/adventure460.css"
const directionTo = (from: Point, to: Point): AdventureDirection =>
  to.x > from.x
    ? "right"
    : to.x < from.x
      ? "left"
      : to.y > from.y
        ? "down"
        : "up"
export function adventureInteractLabel(save: AdventureSave) {
  if (save.message) return "Tiếp tục"
  const map = ADVENTURE_MAP_BY_ID[save.mapId],
    [dx, dy] = DELTAS[save.facing],
    x = save.x + dx,
    y = save.y + dy
  const npc = map.npcs.find((n) => n.x === x && n.y === y)
  if (npc)
    return ["trainer", "keeper"].includes(npc.role)
      ? `Thử thách ${npc.name}`
      : `Nói với ${npc.name}`
  const exit = map.exits.find((e) => e.x === x && e.y === y)
  if (exit) return `Vào ${ADVENTURE_MAP_BY_ID[exit.to].name}`
  if (map.grid[y]?.[x] === "r" || map.grid[save.y]?.[save.x] === "r")
    return "Mở Tủ Vị Linh"
  if (map.grid[y]?.[x] === "s") return "Đọc biển"
  return "Tương tác"
}
export function AdventureWorld({
  save,
  move,
  interact,
  onMenu,
  readOnly = false,
  paused = false,
}: {
  save: AdventureSave
  move: (direction: AdventureDirection) => void
  interact: () => void
  onMenu?: () => void
  readOnly?: boolean
  paused?: boolean
}) {
  const map = ADVENTURE_MAP_BY_ID[save.mapId],
    canvas = useRef<HTMLCanvasElement>(null),
    renderer = useRef<ReturnType<typeof mountAdventureRenderer> | null>(null)
  const preferenceQuiet = useAppStore(
    (s) =>
      s.user.preferences.reducedMotion ||
      s.user.preferences.graphicsQuality === "low",
  )
  const [systemReduced, setSystemReduced] = useState(
    () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  const quiet = preferenceQuiet || systemReduced
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setSystemReduced(media.matches)
    media.addEventListener("change", change)
    return () => media.removeEventListener("change", change)
  }, [])
  const introOpen = useModeIntroStore((s) => !!s.mode),
    [running, setRunning] = useState(false),
    [goal, setGoal] = useState<Point | null>(null)
  const live = useRef({
    save,
    move,
    interact,
    onMenu,
    readOnly,
    paused,
    introOpen,
    running,
  })
  live.current = {
    save,
    move,
    interact,
    onMenu,
    readOnly,
    paused,
    introOpen,
    running,
  }
  const stepper = useRef(new AdventureStepper()),
    pumpTimer = useRef<number | null>(null),
    shift = useRef(false),
    route = useRef<Point[]>([])
  const interval = () =>
    live.current.running || shift.current ? RUN_STEP_MS : WALK_STEP_MS
  const canMove = () => {
    const s = live.current
    return (
      !s.readOnly &&
      !s.paused &&
      !s.introOpen &&
      !s.save.encounter &&
      !s.save.service &&
      !s.save.message &&
      !document.hidden
    )
  }
  const stop = useCallback(() => {
    stepper.current.clear()
    if (pumpTimer.current !== null) clearTimeout(pumpTimer.current)
    pumpTimer.current = null
    shift.current = false
  }, [])
  const cancelRoute = useCallback(() => {
    route.current = []
    setGoal(null)
  }, [])
  const step = (direction: AdventureDirection) => {
    if (!canMove()) {
      stop()
      return
    }
    const current = live.current.save,
      [dx, dy] = DELTAS[direction]
    if (
      current.facing === direction &&
      !canWalk(
        ADVENTURE_MAP_BY_ID[current.mapId],
        current.x + dx,
        current.y + dy,
      )
    ) {
      stop()
      return
    }
    live.current.move(direction)
  }
  const pump = () => {
    if (!canMove()) {
      stop()
      return
    }
    const direction = stepper.current.tick(performance.now(), interval())
    if (direction) step(direction)
    if (stepper.current.active)
      pumpTimer.current = window.setTimeout(
        pump,
        Math.max(1, stepper.current.delay(performance.now())),
      )
  }
  const press = (source: string, direction: AdventureDirection) => {
    if (!canMove()) return
    cancelRoute()
    const next = stepper.current.press(
      source,
      direction,
      performance.now(),
      interval(),
    )
    if (next) step(next)
    if (pumpTimer.current !== null) clearTimeout(pumpTimer.current)
    if (stepper.current.active)
      pumpTimer.current = window.setTimeout(
        pump,
        Math.max(1, stepper.current.delay(performance.now())),
      )
  }
  const before = useRef({ steps: save.steps, map: save.mapId })
  useEffect(() => {
    const prior = before.current
    before.current = { steps: save.steps, map: save.mapId }
    if (readOnly) return
    if (prior.map !== save.mapId) gameAudio.play("door")
    else if (prior.steps !== save.steps)
      gameAudio.play("footstep", 0, save.facing === "left" ? -0.2 : 0.2)
  }, [save.steps, save.mapId, save.facing, readOnly])
  useEffect(() => {
    if (!canvas.current) return
    const scene = mountAdventureRenderer(canvas.current, map, live.current.save)
    renderer.current = scene
    return () => {
      scene.dispose()
      renderer.current = null
    }
  }, [map])
  useEffect(() => {
    renderer.current?.update(save, {
      quiet,
      paused:
        paused || (!readOnly && introOpen) || !!save.encounter || !!save.service,
      stepDuration: interval(),
      goal,
    })
  }, [save, quiet, paused, readOnly, introOpen, running, goal])
  useEffect(() => {
    if (
      readOnly ||
      paused ||
      introOpen ||
      save.encounter ||
      save.service ||
      save.message
    ) {
      stop()
      cancelRoute()
    }
  }, [
    readOnly,
    paused,
    introOpen,
    save.encounter,
    save.service,
    save.message,
    stop,
    cancelRoute,
  ])
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        live.current.readOnly ||
        live.current.paused ||
        useModeIntroStore.getState().mode ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target?.closest("input,textarea,select,[contenteditable=true],dialog")
      )
        return
      if (event.key === "Shift") {
        shift.current = true
        return
      }
      const direction =
        DIRECTION_KEYS[
          event.key.length === 1 ? event.key.toLowerCase() : event.key
        ]
      if (direction) {
        event.preventDefault()
        if (!event.repeat) press(`key:${event.code || event.key}`, direction)
      } else if (
        ["e", "E", "z", "Z", "Enter", " "].includes(event.key) &&
        !event.repeat &&
        !target?.closest("button,a,summary")
      ) {
        event.preventDefault()
        stop()
        cancelRoute()
        live.current.interact()
      } else if (["x", "X"].includes(event.key) && !event.repeat) {
        event.preventDefault()
        stop()
        cancelRoute()
        live.current.onMenu?.()
      }
    }
    const up = (event: KeyboardEvent) => {
      if (event.key === "Shift") shift.current = false
      stepper.current.release(`key:${event.code || event.key}`)
      if (!stepper.current.active && pumpTimer.current !== null) {
        clearTimeout(pumpTimer.current)
        pumpTimer.current = null
      }
    }
    const hidden = () => {
      if (document.hidden) {
        stop()
        cancelRoute()
      }
    }
    const blur = () => { stop(); cancelRoute() }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", blur)
    document.addEventListener("visibilitychange", hidden)
    return () => {
      stop()
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", blur)
      document.removeEventListener("visibilitychange", hidden)
    }
  }, [stop, cancelRoute])
  useEffect(() => {
    stop()
    cancelRoute()
  }, [map.id, stop, cancelRoute])
  useEffect(() => {
    if (!goal || !canMove()) return
    const next = route.current.shift()
    if (!next) {
      if (Math.abs(save.x - goal.x) + Math.abs(save.y - goal.y) === 1) {
        step(directionTo(save, goal))
        live.current.interact()
      }
      setGoal(null)
      return
    }
    const timer = window.setTimeout(
      () => step(directionTo(live.current.save, next)),
      interval(),
    )
    return () => clearTimeout(timer)
  }, [goal, save.x, save.y, save.mapId])
  const choosePoint = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!canMove() || !renderer.current) return
    stop()
    const rect = event.currentTarget.getBoundingClientRect()
    let point = renderer.current.pick(
      event.clientX - rect.left,
      event.clientY - rect.top,
    )
    const house = map.houses.find(
      (h) =>
        point.x >= h.x &&
        point.x < h.x + h.width &&
        point.y >= h.y - 1 &&
        point.y < h.y + h.height,
    )
    if (house) {
      const door = map.exits.find((e) => e.to === house.id)
      if (door) point = { x: door.x, y: door.y }
    }
    if (
      point.x < 0 ||
      point.y < 0 ||
      point.y >= map.grid.length ||
      point.x >= map.grid[0].length
    )
      return
    route.current = pathTo(map, save, point)
    setGoal(point)
  }
  const hold = (
    event: PointerEvent<HTMLButtonElement>,
    direction: AdventureDirection,
  ) => {
    if (event.button !== 0 || !canMove()) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    press(`pointer:${event.pointerId}`, direction)
  }
  const release = (event: PointerEvent<HTMLButtonElement>) =>
    stepper.current.release(`pointer:${event.pointerId}`)
  return (
    <>
      <div
        className={`adv-map-frame adv-canvas-map theme-${save.areaId} ${
          map.interior ? "is-interior" : ""
        }`}
      >
        <div className="adv-world-heading">
          <strong>{map.name}</strong>
          <span className="adv-objective-hud">
            {ADVENTURE_AREA_MAP[save.areaId].objective}
          </span>
          <small>
            {goal
              ? "Đang đi tới điểm chọn…"
              : "Giữ hướng để đi · Shift chạy · E/Z xác nhận · X menu"}
          </small>
        </div>
        <div
          className="adv-world-viewport"
          tabIndex={0}
          role="region"
          aria-label={`Bản đồ ${map.name}. Dùng phím mũi tên để di chuyển. Vị trí ${save.x + 1}, ${save.y + 1}.`}
        >
          <canvas
            ref={canvas}
            className="adv-world-renderer"
            aria-hidden="true"
            onPointerUp={choosePoint}
          />
        </div>
      </div>
      <div
        className="adv-controls adv-handheld-controls"
        aria-label="Điều khiển di chuyển"
      >
        <div className="adv-direction-pad">
          {(["up", "left", "right", "down"] as const).map((direction) => (
            <button
              type="button"
              className={direction}
              key={direction}
              aria-label={
                {
                  up: "Đi lên",
                  left: "Đi trái",
                  right: "Đi phải",
                  down: "Đi xuống",
                }[direction]
              }
              onPointerDown={(e) => hold(e, direction)}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
              onClick={(e) => {
                if (e.detail === 0) {
                  cancelRoute()
                  step(direction)
                }
              }}
            >
              {{ up: "▲", left: "◀", right: "▶", down: "▼" }[direction]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="adv-run"
          aria-pressed={running}
          onClick={() => setRunning((v) => !v)}
        >
          {running ? "Chạy" : "Đi bộ"}
          <small>Shift</small>
        </button>
        <button
          type="button"
          className="interact"
          onClick={() => {
            stop()
            cancelRoute()
            interact()
          }}
        >
          <b>A</b>
          <span>{adventureInteractLabel(save)}</span>
        </button>
        <button
          type="button"
          className="adv-menu-key"
          onClick={() => {
            stop()
            cancelRoute()
            onMenu?.()
          }}
        >
          Menu<small>X</small>
        </button>
      </div>
      {save.message && (
        <div className="adv-message" role="status">
          {save.speaker ? (
            <CharacterPortrait id={save.speaker} decorative />
          ) : (
            <HumanSprite character="hero" />
          )}
          <p>{save.message}</p>
          <button
            type="button"
            aria-label="Tiếp tục lời thoại"
            onClick={() =>
              !readOnly &&
              useGameStore.getState().adventureAction({ type: "dismiss" })
            }
          >
            A ▸
          </button>
        </div>
      )}
    </>
  )
}
