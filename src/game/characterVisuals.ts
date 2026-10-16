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
  "chef-bach": {effectColumn:0,title:"Bếp trưởng",species:"Bách",signature:"recipe",color:"#e6bb70",idle:1600,walk:800,attack:840,cast:1100},
  "chef-nhien": {effectColumn:1,title:"Giữ lửa",species:"Nhiên",signature:"wok",color:"#ff9952",idle:1100,walk:480,attack:620,cast:800},
  "chef-moc": {effectColumn:2,title:"Mầm sống",species:"Mộc",signature:"roots",color:"#a9d7a0",idle:1700,walk:760,attack:820,cast:1200},
  "chef-hai": {effectColumn:3,title:"Nghe sóng",species:"Hải",signature:"current",color:"#8ecfe9",idle:1500,walk:720,attack:760,cast:1000},
  "chef-lien": {effectColumn:4,title:"Dệt sao",species:"Liên",signature:"lantern",color:"#e6b5e2",idle:1450,walk:620,attack:740,cast:1080},
} as const

export const CHEF_IDS = ["chef-bach","chef-nhien","chef-moc","chef-hai","chef-lien"] as const
export type ChefId = typeof CHEF_IDS[number]
export const CHEF_EXPRESSIONS = ["neutral","joy","resolve","concern","surprise","tender"] as const
export type ChefExpression = typeof CHEF_EXPRESSIONS[number]
export const CHEF_ASSET_ROOT = "/assets/characters/chefs593"
export type VisualCharacterId = keyof typeof DEFINITIONS
export const VISUAL_CONTACT = { attack: 300, cast: 380, ultimate: 960, tcg: 560 } as const
export const ULTIMATE_TIMELINE = {
  preparation: 0, casting: 360, impact: VISUAL_CONTACT.ultimate,
  finisher: 1500, recovery: 1980, end: 2400,
} as const
export const STARTER_ASSET_ROOT = "/assets/characters/starters590"
const PORTRAIT_CELLS: Partial<Record<VisualCharacterId,number>> = { "com-tam": 13, "banh-mi": 4, "pho-bo": 0, "banh-cuon": 6, "goi-cuon-tom-thit": 105, xoi: -1 }
const CAST_ANCHORS = { "com-tam": [.66,.48], "banh-mi": [.73,.43], "pho-bo": [.73,.3], "banh-cuon": [.68,.38], "goi-cuon-tom-thit": [.7,.28], xoi: [.64,.72], "chef-bach":[.7,.48], "chef-nhien":[.76,.5], "chef-moc":[.7,.35], "chef-hai":[.76,.42], "chef-lien":[.73,.32] }
export function chefPortrait(id: ChefId, expression: ChefExpression = "neutral") {
  return `${CHEF_ASSET_ROOT}/${id}-${expression}.webp`
}
function manifest(id: VisualCharacterId) {
  const chef = id.startsWith("chef-"), root = chef ? CHEF_ASSET_ROOT : STARTER_ASSET_ROOT
  const cell = PORTRAIT_CELLS[id] ?? -1
  return {
    ...DEFINITIONS[id], id,
    sheet: `starter-${id}` as const,
    pixelSheet: `starter-${id}-pixel` as const,
    atlas: `${root}/${id}.webp`,
    pixel: `${root}/${id}-pixel.webp`,
    portrait: cell < 0 ? {path: chef ? chefPortrait(id as ChefId) : `${root}/xoi-portrait.webp`, cell: 0, columns: 1} : {path: `/assets/rpg/spirit510/portraits-${Math.floor(cell/16)+1}.webp`, cell: cell%16, columns: 4},
    effect: {path: `${root}/${chef ? "ultimate" : "ultimate591"}.webp`, column: DEFINITIONS[id].effectColumn},
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
