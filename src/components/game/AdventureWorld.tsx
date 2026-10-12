import { SceneAtmosphere } from "./SceneAtmosphere"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react"
import { useGameStore } from "../../game/useGameStore"
import {
  ADVENTURE_MAP_BY_ID,
  pathTo,
  type AdventureMap,
} from "../../game/adventureWorld"
import {
  ADVENTURE_AREA_MAP,
  tileLabel,
  type AdventureDirection,
  type AdventureSave,
} from "../../game/adventure"
import { HumanSprite, SpiritSprite, WorldAsset } from "./AdventureArt"
import { CharacterPortrait } from "./CharacterPortrait"
import { useModeIntroStore } from "../../game/modeIntroState"

const directionTo = (
  from: { x: number; y: number },
  to: { x: number; y: number },
): AdventureDirection =>
  to.x > from.x
    ? "right"
    : to.x < from.x
      ? "left"
      : to.y > from.y
        ? "down"
        : "up"
function Minimap({ map, save }: { map: AdventureMap; save: AdventureSave }) {
  return (
    <svg
      className="adv-minimap"
      viewBox={`0 0 ${map.grid[0].length} ${map.grid.length}`}
      role="img"
      aria-label={`Vị trí hiện tại: ${save.x + 1}, ${save.y + 1}`}
    >
      {map.grid.flatMap((row, y) =>
        [...row].map((cell, x) => (
          <rect
            key={`${x},${y}`}
            x={x}
            y={y}
            width="1"
            height="1"
            fill={
              cell === "w"
                ? "#729ba9"
                : cell === "t" || cell === "#"
                  ? "#365c48"
                  : cell === "g"
                    ? "#8baf66"
                    : cell === "n"
                      ? "#d99459"
                      : "#c7c397"
            }
          />
        )),
      )}
      <rect
        x={save.x - 0.35}
        y={save.y - 0.35}
        width="1.7"
        height="1.7"
        fill="#ffef9c"
        stroke="#443c2c"
        strokeWidth=".25"
      />
    </svg>
  )
}
export function AdventureWorld({
  save,
  move,
  interact,
  readOnly = false,
  paused = false,
}: {
  save: AdventureSave
  move: (direction: AdventureDirection) => void
  interact: () => void
  readOnly?: boolean
  paused?: boolean
}) {
  const before = useRef({steps:save.steps,map:save.mapId})
  useEffect(()=>{
    const prior = before.current;before.current={steps:save.steps,map:save.mapId}
    if(readOnly)return
    if(prior.map !== save.mapId)gameAudio.play("door")
    else if(prior.steps !== save.steps)gameAudio.play("footstep",0,save.facing === "left" ? -.2 : .2)
  },[save.steps,save.mapId,save.facing,readOnly])
  const map = ADVENTURE_MAP_BY_ID[save.mapId],
    stage = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 624, height: 432 })
  const tileSize = Math.max(20, viewport.width / 13, viewport.height / 12)
  const columns = viewport.width / tileSize, rows = viewport.height / tileSize
  const heldMove = useRef<number | null>(null)
  const stopHeldMove = () => {
    if (heldMove.current !== null) clearInterval(heldMove.current)
    heldMove.current = null
  }
  useEffect(() => {
    stopHeldMove()
    const hidden = () => { if (document.hidden) stopHeldMove() }
    document.addEventListener("visibilitychange", hidden)
    window.addEventListener("blur", stopHeldMove)
    return () => { stopHeldMove(); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("blur", stopHeldMove) }
  }, [save.mapId, save.encounter, save.service, readOnly])
  const introOpen = useModeIntroStore(state => !!state.mode)
  const [goal, setGoal] = useState<{
    mapId: string
    x: number
    y: number
  } | null>(null)
  const cameraX = Math.max(0, Math.min(save.x + .5 - columns / 2, map.grid[0].length - columns)),
    cameraY = Math.max(0, Math.min(save.y + .5 - rows / 2, map.grid.length - rows))
  useEffect(() => {
    if (!stage.current) return
    const resize = new ResizeObserver(([entry]) =>
      setViewport({width: entry.contentRect.width, height: entry.contentRect.height}),
    )
    resize.observe(stage.current)
    return () => resize.disconnect()
  }, [])
  useEffect(() => {
    if (readOnly || introOpen || !goal || save.encounter || save.service || goal.mapId !== map.id) {
      if (goal) setGoal(null)
      return
    }
    const path = pathTo(map, save, goal)
    if (!path.length) {
      if (Math.abs(save.x - goal.x) + Math.abs(save.y - goal.y) === 1) {
        const direction = directionTo(save, goal)
        // Face the object (collision does not move the player), then interact from current store state.
        useGameStore.getState().adventureAction({ type: "move", direction })
        useGameStore.getState().adventureAction({ type: "interact" })
      }
      if (map.grid[save.y]?.[save.x] === "r")
        useGameStore.getState().adventureAction({ type: "interact" })
      setGoal(null)
      return
    }
    const timer = window.setTimeout(() => {
      if (readOnly || useModeIntroStore.getState().mode) return
      useGameStore
        .getState()
        .adventureAction({
          type: "move",
          direction: directionTo(save, path[0]),
        })
      const next = useGameStore.getState().save.adventure
      if (next?.x === save.x && next.y === save.y && next.mapId === map.id)
        setGoal(null)
    }, 160)
    return () => clearTimeout(timer)
  }, [goal, map, save.x, save.y, save.encounter, save.service, introOpen, readOnly])
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => {
      if (
        event.key in
        {
          w: 1,
          a: 1,
          s: 1,
          d: 1,
          ArrowUp: 1,
          ArrowDown: 1,
          ArrowLeft: 1,
          ArrowRight: 1,
        }
      )
        setGoal(null)
    }
    window.addEventListener("keydown", cancel)
    return () => window.removeEventListener("keydown", cancel)
  }, [])
  const onMove = (direction: AdventureDirection) => {
    if (readOnly) return
    setGoal(null)
    move(direction)
  }
  const holdMove = (event: PointerEvent<HTMLButtonElement>, direction: AdventureDirection) => {
    if (readOnly || event.button !== 0 || save.encounter || save.service === "shop") return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    stopHeldMove()
    onMove(direction)
    heldMove.current = window.setInterval(() => {
      if (document.hidden || useModeIntroStore.getState().mode) { stopHeldMove(); return }
      onMove(direction)
    }, 160)
  }
  return (
    <>
      <div
        className={`adv-map-frame theme-${save.areaId} ${
          map.interior ? "is-interior" : ""
        }`}
      >
        <div className="adv-world-heading">
          <span>{map.interior ? "NỘI THẤT" : "KHÁM PHÁ"}</span>
          <strong>{map.name}</strong>
          <span className="adv-objective-hud">{ADVENTURE_AREA_MAP[save.areaId].objective}</span>
          <small>
            {goal
              ? "Đang đi tới điểm chọn…"
              : "Chọn điểm để đi · WASD / ↑↓←→ · Shift chạy · E tương tác"}
          </small>
        </div>
        <div
          ref={stage}
          className="adv-world-viewport"
          tabIndex={0}
          role="region"
          aria-label={`Bản đồ ${map.name}. Dùng phím mũi tên để di chuyển.`}
          style={{ "--tile": `${tileSize}px` } as CSSProperties}
        >
          <div
            className="adv-world-canvas"
            style={{
              left: Math.max(0, (viewport.width - tileSize * map.grid[0].length) / 2),
              top: Math.max(0, (viewport.height - tileSize * map.grid.length) / 2),
              width: tileSize * map.grid[0].length,
              height: tileSize * map.grid.length,
              transform: `translate(${-cameraX * tileSize}px, ${-cameraY * tileSize}px)`,
            }}
          >
            {map.grid.flatMap((row, y) =>
              [...row].map((cell, x) => {
                const find = map.finds.find(
                    (item) => item.x === x && item.y === y,
                  ),
                  available = find && !save.claimedFinds.includes(find.id)
                return (
                  <button
                    type="button"
                    key={`${x},${y}`}
                    tabIndex={-1}
                    className={`adv-world-tile cell-${
                      cell === "." ? "floor" : cell
                    }`}
                    style={{ left: x * tileSize, top: y * tileSize }}
                    aria-label={`${tileLabel(cell)}, ${x + 1}, ${y + 1}`}
                    onClick={() => setGoal({ mapId: map.id, x, y })}
                  >
                    {cell === "t" && <WorldAsset id="tree" />}
                    {cell === "g" && <WorldAsset id="grass" />}
                    {cell === "s" && <WorldAsset id="sign" />}
                    {cell === "r" && <WorldAsset id="storage" />}
                    {available && <WorldAsset id="gift" />}
                    {cell === "d" && <span className="adv-door-mark">▴</span>}
                    {cell === "e" && <span className="adv-exit-mark">⇄</span>}
                  </button>
                )
              }),
            )}
            {map.houses.map((house) => (
              <div
                key={house.id}
                className={`adv-house house-${house.kind}`}
                style={{
                  left: house.x * tileSize,
                  top: (house.y - 1) * tileSize,
                  width: house.width * tileSize,
                  height: (house.height + 1) * tileSize,
                }}
              >
                <WorldAsset id={`house-${house.kind}`} />
                <span>{house.name}</span>
              </div>
            ))}
            {map.npcs.map((npc) => (
              <button
                type="button"
                tabIndex={-1}
                key={npc.id}
                className={`adv-world-person ${
                  npc.role === "keeper" ? "is-keeper" : ""
                }`}
                style={{ left: npc.x * tileSize, top: npc.y * tileSize }}
                aria-label={`${npc.name} · nhấn để đến tương tác`}
                onClick={() => setGoal({ mapId: map.id, x: npc.x, y: npc.y })}
              >
                <HumanSprite character={npc.character} />
                <small>
                  {npc.role === "trainer" || npc.role === "keeper" ? "⚔" : "…"}
                </small>
                <span>{npc.name}</span>
              </button>
            ))}
            {save.follower && save.team[0]?.hp > 0 && (
              <div
                className="adv-world-follower"
                style={{
                  left: save.follower.x * tileSize,
                  top: save.follower.y * tileSize,
                }}
              >
                <SpiritSprite cardId={save.team[0].cardId} back={save.facing === "left"} stamp={`${save.steps}`} />
              </div>
            )}
            <div
              className="adv-world-player"
              style={{ left: save.x * tileSize, top: save.y * tileSize }}
            >
              <HumanSprite
                character="hero"
                direction={save.facing}
                frame={save.steps}
              />
            </div>
            {goal && (
              <div
                className="adv-goal"
                style={{ left: goal.x * tileSize, top: goal.y * tileSize }}
              />
            )}
          </div>
        </div>
        <SceneAtmosphere kind={save.areaId === "rain-harbor" ? "rain" : save.areaId === "herb-garden" ? "leaves" : "motes"} paused={paused} />
        <Minimap map={map} save={save} />
      </div>
      <div className="adv-controls" aria-label="Điều khiển di chuyển">
        <button
          type="button"
          className="up"
          aria-label="Đi lên"
          onPointerDown={event => holdMove(event, "up")}
          onPointerUp={stopHeldMove}
          onPointerCancel={stopHeldMove}
          onLostPointerCapture={stopHeldMove}
          onClick={event => { if (event.detail === 0) onMove("up") }}
        >
          ▲
        </button>
        <button
          type="button"
          className="left"
          aria-label="Đi trái"
          onPointerDown={event => holdMove(event, "left")}
          onPointerUp={stopHeldMove}
          onPointerCancel={stopHeldMove}
          onLostPointerCapture={stopHeldMove}
          onClick={event => { if (event.detail === 0) onMove("left") }}
        >
          ◀
        </button>
        <button
          type="button"
          className="interact"
          onClick={() => {
            setGoal(null)
            interact()
          }}
        >
          TƯƠNG TÁC
        </button>
        <button
          type="button"
          className="right"
          aria-label="Đi phải"
          onPointerDown={event => holdMove(event, "right")}
          onPointerUp={stopHeldMove}
          onPointerCancel={stopHeldMove}
          onLostPointerCapture={stopHeldMove}
          onClick={event => { if (event.detail === 0) onMove("right") }}
        >
          ▶
        </button>
        <button
          type="button"
          className="down"
          aria-label="Đi xuống"
          onPointerDown={event => holdMove(event, "down")}
          onPointerUp={stopHeldMove}
          onPointerCancel={stopHeldMove}
          onLostPointerCapture={stopHeldMove}
          onClick={event => { if (event.detail === 0) onMove("down") }}
        >
          ▼
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
            aria-label="Đóng lời nhắn"
            onClick={() =>
              !readOnly && useGameStore.getState().adventureAction({ type: "dismiss" })
            }
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
