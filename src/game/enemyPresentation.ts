import type { RpgActor, RpgBattle, RpgEvent } from "./adventureRpg/types"
/** Mirrors eligibility already enforced by the engine; no state mutation. */
export function activeEnemyWarning(b: RpgBattle) {
  const w = b.warning,
    a = b.actors.find((a) => a.uid === w?.source)
  return w &&
    a &&
    a.hp > 0 &&
    !a.stun &&
    (b.rulesVersion !== 530 || a.energy >= (a.boss ? 80 : 60)) &&
    !b.result &&
    b.tick < w.until
    ? { warning: w, actor: a }
    : null
}
export function enemyWarningIsGlobal(a: RpgActor) {
  return (
    a.boss &&
    a.phase > 0 &&
    ["v4-tide-lock", "moon-heron", "aroma-regent"].includes(a.id)
  )
}
export function enemyWarningTargets(b: RpgBattle) {
  const active = activeEnemyWarning(b)
  if (!active) return []
  const { actor: a, warning: w } = active
  const friends = b.actors.filter((t) => t.hp > 0 && t.side === a.side)
  const foes = b.actors.filter((t) => t.hp > 0 && t.side !== a.side)
  const row = foes.filter((t) => (t.slot < 2 ? "front" : "back") === w.row)
  const line = row.length ? row : foes
  if ((b.rulesVersion ?? 510) < 520) return line
  const weak = [...friends].sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)
  const targets = new Set<RpgActor>()
  if (a.boss) {
    for (const t of enemyWarningIsGlobal(a) ? foes : line) targets.add(t)
    if (
      [
        "boss-drum",
        "boss-lotus",
        "boss-blue-root",
        "boss-last-banquet",
        "cloud-teapot",
        "aroma-regent",
      ].includes(a.id)
    )
      for (const t of friends) targets.add(t)
    if (a.id === "bamboo-wraith") targets.add(a)
    if (a.id === "boss-mirror-sugar") {
      targets.add(a)
      const fragile = [...foes].sort(
        (x, y) => x.hp / x.maxHp - y.hp / y.maxHp,
      )[0]
      if (fragile) targets.add(fragile)
    }
  } else if (a.style === "mender")
    for (const t of weak.slice(0, 2)) targets.add(t)
  else if (a.style === "bulwark") {
    targets.add(a)
    if (weak[0]) targets.add(weak[0])
  } else
    for (const t of line.slice(0, a.style === "hexer" ? 3 : 2)) targets.add(t)
  if (b.difficulty && b.difficulty !== "normal") {
    // Hard/extreme elites also drain the warned row, including support casters.
    if (a.elite) for (const t of line) targets.add(t)
    if (
      a.elite &&
      ["tea-oracle", "salt-alchemist", "aroma-conductor"].includes(a.id)
    )
      for (const t of friends) targets.add(t)
    if (b.difficulty === "extreme" && a.boss && a.phase) targets.add(a)
  }
  return [...targets]
}
/** The engine emits phase changes once, separately from damage/cast events. */
export function isEnemyPhaseEvent(e: RpgEvent, a: RpgActor) {
  return (
    a.side === "enemy" &&
    a.boss &&
    a.phase > 0 &&
    e.kind === "boss" &&
    e.source === a.uid &&
    e.text.includes("chuyển pha")
  )
}
