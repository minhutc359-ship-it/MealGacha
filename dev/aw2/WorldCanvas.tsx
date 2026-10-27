import {
  WalkingMarker,
  updateWalkingMarker,
  worldVisibleBounds,
} from "./WalkingTarget"
import { useEffect, useRef, useState } from "react"
import type { Texture } from "pixi.js"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import { sampleWorldFrame } from "../../src/aw2/assets/animation"
import type { WorldProgress } from "../../src/aw2/world/model"
import { zoneById } from "../../src/aw2/world/maps"
import { ZONE_IDS } from "../../src/aw2/world/ids"
import {
  TABLE_ROOM_SCENE,
  tableRoomPropAlpha,
  tableRoomWaypoints,
} from "../../src/aw2/assets/tableRoom"
import {
  FORGOTTEN_HOST_WORLD,
  worldBossPresentation,
} from "../../src/aw2/assets/bossWorld"
import {
  HEARTH_ROOM_SCENE,
  hearthRoomWaypoints,
  hearthRoomProps,
} from "../../src/aw2/assets/hearthRoom"
import { RoomWaypoints } from "./RoomWaypoints"
import type { Waypoint } from "../../src/aw2/world/navigation"
import {
  TABLE_ROOM_INTERACTIONS,
  tableRoomInteractionProps,
} from "../../src/aw2/assets/tableInteractions"
import {
  VILLAGE_SCENE,
  villageProps,
  villageWaypoints,
  villageWellAlpha,
} from "../../src/aw2/assets/village"
import { VillageLandscape } from "./VillageLandscape"
import { JourneyLandscape } from "./JourneyLandscape"
import { journeyScene } from "../../src/aw2/assets/journeyScenes"
import { interiorScene } from "../../src/aw2/assets/interiorLandscapes"
import {
  landscapeCamera,
  projectVillage,
  unprojectVillage,
  villageWorldBounds,
  type VillageCamera,
  type VillageViewMode,
} from "../../src/aw2/assets/villageView"
import type { WorldCanvasProps } from "./worldCanvasTypes"
import { TeaRoomCanvas } from "./TeaRoomCanvas"
import {
  SceneLifetime,
  initializeWorldScene,
  firstWorldFrame,
} from "./sceneLifecycle"

export function WorldCanvas(props: WorldCanvasProps) {
  if (props.world.interior) return <TeaRoomCanvas {...props} />
  return props.world.zoneId === VILLAGE_SCENE.zoneId ? (
    <VillageLandscape {...props} />
  ) : journeyScene(props.world.zoneId) ? (
    <JourneyLandscape {...props} />
  ) : (
    <FlatWorldCanvas {...props} />
  )
}

