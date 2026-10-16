/** Stable gameplay IDs. Presentation variants never create a second character. */
export const STARTER_CHARACTER_IDS = [
  "com-tam",
  "banh-mi",
  "pho-bo",
  "banh-cuon",
  "goi-cuon-tom-thit",
] as const
export type StarterId = typeof STARTER_CHARACTER_IDS[number]
export const STARTER_CHARACTERS = {
  "com-tam": {
    title: "Kim sư",
    species: "Sư tử trắng",
    signature: "bronze",
    color: "#f4cf79",
    idle: 1200,
    walk: 640,
    attack: 720,
    cast: 920,
  },
  "banh-mi": {
    title: "Hỏa vũ",
    species: "Hồ ly đỏ",
    signature: "blades",
    color: "#ffad68",
    idle: 880,
    walk: 440,
    attack: 560,
    cast: 680,
  },
  "pho-bo": {
    title: "Long lưu",
    species: "Bạch long",
    signature: "dragon",
    color: "#9ce6f3",
    idle: 1400,
    walk: 760,
    attack: 780,
    cast: 1040,
  },
  "banh-cuon": {
    title: "Vân cuộn",
    species: "Thỏ hoa trắng",
    signature: "silk",
    color: "#e9e7be",
    idle: 1500,
    walk: 620,
    attack: 760,
    cast: 1100,
  },
  "goi-cuon-tom-thit": {
    title: "Ngọc lâm",
    species: "Bạch lộc",
    signature: "leaves",
    color: "#b7e2a5",
    idle: 1600,
    walk: 740,
    attack: 820,
    cast: 1150,
  },
} as const
export function starterCharacter(id: string) {
  if (id === "goi-cuon") id = "goi-cuon-tom-thit"
  return Object.prototype.hasOwnProperty.call(STARTER_CHARACTERS, id)
    ? STARTER_CHARACTERS[(id as StarterId)]
    : undefined
}
export const STARTER_ASSET_ROOT = "/assets/characters/starters590"
export const ULTIMATE_TIMELINE = {
  preparation: 0,
  casting: 360,
  impact: 960,
  finisher: 1500,
  recovery: 1980,
  end: 2400,
} as const
export type UltimatePhase = Exclude<keyof typeof ULTIMATE_TIMELINE, "end">
export function ultimatePhase(ms: number): UltimatePhase {
  return ms < 360
    ? "preparation"
    : ms < 960
      ? "casting"
      : ms < 1500
        ? "impact"
        : ms < 1980
          ? "finisher"
          : "recovery"
}
export const STARTER_STATES = [
  "idle",
  "walk",
  "attack",
  "cast",
  "ultimate",
  "hit",
  "fall",
  "victory",
] as const

/** Four authored poses per action. No cross-fade or simultaneous silhouettes. */
export function starterPose(
  id: string,
  motion: string,
  age: number,
  quiet = false,
  contact?: number,
) {
  const row = STARTER_STATES.indexOf(motion as typeof STARTER_STATES[number])
  if (row < 0 || motion === "summon") return 0
  if (quiet) return row === 6 ? 27 : row * 4
  const kit = starterCharacter(id)!
  const loop = ["idle", "walk", "victory"].includes(motion)
  const base =
    motion === "ultimate"
      ? 2400
      : motion === "fall"
        ? 900
        : motion === "hit"
          ? 360
          : motion === "victory"
            ? 1100
            : kit[(motion as "idle" | "walk" | "attack" | "cast")]
  const duration =
    contact === undefined || !["attack", "cast"].includes(motion)
      ? base
      : Math.max(base, contact + 260)
  const t = Math.max(0, age)
  if (!loop && t >= duration) return motion === "fall" ? 27 : 0
  const phase = (loop ? t % duration : t) / duration
  if (motion === "ultimate")
    return 16 + (t < 360 ? 0 : t < 960 ? 1 : t < 1980 ? 2 : 3)
  if (contact !== undefined && ["attack", "cast"].includes(motion))
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
  return row * 4 + Math.min(3, Math.floor(phase * 4))
}
