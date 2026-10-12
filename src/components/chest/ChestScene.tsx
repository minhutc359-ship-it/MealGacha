import { useMemo } from "react"
import type React from "react"
import type { RewardRarity } from "../../domain/models"
import { LootVfxCanvas } from "./LootVfxCanvas"

export function ChestScene({
  state,
  accent,
  reducedMotion,
  rarity,
}: {
  state: string
  accent: string
  reducedMotion: boolean
  rarity: RewardRarity | null
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        angle: (360 / 22) * index,
        delay: (index % 6) * 0.07,
        distance: 90 + (index % 5) * 18,
      })),
    [],
  )

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    event.currentTarget.style.setProperty("--tilt-x", `${y * -7}deg`)
    event.currentTarget.style.setProperty("--tilt-y", `${x * 9}deg`)
  }

  const resetPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg")
    event.currentTarget.style.setProperty("--tilt-y", "0deg")
  }

  return (
    <div
      className={`chest-scene scene-${state} scene-rarity-${rarity ?? "common"}`}
      style={{ "--scene-accent": accent } as React.CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <LootVfxCanvas
        state={state}
        accent={accent}
        reducedMotion={reducedMotion}
        rarity={rarity}
      />
      <div className="scene-stars" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
      <div className="ritual-halo" />
      <div className="ritual-ring ritual-ring-outer">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="ritual-ring ritual-ring-inner">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="vertical-ray" />
      <div className="energy-column" />
      <div className="scene-vignette" />
      <div className="cinematic-bar cinematic-bar-top" />
      <div className="cinematic-bar cinematic-bar-bottom" />
      <div className="scene-flash" />
      <div className="lens-flare" />
      <div className="shockwave shockwave-primary" />
      <div className="shockwave shockwave-secondary" />

      <div className="taste-key" aria-hidden="true">
        <span className="key-head">◇</span>
        <span className="key-shaft" />
        <span className="key-tooth" />
        <i className="key-spark" />
      </div>

      <div className="chest-parallax">
        <div className="chest-model" aria-hidden="true">
          <div className="chest-shadow" />
          <div className="chest-lid">
            <div className="lid-face">
              <span />
              <span />
            </div>
          </div>
          <div className="chest-body">
            <div className="body-panel left" />
            <div className="body-panel right" />
            <div className="chest-core">
              <span>◇</span>
            </div>
            <div className="chest-band" />
          </div>
          <div className="inner-light" />
        </div>
      </div>

      <div className="reward-sigil">
        <span>✦</span>
      </div>
      <div className="burst-particles" aria-hidden="true">
        {particles.map((particle) => (
          <i
            key={particle.id}
            style={
              {
                "--particle-angle": `${particle.angle}deg`,
                "--particle-delay": `${particle.delay}s`,
                "--particle-distance": `${particle.distance}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}
