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
    "cloud-teapot": { name: "Vân trà hồi lưu", text: "Rót mây hồi phục, dựng khiên; Hard/Extreme còn rút năng lượng." },
    "salt-colossus": { name: "Chấn lò muối đỏ", text: "Phá khiên, gây Bỏng và làm nứt giáp; Extreme nện thêm ở pha hai." },
    "moon-heron": { name: "Nguyệt vũ đoạn triều", text: "Đổi tuyến, hút năng lượng và gây choáng; pha hai quét cả đội." },
    "aroma-regent": { name: "Vạn hương nhiếp chính", text: "Làm yếu toàn đội, dựng khiên cho quân hương và phản kích ở pha hai." },
};

const CAMPAIGN_ENEMIES: Record<string, {
    regular: {id: string; name: string; style: EnemyStyle}[];
    elite: {id: string; name: string; style: EnemyStyle};
}> = {
    mistwood: {
        regular: [
            {id: "tea-moth", name: "Bướm Trà Ngọc", style: "hexer"},
            {id: "jade-sentinel", name: "Vệ Binh Ngọc", style: "bulwark"},
        ],
        elite: {id: "tea-oracle", name: "Trà Sư Vân", style: "mender"},
    },
    sugartower: {
        regular: [
            {id: "salt-scarab", name: "Bọ Muối Đỏ", style: "raider"},
            {id: "kiln-knight", name: "Kỵ Sĩ Lò", style: "bulwark"},
        ],
        elite: {id: "salt-alchemist", name: "Luyện Sư Muối", style: "mender"},
    },
    ashalley: {
        regular: [
            {id: "moon-jelly", name: "Sứa Nguyệt", style: "hexer"},
            {id: "lotus-mantis", name: "Bọ Ngựa Sen", style: "raider"},
        ],
        elite: {id: "moon-priestess", name: "Tư Tế Nguyệt", style: "hexer"},
    },
    lasttable: {
        regular: [
            {id: "spice-kite", name: "Diều Gia Vị", style: "raider"},
            {id: "bronze-warden", name: "Hộ Vệ Hương", style: "bulwark"},
        ],
        elite: {id: "aroma-conductor", name: "Nhạc Trưởng Hương", style: "mender"},
    },
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
    const campaign = region ? CAMPAIGN_ENEMIES[region] : undefined;
    const styles: EnemyStyle[] = ["bulwark", "raider", "hexer", "mender", "raider", "hexer"];
    return Array.from({ length: count }, (_, wave) => {
        const size = dungeon ? 4 + Number(level >= 15) : 4 + Number(level >= 5) + Number(level >= 15);
        const finalBoss = boss && wave === count - 1;
        const units: RpgEnemy[] = Array.from({ length: size - Number(!!finalBoss) }, (_, slot) => {
            const campaignElite = campaign && wave === count - 1 && slot === 0;
            const identity = campaignElite
                ? campaign.elite
                : campaign?.regular[(slot + wave) % campaign.regular.length];
            const style = identity?.style ?? styles[(slot + wave) % styles.length];
            return {
                uid: `e:${wave}:${slot}`,
                id: identity?.id ?? POOLS[school][(slot + wave) % 3],
                name: identity?.name ?? ENEMY_STYLES[style].name,
                school, boss: false,
                level: Math.max(1, Math.min(50, level - (count - wave - 1))), style,
                elite: campaign ? !!campaignElite : level >= 3 && wave === count - 1 && slot === 0,
                ...(strength > 1 ? { strength } : {}),
                ...(multiplier > 1 ? { difficultyMultiplier: multiplier } : {}),
            };
        });
        if (finalBoss)
            units.push({ uid: `e:${wave}:boss`, id: boss.id, name: boss.name, school, boss: true, level, ...(strength > 1 ? { strength } : {}), ...(multiplier > 1 ? { difficultyMultiplier: multiplier } : {}) });
        return units;
    });
}
