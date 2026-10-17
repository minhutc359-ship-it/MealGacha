/** Authored post-story opponents. Presentation only; never changes spawn pools. */
const ROOT = "/assets/characters/campaign598"
const BOSS_DEFINITIONS = {
  "tea-oracle": {
    motif: "tea",
    color: "#b4dca4",
    cast: [0.72, 0.55],
    idle: 1600,
    walk: 800,
  },
  "cloud-teapot": {
    motif: "tea",
    color: "#9edecb",
    cast: [0.8, 0.48],
    idle: 1800,
    walk: 920,
  },
  "salt-alchemist": {
    motif: "salt",
    color: "#ffab7b",
    cast: [0.75, 0.48],
    idle: 1400,
    walk: 680,
  },
  "salt-colossus": {
    motif: "salt",
    color: "#f3aa94",
    cast: [0.7, 0.65],
    idle: 1800,
    walk: 1100,
  },
  "moon-priestess": {
    motif: "moon",
    color: "#d4c0fa",
    cast: [0.76, 0.3],
    idle: 1600,
    walk: 760,
  },
  "moon-heron": {
    motif: "moon",
    color: "#d4cafa",
    cast: [0.78, 0.35],
    idle: 1700,
    walk: 820,
  },
  "aroma-conductor": {
    motif: "aroma",
    color: "#e5ce89",
    cast: [0.75, 0.4],
    idle: 1500,
    walk: 740,
  },
  "aroma-regent": {
    motif: "aroma",
    color: "#edbb71",
    cast: [0.74, 0.42],
    idle: 1700,
    walk: 880,
  },
} as const
export const REGULAR_ENEMY_IDS = [
  "tea-moth",
  "jade-sentinel",
  "salt-scarab",
  "kiln-knight",
  "moon-jelly",
  "lotus-mantis",
  "spice-kite",
  "bronze-warden",
] as const
export type RegularEnemyId = typeof REGULAR_ENEMY_IDS[number]
const REGULAR_DEFINITIONS = {
  "tea-moth": {
    motif: "tea",
    color: "#bee493",
    cast: [0.72, 0.3],
    idle: 1100,
    walk: 540,
  },
  "jade-sentinel": {
    motif: "tea",
    color: "#95d9b9",
    cast: [0.74, 0.49],
    idle: 1800,
    walk: 1050,
  },
  "salt-scarab": {
    motif: "salt",
    color: "#f3b6b0",
    cast: [0.75, 0.58],
    idle: 1000,
    walk: 420,
  },
  "kiln-knight": {
    motif: "salt",
    color: "#ffac71",
    cast: [0.74, 0.5],
    idle: 1700,
    walk: 1050,
  },
  "moon-jelly": {
    motif: "moon",
    color: "#bdb4f3",
    cast: [0.7, 0.64],
    idle: 1600,
    walk: 900,
  },
  "lotus-mantis": {
    motif: "moon",
    color: "#f4b8df",
    cast: [0.8, 0.5],
    idle: 950,
    walk: 500,
  },
  "spice-kite": {
    motif: "aroma",
    color: "#efb86c",
    cast: [0.77, 0.3],
    idle: 900,
    walk: 480,
  },
  "bronze-warden": {
    motif: "aroma",
    color: "#e4cf85",
    cast: [0.74, 0.5],
    idle: 1800,
    walk: 1100,
  },
} as const
const DEFINITIONS = { ...BOSS_DEFINITIONS, ...REGULAR_DEFINITIONS }
export type EnemyVisualId = keyof typeof DEFINITIONS
function manifest(id: EnemyVisualId) {
  const accent = REGULAR_ENEMY_IDS.indexOf(id as RegularEnemyId) + 1
  const root = accent ? "/assets/characters/campaign599" : ROOT
  return {
    accent,
    defense: ["jade-sentinel", "kiln-knight", "bronze-warden"].includes(id),
    ...DEFINITIONS[id],
    id,
    sheet: `campaign-${id}` as const,
    pixelSheet: `campaign-${id}-pixel` as const,
    atlas: `${root}/${id}.webp`,
    pixel: `${root}/${id}-pixel.webp`,
    portrait: { path: `${root}/${id}-portrait.webp`, cell: 0, columns: 1 },
    attack: 780,
    castDuration: 1000,
    anchors: { foot: [0.5, 0.9375], cast: DEFINITIONS[id].cast },
  }
}
export const ENEMY_VISUALS = Object.fromEntries(
  (Object.keys(DEFINITIONS) as EnemyVisualId[]).map((id) => [id, manifest(id)]),
) as Record<EnemyVisualId, ReturnType<typeof manifest>>
export function enemyVisual(id: string) {
  return Object.prototype.hasOwnProperty.call(ENEMY_VISUALS, id)
    ? ENEMY_VISUALS[(id as EnemyVisualId)]
    : undefined
}
const STATES = [
  "idle",
  "walk",
  "attack",
  "cast",
  "phase",
  "hit",
  "fall",
  "victory",
]
/** Channel holds the gathered pose until the engine actually resolves/cancels it. */
export function enemyPose(
  id: string,
  motion: string,
  age: number,
  quiet = false,
  contact = 380,
) {
  const v = enemyVisual(id)
  if (!v) return 0
  if (motion === "stun") return 20
  if (motion === "channel") return quiet ? 13 : age < 250 ? 12 : 13
  const row = motion === "guard" ? 4 : STATES.indexOf(motion)
  if (row < 0) return 0
  if (quiet) return motion === "fall" ? 27 : motion === "guard" ? 18 : row * 4
  const t = Math.max(0, age)
  if (motion === "attack" || motion === "cast" || motion === "guard") {
    const duration = Math.max(
      motion === "attack" ? v.attack : v.castDuration,
      contact + 260,
    )
    if (t >= duration) return 0
    return (
      row * 4 +
      (t < contact * 0.45
        ? 0
        : t < contact
          ? 1
          : t < contact + (duration - contact) * 0.55
            ? 2
            : 3)
    )
  }
  const duration =
    motion === "idle"
      ? v.idle
      : motion === "walk"
        ? v.walk
        : motion === "hit"
          ? 360
          : motion === "phase"
            ? 1100
            : motion === "fall"
              ? 900
              : 1400
  const loop = ["idle", "walk", "victory"].includes(motion)
  if (!loop && t >= duration) return motion === "fall" ? 27 : 0
  return (
    row * 4 +
    Math.min(3, Math.floor(((loop ? t % duration : t) / duration) * 4))
  )
}
