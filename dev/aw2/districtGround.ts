import type { Sprite, Texture } from "pixi.js"
import type { JourneyFrame } from "../../src/aw2/assets/journeyScenes"
import type { Container } from "pixi.js"
interface District {
  landscape: JourneyFrame
  pavingFrame: JourneyFrame
  paths: readonly JourneyFrame[]
}
/** Same atlas grid for floor and paths; runtime crops only, original art is unchanged. */
export function addDistrictGround(
  stage: Container,
  floor: Texture,
  crop: (base: Texture, frame: JourneyFrame) => Texture,
  district: District,
  SpriteType: typeof Sprite,
) {
  // Crop ordinary sprites on a shared grid: stable atlas UVs and aligned roads.
  const pave = (
    area: {
      x: number
      y: number
      width: number
      height: number
    },
    tint: number,
    depth: number,
  ) => {
    const frame = district.pavingFrame
    for (
      let y = Math.floor(area.y / frame.height) * frame.height;
      y < area.y + area.height;
      y += frame.height
    )
      for (
        let x = Math.floor(area.x / frame.width) * frame.width;
        x < area.x + area.width;
        x += frame.width
      ) {
        const left = Math.max(x, area.x),
          top = Math.max(y, area.y)
        const width = Math.min(x + frame.width, area.x + area.width) - left
        const height = Math.min(y + frame.height, area.y + area.height) - top
        const tile = new SpriteType(
          crop(floor, {
            x: frame.x + left - x,
            y: frame.y + top - y,
            width,
            height,
          }),
        )
        tile.position.set(left, top)
        tile.tint = tint
        tile.zIndex = depth
        stage.addChild(tile)
      }
  }
  pave(district.landscape, 0x9db594, -1000)
  for (const path of district.paths) pave(path, 0xffffff, -990)
}
