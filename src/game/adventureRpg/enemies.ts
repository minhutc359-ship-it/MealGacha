import type { School } from "../types";
import type { EnemyStyle, RpgDifficulty, RpgEnemy, RpgSave } from "./types";
const POOLS: Record<School, string[]> = {
    hearth: ["ink-crab", "rival-ladle", "silk-moth"],
    ember: ["char-hound", "rival-flute", "ink-crab"],
    grove: ["bamboo-wraith", "silk-moth", "rival-ladle"],
    tide: ["ink-crab", "rival-flute", "silk-moth"],
    sugar: ["silk-moth", "rival-ladle", "bamboo-wraith"],
};
export const ENEMY_STYLES: Record<EnemyStyle, {
    name: string;
    skill: string;
    text: string;
}> = {
    bulwark: { name: "Hộ vệ sương", skill: "Vỏ ký ức", text: "Tạo khiên cho đồng đội, che người thấp HP nhất." },
    raider: { name: "Thợ săn hương", skill: "Vồ hương", text: "Tập kích tuyến sau, để lại Bỏng hương." },
    hexer: { name: "Dệt sương", skill: "Khóa hương", text: "Hút năng lượng, làm yếu và giảm hồi phục 50% trong 3s." },
    mender: { name: "Người giữ sương", skill: "Vá ký ức", text: "Hồi HP cho đồng đội còn sống; ưu tiên tinh anh và boss." },
};
export const BOSS_SKILLS: Record<string, {
    name: string;
    text: string;
}> = {
    "boss-drum": { name: "Trống vỡ mâm", text: "Chấn động tuyến trước, tạo khiên cho phe địch; cuồng nộ đổi sang tuyến sau." },
    "char-hound": { name: "Bão than tàn", text: "Quét lửa và gây bỏng, cuồng nộ phá một phần khiên." },
    "bamboo-wraith": { name: "Rễ níu ký ức", text: "Rễ trói gây choáng tuyến bị nhắm, hút sinh lực và giảm hồi phục 50% trong 4s." },
    "v4-tide-lock": { name: "Triều khóa hương", text: "Sóng hút năng lượng và làm yếu; cuồng nộ đánh cả hai tuyến." },
    "boss-lotus": { name: "Sen nuốt mộng", text: "Hút năng lượng, giảm hồi phục 50% trong 5s; hồi HP và bảo vệ người giữ kho." },
    "boss-blue-root": { name: "Rễ bám ký ức", text: "Hút sinh lực tuyến trước và tạo khiên cho các bóng sương." },
    "boss-mirror-sugar": { name: "Đường soi gương", text: "Chuyển đòn vào người thấp máu, hút năng lượng và dựng khiên." },
    "boss-char-clock": { name: "Giờ tro cháy", text: "Đốt hai tuyến, phá khiên và giữ chân người hỗ trợ." },
    "boss-last-banquet": { name: "Bàn tiệc khóa tên", text: "Khóa hồi phục, dựng khiên và phản công ở pha cuối." },
};
export function formationAverage(save: RpgSave) {
    const team = save.formation.map(uid => save.roster.find(h => h.uid === uid)!);
    return Math.round(team.reduce((n, h) => n + h.level, 0) / team.length * 10) / 10;
}
export function dungeonScaling(save: RpgSave, tier: number) {
    const average = formationAverage(save);
    return { average, baseLevel: Math.min(50, Math.max(1, Math.round(average * .9) + (tier - 1) * 3)) };
}
export function encounterWaves(school: School, level: number, count: number, boss?: {
    id: string;
    name: string;
}, dungeon = false, strength = 1, region?: string, difficulty: RpgDifficulty = "normal"): RpgEnemy[][] {
    const multiplier: 1 | 3 | 8 = difficulty === "extreme" ? 8 : difficulty === "hard" ? 3 : 1;
    const advancedElites: Record<string, string> = {
        mistwood: "mist-vine-elite", sugartower: "sugar-echo-elite",
        ashalley: "char-ash-elite", lasttable: "table-shadow-elite",
    };
    const styles: EnemyStyle[] = ["bulwark", "raider", "hexer", "mender", "raider", "hexer"];
    return Array.from({ length: count }, (_, wave) => {
        const size = dungeon ? 4 + Number(level >= 15) : 4 + Number(level >= 5) + Number(level >= 15);
        const finalBoss = boss && wave === count - 1;
        const units: RpgEnemy[] = Array.from({ length: size - Number(!!finalBoss) }, (_, slot) => {
            const style = styles[(slot + wave) % styles.length];
            return {
                uid: `e:${wave}:${slot}`, id: advancedElites[region ?? ""] && wave === count - 1 && slot === 0 ? advancedElites[region!] : POOLS[school][(slot + wave) % 3],
                name: advancedElites[region ?? ""] && wave === count - 1 && slot === 0 ? ({mistwood:"Dây Trói Đêm",sugartower:"Kính Vỡ",ashalley:"Tro Kẹp",lasttable:"Bóng Cạn"}[region!] ?? "Tinh anh") : ENEMY_STYLES[style].name, school, boss: false,
                level: Math.max(1, Math.min(50, level - (count - wave - 1))), style,
                elite: level >= 3 && wave === count - 1 && slot === 0,
                ...(strength > 1 ? { strength } : {}),
                ...(multiplier > 1 ? { difficultyMultiplier: multiplier } : {}),
            };
        });
        if (finalBoss)
            units.push({ uid: `e:${wave}:boss`, id: boss.id, name: boss.name, school, boss: true, level, ...(strength > 1 ? { strength } : {}), ...(multiplier > 1 ? { difficultyMultiplier: multiplier } : {}) });
        return units;
    });
}
