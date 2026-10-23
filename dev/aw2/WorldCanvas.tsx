import { useEffect, useRef, useState, type Ref } from "react"
import type { Application, Texture } from "pixi.js"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import { sampleWorldFrame } from "../../src/aw2/assets/animation"
import type { WorldProgress } from "../../src/aw2/world/model"
import { zoneById } from "../../src/aw2/world/maps"
import { KITCHEN_BOSS_ID, ZONE_IDS } from "../../src/aw2/world/ids"
import {
  TABLE_ROOM_SCENE,
  tableRoomPropAlpha,
  tableRoomWaypoints,
} from "../../src/aw2/assets/tableRoom"
import { FORGOTTEN_HOST_ASSETS } from "../../src/aw2/assets/forgottenHost"
import { RoomWaypoints } from "./RoomWaypoints"
import type { Waypoint } from "../../src/aw2/world/navigation"

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
  const ids = world.partyIds.length ? world.partyIds : ["aw2-than"]
  const partyKey = ids.join(",")
  const scene =
    world.zoneId === TABLE_ROOM_SCENE.zoneId ? TABLE_ROOM_SCENE : null
  const roomPoints = tableRoomWaypoints(world)
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
          scene
            ? Promise.all([
                Assets.load(scene.assets.floor.url),
                Assets.load(scene.assets.sideboard.url),
                Assets.load(FORGOTTEN_HOST_ASSETS.assets.battle.url),
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
          if (scene && object.id === KITCHEN_BOSS_ID) continue
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
        if (scene) {
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
          const pose =
            FORGOTTEN_HOST_ASSETS.frames[
              scene.bossMarker
                .frame as keyof typeof FORGOTTEN_HOST_ASSETS.frames
            ]
          const bossTexture = new Texture({
            source: environment[2].source,
            frame: new Rectangle(pose.x, pose.y, pose.width, pose.height),
          })
          textures.push(bossTexture)
          bossMarker = new Sprite(bossTexture)
          bossMarker.anchor.set(
            pose.anchorX / pose.width,
            pose.anchorY / pose.height,
          )
          bossMarker.scale.set(scene.bossMarker.height / pose.height)
          const object = zoneById(world.zoneId).objects.find(
            (object) => object.id === KITCHEN_BOSS_ID,
          )!
          bossMarker.position.set(object.x, object.y + 6)
          bossMarker.zIndex = object.y + 10
          next.stage.addChild(bossMarker)
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
        let trail = [{ ...position.current }]
        let prior = { ...position.current }
        let elapsed = 0
        const reduced = matchMedia("(prefers-reduced-motion: reduce)")
        next.stage.sortableChildren = true
        next.ticker.add((ticker) => {
          const now = position.current
          const moving =
            Math.hypot(now.x - prior.x, now.y - prior.y) > 0.05 &&
            !pauseRef.current
          if (moving) {
            elapsed += ticker.deltaMS
            if (Math.hypot(now.x - trail[0].x, now.y - trail[0].y) >= 3) {
              trail.unshift({ ...now })
              trail = trail.slice(0, 160)
            }
          }
          actors.forEach(({ manifest, frames, sprite }, index) => {
            let distance = 0,
              point = now
            if (index > 0) {
              point = trail[trail.length - 1]
              for (let i = 1; i < trail.length; i++) {
                distance += Math.hypot(
                  trail[i].x - trail[i - 1].x,
                  trail[i].y - trail[i - 1].y,
                )
                if (distance >= index * 27) {
                  point = trail[i]
                  break
                }
              }
            }
            const frameId = sampleWorldFrame(
              manifest,
              point.facing,
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
            sprite.position.set(point.x, point.y + 6)
            sprite.zIndex = point.y + 10
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
          if (bossMarker)
            bossMarker.alpha =
              now.questIndex === 4 ? 1 : now.bossDefeated ? 0.6 : 1
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
  }, [world.zoneId, partyKey])
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
              left: `${Math.max(12, Math.min(88, object.x / 6.4))}%`,
              top: `${(object.y + (scene ? 14 : 0)) / 3.84}%`,
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
            Đang gọi những người bạn…
          </p>
        )}
        {error && (
          <p className="aw2-map-loading" role="alert">
            Bản đồ: {error}
          </p>
        )}
      </div>
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
