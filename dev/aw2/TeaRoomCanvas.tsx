import { PlaceCue, hideOverlappingPlaceCues } from "./PlaceCue"
import { placeAffordance } from "../../src/aw2/world/placeAffordance"
import {
  WalkingMarker,
  updateWalkingMarker,
  worldVisibleBounds,
} from "./WalkingTarget"
import { useEffect, useRef, useState } from "react"
import type { Texture, Ticker } from "pixi.js"
import type { WorldCanvasProps } from "./worldCanvasTypes"
import { roomScene } from "../../src/aw2/assets/teaRoom"
import { roomById } from "../../src/aw2/world/interiorLayout"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import { sampleWorldFrame } from "../../src/aw2/assets/animation"
import {
  landscapeCamera,
  projectVillage,
  unprojectVillage,
  type VillageCamera,
  type VillageViewMode,
} from "../../src/aw2/assets/villageView"
import type { Waypoint } from "../../src/aw2/world/navigation"
import type { JourneyFrame } from "../../src/aw2/assets/journeyScenes"
import {
  SceneLifetime,
  initializeWorldScene,
  firstWorldFrame,
} from "./sceneLifecycle"
import { RoomWaypoints } from "./RoomWaypoints"

/** Renderer only: rules/store own room movement, actions and the outside checkpoint. */
export function TeaRoomCanvas({
  world,
  economy,
  onNavigate,
  paused,
  focusRef,
  onReadyChange,
  walkTarget,
  walkControls,
}: WorldCanvasProps) {
  const room = roomById(world.interior!.roomId)
  const scene = roomScene(room.id)
  const walking = useRef(walkTarget)
  const walkingMarker = useRef<HTMLSpanElement>(null)
  walking.current = walkTarget
  const host = useRef<HTMLDivElement>(null),
    position = useRef(world),
    pause = useRef(paused)
  const camera = useRef<VillageCamera | null>(null),
    pointer = useRef<Waypoint | null>(null),
    labels = useRef(new Map<string, HTMLSpanElement>())
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [mode, setMode] = useState<VillageViewMode>("follow"),
    modeRef = useRef(mode)
  position.current = world
  pause.current = paused
  modeRef.current = mode
  const leader = world.partyIds[0] ?? "aw2-than"
  useEffect(() => {
    const lifetime = new SceneLifetime(),
      textures: Texture[] = []
    lifetime.own(() => textures.forEach((t) => t.destroy(false)))
    const report = (
      ready: boolean,
      error?: string,
      assertUsable?: () => void,
    ) =>
      onReadyChange?.({
        zoneId: room.zoneId,
        sceneId: room.id,
        leaderId: leader,
        ready,
        error,
        assertUsable,
      })
    const fail = (cause: unknown) => {
      if (lifetime.disposed) return
      const message =
        cause instanceof Error ? cause.message : "Chưa mở được tiệm trà."
      setReady(false)
      setError(message)
      report(false, message)
      lifetime.dispose()
    }
    setReady(false)
    setError("")
    camera.current = null
    report(false)
    void (async () => {
      try {
        const { Application, Assets, Sprite, Texture, Rectangle } =
          await import("pixi.js")
        const [floor, props, body] = await Promise.all([
          Assets.load(scene.assets.floor.url),
          Assets.load(scene.assets.props.url),
          Assets.load(ROSTER_ASSETS[leader].assets.world.url),
        ])
        if (lifetime.disposed) return
        floor.source.scaleMode = "linear"
        props.source.scaleMode = "nearest"
        body.source.scaleMode = "nearest"
        const app = new Application()
        await initializeWorldScene(
          app,
          {
            width: 640,
            height: 384,
            background: 0x38291e,
            antialias: false,
            preference: "webgl",
          },
          lifetime,
        )
        if (lifetime.disposed) return
        const crop = (base: Texture, f: JourneyFrame) => {
          const t = new Texture({
            source: base.source,
            frame: new Rectangle(f.x, f.y, f.width, f.height),
          })
          textures.push(t)
          return t
        }
        app.stage.sortableChildren = true
        const background = new Sprite(floor)
        background.position.set(scene.floorBounds.x, scene.floorBounds.y)
        background.width = scene.floorBounds.width
        background.height = scene.floorBounds.height
        background.zIndex = -1000
        app.stage.addChild(background)
        const furniture = scene.props.map((spec) => {
          const f = scene.frames[(spec.frame as keyof typeof scene.frames)],
            sprite = new Sprite(crop(props, f))
          sprite.anchor.set(0.5, 0.5)
          sprite.position.set(spec.x, spec.y)
          sprite.width = spec.width
          sprite.height = (spec.width * f.height) / f.width
          sprite.zIndex = spec.depth
          app.stage.addChild(sprite)
          return { spec, sprite }
        })
        const manifest = ROSTER_ASSETS[leader],
          frames: Record<string, Texture> = {}
        for (const [id, f] of Object.entries(manifest.frames))
          if (f.asset === "world") frames[id] = crop(body, f)
        const actor = new Sprite(frames[manifest.world.down.idle])
        app.stage.addChild(actor)
        const reduced = matchMedia("(prefers-reduced-motion: reduce)")
        let prior = position.current.interior ?? room.spawn,
          elapsed = 0
        const update = (ticker: Ticker) => {
          const now = position.current,
            point = now.interior
          if (!point) return
          const view = landscapeCamera(point, modeRef.current, scene)
          camera.current = view
          app.stage.scale.set(view.zoom)
          app.stage.position.set(
            320 - view.x * view.zoom,
            192 - view.y * view.zoom,
          )
          const moving =
            !pause.current &&
            Math.hypot(point.x - prior.x, point.y - prior.y) > 0.05
          if (moving) elapsed += ticker.deltaMS
          const id = sampleWorldFrame(
              manifest,
              point.facing,
              moving,
              elapsed,
              reduced.matches,
            ),
            f = manifest.frames[id]
          actor.texture = frames[id]
          actor.anchor.set(f.anchorX / f.width, f.anchorY / f.height)
          actor.scale.set(48 / f.height)
          actor.position.set(point.x, point.y + 6)
          actor.zIndex = point.y + 10
          for (const { spec, sprite } of furniture)
            sprite.alpha =
              point.y < spec.depth &&
              Math.abs(point.x - spec.x) < spec.width / 2 + 12 &&
              Math.abs(point.y - spec.y) < 50
                ? 0.45
                : 1
          const viewport = worldVisibleBounds(app.canvas)
          for (const object of room.objects) {
            const label = labels.current.get(object.id)
            if (!label) continue
            const p = projectVillage(
              {
                x: object.x,
                y: object.y + (object.kind === "room-exit" ? 28 : 24),
              },
              view,
            )
            label.style.left = `${p.x / 6.4}%`
            label.style.top = `${p.y / 3.84}%`
            label.style.visibility = "visible"
            const b = label.getBoundingClientRect()
            if (
              b.left < viewport.left ||
              b.right > viewport.right ||
              b.top < viewport.top ||
              b.bottom > viewport.bottom
            )
              label.style.visibility = "hidden"
          }
          hideOverlappingPlaceCues(labels.current.values())
          updateWalkingMarker(
            walkingMarker.current,
            walking.current,
            view,
            app.canvas,
          )
          app.canvas.dataset.worldCamera = JSON.stringify(view)
          app.canvas.dataset.representativeFrame = id
          app.canvas.dataset.partyPositions = JSON.stringify([
            { x: actor.x, y: actor.y },
          ])
          app.canvas.dataset.interiorPosition = JSON.stringify(point)
          app.canvas.dataset.outsideCheckpoint = JSON.stringify({
            zoneId: now.zoneId,
            x: now.x,
            y: now.y,
            facing: now.facing,
          })
          app.canvas.dataset.roomProps = JSON.stringify(
            furniture.map(({ spec, sprite }) => ({
              entityId: spec.entityId,
              x: sprite.x,
              y: sprite.y,
              width: sprite.width,
              height: sprite.height,
              depth: sprite.zIndex,
              alpha: sprite.alpha,
              textureId: scene.assets.props.id,
            })),
          )
          prior = point
        }
        app.canvas.setAttribute("aria-hidden", "true")
        app.canvas.dataset.sceneId = scene.id
        app.canvas.dataset.roomId = room.id
        app.canvas.dataset.partySize = "1"
        app.canvas.dataset.partyIds = JSON.stringify([leader])
        const assertUsable = await firstWorldFrame(
          app,
          host.current!,
          update,
          lifetime,
          fail,
        )
        if (lifetime.disposed) return
        setReady(true)
        report(true, undefined, assertUsable)
      } catch (cause) {
        fail(cause)
      }
    })()
    return () => {
      report(false)
      camera.current = null
      lifetime.dispose()
    }
  }, [leader, room.id, onReadyChange])
  return (
    <>
      <div
        className="aw2-map-toolbar"
        role="group"
        aria-label="Góc nhìn tiệm trà"
      >
        <button
          type="button"
          disabled={!ready || paused}
          data-aw2-world-control="view"
          aria-pressed={mode === "follow"}
          onClick={() => setMode("follow")}
        >
          Bám nhân vật
        </button>
        <button
          type="button"
          disabled={!ready || paused}
          data-aw2-world-control="view"
          aria-pressed={mode === "overview"}
          onClick={() => setMode("overview")}
        >
          Toàn cảnh
        </button>
        <span>Chọn bàn hoặc cửa rồi tự E / Tương tác.</span>
      </div>
      <div
        ref={focusRef}
        className="aw2-world-map aw2-village-map aw2-tea-room"
        data-testid="world-map"
        data-view-mode={mode}
        tabIndex={0}
        role="region"
        aria-label="Bản đồ khám phá"
        onPointerDown={(e) => {
          if (paused || !ready || e.button !== 0) return
          e.currentTarget.focus({ preventScroll: true })
          pointer.current = { x: e.clientX, y: e.clientY }
        }}
        onPointerCancel={() => {
          pointer.current = null
        }}
        onPointerUp={(e) => {
          const start = pointer.current
          pointer.current = null
          if (
            paused ||
            !ready ||
            !start ||
            !camera.current ||
            Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8
          )
            return
          const r = host.current
            ?.querySelector("canvas")
            ?.getBoundingClientRect()
          if (!r || r.width <= 0 || r.height <= 0) return
          onNavigate(
            unprojectVillage(
              {
                x: ((e.clientX - r.left) * 640) / r.width,
                y: ((e.clientY - r.top) * 384) / r.height,
              },
              camera.current,
            ),
          )
        }}
      >
        <div ref={host} />
        <WalkingMarker
          world={world}
          target={walkTarget}
          markerRef={walkingMarker}
        />
        {walkControls}
        {room.objects.map((o) => (
          <span
            key={o.id}
            className="aw2-world-label"
            data-world-label={o.id}
            ref={(node) => {
              if (node) labels.current.set(o.id, node)
              else labels.current.delete(o.id)
            }}
            style={{ visibility: "hidden" }}
          >
            <span className="aw2-place-name">
              {o.kind === "room-exit"
                ? "Ra hiên"
                : o.x === 240
                  ? "Đội đồng hành"
                  : "Nhật ký / công thức"}
            </span>
            <PlaceCue value={placeAffordance(world, economy, o.id)} />
          </span>
        ))}
        {!ready && !error && (
          <p className="aw2-map-loading" role="status">
            Đang mở tiệm trà…
          </p>
        )}
        {error && (
          <p className="aw2-map-loading" role="alert">
            Bản đồ: {error}
          </p>
        )}
      </div>
      <p data-testid="map-representative">
        Đại diện trên bản đồ: {ROSTER_ASSETS[leader].displayName}.
      </p>
      <RoomWaypoints
        world={world}
        disabled={!ready || paused}
        onChoose={(point) => {
          onNavigate(point)
          host.current?.parentElement?.focus({ preventScroll: true })
        }}
      />
    </>
  )
}
