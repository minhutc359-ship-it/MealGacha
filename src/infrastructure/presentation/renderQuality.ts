/** Presentation budget only; never feeds simulation, saves or battle timers. */
export class RenderBudget {
  light = false
  private slow = 0
  private fast = 0
  sample(gap: number, cost = 0) {
    if (!Number.isFinite(gap) || gap <= 0 || gap > 250) { this.slow = this.fast = 0; return false }
    const previous = this.light
    if (gap > 35 || cost > 14) { this.slow++; this.fast = 0 }
    else { this.fast++; this.slow = Math.max(0, this.slow - 1) }
    if (!this.light && this.slow >= 45) { this.light = true; this.slow = 0 }
    if (this.light && this.fast >= 300) { this.light = false; this.fast = 0 }
    return previous !== this.light
  }
  reset() { this.slow = this.fast = 0 }
}
const budget = new RenderBudget()
let manual = false
const listeners = new Set<() => void>()
export const renderIsLight = () => manual || budget.light
export const subscribeRenderQuality = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
function notify() { for (const listener of listeners) listener() }
export function setRenderPreference(light: boolean) { const before = renderIsLight(); manual = light; if (before !== renderIsLight()) notify() }
export function sampleRenderFrame(gap: number, cost = 0) { if (budget.sample(gap, cost)) notify() }
export const resetRenderSampling = () => budget.reset()
export const renderDpr = () => Math.min(renderIsLight() ? 1 : 2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1)
