import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { newGame } from "@/game/progression";
import { parseGame } from "@/game/storage";
import { newRpgSave, reduceRpg as currentReduceRpg, createRpgBattle, advanceRpgBattle } from "@/game/adventureRpg/engine";
import { RPG_STAGE_IDS, rpgStage } from "@/game/adventureRpg/content";
import { dungeonScaling } from "@/game/adventureRpg/enemies";
import type { RpgSave } from "@/game/adventureRpg/types";
const game = newGame();
const reduceRpg: typeof currentReduceRpg = (current, action, g) => {
  const result=currentReduceRpg(current,action,g)
  if(!result.error && result.save.run && ["start","dungeon"].includes(action.type)) {
    const b=result.save.run.battle
    result.save.run.battle=createRpgBattle(result.save,b.waves,b.id,undefined,0,520)
  }
  return result
};
function prepared(level: number, geared = true) {
    const s = newRpgSave(game);
    for (const h of s.roster) {
        h.level = level;
        if (geared) {
            h.rank = Math.min(5, 1 + Math.floor(level / 10));
            h.skills = [Math.min(6, level), Math.min(6, level), Math.min(6, level), Math.min(6, level)];
            h.gear = [3, 3, 2];
        }
    }
    return s;
}
function finish(save: RpgSave) {
    let s = reduceRpg(save, { type: "auto" }, game).save;
    for (let i = 0; i < 720 && !s.run!.battle.result; i++) {
        const b = s.run!.battle;
        const priority = b.actors.find(a => a.side === "enemy" && a.hp > 0 && a.style === "mender") ?? b.actors.find(a => a.side === "enemy" && a.hp > 0 && a.style === "hexer");
        if (priority && b.focus !== priority.uid)
            s = reduceRpg(s, { type: "focus", uid: priority.uid }, game).save;
        if (b.warning && b.tick >= b.guardReady)
            s = reduceRpg(s, { type: "guard", row: b.warning.row }, game).save;
        s = reduceRpg(s, { type: "tick", steps: 1 }, game).save;
    }
    return s;
}
describe("RPG 5.2 enemy formations and difficulty", () => {
    it("has three substantial waves, and four-wave bosses with elites and distinct enemy roles", () => {
        const times = [];
        for (const id of ["lantern-1", "lantern-6", "harbor-6", "garden-6", "tide-6"]) {
            const stage = rpgStage(id)!, s = prepared(stage.level);
            for (const prev of RPG_STAGE_IDS) {
                if (prev === id)
                    break;
                s.stars[prev] = 1;
            }
            const run = reduceRpg(s, { type: "start", stageId: id }, game).save;
            expect(run.run!.battle.rulesVersion).toBe(520);
            expect(run.run!.battle.waves.length).toBe(stage.boss ? 4 : 3);
            expect(run.run!.battle.waves.every(w => w.length >= 4 && w.length <= 6)).toBe(true);
            const done = finish(run), b = done.run!.battle;
            times.push({ id, level: stage.level, result: b.result, seconds: b.tick / 4, survivors: b.actors.filter(a => a.side === "ally" && a.hp > 0).length });
            expect(b.result, id).toBe("win");
            expect(parseGame({ ...game, adventureRpg: done })).not.toBeNull();
        }
        mkdirSync("dev/docs/web-v520", { recursive: true });
        writeFileSync("dev/docs/web-v520/balance-qa.json", JSON.stringify(times, null, 2) + "\n");
    });
    it("takes the average of selected heroes, snapshots it and does not scale from reserves", () => {
        const s = prepared(20);
        s.roster[0].level = 5;
        s.roster[0].skills = [5, 5, 5, 5];
        s.formation = [s.roster[0].uid, s.roster[1].uid];
        s.roster.at(-1)!.level = 50;
        expect(dungeonScaling(s, 1).average).toBe(12.5);
        expect(dungeonScaling(s, 3).baseLevel).toBeGreaterThan(dungeonScaling(s, 1).baseLevel);
        const run = reduceRpg(s, { type: "dungeon", kind: "forge", tier: 1 }, game).save;
        const copy = parseGame(JSON.parse(JSON.stringify({ ...game, adventureRpg: run })))!.adventureRpg!;
        expect(copy.run!.dungeon!.scaling).toEqual(run.run!.dungeon!.scaling);
    });
    it("keeps old snapshots on old stats and enemy AI", () => {
        const run = reduceRpg(prepared(8), { type: "start", stageId: "lantern-1" }, game).save;
        run.run!.battle.rulesVersion = 510;
        for (const a of run.run!.battle.actors) {
            a.nextAttack = 100;
            a.nextSupport = 100;
            a.nextSkill = a.side === "enemy" ? 0 : 100;
        }
        const old = advanceRpgBattle(run.run!.battle, 8);
        expect(old.events.some(e => e.animation === "enemy")).toBe(false);
        expect(old.rulesVersion).toBe(510);
    });
    it("lets a fresh team win the opening stage, but not an unprepared boss", () => {
        const s = prepared(1, false);
        const first = finish(reduceRpg(s, { type: "start", stageId: "lantern-1" }, game).save);
        expect(first.run!.battle.result).toBe("win");
        expect(first.run!.battle.tick / 4).toBeGreaterThan(30);
        for (let i = 1; i <= 5; i++)
            s.stars[`lantern-${i}`] = 1;
        const boss = finish(reduceRpg(s, { type: "start", stageId: "lantern-6" }, game).save);
        expect(boss.run!.battle.result).toBe("loss");
        writeFileSync("dev/docs/web-v520/opening-qa.json", JSON.stringify({ freshLevel: 1, gear: 0, skills: 1, firstStage: { result: first.run!.battle.result, seconds: first.run!.battle.tick / 4 }, unpreparedBoss: { result: boss.run!.battle.result, seconds: boss.run!.battle.tick / 4 } }, null, 2) + "\n");
    });
    it("uses distinct boss mechanics and supports guard / healing counters", () => {
        for (const [map, id] of [["lantern", "boss-drum"], ["harbor", "char-hound"], ["garden", "bamboo-wraith"], ["tide", "v4-tide-lock"]]) {
            const s = prepared(30);
            for (const stage of RPG_STAGE_IDS) {
                if (stage === `${map}-6`)
                    break;
                s.stars[stage] = 1;
            }
            const run = reduceRpg(s, { type: "start", stageId: `${map}-6` }, game).save, b = run.run!.battle;
            const definition = b.waves.at(-1)!.find(e => e.boss)!;
            const source = { ...b.actors.find(a => a.side === "enemy")!, ...definition, slot: 2, side: "enemy" as const, attack: 100, hp: 5000, maxHp: 10000, nextSkill: 1000 };
            b.actors = b.actors.filter(a => a.side === "ally");
            b.actors.push(source);
            for (const a of b.actors) {
                a.nextAttack = a.nextSkill = a.nextSupport = 1000;
            }
            b.warning = { source: source.uid, until: 1, row: "front" };
            const plain = advanceRpgBattle(b, 1), guarded = advanceRpgBattle(reduceRpg(run, { type: "guard", row: "front" }, game).save.run!.battle, 1);
            expect(guarded.actors[0].hp).toBeGreaterThan(plain.actors[0].hp);
            const enemies = plain.actors.filter(a => a.side === "enemy"), allies = plain.actors.filter(a => a.side === "ally");
            expect(plain.events.some(e => e.kind === "boss" && e.animation === "enemy")).toBe(true);
            if (id === "boss-drum")
                expect(enemies[0].shield).toBeGreaterThan(0);
            if (id === "char-hound")
                expect(allies[0].burn).toBeGreaterThan(0);
            if (id === "bamboo-wraith") {
                expect(allies[0].wither).toBeGreaterThan(0);
                expect(enemies[0].hp).toBeGreaterThan(5000);
            }
            if (id === "v4-tide-lock")
                expect(allies[0].energy).toBeLessThan(b.actors[0].energy);
        }
    });
    it("carries the original dungeon level snapshot across XP gains and reload", () => {
        let s = reduceRpg(prepared(12), { type: "dungeon", kind: "experience", tier: 1 }, game).save;
        const scaling = structuredClone(s.run!.dungeon!.scaling);
        s = finish(s);
        expect(s.run!.battle.result).toBe("win");
        s = reduceRpg(s, { type: "settle" }, game).save;
        s = parseGame(JSON.parse(JSON.stringify({ ...game, adventureRpg: s })))!.adventureRpg!;
        s = reduceRpg(s, { type: "next" }, game).save;
        expect(s.run!.dungeon!.scaling).toEqual(scaling);
        expect(s.run!.battle.waves[0][0].level).toBe(scaling!.baseLevel + 1);
        expect(s.run!.battle.rulesVersion).toBe(520);
    });
    it("keeps pre-5.2 dungeon floors on their original level and rule schedule", () => {
        let s = reduceRpg(prepared(12), { type: "dungeon", kind: "experience", tier: 1 }, game).save;
        delete s.run!.dungeon!.scaling;
        s.run!.battle.rulesVersion = 510;
        s = finish(s);
        s = reduceRpg(s, { type: "settle" }, game).save;
        s = parseGame({ ...game, adventureRpg: s })!.adventureRpg!;
        s = reduceRpg(s, { type: "next" }, game).save;
        expect(s.run!.battle.rulesVersion).toBe(510);
        const enemy = s.run!.battle.actors.find(a => a.side === "enemy")!;
        expect(enemy.level).toBe(2);
        expect(enemy.maxHp).toBe(184);
        expect(enemy.style).toBeUndefined();
        expect(s.run!.dungeon!.scaling).toBeUndefined();
    });
    it("keeps higher tiers distinct even near the level cap", () => {
        const s = prepared(50);
        for (const id of RPG_STAGE_IDS)
            s.stars[id] = 1;
        const a = reduceRpg(s, { type: "dungeon", kind: "forge", tier: 2 }, game).save;
        const b = reduceRpg(s, { type: "dungeon", kind: "forge", tier: 3 }, game).save;
        expect(b.run!.battle.waves[0][0].strength).toBeGreaterThan(a.run!.battle.waves[0][0].strength!);
        expect(b.run!.battle.actors.find(a => a.side === "enemy")!.maxHp).toBeGreaterThan(a.run!.battle.actors.find(a => a.side === "enemy")!.maxHp);
    });
});
