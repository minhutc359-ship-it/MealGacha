import { describe, expect, it, vi } from "vitest"
import { drawImpactTexture } from "@/game/battleVfx"
import type { School } from "@/game/types"

describe("shared impact atlas", () => {
  it("keeps all five elements inside their own cell and blends with bounded opacity", () => {
    const image = {
      complete: true,
      naturalWidth: 1000,
      naturalHeight: 1000,
    } as HTMLImageElement
    for (const school of [
      "ember",
      "tide",
      "grove",
      "hearth",
      "sugar",
    ] as School[]) {
      for (const age of [0, 0.07, 0.21, 0.35, 0.56, 0.699]) {
        const calls: { alpha: number; values: number[] }[] = []
        const ctx = {
          globalAlpha: 1,
          beginPath: vi.fn(), arc: vi.fn(), clip: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          drawImage: (_image: unknown, ...values: number[]) =>
            calls.push({ alpha: ctx.globalAlpha, values }),
        }
        drawImpactTexture(
          ctx as unknown as CanvasRenderingContext2D,
          { x: 30, y: 40 },
          school,
          age,
          40,
          image,
        )
        expect(calls.length).toBeGreaterThan(0)
        expect(calls.length).toBeLessThanOrEqual(2)
        for (const {
          alpha,
          values: [x, y, w, h, ...dest],
        } of calls) {
          expect(alpha).toBeGreaterThan(0)
          expect(alpha).toBeLessThanOrEqual(0.78)
          expect(x).toBeGreaterThanOrEqual(0)
          expect(x + w).toBeLessThanOrEqual(1000)
          expect(y).toBeGreaterThanOrEqual(0)
          expect(y + h).toBeLessThanOrEqual(1000)
          expect(Math.floor(y / 200)).toBe(
            ["ember", "tide", "grove", "hearth", "sugar"].indexOf(school),
          )
          expect(w).toBe(190)
          expect(h).toBe(190)
          expect(dest.every(Number.isFinite)).toBe(true)
        }
        expect(ctx.save).toHaveBeenCalledOnce()
        expect(ctx.restore).toHaveBeenCalledOnce()
      }
    }
  })
  it("draws no texture outside the impact window or before image decode", () => {
    const ctx = { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D
    const ready = {
      complete: true,
      naturalWidth: 1000,
      naturalHeight: 1000,
    } as HTMLImageElement
    for (const age of [-1, 0.7, 1])
      drawImpactTexture(ctx, { x: 0, y: 0 }, "tide", age, 30, ready)
    drawImpactTexture(ctx, { x: 0, y: 0 }, "tide", 0.2, 30, {
      complete: false,
    } as HTMLImageElement)
    expect(ctx.drawImage).not.toHaveBeenCalled()
  })
})
