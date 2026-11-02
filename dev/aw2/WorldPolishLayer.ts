import type { Container, Graphics } from "pixi.js"
import type { ZoneId } from "../../src/aw2/world/ids"
import {
  worldPolishFrame,
  worldPolishProfile,
  worldPolishTelemetry,
} from "../../src/aw2/assets/worldPolish"

interface PolishControls {
  paused: boolean
  reduced: boolean
}

/** Pixi-only presentation. It never participates in hit testing or world authority. */
export function createWorldPolishLayer(
  stage: Container,
  zoneId: ZoneId,
  GraphicsType: typeof Graphics,
) {
  const profile = worldPolishProfile(zoneId)
  const edges = new GraphicsType()
  edges.eventMode = "none"
  edges.zIndex = -970
  for (const segment of worldPolishFrame(zoneId, 0, 0, { reduced: true })
    .edges) {
    edges
      .rect(segment.x, segment.y, segment.width, segment.height)
      .fill(profile.edgeColor)
    const horizontal = segment.edge === "north" || segment.edge === "south"
    const length = horizontal ? segment.width : segment.height
    for (let offset = 8; offset < length; offset += 20) {
      const x = horizontal ? segment.x + offset : segment.x + 8
      const y = horizontal ? segment.y + 8 : segment.y + offset
      if (profile.edgeStyle === "lantern")
        edges.rect(x - 2, y - 4, 4, 8).fill(profile.edgeAccent)
      else if (profile.edgeStyle === "pantry" || profile.edgeStyle === "table")
        edges
          .roundRect(x - 5, y - 3, 10, 6, 2)
          .fill({ color: profile.edgeAccent, alpha: 0.72 })
      else
        edges
          .circle(x, y, profile.edgeStyle === "hearth" ? 3 : 4)
          .fill({ color: profile.edgeAccent, alpha: 0.76 })
    }
  }

  const shadows = new GraphicsType()
  shadows.eventMode = "none"
  shadows.zIndex = 303
  for (const shadow of worldPolishFrame(zoneId, 0, 0, { reduced: true })
    .colliders)
    shadows
      .ellipse(
        shadow.x + shadow.width / 2,
        shadow.y + shadow.height / 2,
        shadow.width / 2,
        shadow.height / 2,
      )
      .fill({ color: profile.shadowColor, alpha: 0.5 })

  const lightPools = profile.lights.map((light) => {
    const graphic = new GraphicsType()
    graphic.eventMode = "none"
    graphic.zIndex = -960
    graphic.blendMode = "screen"
    graphic
      .circle(light.x, light.y, light.radius)
      .fill({ color: light.color, alpha: 0.08 })
      .circle(light.x, light.y, light.radius * 0.62)
      .fill({ color: light.color, alpha: 0.17 })
      .circle(light.x, light.y, light.radius * 0.28)
      .fill({ color: light.color, alpha: 0.32 })
    return { id: light.id, graphic }
  })
  const lightById = new Map(
    lightPools.map((light) => [light.id, light.graphic]),
  )

  const ambient = new GraphicsType()
  ambient.eventMode = "none"
  ambient.zIndex = 9000
  ambient.blendMode = "multiply"
  ambient.rect(-512, -384, 1664, 1152).fill(0xffffff)

  stage.addChild(
    edges,
    shadows,
    ...lightPools.map((item) => item.graphic),
    ambient,
  )

  return {
    render(lifeMs: number, animationMs: number, controls: PolishControls) {
      const frame = worldPolishFrame(zoneId, lifeMs, animationMs, controls)
      ambient.tint = frame.ambient.color
      ambient.alpha = frame.ambient.alpha
      for (const light of frame.lights)
        lightById.get(light.id)!.alpha = light.intensity
      return worldPolishTelemetry(frame)
    },
  }
}
