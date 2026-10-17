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
  "bun-cha": {effectColumn:0,title:"Than trúc",species:"Hồ Ly Than Thơm",signature:"grill",color:"#dcb578",idle:1320,walk:740,attack:780,cast:1040},
  "bun-rieu": {effectColumn:1,title:"Xích hải",species:"Giáp Cua Cà Chua",signature:"claw",color:"#f39e86",idle:1600,walk:960,attack:920,cast:1080},
  "banh-xeo": {effectColumn:2,title:"Kim phiến",species:"Hỏa Điểu Vầng Giòn",signature:"fan",color:"#ecd983",idle:1060,walk:580,attack:660,cast:900},
  "com-ga": {effectColumn:3,title:"Dương cầm",species:"Kim Kê Cánh Nắng",signature:"lance",color:"#f1cd78",idle:1200,walk:680,attack:700,cast:820},
  "banh-chung": {effectColumn:0,title:"Lục thành",species:"Linh Quy Lá Vuông",signature:"rampart",color:"#b8d284",idle:1640,walk:940,attack:920,cast:1120},
  "cha-ca-la-vong": {effectColumn:1,title:"Hải vũ",species:"Lão Ngư Thì Là",signature:"skillet",color:"#8dd6c6",idle:1720,walk:880,attack:880,cast:1180},
  "bun-thang": {effectColumn:2,title:"Thất thanh",species:"Bạch Hạc Chỉ Vàng",signature:"threads",color:"#f4df9b",idle:1480,walk:740,attack:760,cast:1040},
  "banh-com-hang-than": {effectColumn:3,title:"Ngọc thu",species:"Yến Ngọc Tơ Duyên",signature:"knot",color:"#d2b9ec",idle:1360,walk:620,attack:700,cast:980},
  "com-lang-vong": {effectColumn:0,title:"Thanh vong",species:"Kỳ Lân Lúa Non",signature:"grain",color:"#c9df91",idle:1560,walk:700,attack:820,cast:1140},
  "ca-phe-trung": {effectColumn:1,title:"Hoàng mộng",species:"Cầy Hương Mây Kem",signature:"phin",color:"#e5c59a",idle:1580,walk:780,attack:760,cast:1080},
  "thit-kho-trung": {effectColumn:2,title:"Hoàng ấn",species:"Huyền Quy Nồi Tết",signature:"seal",color:"#e5b275",idle:1760,walk:980,attack:960,cast:1220},
  "cha-ruoi": {effectColumn:3,title:"Thu ngư",species:"Sóc Lá Thu",signature:"autumn",color:"#f1ad6c",idle:960,walk:460,attack:580,cast:860},
  "banh-tet": {effectColumn:-1,title:"Đoàn viên",species:"Ngọc Thố Nếp Đoàn Viên",signature:"roll",color:"#d9b5dc",idle:1480,walk:780,attack:820,cast:1120},
  "bun-bo-hue": {effectColumn:-1,title:"Xích ngưu",species:"Ngưu Vương Sả Ớt",signature:"ladle",color:"#efab71",idle:1360,walk:800,attack:860,cast:1060},
  "bun-ca": {effectColumn:-1,title:"Ngân vũ",species:"Bói Cá Sóng Bạc",signature:"dart",color:"#91d7ed",idle:1260,walk:580,attack:680,cast:980},
  "che-buoi": {effectColumn:-1,title:"Bạch hoa",species:"Hải Ly Hương Bưởi",signature:"blossom",color:"#dce79d",idle:1600,walk:720,attack:760,cast:1100},
} as const

