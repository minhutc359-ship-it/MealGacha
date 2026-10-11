import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useGameStore } from "../../game/useGameStore"
import {
  ADVENTURE_MAP_BY_ID,
  pathTo,
  type AdventureMap,
} from "../../game/adventureWorld"
import {
  tileLabel,
  type AdventureDirection,
  type AdventureSave,
} from "../../game/adventure"
import { HumanSprite, SpiritSprite, WorldAsset } from "./AdventureArt"
import { CharacterPortrait } from "./CharacterPortrait"

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
}: {
  save: AdventureSave
  move: (direction: AdventureDirection) => void
  interact: () => void
}) {
  const map = ADVENTURE_MAP_BY_ID[save.mapId],
    stage = useRef<HTMLDivElement>(null)
  const [tileSize, setTileSize] = useState(48)
  const [goal, setGoal] = useState<{
    mapId: string
    x: number
    y: number
  } | null>(null)
  const cameraX = Math.max(0, Math.min(save.x - 6, map.grid[0].length - 13)),
    cameraY = Math.max(0, Math.min(save.y - 4, map.grid.length - 9))
  useEffect(() => {
    if (!stage.current) return
    const resize = new ResizeObserver(([entry]) =>
      setTileSize(entry.contentRect.width / 13),
    )
    resize.observe(stage.current)
    return () => resize.disconnect()
  }, [])
  useEffect(() => {
    if (!goal || save.encounter || save.service || goal.mapId !== map.id) {
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
  }, [goal, map, save.x, save.y, save.encounter, save.service])
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
    setGoal(null)
    move(direction)
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
          style={
            { height: tileSize * 9, "--tile": `${tileSize}px` } as CSSProperties
          }
        >
          <div
            className="adv-world-canvas"
            style={{
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
                <SpiritSprite cardId={save.team[0].cardId} />
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
        <Minimap map={map} save={save} />
      </div>
      <div className="adv-controls" aria-label="Điều khiển di chuyển">
        <button
          type="button"
          className="up"
          aria-label="Đi lên"
          onClick={() => onMove("up")}
        >
          ▲
        </button>
        <button
          type="button"
          className="left"
          aria-label="Đi trái"
          onClick={() => onMove("left")}
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
          TƯƠNG TÁC · E
        </button>
        <button
          type="button"
          className="right"
          aria-label="Đi phải"
          onClick={() => onMove("right")}
        >
          ▶
        </button>
        <button
          type="button"
          className="down"
          aria-label="Đi xuống"
          onClick={() => onMove("down")}
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
              useGameStore.getState().adventureAction({ type: "dismiss" })
            }
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
