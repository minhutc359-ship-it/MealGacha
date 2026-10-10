import type { Ability, GameCard, School } from "./types"

export const ABILITY_TEXT: Record<Ability, string> = {
  ambush: "Vào sân: gây 2 sát thương lên quân địch đã mất máu có máu thấp nhất.",
  spellfire: "Sau khi bạn dùng phép: quân này +1 công (tối đa 2 lần mỗi lượt).",
  scout: "Vào sân: rút 1 lá nếu tay có tối đa 3 lá.",
  snare: "Vào sân: quân địch có công cao nhất mất 1 công (tối thiểu 0).",
  mender: "Vào sân: hồi 2 máu cho mọi đồng minh trên sân, tối đa máu gốc.",
  bloom: "Khi chủ tướng thực sự được hồi máu: quân này +1 công (tối đa 2 lần mỗi lượt).",
  host: "Vào sân: mọi đồng minh khác nhận 1 chắn.",
  pantry: "Khi bị hạ: hồi 3 máu chủ tướng.",
  farewell: "Khi bị hạ: rút 1 lá (vẫn chịu kiệt sức nếu hết bài).",
  weaver: "Sau khi bạn dùng phép: đồng minh ít máu nhất nhận 1 chắn (tối đa 2 lần mỗi lượt).",
  welcome: "Vào sân: nếu bàn có 3 hệ khác nhau, mọi đồng minh +1 công.",
  wok: "Gây 5 sát thương lên mục tiêu địch, rồi gây 1 sát thương lên quân địch còn sống ít máu nhất khác mục tiêu đó.",
  pierce: "Gây 7 sát thương lên mục tiêu địch, xuyên lá chắn; lá chắn vẫn giữ nguyên.",
  desperation: "Gây 6 sát thương lên mục tiêu địch; thành 10 nếu ý chí của bạn không quá nửa.",
  insight: "Rút 3 lá. Nếu bàn có 3 hệ khác nhau, hồi 1 năng lượng (tối đa năng lượng lượt).",
  wash: "Xóa toàn bộ chắn của mục tiêu địch, rồi gây 3 sát thương. Chủ tướng chỉ nhận 3 sát thương.",
  revive: "Tái triệu hồi đồng minh giá tối đa 4 bị hạ gần nhất với 2 máu, chưa được đánh. Không kích hiệu ứng vào sân. Cần ô trống và ký ức đã mất.",
  mend: "Hồi 4 máu chủ tướng và 2 máu cho mọi đồng minh trên sân.",
  feast: "Hồi 5 máu chủ tướng và 3 máu cho mọi đồng minh trên sân.",
  root: "Mọi đồng minh nhận 1 chắn. Quân nhiều máu nhất trở thành Hộ vệ.",
  rebloom: "Hồi 6 máu chủ tướng. Nếu còn ô trống, tái triệu hồi đồng minh giá tối đa 4 bị hạ gần nhất với 2 máu; không kích hiệu ứng vào sân.",
  sharp: "Đồng minh có công thấp nhất nhận +2 công và +2 máu tối đa.",
  diverse: "Mọi đồng minh +1 công, +1 máu tối đa; thành +2/+2 nếu bàn có ít nhất 2 hệ khác nhau. Nếu có 3 hệ, mỗi quân nhận thêm 1 chắn.",
  bulwark: "Đồng minh ít máu nhất nhận 3 chắn và trở thành Hộ vệ.",
  offering: "Hy sinh đồng minh ít máu nhất; những quân còn lại +2 công, +3 máu tối đa. Cần ít nhất 2 quân. Hiệu ứng khi bị hạ vẫn kích hoạt.",
  veil: "Mọi đồng minh nhận 1 chắn. Nếu đã dùng phép trong lượt này, rút thêm 1 lá.",
  dream: "Hồi 3 máu chủ tướng. Đóng băng quân địch có công cao nhất: bỏ lần tấn công ở lượt kế tiếp của nó.",
  starlight: "Gây 2 sát thương lên mục tiêu địch, thêm 2 cho mỗi phép đã dùng trong lượt này (tối đa +4).",
  moonward: "Mọi đồng minh nhận 2 chắn. Nếu có đủ 3 quân, rút 1 lá.",
}
const SCHOOL_ABILITIES: Record<School, Ability[]> = {
  ember: ["ambush", "spellfire"], tide: ["scout", "snare"], grove: ["mender", "bloom"],
  hearth: ["host", "pantry"], sugar: ["farewell", "weaver"],
}
export function foodProfile(card: GameCard, hash: number): GameCard {
  if (["banh-mi", "pho-bo", "com-tam", "banh-cuon", "bun-cha", "xoi"].includes(card.id)) return card
  const signature: Record<string, Ability> = { "dua-hanh": "bloom", "goi-cuon-tom-thit": "bloom", "nom-sua-xoai": "mender" }
  if (signature[card.id]) return { ...card, ability: signature[card.id], effect: undefined, text: `${card.keywords.includes("guard") ? "Hộ vệ. " : ""}${ABILITY_TEXT[signature[card.id]]}` }
  const variant = Math.floor(hash / 6) % 6
  if (variant === 0) return card
  const ability = variant <= 2 ? SCHOOL_ABILITIES[card.school][variant - 1] : variant === 4 ? "welcome" : undefined
  const keywords = variant === 3
    ? [card.school === "ember" ? "drain" as const : card.school === "tide" || card.school === "hearth" ? "shield" as const : card.school === "sugar" ? "rush" as const : "guard" as const]
    : card.keywords
  const prefix = keywords.map(k => ({ guard: "Hộ vệ.", rush: "Xung phong.", shield: "Chắn 1.", drain: "Hút vị." })[k]).join(" ")
  return { ...card, keywords, ability, effect: ability ? undefined : card.effect,
    attack: card.attack + (variant === 5 ? 1 : 0), health: card.health - (variant === 5 ? 1 : 0),
    text: `${prefix} ${ability ? ABILITY_TEXT[ability] : card.effect === "heal" ? `Vào sân: hồi ${card.power} máu chủ tướng.` : card.effect === "draw" ? `Vào sân: rút ${card.power} lá.` : "Đồng hệ: nhận 1 chắn nếu có đồng minh cùng hệ."}`.trim() }
}
const SPELLS: Record<string, Partial<GameCard>> = {
  "wok-storm": { ability: "wok", power: 5 },
  "dragon-breath": { ability: "pierce", power: 7 }, "last-flame": { ability: "desperation", power: 6 },
  "recipe-scroll": { ability: "insight", power: 3 }, "tidal-cut": { ability: "wash", power: 3 },
  "sea-memory": { ability: "revive", power: 0 }, herb: { ability: "mend", power: 4 },
  "spring-feast": { ability: "feast", power: 5 }, "forest-oath": { ability: "root", power: 1 },
  rebloom: { ability: "rebloom", power: 6 }, seasoning: { ability: "sharp", power: 2 },
  "family-table": { ability: "diverse", power: 1 }, "iron-ladle": { ability: "bulwark", power: 3 },
  "hearth-legacy": { ability: "offering", cost: 4, power: 2 }, "sugar-veil": { ability: "veil", power: 1 },
  "sweet-dream": { ability: "dream", power: 3 }, starlight: { ability: "starlight", power: 2 },
  "moon-banquet": { ability: "moonward", power: 2 },
}
export function specializeCard(card: GameCard): GameCard {
  const patch = SPELLS[card.id]
  return patch ? { ...card, ...patch, text: patch.ability ? ABILITY_TEXT[patch.ability] : patch.text! } : card
}
