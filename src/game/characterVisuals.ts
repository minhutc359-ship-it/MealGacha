/** Visual production manifest. Gameplay IDs, skills and saves stay in their own domains. */
type VisualRow = readonly [
  effectColumn: number, species: string, signature: string, color: `#${string}`,
  idle: number, walk: number, attack: number, cast: number,
  portraitCell: number, castX: number, castY: number,
]
// Durations are milliseconds; portraitCell is the immutable absolute canon index.
const VISUAL_ROWS = {
  "com-tam": [0,"Sư tử trắng","bronze","#f4cf79",1200,640,720,920,13,0.66,0.48],
  "banh-mi": [1,"Hồ ly đỏ","blades","#ffad68",880,440,560,680,4,0.73,0.43],
  "pho-bo": [2,"Bạch long","dragon","#9ce6f3",1400,760,780,1040,0,0.73,0.3],
  "banh-cuon": [3,"Thỏ hoa trắng","silk","#e9e7be",1500,620,760,1100,6,0.68,0.38],
  "goi-cuon-tom-thit": [4,"Bạch lộc","leaves","#b7e2a5",1600,740,820,1150,105,0.7,0.28],
  "xoi": [5,"Gấu Nếp Mới","stomp","#e8ba6b",1440,820,880,1080,-1,0.64,0.72],
  "chef-bach": [0,"Bách","recipe","#e6bb70",1600,800,840,1100,-1,0.7,0.48],
  "chef-nhien": [1,"Nhiên","wok","#ff9952",1100,480,620,800,-1,0.76,0.5],
  "chef-moc": [2,"Mộc","roots","#a9d7a0",1700,760,820,1200,-1,0.7,0.35],
  "chef-hai": [3,"Hải","current","#8ecfe9",1500,720,760,1000,-1,0.76,0.42],
  "chef-lien": [4,"Liên","lantern","#e6b5e2",1450,620,740,1080,-1,0.73,0.32],
  "bun-cha": [0,"Hồ Ly Than Thơm","grill","#dcb578",1320,740,780,1040,-1,0.7,0.5],
  "bun-rieu": [1,"Giáp Cua Cà Chua","claw","#f39e86",1600,960,920,1080,-1,0.72,0.48],
  "banh-xeo": [2,"Hỏa Điểu Vầng Giòn","fan","#ecd983",1060,580,660,900,-1,0.72,0.38],
  "com-ga": [3,"Kim Kê Cánh Nắng","lance","#f1cd78",1200,680,700,820,-1,0.77,0.4],
  "banh-chung": [0,"Linh Quy Lá Vuông","rampart","#b8d284",1640,940,920,1120,-1,0.71,0.49],
  "cha-ca-la-vong": [1,"Lão Ngư Thì Là","skillet","#8dd6c6",1720,880,880,1180,-1,0.74,0.3],
  "bun-thang": [2,"Bạch Hạc Chỉ Vàng","threads","#f4df9b",1480,740,760,1040,-1,0.75,0.27],
  "banh-com-hang-than": [3,"Yến Ngọc Tơ Duyên","knot","#d2b9ec",1360,620,700,980,-1,0.74,0.45],
  "com-lang-vong": [0,"Kỳ Lân Lúa Non","grain","#c9df91",1560,700,820,1140,-1,0.69,0.32],
  "ca-phe-trung": [1,"Cầy Hương Mây Kem","phin","#e5c59a",1580,780,760,1080,-1,0.76,0.28],
  "thit-kho-trung": [2,"Huyền Quy Nồi Tết","seal","#e5b275",1760,980,960,1220,-1,0.65,0.51],
  "cha-ruoi": [3,"Sóc Lá Thu","autumn","#f1ad6c",960,460,580,860,-1,0.77,0.46],
  "banh-tet": [-1,"Ngọc Thố Nếp Đoàn Viên","roll","#d9b5dc",1480,780,820,1120,-1,0.72,0.48],
  "bun-bo-hue": [-1,"Ngưu Vương Sả Ớt","ladle","#efab71",1360,800,860,1060,-1,0.77,0.4],
  "bun-ca": [-1,"Bói Cá Sóng Bạc","dart","#91d7ed",1260,580,680,980,-1,0.79,0.38],
  "che-buoi": [-1,"Hải Ly Hương Bưởi","blossom","#dce79d",1600,720,760,1100,-1,0.73,0.5],
  "xoi-xeo": [-1,"Tê Tê Nếp Vàng","bowl","#edc16e",1520,820,860,1120,-1,0.72,0.56],
  "dua-hanh": [-1,"Ngọc Thố Muối Xuân","onion","#c4db91",1420,640,740,1060,-1,0.75,0.48],
  "caravan-herbalist": [-1,"Người hái thuốc","herbs","#c8b2d7",1740,940,920,1240,-1,0.76,0.46],
  "caravan-gardener": [-1,"Người gieo vườn","hoe","#a9d3b9",1360,680,760,1040,-1,0.8,0.42],
  "pho-ga": [-1,"Bạch Hồ Ngọc Vân","vapor","#cde8cf",1580,720,760,1080,1,0.72,0.46],
  "chao-suon": [-1,"Cẩm Lý Ngọc Ấn","carp","#edc080",1640,880,900,1160,7,0.75,0.5],
  "mien-ga": [-1,"Ngân Cú Tơ Sương","plume","#bad9e4",1500,680,700,1020,8,0.78,0.45],
  "bun-moc": [-1,"Ngân Lang Thanh Phong","howl","#a5d5cf",1440,640,680,1060,9,0.78,0.5],
  "banh-da-cua": [-1,"Hải Quy Nón Ngọc","shell","#9ccebb",1800,980,940,1220,10,0.76,0.52],
  "bun-dau": [-1,"Tiên Hồ Điệp Tử Ngọc","butterfly","#e2b9e9",1520,660,740,1140,12,0.73,0.4],
  "com-rang-dua-bo": [-1,"Bạch Lộc Kim Chi","antler","#dfcf9a",1620,740,800,1180,15,0.75,0.46],
  "com-nieu": [-1,"Kim Long Đồng Trượng","scepter","#efbd76",1720,860,920,1240,16,0.79,0.4],
  "banh-dau-xanh": [-1,"Tiểu Tượng Ngọc","pearl","#edc66f",1560,780,820,1160,112,0.72,0.38],
  "banh-khuc": [-1,"Mầm Áo Lá","leafwrap","#b8d58b",1480,700,760,1100,113,0.75,0.42],
  "banh-can": [-1,"Chim Than Tròn","discs","#e9bb63",1380,620,700,980,114,0.78,0.5],
  "banh-tom-ho-tay": [-1,"Tôm Lửa Hồ","flarelion","#f08a58",1440,680,740,1040,115,0.73,0.43],
  "com-hen": [-1,"Linh Trai Sông","pearlguard","#e6d3a0",1680,820,860,1180,116,0.71,0.34],
  "che-lam": [-1,"Hươu Mật Gừng","gingerwing","#e3b86f",1520,720,780,1120,117,0.77,0.31],
  "chao-luon": [-1,"Long Tuyến Ấm","steamline","#72ced5",1460,660,720,1060,118,0.78,0.44],
  "banh-it-la-gai": [-1,"Dơi Lá Tím","leafdodge","#b69ad7",1580,760,800,1140,119,0.76,0.4],
  "banh-ram-it": [-1,"Song Linh Giòn Mềm","twinbeat","#d6ad70",1420,640,720,1000,120,0.74,0.46],
  "keo-cu-do": [-1,"Ngưu Lạc Vàng","chargearc","#dc825c",1500,700,760,1080,121,0.79,0.45],
  "mi-van-than": [-1,"Ngọc Thố Lam Triều","rabbitwave","#75d8df",1460,640,740,1060,18,0.76,0.38],
  "mi-cay": [-1,"Sư Vương Xích Triều","liontide","#ef6854",1580,760,820,1120,19,0.77,0.42],
  "ga-ran": [-1,"Kim Lộc Thu Diệp","amberantler","#e9b957",1640,780,840,1160,20,0.78,0.36],
  "pizza": [-1,"Hạc Vương Kim Phong","cranewind","#f0c56e",1560,720,800,1120,21,0.79,0.4],
  "pasta": [-1,"Kim Hổ Liệt Dương","tigerflare","#efa34f",1520,700,780,1080,22,0.78,0.42],
  "sushi": [-1,"Cẩm Lý San Hô","koicurrent","#ed8b62",1500,680,760,1060,23,0.77,0.38],
  "tokbokki": [-1,"Hỏa Cú Xích Vũ","owlember","#ee5d42",1480,660,740,1040,24,0.76,0.39],
  "lau-thai": [-1,"Ngân Lang Xích Ấn","wolfflame","#f05f4d",1540,720,800,1100,25,0.79,0.43],
  "lau-rieu-cua": [0,"Thần Oa Hải Triều","none","#79c8bd",1760,900,920,1200,26,0.74,0.38],
  "nuong-bbq": [1,"Phượng Hoàng Than Hội","none","#f06b42",1480,720,820,1120,27,0.78,0.42],
  "vit-quay": [2,"Ngọc Thố Hỏa Điệp","none","#ed7658",1420,650,740,1080,28,0.76,0.4],
  "bibimbap": [3,"Hải Ly Ngũ Sắc","none","#e6b867",1500,720,800,1120,30,0.76,0.44],
  "canh-mang-mien": [0,"Bạch Lân Song Kiếm","none","#9cd6d3",1560,720,800,1100,95,0.77,0.44],
  "gio-xao": [1,"Xích Long Văn Ấn","none","#ee9265",1640,800,840,1160,96,0.75,0.43],
  "thit-dong": [2,"Hồ Ly Hồng Quyển","none","#edacaa",1480,680,740,1080,97,0.73,0.46],
  "che-khuc-bach": [3,"Bạch Lộc Tử Tinh","none","#c6b2e9",1700,760,820,1200,100,0.72,0.42],
  "banner-tay-bac-goi-rau-don": [0,"Huyền Quy Hổ Phách","none","#d7b474",1760,980,940,1240,106,0.7,0.5],
  "banner-tay-bac-com-lam": [1,"Bạch Phượng Kim Vũ","none","#efb15f",1480,680,760,1080,107,0.78,0.44],
  "banner-tay-bac-thang-co": [2,"Kim Cú Điệp Quang","none","#efd28b",1560,700,780,1120,108,0.74,0.46],
  "banner-tay-bac-thit-trau-gac-bep": [3,"Tê Tê Xích Quyển","none","#d69c72",1600,820,860,1160,109,0.76,0.5],
  "banner-tay-bac-ga-nuong-mac-khen": [4,"Rái Cá Kim Hương","none","#e4be7e",1400,640,720,1040,110,0.74,0.46],
  "banner-tay-bac-xoi-ngu-sac": [5,"Bạch Lộc Ngũ Sắc","none","#d1b3e7",1720,760,820,1180,111,0.77,0.43],
  "samgyeopsal": [0,"Bạch Long Kim Giác","none","#e7d39b",1560,720,800,1120,31,0.79,0.4],
  "hanwoo-bbq": [1,"Xích Long Nhật Trượng","none","#ee8a58",1640,760,840,1160,32,0.77,0.35],
  "korean-fried-chicken": [2,"Sư Vương Hồng Thuẫn","none","#ef7553",1480,700,780,1080,51,0.77,0.48],
  "bingsu": [3,"Bạch Lộc Tử Hoa","none","#c8b3ed",1720,760,820,1200,52,0.74,0.43],
  "jjajangmyeon": [4,"Huyền Long Thanh Đăng","none","#77d5d7",1600,740,800,1140,64,0.76,0.47],
  "kimchi-jjigae": [5,"Xích Hồ Hỏa Đăng","none","#eda36a",1420,640,720,1040,65,0.77,0.46],
  "shoyu-ramen": [-1,"Hồ ly cam","none","#ef9b4b",1460,660,760,1080,33,0.77,0.42],
  "unagi-don": [-1,"Thỏ trắng","none","#ead5df",1420,640,740,1060,34,0.76,0.4],
  "omakase": [-1,"Sư tử trắng","none","#efc879",1600,760,840,1160,35,0.75,0.39],
  "tonkotsu-ramen": [-1,"Hạc mào đỏ","none","#78d5df",1560,720,800,1120,53,0.78,0.42],
  "takoyaki": [-1,"Hổ cam","none","#e69551",1520,700,780,1080,70,0.77,0.45],
  "okonomiyaki": [-1,"Cá koi đỏ","none","#ee7358",1500,680,760,1060,71,0.76,0.4],
} as const satisfies Record<string, VisualRow>

