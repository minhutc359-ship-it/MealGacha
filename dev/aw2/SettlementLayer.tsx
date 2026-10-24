import type { Texture, Sprite, Rectangle } from "pixi.js"
import {
  SETTLEMENT,
  settlementForZone,
  settlementRoofAlpha,
  type SettlementBuilding,
  type SettlementActor,
} from "../../src/aw2/assets/settlement"
import type { Waypoint } from "../../src/aw2/world/navigation"

type LoadedSettlement = {
  region: NonNullable<ReturnType<typeof settlementForZone>>
  bases: Texture[]
}
export async function loadSettlementTextures(
  zoneId: string,
  load: (url: string) => Promise<Texture>,
): Promise<LoadedSettlement | null> {
  const region = settlementForZone(zoneId)
  if (!region) return null
  return {
    region,
    bases: await Promise.all([
      load(SETTLEMENT.assets.homes.url),
      load(SETTLEMENT.assets.shops.url),
    ]),
  }
}
export interface SettlementSprite {
  building: SettlementBuilding
  sprite: Sprite
  assetId: string
}
export function createSettlementSprites(
  loaded: LoadedSettlement | null,
  pixi: {
    Sprite: typeof Sprite
    Texture: typeof Texture
    Rectangle: typeof Rectangle
  },
  owned: Texture[],
): SettlementSprite[] {
  if (!loaded) return []
  const frames: Record<string, Texture> = {}
  for (const [name, f] of Object.entries(SETTLEMENT.frames)) {
    const base = loaded.bases[f.asset === "homes" ? 0 : 1]
    base.source.scaleMode = "linear"
    const texture = new pixi.Texture({
      source: base.source,
      frame: new pixi.Rectangle(f.x, f.y, f.width, f.height),
    })
    owned.push(texture)
    frames[name] = texture
  }
  return loaded.region.buildings.map((building) => {
    const f =
      SETTLEMENT.frames[(building.frame as keyof typeof SETTLEMENT.frames)]
    const sprite = new pixi.Sprite(frames[building.frame])
    sprite.anchor.set(0.5, 1)
    sprite.position.set(building.x, building.y)
    sprite.width = building.width
    sprite.height = building.height
    sprite.zIndex = building.depth
    return {
      building,
      sprite,
      assetId: SETTLEMENT.assets[(f.asset as "homes" | "shops")].id,
    }
  })
}
export function renderSettlement(
  sprites: readonly SettlementSprite[],
  actors: readonly SettlementActor[],
) {
  return sprites.map(({ building, sprite, assetId }) => {
    sprite.alpha = settlementRoofAlpha(building, actors)
    return {
      id: building.id,
      frame: building.frame,
      assetId,
      x: sprite.x,
      y: sprite.y,
      width: sprite.width,
      height: sprite.height,
      depth: sprite.zIndex,
      alpha: sprite.alpha,
    }
  })
}
export function SettlementLandmarks({
  zoneId,
  disabled,
  onChoose,
}: {
  zoneId: string
  disabled: boolean
  onChoose: (p: Waypoint) => void
}) {
  const region = settlementForZone(zoneId)
  if (!region) return null
  return (
    <nav
      className="aw2-room-waypoints"
      aria-label="Dạo quanh khu phố"
      data-testid="settlement-landmarks"
    >
      <p>
        Khám phá ngõ nhà, hiên tiệm và sân chơi. Chọn điểm đến để đi bộ; ghé NPC
        để trò chuyện hoặc mở bàn luyện tập.
      </p>
      <div className="aw2-room-waypoint-grid">
        {region.landmarks.map((point) => (
          <button
            key={point.id}
            type="button"
            disabled={disabled}
            data-testid={`settlement-landmark-${point.id}`}
            onClick={() => onChoose({ x: point.x, y: point.y })}
          >
            {point.name}
          </button>
        ))}
      </div>
    </nav>
  )
}
