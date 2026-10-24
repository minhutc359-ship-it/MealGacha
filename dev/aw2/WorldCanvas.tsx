import { useEffect, useRef, useState, type Ref } from "react"
import type { Application, Texture } from "pixi.js"
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

export function WorldCanvas({
  world,
  onNavigate,
  paused,
  focusRef,
}: {
  world: WorldProgress
  onNavigate: (point: Waypoint) => void
  paused: boolean
  focusRef?: Ref<HTMLDivElement>
}) {
  const host = useRef<HTMLDivElement>(null)
  const pointerStart = useRef<Waypoint | null>(null)
  const position = useRef(world)
  const pauseRef = useRef(paused)
  position.current = world
  pauseRef.current = paused
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)
  const leaderId = world.partyIds[0] ?? "aw2-than"
  const ids = [leaderId]
  const hearthScene =
    world.zoneId === HEARTH_ROOM_SCENE.zoneId ? HEARTH_ROOM_SCENE : null
  const scene =
    world.zoneId === TABLE_ROOM_SCENE.zoneId ? TABLE_ROOM_SCENE : hearthScene
  const roomPoints = hearthScene
    ? hearthRoomWaypoints(world)
    : tableRoomWaypoints(world)
  const interactionProps = tableRoomInteractionProps(world)
  const hearthProps = hearthRoomProps(world)
  const labelProps = hearthScene ? hearthProps : interactionProps
  useEffect(() => {
    let disposed = false
    let app: Application | undefined
    const textures: Texture[] = []
    setReady(false)
    setError("")
    void (async () => {
      try {
        const { Application, Graphics, Assets, Sprite, Texture, Rectangle } =
          await import("pixi.js")
        const [loaded, environment] = await Promise.all([
          Promise.all(
            ids.map((id) => Assets.load(ROSTER_ASSETS[id].assets.world.url)),
          ),
          hearthScene
            ? Promise.all([
                Assets.load(hearthScene.assets.floor.url),
                Assets.load(hearthScene.assets.sideboard.url),
                Assets.load(hearthScene.assets.puzzles.url),
                Assets.load(hearthScene.assets.threshold.url),
              ])
            : scene
              ? Promise.all([
                  Assets.load(scene.assets.floor.url),
                  Assets.load(scene.assets.sideboard.url),
                  Assets.load(FORGOTTEN_HOST_WORLD.asset.url),
                  Assets.load(TABLE_ROOM_INTERACTIONS.assets.note.url),
                  Assets.load(TABLE_ROOM_INTERACTIONS.assets.threshold.url),
                ])
              : Promise.resolve([]),
        ])
        if (disposed) return
        for (const texture of environment) texture.source.scaleMode = "nearest"
        const next = new Application()
        await next.init({
          width: 640,
          height: 384,
          background: 0x233b32,
          antialias: false,
          preference: "webgl",
        })
        if (disposed) {
          next.destroy(true)
          return
        }
        app = next
        const room = ZONE_IDS.indexOf(world.zoneId) >= 3
        const terrain = new Graphics()
        if (scene) {
          const floor = new Sprite(environment[0])
          floor.width = scene.canvas.width
          floor.height = scene.canvas.height
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
        if (scene) {
          for (const prop of interactionProps) {
            const asset =
              TABLE_ROOM_INTERACTIONS.assets[
                prop.asset as keyof typeof TABLE_ROOM_INTERACTIONS.assets
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
                hearthScene.assets[prop.asset as "puzzles" | "threshold"]
              const f =
                prop.asset === "puzzles"
                  ? hearthScene.frames[
                      prop.frame as keyof typeof hearthScene.frames
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
          const frame = scene.assets.sideboard.frame
          const texture = new Texture({
            source: environment[1].source,
            frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
          })
          textures.push(texture)
          foreground = new Sprite(texture)
          foreground.anchor.set(scene.prop.anchorX, scene.prop.anchorY)
          foreground.position.set(scene.prop.x, scene.prop.y)
          foreground.width = scene.prop.width
          foreground.height = scene.prop.height
          foreground.zIndex = scene.prop.sortY + 10
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
                state.frame as keyof typeof FORGOTTEN_HOST_WORLD.frames
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
        next.ticker.add((ticker) => {
          const now = position.current
          // React may publish the destination before effect cleanup destroys this canvas.
          if (now.zoneId !== world.zoneId) return
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
            foreground.alpha = tableRoomPropAlpha(
              actors.map(({ sprite }) => {
                const bounds = sprite.getBounds()
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
                state.frame as keyof typeof FORGOTTEN_HOST_WORLD.frames
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
            const props = hearthScene
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
          prior = { ...now }
        })
        next.canvas.setAttribute("aria-hidden", "true")
        next.canvas.dataset.sceneId = scene?.id ?? "debug-terrain"
        next.canvas.dataset.partySize = String(ids.length)
        next.canvas.dataset.partyIds = JSON.stringify(ids)
        host.current?.replaceChildren(next.canvas)
        setReady(true)
      } catch (cause) {
        if (!disposed)
          setError(
            cause instanceof Error ? cause.message : "Chưa tải được bản đồ.",
          )
      }
    })()
    return () => {
      disposed = true
      app?.destroy(true, { children: true })
      textures.forEach((texture) => texture.destroy(false))
    }
  }, [world.zoneId, leaderId])
  return (
    <>
      <div
        ref={focusRef}
        className="aw2-world-map"
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
          const rect = event.currentTarget.getBoundingClientRect()
          onNavigate({
            x: ((event.clientX - rect.left) * 640) / rect.width,
            y: ((event.clientY - rect.top) * 384) / rect.height,
          })
        }}
      >
        <div ref={host} />
        {zoneById(world.zoneId).objects.map((object) => (
          <span
            key={object.id}
            className="aw2-world-label"
            style={{
              transform:
                (scene && object.id === FORGOTTEN_HOST_WORLD.entityId) ||
                labelProps.some((prop) => prop.entityId === object.id)
                  ? "translate(-50%, 0)"
                  : undefined,
              left: `${Math.max(12, Math.min(88, object.x / 6.4))}%`,
              top: `${(object.y + (labelProps.find((prop) => prop.entityId === object.id)?.labelOffsetY ?? (scene ? 24 : 0))) / 3.84}%`,
            }}
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