export const CHEF_IDS = ["chef-bach","chef-nhien","chef-moc","chef-hai","chef-lien"] as const
export type ChefId = typeof CHEF_IDS[number]
export const CHEF_EXPRESSIONS = ["neutral","joy","resolve","concern","surprise","tender"] as const
export type ChefExpression = typeof CHEF_EXPRESSIONS[number]
export const CHEF_ASSET_ROOT = "/assets/characters/chefs593"
export const FAMILIAR_IDS = ["bun-cha","bun-rieu","banh-xeo","com-ga"] as const
export const FAMILIAR_ASSET_ROOT = "/assets/characters/familiar594"
export const RARE_IDS = ["banh-chung","cha-ca-la-vong","bun-thang","banh-com-hang-than"] as const
export const RARE_ASSET_ROOT = "/assets/characters/rare595"
export const RARE_SECOND_IDS = ["com-lang-vong","ca-phe-trung","thit-kho-trung","cha-ruoi"] as const
export const RARE_SECOND_ASSET_ROOT = "/assets/characters/rare596"
export const REGIONAL_IDS = ["banh-tet","bun-bo-hue","bun-ca","che-buoi"] as const
export const REGIONAL_ASSET_ROOT = "/assets/characters/regional5910"
export type VisualCharacterId = keyof typeof DEFINITIONS
export const VISUAL_CONTACT = { attack: 300, cast: 380, ultimate: 960, tcg: 560 } as const
export const ULTIMATE_TIMELINE = {
  preparation: 0, casting: 360, impact: VISUAL_CONTACT.ultimate,
  finisher: 1500, recovery: 1980, end: 2400,
} as const
export const STARTER_ASSET_ROOT = "/assets/characters/starters590"
const PORTRAIT_CELLS: Partial<Record<VisualCharacterId,number>> = { "com-tam": 13, "banh-mi": 4, "pho-bo": 0, "banh-cuon": 6, "goi-cuon-tom-thit": 105, xoi: -1 }
const CAST_ANCHORS = { "com-tam": [.66,.48], "banh-mi": [.73,.43], "pho-bo": [.73,.3], "banh-cuon": [.68,.38], "goi-cuon-tom-thit": [.7,.28], xoi: [.64,.72], "chef-bach":[.7,.48], "chef-nhien":[.76,.5], "chef-moc":[.7,.35], "chef-hai":[.76,.42], "chef-lien":[.73,.32], "bun-cha":[.7,.5], "bun-rieu":[.72,.48], "banh-xeo":[.72,.38], "com-ga":[.77,.4], "banh-chung":[.71,.49], "cha-ca-la-vong":[.74,.3], "bun-thang":[.75,.27], "banh-com-hang-than":[.74,.45], "com-lang-vong":[.69,.32], "ca-phe-trung":[.76,.28], "thit-kho-trung":[.65,.51], "cha-ruoi":[.77,.46], "banh-tet":[.72,.48], "bun-bo-hue":[.77,.4], "bun-ca":[.79,.38], "che-buoi":[.73,.5] }
const ASSET_GROUPS: ReadonlyArray<readonly [readonly string[],string]> = [
  [CHEF_IDS,CHEF_ASSET_ROOT], [FAMILIAR_IDS,FAMILIAR_ASSET_ROOT],
  [RARE_IDS,RARE_ASSET_ROOT], [RARE_SECOND_IDS,RARE_SECOND_ASSET_ROOT],
  [REGIONAL_IDS,REGIONAL_ASSET_ROOT],
]
export function chefPortrait(id: ChefId, expression: ChefExpression = "neutral") {
  return `${CHEF_ASSET_ROOT}/${id}-${expression}.webp`
}
function manifest(id: VisualCharacterId) {
  const chef = id.startsWith("chef-")
  const root = ASSET_GROUPS.find(([ids]) => ids.includes(id))?.[1] ?? STARTER_ASSET_ROOT
  const cell = PORTRAIT_CELLS[id] ?? -1
  return {
    ...DEFINITIONS[id], id,
    sheet: `starter-${id}` as const,
    pixelSheet: `starter-${id}-pixel` as const,
    atlas: `${root}/${id}.webp`,
    pixel: `${root}/${id}-pixel.webp`,
    portrait: cell < 0 ? {path: chef ? chefPortrait(id as ChefId) : `${root}/${id}-portrait.webp`, cell: 0, columns: 1} : {path: `/assets/rpg/spirit510/portraits-${Math.floor(cell/16)+1}.webp`, cell: cell%16, columns: 4},
    // New cohorts use procedural VFX; old atlas descriptors remain compatible.
    effect: root === REGIONAL_ASSET_ROOT ? null : {path: `${root}/${root === STARTER_ASSET_ROOT ? "ultimate591" : "ultimate"}.webp`, column: DEFINITIONS[id].effectColumn},
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
