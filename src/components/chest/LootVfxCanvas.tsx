import { useEffect, useRef } from "react"
import type { Application as PixiApplication } from "pixi.js"

interface Props {
  state: string
  accent: string
  reducedMotion: boolean
  rarity: string | null
}

function toHex(color: string): number {
  return Number.parseInt(color.replace("#", ""), 16)
}

export function LootVfxCanvas({ state, accent, reducedMotion, rarity }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef(state)
  const reducedMotionRef = useRef(reducedMotion)
  const rarityRef = useRef(rarity)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    reducedMotionRef.current = reducedMotion
  }, [reducedMotion])

  useEffect(() => {
    rarityRef.current = rarity
  }, [rarity])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let app: PixiApplication | null = null

    void (async () => {
      try {
        const { Application, Container, Graphics } = await import("pixi.js")
        const nextApp = new Application()
        await nextApp.init({
          resizeTo: host,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          preference: "webgl",
          powerPreference: "high-performance",
        })
        if (disposed) {
          nextApp.destroy({ removeView: true }, { children: true })
          return
        }

        app = nextApp
        nextApp.canvas.setAttribute("aria-hidden", "true")
        host.appendChild(nextApp.canvas)

        const color = toHex(accent)
        const scene = new Container()
        const ringGroup = new Container()
        const aura = new Graphics().circle(0, 0, 86).fill({ color, alpha: 0.12 })
        const outerRing = new Graphics().circle(0, 0, 184).stroke({ width: 1.2, color, alpha: 0.33 })
        const middleRing = new Graphics().circle(0, 0, 145).stroke({ width: 1, color: 0xa8f3f7, alpha: 0.2 })
        const shockwave = new Graphics().circle(0, 0, 52).stroke({ width: 4, color: 0xa8f3f7, alpha: 0.9 })
        const echoWave = new Graphics().circle(0, 0, 46).stroke({ width: 1.5, color, alpha: 0.65 })
        shockwave.alpha = 0
        echoWave.alpha = 0

        for (let index = 0; index < 12; index += 1) {
          const angle = (Math.PI * 2 * index) / 12
          const rune = new Graphics()
            .rect(-3, -3, 6, 6)
            .fill({ color, alpha: index % 3 === 0 ? 0.7 : 0.32 })
          rune.position.set(Math.cos(angle) * 184, Math.sin(angle) * 184)
          rune.rotation = angle + Math.PI / 4
          ringGroup.addChild(rune)
        }
        ringGroup.addChild(outerRing, middleRing)

        const dust = Array.from({ length: 32 }, (_, index) => {
          const particle = new Graphics()
            .circle(0, 0, index % 5 === 0 ? 1.8 : 1)
            .fill({ color: index % 4 === 0 ? 0xe8c777 : color, alpha: 0.45 })
          const angle = (Math.PI * 2 * index) / 32
          const radius = 70 + ((index * 29) % 150)
          particle.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius)
          scene.addChild(particle)
          return { particle, angle, radius, speed: 0.00025 + (index % 7) * 0.00006 }
        })

        const burst = Array.from({ length: 28 }, (_, index) => {
          const shard = new Graphics()
            .roundRect(-1.5, -5, 3, 10, 2)
            .fill({ color: index % 4 === 0 ? 0xe8c777 : 0xa8f3f7, alpha: 0.95 })
          shard.alpha = 0
          shard.rotation = (Math.PI * 2 * index) / 28
          scene.addChild(shard)
          return { shard, angle: (Math.PI * 2 * index) / 28, velocity: 105 + (index % 6) * 17 }
        })

        scene.addChild(aura, ringGroup, shockwave, echoWave)
        nextApp.stage.addChild(scene)

        let lastState = stateRef.current
        let impactStartedAt = 0
        let burstStartedAt = 0
        let pulseStartedAt = 0
        let elapsed = 0
        nextApp.ticker.add((ticker) => {
          elapsed += ticker.deltaMS
          scene.position.set(nextApp.renderer.width / 2, nextApp.renderer.height / 2 + 12)

          const currentState = stateRef.current
          const isCharging = ["locking", "charging", "pulse"].includes(currentState)
          const isSuspense = currentState === "anticipation"
          const isRevealing = ["impact", "opening", "reward-rise", "result"].includes(currentState)
          const rarityColor = rarityRef.current === "diamond"
            ? 0xd9fbff
            : rarityRef.current === "epic"
              ? 0xe8c777
              : rarityRef.current === "rare"
                ? 0x35d6e6
                : color
          if (!reducedMotionRef.current) {
            ringGroup.rotation += ticker.deltaTime * (isCharging ? 0.008 : isSuspense ? 0.0007 : 0.0015)
            middleRing.rotation -= ticker.deltaTime * (isCharging ? 0.013 : isSuspense ? 0.001 : 0.0025)
          }
          ringGroup.alpha = isCharging ? 0.94 : isSuspense ? 0.38 : 0.62
          aura.tint = rarityColor
          aura.alpha = isRevealing ? 0.22 : isCharging ? 0.16 : 0.08
          aura.scale.set(1 + Math.sin(elapsed * 0.003) * (isCharging ? 0.18 : 0.06))

          dust.forEach(({ particle, angle, radius, speed }, index) => {
            const drift = elapsed * speed * (isCharging ? 2.4 : isSuspense ? 0.35 : 1)
            particle.position.set(
              Math.cos(angle + drift) * radius,
              Math.sin(angle + drift) * radius * 0.68,
            )
            particle.alpha = (isCharging ? 0.55 : 0.24) + Math.sin(elapsed * 0.002 + index) * 0.12
          })

          if (currentState === "pulse" && lastState !== "pulse") {
            pulseStartedAt = performance.now()
          }
          if (pulseStartedAt > 0) {
            const progress = Math.min((performance.now() - pulseStartedAt) / 460, 1)
            aura.scale.set(1 + Math.sin(progress * Math.PI) * 0.62)
            aura.alpha = 0.16 + Math.sin(progress * Math.PI) * 0.36
            if (progress === 1) pulseStartedAt = 0
          }

          if (currentState === "impact" && lastState !== "impact") {
            impactStartedAt = performance.now()
            burstStartedAt = impactStartedAt
            shockwave.alpha = 1
            shockwave.scale.set(0.45)
            echoWave.alpha = 0.8
            echoWave.scale.set(0.35)
          }
          if (impactStartedAt > 0) {
            const progress = Math.min((performance.now() - impactStartedAt) / 560, 1)
            shockwave.scale.set(0.45 + progress * 3.5)
            shockwave.alpha = 1 - progress
            const echoProgress = Math.max(0, Math.min((progress - 0.18) / 0.82, 1))
            echoWave.scale.set(0.35 + echoProgress * 4.2)
            echoWave.alpha = (1 - echoProgress) * 0.72
            if (progress === 1) impactStartedAt = 0
          }
          if (burstStartedAt > 0) {
            const progress = Math.min((performance.now() - burstStartedAt) / 760, 1)
            burst.forEach(({ shard, angle, velocity }, index) => {
              const distance = velocity * (1 - (1 - progress) ** 2)
              shard.position.set(Math.cos(angle) * distance, Math.sin(angle) * distance)
              shard.rotation = angle + progress * (index % 2 === 0 ? 2.4 : -2.4)
              shard.alpha = Math.sin(progress * Math.PI) * (["epic", "diamond"].includes(rarityRef.current ?? "") ? 1 : 0.72)
              shard.tint = rarityColor
            })
            if (progress === 1) {
              burstStartedAt = 0
              burst.forEach(({ shard }) => { shard.alpha = 0 })
            }
          }
          lastState = currentState
        })
      } catch {
        // DOM/CSS chest is the guaranteed fallback when WebGL is unavailable.
      }
    })()

    return () => {
      disposed = true
      app?.destroy({ removeView: true }, { children: true })
    }
  }, [accent])

  return <div ref={hostRef} className="pixi-vfx" aria-hidden="true" />
}
