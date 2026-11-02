import type { WorldProgress } from "@/aw2/world/model"
/** Historical envelopes never contained the v6 interior property. */
export function legacyProgress(progress: WorldProgress) {
  const { interior, ...legacy } = progress
  return legacy
}
