import { CARD_MAP } from "../catalog"
import type { School } from "../types"
import type { RpgRole } from "./types"
export const SPIRIT_SCHOOLS: School[] = ["hearth", "ember", "grove", "tide", "sugar"]
const ROLES: RpgRole[] = ["guardian", "striker", "mage", "healer", "trickster"]
const THEMES = ["Kim sư", "Hỏa phượng", "Ngọc lâm", "Long triều", "Nguyệt mộng"]
const MOVES = ["Hộ trận", "Liên trảm", "Pháp ấn", "Sinh hoa", "Ảo ảnh"]
const FINISH = ["Thiên thành", "Phá quân", "Vạn tượng", "Đoàn viên", "Phong nguyệt"]
const EFFECTS = ["khiên 12% HP cho người yếu nhất", "Bỏng hương 4s", "hồi 8% HP cho người yếu nhất", "+8 năng lượng cho đồng đội", "làm yếu mục tiêu 4s"]
export function spiritKit(id: string, role: RpgRole) {
 const s = SPIRIT_SCHOOLS.indexOf(CARD_MAP[id].school), ri = ROLES.indexOf(role)
 const variant = [...id].reduce((n,c)=>n+c.charCodeAt(0),0) % 3
 const style = ["Cân bằng", "Tập kích", "Tiếp sức"][variant]
 return {variant, style, school: s, icon: (s * 5 + ri) * 2, primary: `${THEMES[s]} · ${MOVES[ri]}`, burst: `${THEMES[s]} · ${FINISH[ri]} · ${style}`, effect: EFFECTS[s]}
}
export function reactionName(from: School, to: School) {
 const pair = [from, to].sort().join(":")
 return ({"ember:tide": "Bốc hơi", "ember:grove": "Nở rộ", "grove:tide": "Sinh trưởng", "hearth:sugar": "Mộng ấm"} as Record<string, string>)[pair] ?? null
}
export const REACTION_HELP = "Kỹ năng lưu dấu nguyên tố 5s: Hỏa + Thủy gây Bốc hơi (+80% công); Hỏa + Mộc Nở rộ (bỏng + làm yếu); Mộc + Thủy Sinh trưởng (hồi 10% HP đội); Bếp + Ngọt Mộng ấm (khiên 12% HP đội). Nối tuyệt kỹ khác người trong 3s: +15% hiệu lực mỗi nhịp, tối đa +30%."
