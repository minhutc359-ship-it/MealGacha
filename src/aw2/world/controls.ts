export interface WorldKeyContext {
  enabled: boolean
  nativeControl: boolean
  modified: boolean
  repeat: boolean
}
export interface WorldKeyAction {
  type: "move" | "interact"
  key: string
}

/** Global world shortcuts must leave other modes and native controls to the browser. */
export function worldKeyAction(
  key: string,
  context: WorldKeyContext,
): WorldKeyAction | null {
  if (!context.enabled || context.nativeControl || context.modified) return null
  const normalized = key.toLowerCase()
  if (normalized === "e")
    return context.repeat ? null : { type: "interact", key: normalized }
  return [
    "w",
    "a",
    "s",
    "d",
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
  ].includes(normalized)
    ? { type: "move", key: normalized }
    : null
}
