import { starterCharacter } from "@/game/starterCharacters";
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { CARDS, CARD_MAP } from "@/game/catalog";
import { newGame } from "@/game/progression";
import { parseGame } from "@/game/storage";
import { newRpgSave, reduceRpg, createRpgBattle, heroStats, heroSkills, advanceRpgBattle, syncRoster } from "@/game/adventureRpg/engine";
import { rpgSaveSchema } from "@/game/adventureRpg/schema";
import { AWAKENED_ROSTER } from "@/game/adventureRpg/awakenedRoster";
import { awakenedKit } from "@/game/adventureRpg/awakening";
import { SPIRIT_IDS } from "@/game/adventureRpg/spiritArt";
import { SPIRIT_POOLS, SPIRIT_RARITY, SPIRIT_THRESHOLDS, drawSpiritCard } from "@/domain/spiritSummons";
import type { RpgSave, RpgAction } from "@/game/adventureRpg/types";
const game = newGame();
function act(s: RpgSave, a: RpgAction) { const r = reduceRpg(s, a, game); expect(r.error).toBeUndefined(); expect(rpgSaveSchema.safeParse(r.save).success).toBe(true); return r.save; }
function fixture(id = "com-tam", cinematics = true) {
    let s = newRpgSave(game);
    syncRoster(s, { [id]: 45 });
    s.formation = [s.roster.find(h => h.cardId === id)!.uid];
    const h = s.roster.find(h => h.cardId === id)!;
    h.level = 10;
    h.rank = 2;
    h.skills = [3, 3, 3, 3];
    s.cinematics = cinematics;
    s = act(s, { type: "start", stageId: "lantern-1" });
    const b = s.run!.battle;
    for (const a of b.actors) {
        a.energy = 100;
        a.nextAttack = a.nextSkill = a.nextSupport = 1000;
        if (a.side === "enemy")
            a.hp = a.maxHp = 10000;
    }
    return s;
}
describe("5.3 character collection and kit coverage", () => {
    it("covers every unit once and gives all 139 a different mechanical recipe and ultimate", () => {
        const units = CARDS.filter(c => c.kind === "unit").map(c => c.id);
        expect(new Set(Object.values(SPIRIT_POOLS).flat())).toEqual(new Set(units));
        expect(SPIRIT_IDS.length).toBe(139);
        expect(new Set(AWAKENED_ROSTER.map(r => r[0]))).toEqual(new Set(units));
        expect(new Set(AWAKENED_ROSTER.map(r => JSON.stringify(r.slice(2, 7)))).size).toBe(139);
        const s = newRpgSave(game);
        syncRoster(s, Object.fromEntries(units.map(id => [id, 45])));
        expect(s.roster.length).toBe(139);
        const names = [];
        const details = JSON.parse(readFileSync("public/assets/rpg/awakening530/skill-details.json", "utf8"));
        for (const h of s.roster) {
            expect(SPIRIT_RARITY[h.cardId]).toBe(CARD_MAP[h.cardId].rarity);
            const skills = heroSkills(h, details);
            expect(skills.length).toBe(4);
            expect(skills.every(k => k.text.length > 60 && k.icon >= 0 && k.icon < 208)).toBe(true);
            names.push(skills[2].name);
        }
        expect(new Set(names).size).toBe(139);
    });
    it.each(Object.entries(SPIRIT_THRESHOLDS))("%s unlocks exactly at %i chest cards, never a single new TCG copy", (rarity, count) => {
        const id = SPIRIT_POOLS[rarity as keyof typeof SPIRIT_POOLS].find(id => !newRpgSave(game).roster.some(h => h.cardId === id))!;
        const s = newRpgSave({ ...game, cards: { ...game.cards, [id]: 100 } });
        expect(s.roster.some(h => h.cardId === id)).toBe(false);
        const before = structuredClone(s);
        syncRoster(s, { [id]: count - 1 });
        expect(s).toEqual(before);
        syncRoster(s, { [id]: count });
        expect(s.roster.filter(h => h.cardId === id)).toHaveLength(1);
        s.roster.at(-1)!.level = 8;
        syncRoster(s, { [id]: 0 });
        expect(s.roster.at(-1)!.level).toBe(8);
        syncRoster(s, { [id]: count + 1 });
        expect(s.roster.filter(h => h.cardId === id)).toHaveLength(1);
    });
    it("can draw every rarity and every member, including all five story heroes", () => {
        for (const [r, pool] of Object.entries(SPIRIT_POOLS))
            for (const [i, id] of pool.entries()) {
                const rolls = [{ common: .8, rare: .2, epic: .05, legendary: .001 }[r]!, (i + .1) / pool.length];
                expect(drawSpiritCard(() => rolls.shift()!)).toBe(id);
            }
    });
    it("preserves existing roster UIDs, levels, resources and collection without paying shards", () => {
        const s = newRpgSave(game), old = structuredClone(s);
        s.roster[0].uid = "old:retained";
        s.formation[0] = "old:retained";
        s.roster[0].level = 27;
        const next = act(s, { type: "sync", cards: {} });
        expect(next).toEqual(s);
        expect(next.resources).toEqual(old.resources);
        expect(game.cards).toEqual(newGame().cards);
    });
    it("keeps rarity bonuses modest and still rewards real levels and skill upgrades", () => {
        const s = newRpgSave(game);
        syncRoster(s, { "chef-nhien": 45 });
        const legendary = s.roster.find(h => h.cardId === "chef-nhien")!;
        const base = heroStats(legendary, false), rare = heroStats(legendary);
        expect(rare.attack / base.attack).toBeGreaterThan(1.08);
        expect(rare.attack / base.attack).toBeLessThan(1.15);
        const common = s.roster.find(h => h.cardId === "banh-mi")!;
        common.level = 15;
        common.gear = [3, 3, 2];
        expect(heroStats(common).attack).toBeGreaterThan(rare.attack * 1.6);
    });
});
describe("5.3 real combat and cinematic transaction", () => {
    it("commits a cast once, freezes the clock, saves/reloads, rejects a second cast and resolves only its own movie", () => {
        let s = fixture(), uid = s.formation[0];
        const hp = s.run!.battle.actors.find(a => a.side === "enemy")!.hp;
        s = act(s, { type: "burst", uid });
        const b = s.run!.battle, serial = b.cinematic!.serial, energy = b.actors[0].energy;
        expect(b.actors.find(a => a.side === "enemy")!.hp).toBeLessThan(hp);
        expect(advanceRpgBattle(b, 8)).toBe(b);
        expect(reduceRpg(s, { type: "burst", uid }, game).error).toBeTruthy();
        const reloaded = parseGame(JSON.parse(JSON.stringify({ ...game, adventureRpg: s })))!.adventureRpg!;
        expect(reloaded).toEqual(s);
        expect(act(s, { type: "cinematicDone", serial: serial + 1 })).toEqual(s);
        s = act(reloaded, { type: "cinematicDone", serial });
        expect(s.run!.battle.cinematic).toBeUndefined();
        expect(s.run!.battle.actors[0].energy).toBe(energy);
        expect(s.run!.battle.actors.find(a => a.side === "enemy")!.hp).toBe(b.actors.find(a => a.side === "enemy")!.hp);
        const done = structuredClone(s);
        expect(act(s, { type: "cinematicDone", serial })).toEqual(done);
        expect(advanceRpgBattle(s.run!.battle).tick).toBe(b.tick + 1);
    });
    it("delays a killing blow's wave/result and pays first-clear loot only after one completion", () => {
        let s = fixture("banh-mi"), b = s.run!.battle;
        b.waves = b.waves.slice(0, 1);
        b.actors = b.actors.filter(a => a.side === "ally" || a.slot === 0);
        b.actors[1].hp = 1;
        b.actors[1].shield = 0;
        s = act(s, { type: "burst", uid: s.formation[0] });
        expect(s.run!.battle.result).toBeNull();
        const before = structuredClone(s.resources), serial = s.run!.battle.cinematic!.serial;
        expect(act(s, { type: "settle" }).resources).toEqual(before);
        s = act(s, { type: "cinematicDone", serial });
        expect(s.run!.battle.result).toBe("win");
        s = act(s, { type: "settle" });
        expect(s.resources.coins).toBeGreaterThan(before.coins);
        const after = structuredClone(s);
        expect(act(s, { type: "settle" })).toEqual(after);
    });
    it("stops AUTO at the first movie and permits fast farming with movies switched off", () => {
        let s = fixture();
        s = act(s, { type: "auto" });
        s = act(s, { type: "tick", steps: 8 });
        expect(s.run!.battle.tick).toBe(1);
        expect(s.run!.battle.cinematic).toBeTruthy();
        s = act(s, { type: "cinematics" });
        expect(s.cinematics).toBe(false);
        expect(s.run!.battle.cinematic).toBeUndefined();
        expect(advanceRpgBattle(s.run!.battle, 4).tick).toBe(5);
    });
    it("executes every hero's primary, support, passive context and ultimate with valid saved states", () => {
        for (const id of SPIRIT_IDS) {
            let s = fixture(id, false), a = s.run!.battle.actors[0];
            a.hp = Math.floor(a.maxHp * .3);
            a.nextSkill = 0;
            s = act(s, { type: "tick", steps: 1 });
            expect(s.run!.battle.events.some(e => e.animation === "primary"), id).toBe(true);
            a = s.run!.battle.actors[0];
            a.nextSkill = 1000;
            a.nextSupport = 0;
            s = act(s, { type: "tick", steps: 1 });
            expect(s.run!.battle.events.some(e => e.animation === "support"), id).toBe(true);
            a = s.run!.battle.actors[0];
            a.energy = 100;
            a.stun = 0;
            s = act(s, { type: "burst", uid: a.uid });
            expect(s.run!.battle.events.some(e => e.animation === "ultimate"), id).toBe(true);
        }
    });
    it("cleansing, taunting, armour break, regeneration and evasion have actual different effects", () => {
        let healer = fixture("banh-cuon", false);
        const h = healer.run!.battle.actors[0];
        h.hp = 100;
        h.wither = 20;
        h.burn = 20;
        h.nextSkill = 0;
        healer = act(healer, { type: "tick", steps: 1 });
        expect(healer.run!.battle.actors[0].wither).toBe(0);
        expect(healer.run!.battle.actors[0].hp).toBeGreaterThan(100);
        let tank = fixture("com-tam", false);
        tank = act(tank, { type: "burst", uid: tank.formation[0] });
        expect(tank.run!.battle.actors[0].traits?.thorns).toBe(20);
        // Exercise each status-producing recipe on a real character, not an invented test kit.
        for (const primary of [3, 6, 15, 22, 24]) {
            const id = AWAKENED_ROSTER.find(r => r[2] === primary)![0];
            let s = fixture(id, false);
            s.run!.battle.actors[0].nextSkill = 0;
            s = act(s, { type: "tick", steps: 1 });
            const actors = s.run!.battle.actors;
            expect(actors.some(a => a.traits?.[({ 3: "fracture", 6: "taunt", 15: "regen", 22: "evade", 24: "vulnerable" } as const)[primary as 3 | 6 | 15 | 22 | 24]]), id).toBe(true);
        }
    });
    it("uses enemy energy as a real interrupt condition for warned skills",()=>{
      const s=fixture("com-tam",false),b=s.run!.battle,source=b.actors.find(a=>a.side==="enemy")!;
      source.id="boss-drum";source.boss=true;source.energy=0;b.warning={source:source.uid,row:"front",until:1};
      const empty=advanceRpgBattle(b,1);expect(empty.warning).toBeNull();expect(empty.events.some(e=>e.source===source.uid&&e.kind==="hit")).toBe(false);
      source.energy=100;const charged=advanceRpgBattle(b,1);expect(charged.events.some(e=>e.source===source.uid&&e.kind==="hit")).toBe(true);expect(charged.actors.find(a=>a.uid===source.uid)!.energy).toBeLessThan(80);
    });
    it("requires rank training before a legendary signature adds its extra hit",()=>{
      let low=fixture("chef-nhien",false),trained=structuredClone(low);low.run!.battle.actors[0].rank=1;
      low=act(low,{type:"burst",uid:low.formation[0]});trained=act(trained,{type:"burst",uid:trained.formation[0]});
      const hits=(s:RpgSave)=>s.run!.battle.events.filter(e=>e.kind==="hit").length;
      expect(hits(trained)).toBe(hits(low)+1);
    });
    it("returns only energy actually stolen and clears an expired stronger counter buff",()=>{
      const id=AWAKENED_ROSTER.find(r=>r[2]===21)![0];let s=fixture(id,false);for(const a of s.run!.battle.actors)a.energy=0;
      s.run!.battle.actors[0].nextSkill=0;s=act(s,{type:"tick",steps:1});expect(s.run!.battle.actors[0].energy).toBe(17);
      s=fixture("com-tam",false);s.run!.battle.actors[0].traits={thorns:1,thornsPower:30};s=act(s,{type:"tick",steps:1});expect(s.run!.battle.actors[0].traits?.thornsPower).toBeUndefined();
    });
    it("Mercy only improves the recipient below 35%, without buffing a healthy neighbour",()=>{
      let s=newRpgSave(game);s.formation=["banh-cuon","com-tam"].map(id=>s.roster.find(h=>h.cardId===id)!.uid);s.cinematics=false;
      for(const h of s.roster){h.level=10;h.rank=2;h.skills=[3,3,3,3]};s=act(s,{type:"start",stageId:"lantern-1"});
      const b=s.run!.battle;for(const a of b.actors)a.nextAttack=a.nextSkill=a.nextSupport=1000;
      const [h,t]=b.actors;h.hp=Math.floor(h.maxHp*.2);t.hp=Math.floor(t.maxHp*.6);h.nextSkill=0;const before=[h.hp,t.hp];
      s=act(s,{type:"tick",steps:1});expect(s.run!.battle.actors[0].hp-before[0]).toBe(Math.round(h.maxHp*.16*1.18*1.15));expect(s.run!.battle.actors[1].hp-before[1]).toBe(Math.round(t.maxHp*.16*1.18));
    });
    it.each([undefined, 510, 520] as const)("keeps saved %s battles on their original rules and without a movie gate", version => {
        let s = fixture(), b = s.run!.battle;
        b = createRpgBattle(s, b.waves, "legacy", undefined, 0, version ?? null);
        s.run!.battle = b;
        b.actors[0].energy = 100;
        const old = act(s, { type: "burst", uid: s.formation[0] });
        expect(old.run!.battle.rulesVersion).toBe(version);
        expect(old.run!.battle.cinematic).toBeUndefined();
        expect(advanceRpgBattle(old.run!.battle).tick).toBe(1);
    });
});
describe("5.3 media payload", () => {
    it("ships 134 H264 clips, five native timelines and 139 original sounds within the media budget", () => {
        const root = "public/assets/rpg/awakening530", movieHashes = new Set(), soundHashes = new Set();
        let total = 0;
        for (const id of SPIRIT_IDS) {
            const movie = starterCharacter(id) ? null : readFileSync(`${root}/movies/${id}.mp4`), sound = readFileSync(`${root}/sounds/${id}.mp3`);
            if(movie){expect(movie.length).toBeGreaterThan(10000);
            expect(sound.length).toBeGreaterThan(5000);
            expect(movie.subarray(4, 8).toString()).toBe("ftyp");}
            expect(sound.subarray(0, 3).toString()).toBe("ID3");
            if(movie)movieHashes.add(createHash("sha256").update(movie).digest("hex"));
            soundHashes.add(createHash("sha256").update(sound).digest("hex"));
            total += (movie?.length ?? 0) + sound.length;
        }
        total += statSync(`dev/docs/web-v530/environments.webp`).size + statSync(`${root}/sigils.webp`).size;
        expect(movieHashes.size).toBe(134);
        expect(soundHashes.size).toBe(139);
        expect(total).toBeGreaterThan(5000000);
        expect(total).toBeLessThan(190000000);
        expect(readdirSync(`${root}/movies`).length).toBe(134);
        expect(readdirSync(`${root}/sounds`).length).toBe(139);
    });
});
