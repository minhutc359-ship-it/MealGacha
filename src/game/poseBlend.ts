/** Presentation only. Bounded two-pose dissolve; no extra frame loop or simulation input. */
export interface PoseBlend {pose: number; previous: number; at: number}
export function blendPose(state: PoseBlend, pose: number, now: number, still = false) {
 if (state.pose !== pose) {state.previous = state.pose; state.pose = pose; state.at = now}
 const mix = still ? 1 : Math.min(1, Math.max(0, (now - state.at) / 70))
 return {previous: state.previous, mix: mix * mix * (3 - 2 * mix)}
}