const VISUAL_IDS = Object.keys(VISUAL_ROWS) as (keyof typeof VISUAL_ROWS)[]
export const CHEF_IDS = ["chef-bach","chef-nhien","chef-moc","chef-hai","chef-lien"] as const
export type ChefId = typeof CHEF_IDS[number]
export const CHEF_EXPRESSIONS = ["neutral","joy","resolve","concern","surprise","tender"] as const
export type ChefExpression = typeof CHEF_EXPRESSIONS[number]
export const CHEF_ASSET_ROOT = "/assets/characters/chefs593"
// Production cohorts are contiguous in VISUAL_ROWS; slicing avoids a second copy of every ID in the client bundle.
export const FAMILIAR_IDS = VISUAL_IDS.slice(11,15)
export const FAMILIAR_ASSET_ROOT = "/assets/characters/familiar594"
export const RARE_IDS = VISUAL_IDS.slice(15,19)
export const RARE_ASSET_ROOT = "/assets/characters/rare595"
export const RARE_SECOND_IDS = VISUAL_IDS.slice(19,23)
export const RARE_SECOND_ASSET_ROOT = "/assets/characters/rare596"
export const REGIONAL_IDS = VISUAL_IDS.slice(23,27)
export const REGIONAL_ASSET_ROOT = "/assets/characters/regional5910"
export const SPRING_CARAVAN_IDS = VISUAL_IDS.slice(27,31)
export const SPRING_CARAVAN_ASSET_ROOT = "/assets/characters/spring5911"
export const VIETNAM_IDS = VISUAL_IDS.slice(31,39)
export const VIETNAM_ASSET_ROOT = "/assets/characters/vietnam5912"
export const AUTOCHESS_CORE_IDS = VISUAL_IDS.slice(39,49)
export const AUTOCHESS_CORE_ASSET_ROOT = "/assets/characters/autochess5913"
export const TCG_CLASSIC_IDS = VISUAL_IDS.slice(49,57)
export const TCG_CLASSIC_ASSET_ROOT = "/assets/characters/tcg5914"
export const PRIORITY_SPIRIT_IDS = VISUAL_IDS.slice(57,61)
export const PRIORITY_SPIRIT_ASSET_ROOT = "/assets/characters/spirits5917"
export const VIET_FEAST_IDS = VISUAL_IDS.slice(61,65)
export const VIET_FEAST_ASSET_ROOT = "/assets/characters/spirits5921"
export const NORTHWEST_SPIRIT_IDS = VISUAL_IDS.slice(65,71)
export const NORTHWEST_SPIRIT_ASSET_ROOT = "/assets/characters/northwest5922"
export const KOREA_SPIRIT_IDS = VISUAL_IDS.slice(71,77)
export const KOREA_SPIRIT_ASSET_ROOT = "/assets/characters/korea5923"
export const JAPAN_SPIRIT_IDS = VISUAL_IDS.slice(77)
export const JAPAN_SPIRIT_ASSET_ROOT = "/assets/characters/japan5924"
export type VisualCharacterId = keyof typeof VISUAL_ROWS
export const VISUAL_CONTACT = { attack: 300, cast: 380, ultimate: 960, tcg: 560 } as const
export const ULTIMATE_TIMELINE = {
  preparation: 0, casting: 360, impact: VISUAL_CONTACT.ultimate,
  finisher: 1500, recovery: 1980, end: 2400,
} as const
export const STARTER_ASSET_ROOT = "/assets/characters/starters590"
const ASSET_GROUPS: ReadonlyArray<readonly [readonly string[],string]> = [
  [JAPAN_SPIRIT_IDS,JAPAN_SPIRIT_ASSET_ROOT], [KOREA_SPIRIT_IDS,KOREA_SPIRIT_ASSET_ROOT], [CHEF_IDS,CHEF_ASSET_ROOT], [FAMILIAR_IDS,FAMILIAR_ASSET_ROOT],
  [RARE_IDS,RARE_ASSET_ROOT], [RARE_SECOND_IDS,RARE_SECOND_ASSET_ROOT],
  [REGIONAL_IDS,REGIONAL_ASSET_ROOT], [SPRING_CARAVAN_IDS,SPRING_CARAVAN_ASSET_ROOT],
  [VIETNAM_IDS,VIETNAM_ASSET_ROOT], [AUTOCHESS_CORE_IDS,AUTOCHESS_CORE_ASSET_ROOT],
  [NORTHWEST_SPIRIT_IDS,NORTHWEST_SPIRIT_ASSET_ROOT], [VIET_FEAST_IDS,VIET_FEAST_ASSET_ROOT], [TCG_CLASSIC_IDS,TCG_CLASSIC_ASSET_ROOT], [PRIORITY_SPIRIT_IDS,PRIORITY_SPIRIT_ASSET_ROOT],
]
export function chefPortrait(id: ChefId, expression: ChefExpression = "neutral") {
  if (id === "chef-bach" && expression === "neutral") return "/assets/tcg/characters/anime/bach.webp"
  return `${CHEF_ASSET_ROOT}/${id}-${expression}.webp`
}
function manifest(id: VisualCharacterId) {
  const [effectColumn,species,signature,color,idle,walk,attack,cast,cell,castX,castY] = VISUAL_ROWS[id]
  const chef = id.startsWith("chef-")
  const root = ASSET_GROUPS.find(([ids]) => ids.includes(id))?.[1] ?? STARTER_ASSET_ROOT
  return {
    effectColumn,species,signature,color,idle,walk,attack,cast,id,
    sheet: `starter-${id}` as const,
    pixelSheet: `starter-${id}-pixel` as const,
    atlas: `${root}/${id}.webp`,
    pixel: `${root}/${id}-pixel.webp`,
    portrait: cell < 0 ? {path: chef ? chefPortrait(id as ChefId) : `${root}/${id}-portrait.webp`, cell: 0, columns: 1} : {path: `/assets/rpg/spirit510/portraits-${Math.floor(cell/16)+1}.webp`, cell: cell%16, columns: 4},
    // Optional painted VFX share the same three-phase compositor across modes.
    effect: effectColumn < 0 ? null : {path: `${root}/${root === STARTER_ASSET_ROOT ? "ultimate591" : "ultimate"}.webp`, column: effectColumn},
    anchors: { foot: [.5, .9375], cast: [castX,castY] },
    contact: VISUAL_CONTACT,
    sound: `/assets/rpg/awakening530/sounds/${id}.mp3`,
    timeline: ULTIMATE_TIMELINE,
    reducedPose: 18,
  }
}
export const CHARACTER_VISUALS = Object.fromEntries(
  (Object.keys(VISUAL_ROWS) as VisualCharacterId[]).map(id => [id, manifest(id)]),
) as Record<VisualCharacterId, ReturnType<typeof manifest>>
export function characterVisual(id: string) {
  if (id === "goi-cuon") id = "goi-cuon-tom-thit"
  const visual = CHARACTER_VISUALS[id as VisualCharacterId]
  return visual?.id === id ? visual : undefined
}
