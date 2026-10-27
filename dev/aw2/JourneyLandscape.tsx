import { useEffect, useRef, useState } from "react"
import type { Texture } from "pixi.js"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import { sampleWorldFrame } from "../../src/aw2/assets/animation"
import {
  journeyScene,
  journeyProps,
  journeyWaypoints,
  journeyObstacleAlpha,
} from "../../src/aw2/assets/journeyScenes"
import {
  landscapeCamera,
  projectVillage,
  unprojectVillage,
  villageWorldBounds,
  villageFoliage,
  type VillageCamera,
  type VillageViewMode,
} from "../../src/aw2/assets/villageView"
import type { Waypoint } from "../../src/aw2/world/navigation"
import type { WorldCanvasProps } from "./worldCanvasTypes"
import { PANTRY_STOCK } from "../../src/aw2/world/pantryLayout"
import {
  SceneLifetime,
  initializeWorldScene,
  firstWorldFrame,
} from "./sceneLifecycle"
import { npcForEntity, advanceNpcClock } from "../../src/aw2/assets/npcMotion"
import {
  loadNpcTextures,
  createNpcSprites,
  renderNpcSprites,
} from "./npcSprites"
import { settlementCameraSpec } from "../../src/aw2/assets/settlement"
import {
  loadSettlementTextures,
  createSettlementSprites,
  renderSettlement,
  SettlementLandmarks,
} from "./SettlementLayer"
import { RoomWaypoints } from "./RoomWaypoints"
import {
  createAmbientSprites,
  loadAmbientTextures,
  releaseAmbientTextures,
  renderAmbientSprites,
} from "./AmbientLayer"

