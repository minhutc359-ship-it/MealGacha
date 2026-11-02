import type { WorldProgress } from "@/aw2/world/model"
/** v1–8 never contained earned table/summon state. Keep historical mocks strict. */
export function beforeEarnedModes<T extends object>(save: T) {
  const { modes, summons, ...legacy } = save as T & {
    modes?: unknown
    summons?: unknown
  }
  return legacy
}
/** Historical envelopes never contained the v6 interior property. */
export function legacyProgress(progress: WorldProgress) {
  const { interior, ...legacy } = progress
  return legacy
}