function FlatWorldCanvas({
  world,
  onNavigate,
  paused,
  focusRef,
  onReadyChange,
  walkTarget,
  walkControls,
}: WorldCanvasProps) {
  const walking = useRef(walkTarget)
  const walkingMarker = useRef<HTMLSpanElement>(null)
  walking.current = walkTarget
  const host = useRef<HTMLDivElement>(null)
  const pointerStart = useRef<Waypoint | null>(null)
  const position = useRef(world)
  const pauseRef = useRef(paused)
  position.current = world
  pauseRef.current = paused
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<VillageViewMode>("follow")
  const modeRef = useRef(mode)
  modeRef.current = mode
  const camera = useRef<VillageCamera | null>(null)
  const labels = useRef(new Map<string, HTMLSpanElement>())
  const landscape = interiorScene(world.zoneId)!
  const leaderId = world.partyIds[0] ?? "aw2-than"
  const ids = [leaderId]
  const hearthScene =
    world.zoneId === HEARTH_ROOM_SCENE.zoneId ? HEARTH_ROOM_SCENE : null
  const villageScene =
    world.zoneId === VILLAGE_SCENE.zoneId ? VILLAGE_SCENE : null
  const roomScene =
    world.zoneId === TABLE_ROOM_SCENE.zoneId ? TABLE_ROOM_SCENE : hearthScene
  const scene = villageScene ?? roomScene
  const roomPoints = villageScene
    ? villageWaypoints(world)
    : hearthScene
      ? hearthRoomWaypoints(world)
      : tableRoomWaypoints(world)
  const interactionProps = tableRoomInteractionProps(world)
  const hearthProps = hearthRoomProps(world)
  const openingProps = villageProps(world)
  const labelProps = villageScene
    ? openingProps
    : hearthScene
      ? hearthProps
      : interactionProps
  useEffect(() => {
    const lifetime = new SceneLifetime()
    const textures: Texture[] = []
    lifetime.own(() => textures.forEach((texture) => texture.destroy(false)))
    const signalReady = (
      ready: boolean,
      error?: string,
      assertUsable?: () => void,
    ) =>
      onReadyChange?.({
        zoneId: world.zoneId,
        sceneId: world.zoneId,
        leaderId: leaderId,
        ready,
        error,
        assertUsable,
      })
    const fail = (cause: unknown) => {
      if (lifetime.disposed) return
      const message =
        cause instanceof Error ? cause.message : "Chưa tải được bản đồ."
      setReady(false)
      setError(message)
      signalReady(false, message)
      lifetime.dispose()
    }
    setReady(false)
    signalReady(false)
    setError("")
    void (async () => {
      try {
        const { Application, Graphics, Assets, Sprite, Texture, Rectangle } =
          await import("pixi.js")
        const [loaded, environment] = await Promise.all([
          Promise.all(
            ids.map((id) => Assets.load(ROSTER_ASSETS[id].assets.world.url)),
          ),
          villageScene
            ? Promise.all([
                Assets.load(villageScene.assets.floor.url),
                Assets.load(villageScene.assets.props.url),
                Assets.load(villageScene.assets.threshold.url),
              ])
            : hearthScene
              ? Promise.all([
                  Assets.load(landscape.assets.floor.url),
                  Assets.load(hearthScene.assets.sideboard.url),
                  Assets.load(hearthScene.assets.puzzles.url),
                  Assets.load(hearthScene.assets.threshold.url),
                ])
              : roomScene
                ? Promise.all([
                    Assets.load(landscape.assets.floor.url),
                    Assets.load(roomScene.assets.sideboard.url),
                    Assets.load(FORGOTTEN_HOST_WORLD.asset.url),
                    Assets.load(TABLE_ROOM_INTERACTIONS.assets.note.url),
                    Assets.load(TABLE_ROOM_INTERACTIONS.assets.threshold.url),
                  ])
                : Promise.resolve([]),
        ])
        if (lifetime.disposed) return
        for (const texture of environment) texture.source.scaleMode = "nearest"
        const next = new Application()
        await initializeWorldScene(
          next,
          {
            width: 640,
            height: 384,
            background: 0x233b32,
            antialias: false,
            preference: "webgl",
          },
          lifetime,
        )
        if (lifetime.disposed) return
        const room = ZONE_IDS.indexOf(world.zoneId) >= 3
        const terrain = new Graphics()
        if (scene) {
          const floor = new Sprite(environment[0])
          floor.position.set(landscape.landscape.x, landscape.landscape.y)
          floor.width = landscape.landscape.width
          floor.height = landscape.landscape.height
          next.stage.addChild(floor)
        }
        if (!scene) {
          for (let y = 0; y < 384; y += 16)
            for (let x = 0; x < 640; x += 16) {
              const path =
                Math.abs(y - 192) < 44 ||
                (x > 120 && x < 536 && y > 96 && y < 288)
              const tone = (x / 16 + y / 16) % 2
              terrain
                .rect(x, y, 16, 16)
                .fill(
                  room
                    ? tone
                      ? 0x615039
                      : 0x584832
                    : path
                      ? tone
                        ? 0xb6a075
                        : 0xad976d
                      : tone
                        ? 0x315b41
                        : 0x345f43,
                )
            }
          terrain.rect(8, 8, 624, 368).stroke({ width: 4, color: 0x9f885e })
          for (const wall of zoneById(world.zoneId).walls) {
            terrain
              .rect(wall.x, wall.y, wall.width, wall.height)
              .fill(0x384536)
              .rect(wall.x + 4, wall.y + 4, wall.width - 8, wall.height - 8)
              .fill(0x63724d)
              .rect(wall.x + 12, wall.y + 12, wall.width - 24, 12)
              .fill(0x889264)
          }
        }
        for (const object of zoneById(world.zoneId).objects) {
          if (scene) continue
          if (object.kind === "exit")
            terrain.rect(object.x - 10, object.y - 16, 20, 32).fill(0xe4c782)
          else if (object.kind === "chest")
            terrain
              .roundRect(object.x - 12, object.y - 12, 24, 20, 3)
              .fill(0x865332)
              .stroke({ width: 2, color: 0xe4b85e })
              .rect(object.x - 2, object.y - 6, 4, 8)
              .fill(0xf6dd92)
          else if (
            ["table", "note", "puzzle", "hint", "mode"].includes(object.kind)
          )
            terrain
              .rect(object.x - 14, object.y - 6, 28, 14)
              .fill(0x65482e)
              .rect(object.x - 16, object.y - 12, 32, 10)
              .fill(0xd6bd88)
          else
            terrain
              .ellipse(object.x, object.y + 7, 12, 5)
              .fill({ color: 0x10251c, alpha: 0.5 })
              .roundRect(object.x - 8, object.y - 11, 16, 23, 4)
              .fill(object.kind === "boss" ? 0x9c6367 : 0x779aa1)
              .circle(object.x, object.y - 17, 7)
              .fill(0xf2d5ad)
        }
        next.stage.addChild(terrain)
        let foreground: import("pixi.js").Sprite | undefined
        let bossMarker: import("pixi.js").Sprite | undefined
        const bossFrames: Record<string, Texture> = {}
        const groundProps: {
          entityId: string
          sprite: import("pixi.js").Sprite
          textureId: string
        }[] = []
        if (villageScene) {
          for (const prop of openingProps) {
            const asset =
              villageScene.assets[(prop.asset as "props" | "threshold")]
            const f =
              prop.asset === "props"
                ? villageScene.frames[
                    (prop.frame as keyof typeof villageScene.frames)
                  ]
                : villageScene.assets.threshold.frame
            const texture = new Texture({
              source: environment[prop.asset === "props" ? 1 : 2].source,
              frame: new Rectangle(f.x, f.y, f.width, f.height),
            })
            textures.push(texture)
            const sprite = new Sprite(texture)
            sprite.anchor.set(prop.anchorX, prop.anchorY)
            sprite.position.set(prop.x, prop.y)
            sprite.width = prop.width
            sprite.height = prop.height
            sprite.zIndex = prop.depth
            sprite.alpha = prop.alpha
            next.stage.addChild(sprite)
            groundProps.push({
              entityId: prop.entityId,
              sprite,
              textureId: asset.id,
            })
          }
          const f = villageScene.frames.well,
            prop = villageScene.obstacle
          const texture = new Texture({
            source: environment[1].source,
            frame: new Rectangle(f.x, f.y, f.width, f.height),
          })
          textures.push(texture)
          foreground = new Sprite(texture)
          foreground.anchor.set(prop.anchorX, prop.anchorY)
          foreground.position.set(prop.x, prop.y)
          foreground.width = prop.width
          foreground.height = prop.height
          foreground.zIndex = prop.sortY + 10
          next.stage.addChild(foreground)
        }
        if (roomScene) {
          for (const prop of interactionProps) {
            const asset =
              TABLE_ROOM_INTERACTIONS.assets[
                (prop.asset as keyof typeof TABLE_ROOM_INTERACTIONS.assets)
              ]
            const f = asset.frame
            const texture = new Texture({
              source: environment[prop.asset === "note" ? 3 : 4].source,
              frame: new Rectangle(f.x, f.y, f.width, f.height),
            })
            textures.push(texture)
            const sprite = new Sprite(texture)
            sprite.anchor.set(prop.anchorX, prop.anchorY)
            sprite.position.set(prop.x, prop.y)
            sprite.width = prop.width
            sprite.height = prop.height
            sprite.zIndex = prop.depth
            sprite.alpha = prop.alpha
            next.stage.addChild(sprite)
            groundProps.push({
              entityId: prop.entityId,
              sprite,
              textureId: asset.id,
            })
          }
          if (hearthScene) {
            for (const prop of hearthProps) {
              const asset =
                hearthScene.assets[(prop.asset as "puzzles" | "threshold")]
              const f =
                prop.asset === "puzzles"
                  ? hearthScene.frames[
                      (prop.frame as keyof typeof hearthScene.frames)
                    ]
                  : hearthScene.assets.threshold.frame
              const texture = new Texture({
                source: environment[prop.asset === "puzzles" ? 2 : 3].source,
                frame: new Rectangle(f.x, f.y, f.width, f.height),
              })
              textures.push(texture)
              const sprite = new Sprite(texture)
              sprite.anchor.set(prop.anchorX, prop.anchorY)
              sprite.position.set(prop.x, prop.y)
              sprite.width = prop.width
              sprite.height = prop.height
              sprite.zIndex = prop.depth
              sprite.alpha = prop.alpha
              next.stage.addChild(sprite)
              groundProps.push({
                entityId: prop.entityId,
                sprite,
                textureId: asset.id,
              })
            }
          }
          const frame = roomScene.assets.sideboard.frame
          const texture = new Texture({
            source: environment[1].source,
            frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
          })
          textures.push(texture)
          foreground = new Sprite(texture)
          foreground.anchor.set(roomScene.prop.anchorX, roomScene.prop.anchorY)
          foreground.position.set(roomScene.prop.x, roomScene.prop.y)
          foreground.width = roomScene.prop.width
          foreground.height = roomScene.prop.height
          foreground.zIndex = roomScene.prop.sortY + 10
          next.stage.addChild(foreground)
          if (!hearthScene) {
            for (const [key, pose] of Object.entries(
              FORGOTTEN_HOST_WORLD.frames,
            )) {
              const texture = new Texture({
                source: environment[2].source,
                frame: new Rectangle(pose.x, pose.y, pose.width, pose.height),
              })
              textures.push(texture)
              bossFrames[key] = texture
            }
            const state = worldBossPresentation(world)!
            const pose =
              FORGOTTEN_HOST_WORLD.frames[
                (state.frame as keyof typeof FORGOTTEN_HOST_WORLD.frames)
              ]
            bossMarker = new Sprite(bossFrames[state.frame])
            bossMarker.anchor.set(
              pose.anchorX / pose.width,
              pose.anchorY / pose.height,
            )
            bossMarker.scale.set(FORGOTTEN_HOST_WORLD.display.scale)
            bossMarker.position.set(state.x, state.y)
            bossMarker.zIndex = state.depth
            next.stage.addChild(bossMarker)
          }
        }
        const actors = ids.map((id, index) => {
          const manifest = ROSTER_ASSETS[id]
          loaded[index].source.scaleMode = "nearest"
          const frames: Record<string, Texture> = {}
          for (const [frameId, frame] of Object.entries(manifest.frames)) {
            if (frame.asset !== "world") continue
            const texture = new Texture({
              source: loaded[index].source,
              frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
            })
            textures.push(texture)
            frames[frameId] = texture
          }
          const sprite = new Sprite(frames[manifest.world.down.idle])
          next.stage.addChild(sprite)
          return { manifest, frames, sprite }
        })
        let prior = { ...position.current }
        let elapsed = 0
        const reduced = matchMedia("(prefers-reduced-motion: reduce)")
        next.stage.sortableChildren = true
        const update = (ticker: import("pixi.js").Ticker) => {
          const now = position.current
          // React may publish the destination before effect cleanup destroys this canvas.
          if (now.zoneId !== world.zoneId) return
          const view = landscapeCamera(now, modeRef.current, landscape)
          camera.current = view
          next.stage.scale.set(view.zoom)
          next.stage.position.set(
            320 - view.x * view.zoom,
            192 - view.y * view.zoom,
          )
          updateWalkingMarker(
            walkingMarker.current,
            walking.current,
            view,
            next.canvas,
          )
          next.canvas.dataset.worldCamera = JSON.stringify(view)
          const moving =
            Math.hypot(now.x - prior.x, now.y - prior.y) > 0.05 &&
            !pauseRef.current
          if (moving) elapsed += ticker.deltaMS
          actors.forEach(({ manifest, frames, sprite }) => {
            const frameId = sampleWorldFrame(
              manifest,
              now.facing,
              moving,
              elapsed,
              reduced.matches,
            )
            const frame = manifest.frames[frameId]
            if (!frames[frameId])
              throw Error(`Thiếu khung hình world: ${manifest.spiritId}`)
            sprite.texture = frames[frameId]
            sprite.anchor.set(
              frame.anchorX / frame.width,
              frame.anchorY / frame.height,
            )
            sprite.scale.set(48 / frame.height)
            sprite.position.set(now.x, now.y + 6)
            sprite.zIndex = now.y + 10
            next.canvas.dataset.representativeFrame = frameId
          })
          next.canvas.dataset.partyPositions = JSON.stringify(
            actors.map(({ sprite }) => ({ x: sprite.x, y: sprite.y })),
          )
          if (foreground && scene) {
            foreground.alpha = (
              villageScene ? villageWellAlpha : tableRoomPropAlpha
            )(
              actors.map(({ sprite }) => {
                const bounds = villageWorldBounds(sprite.getBounds(), view)
                return {
                  x: bounds.x,
                  y: bounds.y,
                  width: bounds.width,
                  height: bounds.height,
                  groundY: sprite.zIndex - 10,
                }
              }),
            )
            next.canvas.dataset.foregroundAlpha = String(foreground.alpha)
            next.canvas.dataset.groundDepths = JSON.stringify({
              prop: foreground.zIndex,
              actors: actors.map(({ sprite }) => sprite.zIndex),
            })
          }
          if (bossMarker) {
            const state = worldBossPresentation(now)!
            const pose =
              FORGOTTEN_HOST_WORLD.frames[
                (state.frame as keyof typeof FORGOTTEN_HOST_WORLD.frames)
              ]
            bossMarker.texture = bossFrames[state.frame]
            bossMarker.anchor.set(
              pose.anchorX / pose.width,
              pose.anchorY / pose.height,
            )
            bossMarker.alpha = state.alpha
            next.canvas.dataset.worldBoss = JSON.stringify({
              ...state,
              assetId: FORGOTTEN_HOST_WORLD.asset.id,
              x: bossMarker.x,
              y: bossMarker.y,
              depth: bossMarker.zIndex,
              alpha: bossMarker.alpha,
              scale: bossMarker.scale.x,
              anchorX: bossMarker.anchor.x,
              anchorY: bossMarker.anchor.y,
            })
          }
          if (groundProps.length) {
            const props = villageScene
              ? villageProps(now)
              : hearthScene
                ? hearthRoomProps(now)
                : tableRoomInteractionProps(now)
            for (const { entityId, sprite } of groundProps)
              sprite.alpha = props.find(
                (prop) => prop.entityId === entityId,
              )!.alpha
            next.canvas.dataset.interactionProps = JSON.stringify(
              props.map((prop) => {
                const sprite = groundProps.find(
                  (p) => p.entityId === prop.entityId,
                )!.sprite
                return {
                  entityId: prop.entityId,
                  state: prop.state,
                  x: sprite.x,
                  y: sprite.y,
                  alpha: sprite.alpha,
                  depth: sprite.zIndex,
                  width: sprite.width,
                  height: sprite.height,
                  textureId: groundProps.find(
                    (p) => p.entityId === prop.entityId,
                  )!.textureId,
                }
              }),
            )
          }
          const viewport = worldVisibleBounds(next.canvas)
          for (const object of zoneById(now.zoneId).objects) {
            const label = labels.current.get(object.id)
            if (!label) continue
            const offset =
              (hearthScene ? hearthProps : interactionProps).find(
                (p) => p.entityId === object.id,
              )?.labelOffsetY ?? 24
            const point = projectVillage(
              { x: object.x, y: object.y + offset },
              view,
            )
            label.style.left = `${point.x / 6.4}%`
            label.style.top = `${point.y / 3.84}%`
            label.style.visibility =
              view.mode === "follow" &&
              point.x >= 8 &&
              point.x <= 632 &&
              point.y >= 8 &&
              point.y <= 376
                ? "visible"
                : "hidden"
            if (label.style.visibility === "visible") {
              const b = label.getBoundingClientRect()
              if (
                b.left < viewport.left ||
                b.right > viewport.right ||
                b.top < viewport.top ||
                b.bottom > viewport.bottom
              )
                label.style.visibility = "hidden"
            }
          }
          prior = { ...now }
        }
        next.canvas.setAttribute("aria-hidden", "true")
        next.canvas.dataset.sceneId = landscape.id
        next.canvas.dataset.partySize = String(ids.length)
        next.canvas.dataset.partyIds = JSON.stringify(ids)
        const assertUsable = await firstWorldFrame(
          next,
          host.current!,
          update,
          lifetime,
          fail,
        )
        if (lifetime.disposed) return
        setReady(true)
        signalReady(true, undefined, assertUsable)
      } catch (cause) {
        fail(cause)
      }
    })()
    return () => {
      signalReady(false)
      camera.current = null
      lifetime.dispose()
    }
  }, [world.zoneId, leaderId, onReadyChange])
  return (
    <>
      <div
        className="aw2-map-toolbar"
        role="group"
        aria-label="Góc nhìn khu vực"
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
        <span>
          Chọn Toàn cảnh để ngắm khu vực; chạm lối đi hoặc chọn điểm đến để đi.
        </span>
      </div>
      <div
        ref={focusRef}
        className={"aw2-world-map aw2-village-map aw2-interior-map"}
        data-testid="world-map"
        tabIndex={0}
        role="region"
        aria-label="Bản đồ khám phá"
        onPointerDown={(event) => {
          if (paused || !ready || event.button !== 0) return
          event.currentTarget.focus({ preventScroll: true })
          pointerStart.current = { x: event.clientX, y: event.clientY }
        }}
        onPointerCancel={() => {
          pointerStart.current = null
        }}
        onPointerUp={(event) => {
          const start = pointerStart.current
          pointerStart.current = null
          if (
            paused ||
            !ready ||
            !start ||
            Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8
          )
            return
          const rect = host.current
            ?.querySelector("canvas")
            ?.getBoundingClientRect()
          if (!rect || rect.width <= 0 || rect.height <= 0 || !camera.current)
            return
          onNavigate(
            unprojectVillage(
              {
                x: ((event.clientX - rect.left) * 640) / rect.width,
                y: ((event.clientY - rect.top) * 384) / rect.height,
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
        {zoneById(world.zoneId).objects.map((object) => (
          <span
            key={object.id}
            ref={(node) => {
              if (node) labels.current.set(object.id, node)
              else labels.current.delete(object.id)
            }}
            className="aw2-world-label"
            data-world-label={object.id}
            style={{ transform: "translate(-50%, 0)", visibility: "hidden" }}
          >
            {scene
              ? (roomPoints.find((point) => point.id === object.id)?.short ??
                object.name)
              : object.name}
          </span>
        ))}
        {!ready && !error && (
          <p className="aw2-map-loading" role="status">
            Đang tải bản đồ…
          </p>
        )}
        {error && (
          <p className="aw2-map-loading" role="alert">
            Bản đồ: {error}
          </p>
        )}
      </div>
      <p data-testid="map-representative">
        Đại diện trên bản đồ: {ROSTER_ASSETS[leaderId].displayName}. Vị trí đầu
        trong đội đã lưu quyết định nhân vật đại diện.
      </p>
      {scene && (
        <RoomWaypoints
          world={world}
          disabled={!ready || paused}
          onChoose={(point) => {
            onNavigate(point)
            host.current?.parentElement?.focus({ preventScroll: true })
          }}
        />
      )}
    </>
  )
}