/** Three remaining regions share authored layers; committed progress/economy stay read-only. */
export function JourneyLandscape({
  world,
  patrol,
  economy,
  onNavigate,
  paused,
  focusRef,
  onReadyChange,
}: WorldCanvasProps) {
  const scene = journeyScene(world.zoneId)!
  const patrolRef = useRef(patrol)
  patrolRef.current = patrol
  const committedEconomy = useRef(economy)
  committedEconomy.current = economy
  const host = useRef<HTMLDivElement>(null),
    position = useRef(world),
    pause = useRef(paused)
  const camera = useRef<VillageCamera | null>(null),
    pointer = useRef<Waypoint | null>(null)
  const labels = useRef(new Map<string, HTMLSpanElement>())
  const [mode, setMode] = useState<VillageViewMode>("follow"),
    viewMode = useRef(mode)
  const [ready, setReady] = useState(false),
    [error, setError] = useState("")
  position.current = world
  pause.current = paused
  viewMode.current = mode
  const leader = world.partyIds[0] ?? "aw2-than",
    points = journeyWaypoints(world, economy, patrol)
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
        leaderId: leader,
        ready,
        error,
        assertUsable,
      })
    const fail = (cause: unknown) => {
      if (lifetime.disposed) return
      const message =
        cause instanceof Error ? cause.message : "Chưa tải được phong cảnh."
      setReady(false)
      setError(message)
      signalReady(false, message)
      lifetime.dispose()
    }
    setReady(false)
    signalReady(false)
    setError("")
    camera.current = null
    void (async () => {
      try {
        const { Application, Assets, Sprite, Texture, Rectangle } =
          await import("pixi.js")
        const keys = Object.keys(scene.assets).filter(
          (key) =>
            !(scene.zoneId === "aw2-zone-lantern-street" && key === "props"),
        )
        const [loaded, body, loadedNpc, loadedSettlement, loadedAmbient] =
          await Promise.all([
            Promise.all(keys.map((key) => Assets.load(scene.assets[key].url))),
            Assets.load(ROSTER_ASSETS[leader].assets.world.url),
            loadNpcTextures(scene.zoneId, (url) => Assets.load(url)),
            loadSettlementTextures(scene.zoneId, (url) => Assets.load(url)),
            loadAmbientTextures(
              scene.zoneId,
              (url) => Assets.load(url),
              (url) => Assets.unload(url),
            ).then((loaded) => {
              lifetime.own(() =>
                releaseAmbientTextures(loaded.map((item) => item.asset.url)),
              )
              return loaded
            }),
          ])
        if (lifetime.disposed) return
        const assetTextures: Record<string, Texture> = Object.fromEntries(
          keys.map((key, i) => [key, loaded[i]]),
        )
        for (const [key, texture] of Object.entries(assetTextures))
          texture.source.scaleMode =
            key === "floor" || key === "foreground" ? "linear" : "nearest"
        body.source.scaleMode = "nearest"
        const next = new Application()
        await initializeWorldScene(
          next,
          {
            width: 640,
            height: 384,
            background: 0x193b32,
            antialias: false,
            preference: "webgl",
          },
          lifetime,
        )
        if (lifetime.disposed) return
        next.stage.sortableChildren = true
        const crop = (
          base: Texture,
          f: {
            x: number
            y: number
            width: number
            height: number
          },
        ) => {
          const t = new Texture({
            source: base.source,
            frame: new Rectangle(f.x, f.y, f.width, f.height),
          })
          textures.push(t)
          return t
        }
        const backdrop = new Sprite(assetTextures.floor)
        backdrop.position.set(scene.landscape.x, scene.landscape.y)
        backdrop.width = scene.landscape.width
        backdrop.height = scene.landscape.height
        backdrop.zIndex = -1000
        next.stage.addChild(backdrop)
        const npcSprites = createNpcSprites(
          loadedNpc,
          { Sprite, Texture, Rectangle },
          textures,
        )
        for (const npc of npcSprites) next.stage.addChild(npc.sprite)
        const settlement = createSettlementSprites(
          loadedSettlement,
          { Sprite, Texture, Rectangle },
          textures,
        )
        for (const item of settlement) next.stage.addChild(item.sprite)
        const ambient = createAmbientSprites(
          loadedAmbient,
          { Sprite, Texture, Rectangle },
          textures,
        )
        for (const item of ambient) next.stage.addChild(item.sprite)
        const objects = journeyProps(
          position.current,
          committedEconomy.current,
          patrolRef.current,
        )
          .filter((prop) => !npcForEntity(prop.entityId))
          .map((prop) => {
            const asset = scene.assets[(prop.asset as "props" | "threshold")]
            const f =
              prop.asset === "props"
                ? scene.frames[(prop.frame as keyof typeof scene.frames)]
                : scene.assets.threshold.frame!
            const sprite = new Sprite(crop(assetTextures[prop.asset], f))
            sprite.anchor.set(prop.anchorX, prop.anchorY)
            sprite.position.set(prop.x, prop.y)
            sprite.width = prop.width
            sprite.height = prop.height
            sprite.zIndex = prop.depth
            sprite.alpha = prop.alpha
            next.stage.addChild(sprite)
            return { entityId: prop.entityId, sprite, textureId: asset.id }
          })
        const well = new Sprite(
            crop(assetTextures[scene.obstacle.asset], scene.obstacle.frame),
          ),
          obstacle = scene.obstacle
        well.anchor.set(obstacle.anchorX, obstacle.anchorY)
        well.position.set(obstacle.x, obstacle.y)
        well.width = obstacle.width
        well.height = obstacle.height
        well.zIndex = obstacle.sortY + 10
        next.stage.addChild(well)
        const leaves = scene.foliage.map((prop) => {
          const sprite = new Sprite(
            crop(
              assetTextures.foreground,
              scene.foregroundFrames[
                (prop.frame as keyof typeof scene.foregroundFrames)
              ],
            ),
          )
          sprite.anchor.set(prop.anchorX, prop.anchorY)
          sprite.width = prop.width
          sprite.height = prop.height
          sprite.zIndex = prop.depth
          next.stage.addChild(sprite)
          return { sprite, id: prop.id }
        })
        const manifest = ROSTER_ASSETS[leader],
          frames: Record<string, Texture> = {}
        for (const [id, f] of Object.entries(manifest.frames))
          if (f.asset === "world") frames[id] = crop(body, f)
        const actor = new Sprite(frames[manifest.world.down.idle])
        next.stage.addChild(actor)
        const reduced = matchMedia("(prefers-reduced-motion: reduce)")
        let prior = { ...position.current },
          elapsed = 0,
          npcElapsed = 0
        const update = (ticker: import("pixi.js").Ticker) => {
          const now = position.current
          if (now.zoneId !== scene.zoneId) return
          npcElapsed = advanceNpcClock(
            npcElapsed,
            ticker.deltaMS,
            pause.current,
            reduced.matches,
          )
          const view = landscapeCamera(
            now,
            viewMode.current,
            settlementCameraSpec(scene, scene.zoneId),
          )
          next.stage.scale.set(view.zoom)
          next.stage.position.set(
            320 - view.x * view.zoom,
            192 - view.y * view.zoom,
          )
          camera.current = view
          const moving =
            Math.hypot(now.x - prior.x, now.y - prior.y) > 0.05 &&
            !pause.current
          if (moving) elapsed += ticker.deltaMS
          const frameId = sampleWorldFrame(
              manifest,
              now.facing,
              moving,
              elapsed,
              reduced.matches,
            ),
            f = manifest.frames[frameId]
          actor.texture = frames[frameId]
          actor.anchor.set(f.anchorX / f.width, f.anchorY / f.height)
          actor.scale.set(48 / f.height)
          actor.position.set(now.x, now.y + 6)
          actor.zIndex = now.y + 10
          const bounds = villageWorldBounds(actor.getBounds(), view)
          well.alpha = journeyObstacleAlpha(scene, {
            ...bounds,
            groundY: now.y,
          })
          const currentLeaves = villageFoliage(
            view,
            bounds,
            reduced.matches,
            scene,
          )
          for (const prop of currentLeaves) {
            const item = leaves.find((l) => l.id === prop.id)!
            item.sprite.position.set(prop.x, prop.y)
            item.sprite.alpha = prop.alpha
          }
          const currentProps = journeyProps(
            now,
            committedEconomy.current,
            patrolRef.current,
          )
          for (const prop of currentProps)
            (
              objects.find((o) => o.entityId === prop.entityId)?.sprite ??
              npcSprites.find((npc) => npc.manifest.entityId === prop.entityId)!
                .sprite
            ).alpha = prop.alpha
          next.canvas.dataset.npcMotion = JSON.stringify(
            renderNpcSprites(npcSprites, npcElapsed, reduced.matches, {
              world: now,
              patrol: patrolRef.current,
            }),
          )
          next.canvas.dataset.ambientMotion = JSON.stringify(
            renderAmbientSprites(ambient, npcElapsed, reduced.matches),
          )
          next.canvas.dataset.settlement = JSON.stringify(
            renderSettlement(settlement, [
              { ...bounds, groundY: now.y },
              ...npcSprites.map((npc) => ({
                ...villageWorldBounds(npc.sprite.getBounds(), view),
                groundY: npc.sprite.y,
              })),
            ]),
          )
          const canvasViewport = next.canvas.getBoundingClientRect()
          const clippedStage = host.current?.closest(".aw2-game-map")
          const stageViewport = clippedStage?.getBoundingClientRect()
          const toolbarBottom = clippedStage
            ?.querySelector(".aw2-map-toolbar")
            ?.getBoundingClientRect().bottom
          const viewport = stageViewport
            ? {
                left: Math.max(canvasViewport.left, stageViewport.left),
                right: Math.min(canvasViewport.right, stageViewport.right),
                top: Math.max(
                  canvasViewport.top,
                  toolbarBottom ?? stageViewport.top,
                ),
                bottom: Math.min(canvasViewport.bottom, stageViewport.bottom),
              }
            : canvasViewport
          const labelProps = [
            ...currentProps,
            ...(scene.zoneId === PANTRY_STOCK.zoneId
              ? [
                  {
                    entityId: PANTRY_STOCK.id,
                    x: PANTRY_STOCK.x,
                    y: PANTRY_STOCK.y,
                    ...PANTRY_STOCK.label,
                  },
                ]
              : []),
          ]
          for (const prop of labelProps) {
            const label = labels.current.get(prop.entityId)
            if (!label) continue
            const point = projectVillage(
              { x: prop.x + prop.labelOffsetX, y: prop.y + prop.labelOffsetY },
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
              const bounds = label.getBoundingClientRect()
              if (
                bounds.left < viewport.left ||
                bounds.right > viewport.right ||
                bounds.top < viewport.top ||
                bounds.bottom > viewport.bottom
              )
                label.style.visibility = "hidden"
            }
          }
          next.canvas.dataset.worldCamera = JSON.stringify(view)
          if (scene.zoneId === PANTRY_STOCK.zoneId)
            next.canvas.dataset.stockInspection = JSON.stringify({
              entityId: PANTRY_STOCK.id,
              interaction: { x: PANTRY_STOCK.x, y: PANTRY_STOCK.y },
              approach: PANTRY_STOCK.approach,
              visual: {
                x: well.x,
                y: well.y,
                width: well.width,
                height: well.height,
                textureId: scene.assets.props.id,
              },
            })
          next.canvas.dataset.representativeFrame = frameId
          next.canvas.dataset.partyPositions = JSON.stringify([
            { x: actor.x, y: actor.y },
          ])
          next.canvas.dataset.foregroundAlpha = String(well.alpha)
          next.canvas.dataset.groundDepths = JSON.stringify({
            prop: well.zIndex,
            actors: [actor.zIndex],
          })
          next.canvas.dataset.foliage = JSON.stringify(
            currentLeaves.map((prop) => ({
              ...prop,
              textureId: scene.assets.foreground.id,
            })),
          )
          next.canvas.dataset.interactionProps = JSON.stringify(
            currentProps.map((prop) => {
              const item =
                objects.find((o) => o.entityId === prop.entityId) ??
                (() => {
                  const npc = npcSprites.find(
                    (npc) => npc.manifest.entityId === prop.entityId,
                  )!
                  return {
                    sprite: npc.sprite,
                    textureId: npc.manifest.asset.id,
                  }
                })()
              return {
                entityId: prop.entityId,
                state: prop.state,
                x: item.sprite.x,
                y: item.sprite.y,
                width: item.sprite.width,
                height: item.sprite.height,
                alpha: item.sprite.alpha,
                depth: item.sprite.zIndex,
                textureId: item.textureId,
              }
            }),
          )
          prior = { ...now }
        }
        next.canvas.setAttribute("aria-hidden", "true")
        next.canvas.dataset.sceneId = scene.id
        next.canvas.dataset.partySize = "1"
        next.canvas.dataset.partyIds = JSON.stringify([leader])
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
  }, [leader, scene.id, onReadyChange])
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
          aria-pressed={mode === "follow"}
          onClick={() => setMode("follow")}
        >
          Bám nhân vật
        </button>
        <button
          type="button"
          disabled={!ready || paused}
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
        className="aw2-world-map aw2-village-map aw2-journey-map"
        data-testid="world-map"
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
            Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8 ||
            !camera.current
          )
            return
          const rect = host.current
            ?.querySelector("canvas")
            ?.getBoundingClientRect()
          if (!rect || rect.width <= 0 || rect.height <= 0) return
          onNavigate(
            unprojectVillage(
              {
                x: ((e.clientX - rect.left) * 640) / rect.width,
                y: ((e.clientY - rect.top) * 384) / rect.height,
              },
              camera.current,
            ),
          )
        }}
      >
        <div ref={host} />
        {[
          ...scene.props,
          ...(scene.zoneId === PANTRY_STOCK.zoneId
            ? [
                {
                  entityId: PANTRY_STOCK.id,
                  labelTransform: "translate(-50%, 0)",
                },
              ]
            : []),
        ].map((prop) => (
          <span
            key={prop.entityId}
            ref={(node) => {
              if (node) labels.current.set(prop.entityId, node)
              else labels.current.delete(prop.entityId)
            }}
            className="aw2-world-label"
            data-world-label={prop.entityId}
            style={{ transform: prop.labelTransform, visibility: "hidden" }}
          >
            {points.find((p) => p.id === prop.entityId)?.short}
          </span>
        ))}
        {!ready && !error && (
          <p className="aw2-map-loading" role="status">
            Đang tải phong cảnh…
          </p>
        )}
        {error && (
          <p className="aw2-map-loading" role="alert">
            Bản đồ: {error}
          </p>
        )}
      </div>
      <p data-testid="map-representative">
        Đại diện trên bản đồ: {ROSTER_ASSETS[leader].displayName}. Vị trí đầu
        trong đội đã lưu quyết định nhân vật đại diện.
      </p>
      <SettlementLandmarks
        zoneId={world.zoneId}
        disabled={!ready || paused}
        onChoose={(point) => {
          onNavigate(point)
          host.current?.parentElement?.focus({ preventScroll: true })
        }}
      />
      <RoomWaypoints
        world={world}
        patrol={patrol}
        economy={economy}
        disabled={!ready || paused}
        onChoose={(point) => {
          onNavigate(point)
          host.current?.parentElement?.focus({ preventScroll: true })
        }}
      />
    </>
  )
}
