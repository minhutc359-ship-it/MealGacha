import { AWAKENED_ROSTER } from "./awakenedRoster";
import { SPIRIT_RARITY, SPIRIT_THRESHOLDS } from "../../domain/spiritSummons";
import type { RpgHero } from "./types";
export const AWAKENING_MEDIA = "/assets/rpg/awakening530";
export const RARITY_POWER = { common: 1, rare: 1.04, epic: 1.08, legendary: 1.12 };
// Attack, support, ultimate and passive are independent recipes, not five role clones.
export const PRIMARY_MOVES = [["Liên kích", "", 6], ["Truy ảnh", "", 7], ["Hoành trảm", "", 8], ["Chùy hương", "", 7], ["Dẫn sấm", "", 8], ["Hỏa châm", "", 7], ["Hộ tâm", "", 7], ["Vững thành", "", 8], ["Chặn sương", "", 8], ["Phong ấn", "", 8], ["Tinh thương", "", 7], ["Vạn tuyến", "", 9], ["Băng thương", "", 7], ["Hải hút", "", 8], ["Pháp hoàn", "", 7], ["Mầm chữa", "", 8], ["Cuộn thanh", "", 8], ["Tiếp hương", "", 7], ["Ước noãn", "", 8], ["Sinh mệnh", "", 9], ["Mộng trói", "", 8], ["Cắt ý", "", 7], ["Bóng nguyệt", "", 7], ["Sương yếu", "", 8], ["Tinh khóa", "", 8]] as const;
export const SUPPORT_MOVES = [["Mái nhà", "", 10], ["Dưỡng mầm", "", 11], ["Thanh âm", "", 10], ["Tiếp lửa", "", 11], ["Gió nhanh", "", 12], ["Dấu săn", "", 10], ["Bụi mộng", "", 11], ["Vỡ giáp", "", 12], ["Rễ neo", "", 12], ["Chuyển triều", "", 10], ["Gương hộ", "", 12], ["Nhịp nối", "", 12], ["Kết giới", "", 12], ["Hạt noãn", "", 11], ["Tro tàn", "", 11], ["Vườn chung", "", 12]] as const;
export const ULTIMATE_MOVES = [
    ["Thiên thành", "Tạo khiên cho đội, phản đòn và đánh tuyến trước.", "citadel"],
    ["Tinh lạc", "Ba đòn vào địch mạnh nhất, phá giáp 5 giây.", "meteor"],
    ["Vạn tượng", "Đánh toàn bộ địch, tăng lực khi có dấu nguyên tố.", "nova"],
    ["Liên sinh", "Thanh tẩy, hồi phục toàn đội và tái sinh 4 giây.", "lotus"],
    ["Phong nguyệt", "Đánh tuyến sau, gây choáng và hút năng lượng.", "moon"],
    ["Gương mộng", "Đánh địch gần nhất; né đòn và giảm sát thương cho đội.", "mirror"],
    ["Thiết trận", "Che tuyến trước, thu hút đòn và quét toàn bộ địch.", "bastion"],
    ["Cửu trảm", "Bốn nhát chém, nhát cuối phá một phần khiên.", "blade"],
    ["Băng long", "Đánh toàn địch, gây choáng và làm yếu.", "frost"],
    ["Đoàn viên", "Thanh tẩy, hồi cả đội và tiếp năng lượng cho hai người.", "reunion"],
    ["Tinh tỏa", "Đánh hai địch mạnh nhất, khóa hồi phục và làm yếu.", "chains"],
    ["Thâu mộng", "Hút năng lượng hai địch đang đầy nhất rồi phản kích.", "drain"],
    ["Phản thiên", "Che đội bằng khiên phản đòn, đánh địch còn khiên.", "counter"],
    ["Thiên phượng", "Quét lửa, tăng lực vào địch Bỏng và đốt 5 giây.", "phoenix"],
    ["Phán quyết", "Truy kích địch thấp HP nhất; tăng lực dưới 30% HP.", "judgement"],
    ["Vạn sinh", "Thanh tẩy, hồi phục, tạo khiên và kết giới cho đội.", "sanctuary"],
    ["Long triều", "Phá khiên tuyến trước, đánh và tiếp năng lượng đồng đội.", "tide"],
    ["Tái ước", "Thanh tẩy, cứu người thấp HP và che ba người yếu nhất.", "renewal"],
    ["Thiên cân", "Tạo khiên, kết giới và tiếp năng lượng toàn đội.", "balance"],
    ["Ảnh xuyên", "Hai đòn xuyên tuyến sau, phá giáp và né đòn.", "shadow"],
] as const;
export const PASSIVE_MOVES = [["Bất khuất", ""], ["Nhìn thấu", ""], ["Giữ tàn", ""], ["Dòng chảy", ""], ["Hạt sống", ""], ["Mộng sâu", ""], ["Truy kích", ""], ["Hộ ước", ""], ["Từ tâm", ""], ["Nhạc trưởng", ""], ["Gai nhớ", ""], ["Dư âm", ""]] as const;
export const OATHS = [["Hộ ước", ""], ["Tàn hỏa", ""], ["Dấu triều", ""], ["Cứu viện", ""], ["Kết mầm", ""], ["Ngắt mộng", ""]] as const;
const kits = new Map(AWAKENED_ROSTER.map(([id, title, primary, support, ultimate, passive, oath, motif, iconCell]) => [id, { id, title, primary, support, ultimate, passive, oath, motif, iconCell }]));
export function awakenedKit(id: string) { return kits.get(id)!; }
export interface SpiritSkillDetails {
    primary: string[];
    support: string[];
    ultimate: string[];
    passive: string[];
    oaths: string[];
    legendary: string[];
}
export function awakeningSkills(hero: RpgHero, details?: SpiritSkillDetails | null) {
    const kit = awakenedKit(hero.cardId);
    const indices = [kit.primary, kit.support, kit.ultimate, kit.passive];
    const recipes = [PRIMARY_MOVES[kit.primary], SUPPORT_MOVES[kit.support], ULTIMATE_MOVES[kit.ultimate], PASSIVE_MOVES[kit.passive]];
    return recipes.map((move, i) => ({
        icon: i === 2 ? 64 + kit.iconCell : i === 0 ? kit.primary * 2 % 50 : i === 1 ? kit.support * 2 + 1 : 50 + kit.passive,
        name: `${kit.title} · ${move[0]}`,
        text: `${details?.[(["primary", "support", "ultimate", "passive"] as const)[i]]?.[indices[i]] ?? "Chi tiết kỹ năng đang tải."} ${i === 2 ? (details?.oaths[kit.oath] ?? "") + (SPIRIT_THRESHOLDS[SPIRIT_RARITY[hero.cardId]] >= 35 ? " Sử thi/Huyền thoại: liên hương thêm 5 năng lượng cho đồng đội khác (tối đa một lần mỗi chiêu)." : "") + (SPIRIT_RARITY[hero.cardId] === "legendary" ? ` Chân ước: cấp 10, bậc 2, tuyệt kỹ cấp 3. ${details?.legendary[kit.oath] ?? ""}` : "") : ""} ${i < 3 ? "Mỗi cấp tăng 9% công/hồi trực tiếp/khiên; tái sinh và trạng thái giữ mức gốc." : "HP và công +2.5% mỗi cấp nội tại; hiệu ứng riêng mở ở bậc 2."}`,
        unlock: i === 1 ? 5 : i === 3 ? 2 : 1,
        ready: i === 1 ? hero.level >= 5 : i === 3 ? hero.rank >= 2 : true,
        level: hero.skills[i],
        tag: i === 0 ? `Tự động · ${PRIMARY_MOVES[indices[i]][2]}s` : i === 1 ? `Tự động · ${SUPPORT_MOVES[indices[i]][2]}s` : i === 2 ? "Tuyệt kỹ · 100 năng lượng" : "Nội tại · Bậc 2",
    }));
}
