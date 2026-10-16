/** Visual production manifest. Gameplay IDs, skills and saves stay in their own domains. */
const DEFINITIONS = {
  "com-tam": {
    effectColumn: 0,
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
    effectColumn: 1,
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
    effectColumn: 2,
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
    effectColumn: 3,
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
    effectColumn: 4,
    title: "Ngọc lâm",
    species: "Bạch lộc",
    signature: "leaves",
    color: "#b7e2a5",
    idle: 1600,
    walk: 740,
    attack: 820,
    cast: 1150,
  },
  xoi: { effectColumn: 5, title: "Kim noãn", species: "Gấu Nếp Mới", signature: "stomp", color: "#e8ba6b", idle: 1440, walk: 820, attack: 880, cast: 1080 },
} as const

export type VisualCharacterId = keyof typeof DEFINITIONS
export const VISUAL_CONTACT = { attack: 300, cast: 380, ultimate: 960, tcg: 560 } as const
export const ULTIMATE_TIMELINE = {
  preparation: 0, casting: 360, impact: VISUAL_CONTACT.ultimate,
  finisher: 1500, recovery: 1980, end: 2400,
} as const
export const STARTER_ASSET_ROOT = "/assets/characters/starters590"
const PORTRAIT_CELLS = { "com-tam": 13, "banh-mi": 4, "pho-bo": 0, "banh-cuon": 6, "goi-cuon-tom-thit": 105, xoi: -1 }
const CAST_ANCHORS = { "com-tam": [.66,.48], "banh-mi": [.73,.43], "pho-bo": [.73,.3], "banh-cuon": [.68,.38], "goi-cuon-tom-thit": [.7,.28], xoi: [.64,.72] }
function manifest(id: VisualCharacterId) {
  const cell = PORTRAIT_CELLS[id]
  return {
    ...DEFINITIONS[id], id,
    sheet: `starter-${id}` as const,
    pixelSheet: `starter-${id}-pixel` as const,
    atlas: `${STARTER_ASSET_ROOT}/${id}.webp`,
    pixel: `${STARTER_ASSET_ROOT}/${id}-pixel.webp`,
    portrait: cell < 0 ? {path: `${STARTER_ASSET_ROOT}/xoi-portrait.webp`, cell: 0, columns: 1} : {path: `/assets/rpg/spirit510/portraits-${Math.floor(cell/16)+1}.webp`, cell: cell%16, columns: 4},
    effect: {path: `${STARTER_ASSET_ROOT}/ultimate591.webp`, column: DEFINITIONS[id].effectColumn},
    anchors: { foot: [.5, .9375], cast: CAST_ANCHORS[id] },
    contact: VISUAL_CONTACT,
    sound: `/assets/rpg/awakening530/sounds/${id}.mp3`,
    timeline: ULTIMATE_TIMELINE,
    reducedPose: 18,
  }
}
export const CHARACTER_VISUALS = Object.fromEntries(
  (Object.keys(DEFINITIONS) as VisualCharacterId[]).map(id => [id, manifest(id)]),
) as Record<VisualCharacterId, ReturnType<typeof manifest>>
export function characterVisual(id: string) {
  if (id === "goi-cuon") id = "goi-cuon-tom-thit"
  return Object.prototype.hasOwnProperty.call(CHARACTER_VISUALS, id)
    ? CHARACTER_VISUALS[id as VisualCharacterId] : undefined
}
