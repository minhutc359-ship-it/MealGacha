import { nearestRpgOpponent } from "./autoTarget";
import { awakenedKit, OATHS, PRIMARY_MOVES, SUPPORT_MOVES, ULTIMATE_MOVES, PASSIVE_MOVES } from "./awakening";
import { SPIRIT_RARITY } from "../../domain/spiritSummons";
import { reactionName } from "./skills";
import type { RpgActor, RpgBattle, RpgEvent, RpgTrait } from "./types";
interface Ops {
    damage: (b: RpgBattle, a: RpgActor, t: RpgActor, power: number, attack?: boolean) => void;
    heal: (b: RpgBattle, a: RpgActor, t: RpgActor[], fraction: number, text: string) => void;
    shield: (b: RpgBattle, a: RpgActor, t: RpgActor[], amount: number, text: string) => void;
    event: (b: RpgBattle, a: RpgActor, kind: RpgEvent["kind"], t: RpgActor[], value: number, text: string) => void;
}
const living = (b: RpgBattle, side: RpgActor["side"]) => b.actors.filter(a => a.side === side && a.hp > 0);
export const trait = (a: RpgActor, key: RpgTrait, value: number) => { a.traits ??= {}; a.traits[key] = Math.max(a.traits[key] ?? 0, value); };
const weakFirst = (actors: RpgActor[]) => [...actors].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
const energy = (a: RpgActor, gain: number) => { a.energy = Math.max(0, Math.min(100, a.energy + Math.round(gain))); };
const cleanse = (actors: RpgActor[]) => { for (const a of actors) {
    a.burn = 0;
    a.weaken = 0;
    a.stun = 0;
    a.wither = 0;
    if (a.traits) {
        a.traits.vulnerable = 0;
        a.traits.fracture = 0;
    }
} };
const control = (a: RpgActor, ticks: number) => { a.stun = Math.max(a.stun, a.boss ? Math.max(1, Math.floor(ticks / 2)) : ticks); };
export function castAwakened(b: RpgBattle, a: RpgActor, burst: boolean, support: boolean, ops: Ops) {
    const friends = living(b, "ally"), foes = living(b, "enemy").sort((x, y) => x.slot - y.slot);
    if (!foes.length)
        return;
    const k = awakenedKit(a.id), index = burst ? k.ultimate : support ? k.support : k.primary;
    const weak = weakFirst(friends);
    const back = foes.filter(e => e.slot >= 2), front = foes.filter(e => e.slot < 2);
    const target = nearestRpgOpponent(a, foes) ?? (a.role === "trickster" ? back[0] : undefined) ?? foes[0];
    let boost = 1 + (a.skills[burst ? 2 : support ? 1 : 0] - 1) * .09;
    if (burst) {
        const old = b.chain;
        const count = old && old.until >= b.tick && old.source !== a.uid ? Math.min(3, old.count + 1) : 1;
        b.chain = { source: a.uid, until: b.tick + 12, count };
        boost *= 1 + (count - 1) * .15;
        a.energy = 0;
    }
    const offense = boost * (burst && a.path === "assault" ? 1.2 : burst && a.path === "support" ? .85 : 1);
    const care = boost * (burst && a.path === "support" ? 1.5 : burst && a.path === "assault" ? .85 : 1);
    const recipe = burst ? ULTIMATE_MOVES[index] : support ? SUPPORT_MOVES[index] : PRIMARY_MOVES[index];
    const name = `${k.title} · ${recipe[0]}`;
    a.motion = "cast";
    a.motionAt = b.tick;
    ops.event(b, a, burst ? "burst" : "skill", [target], 0, name);
    const cue = b.events[b.events.length - 1];
    cue.animation = burst ? "ultimate" : support ? "support" : "primary";
    const recipients = new Set<string>();
    const on = (targets: RpgActor[], fn: (t: RpgActor) => void) => { for (const t of targets) {
        recipients.add(t.uid);
        fn(t);
    } };
    const hit = (targets: RpgActor[], power: number) => on(targets, t => { if (t.hp > 0)
        ops.damage(b, a, t, power * offense * (burst && k.oath === 1 && t.burn ? 1.12 : 1)); });
    const mend = (targets: RpgActor[], fraction: number) => {
        for (const t of targets) recipients.add(t.uid);
        if (a.rank >= 2 && k.passive === 8) for (const t of targets) ops.heal(b,a,[t],fraction*care*(t.hp/t.maxHp<.35?1.15:1),name);
        else ops.heal(b,a,targets,fraction*care,name);
    };
    const cover = (targets: RpgActor[], fraction: number) => on(targets, t => ops.shield(b, a, [t], t.maxHp * fraction * care, name));
    const state = (targets: RpgActor[], key: RpgTrait, seconds: number) => on(targets, t => trait(t, key, seconds * 4));
    const drain = (targets: RpgActor[], amount: number) => on(targets, t => energy(t, -amount));
    const group = front.length ? front : foes;
    if (burst) {
        switch (index) {
            case 0:
                cover(friends, .24);
                state(friends, "thorns", 5);
                hit(group, 2);
                break;
            case 1: {
                const t = [...foes].sort((x, y) => y.attack - x.attack)[0];
                for (let n = 0; n < 3; n++)
                    hit([t], 1.8);
                state([t], "fracture", 5);
                break;
            }
            case 2:
                for (const t of foes)
                    hit([t], 2.8 + (t.mark?.until && t.mark.until >= b.tick ? .6 : 0));
                break;
            case 3:
                cleanse(friends);
                mend(friends, .27);
                state(friends, "regen", 4);
                break;
            case 4: {
                const t = back.length ? back : foes;
                hit(t, 3);
                on(t, e => control(e, 4));
                drain(t, 16);
                break;
            }
            case 5:
                hit([target], 3.8);
                trait(a, "evade", 2);
                state(friends, "barrier", 4);
                break;
            case 6:
                cover(friends.filter(f => f.slot < 2), .3);
                trait(a, "taunt", 20);
                hit(foes, 1.5);
                break;
            case 7:
                for (let n = 0; n < 4; n++) {
                    if (n === 3)
                        target.shield = Math.round(target.shield * .6);
                    hit([target], 1.45);
                }
                break;
            case 8:
                hit(foes, 2.6);
                on(foes, e => { control(e, 3); e.weaken = Math.max(e.weaken, 16); });
                break;
            case 9:
                cleanse(friends);
                mend(friends, .34);
                on([...friends].sort((x, y) => x.energy - y.energy).slice(0, 2), f => energy(f, 10));
                break;
            case 10: {
                const t = [...foes].sort((x, y) => y.attack - x.attack).slice(0, 2);
                hit(t, 3.5);
                on(t, e => { e.wither = 20; e.weaken = 16; });
                break;
            }
            case 11: {
                const t = [...foes].sort((x, y) => y.energy - x.energy).slice(0, 2);
                const stolen = t.reduce((n, e) => n + Math.min(e.energy, 24), 0);
                drain(t, 24);
                hit(t, 3.6);
                energy(a, Math.min(18, stolen));
                break;
            }
            case 12:
                cover(friends, .22);
                state(friends, "thorns", 6);
                on(friends, f => { f.traits ??= {}; f.traits.thornsPower = 30; });
                hit(foes.filter(e => e.shield > 0), 2.6);
                break;
            case 13:
                for (const t of foes) {
                    hit([t], 2.5 + (t.burn ? 1 : 0));
                    t.burn = 20;
                }
                break;
            case 14: {
                const t = [...foes].sort((x, y) => x.hp - y.hp)[0];
                hit([t], 5.4 * (t.hp / t.maxHp < .3 ? 1.25 : 1));
                break;
            }
            case 15:
                cleanse(friends);
                mend(friends, .22);
                cover(friends, .13);
                state(friends, "barrier", 5);
                break;
            case 16:
                on(group, t => { t.shield = Math.round(t.shield * .7); });
                hit(group, 3.2);
                on(friends.filter(f => f.uid !== a.uid), f => energy(f, 12));
                break;
            case 17:
                cleanse(friends);
                mend([weak[0]], .42);
                cover(weak.slice(0, 3), .18);
                break;
            case 18:
                cover(friends, .25);
                on(friends.filter(f => f.uid !== a.uid), f => energy(f, 10));
                state(friends, "barrier", 4);
                break;
            case 19: {
                const t = back.length ? back : foes;
                hit(t, 2);
                hit(t, 2);
                state(t, "fracture", 5);
                trait(a, "evade", 2);
                break;
            }
        }
        if (k.oath === 0)
            cover([weak[0]], .06);
        if (k.oath === 2)
            for (const t of foes)
                if (t.mark && t.mark.until >= b.tick && t.mark.school !== a.school)
                    hit([t], .5);
        if (k.oath === 3)
            mend(friends.filter(f => f.hp < f.maxHp * .5), .05);
        if (k.oath === 4)
            on(friends.filter(f => f.uid !== a.uid && f.hp < f.maxHp), f => energy(f, 5));
        if (k.oath === 5)
            on(foes.filter(e => e.energy > 50), e => { e.weaken = Math.max(e.weaken, 16); });
        if (["epic", "legendary"].includes(SPIRIT_RARITY[a.id]) && b.chain!.count > 1)
            on(friends.filter(f => f.uid !== a.uid), f => energy(f, 5));
        // Legendary signature requires actual training; rarity alone never grants the extra mechanic.
        if (SPIRIT_RARITY[a.id] === "legendary" && a.level >= 10 && a.rank >= 2 && a.skills[2] >= 3) {
            if (k.oath === 0)
                state(friends, "barrier", 3);
            if (k.oath === 1 && target.burn)
                hit([target], .45);
            if (k.oath === 2)
                on([...friends].filter(f => f.uid !== a.uid).sort((x, y) => x.energy - y.energy).slice(0, 1), f => energy(f, 8));
            if (k.oath === 3) {
                cleanse([weak[0]]);
                mend([weak[0]], .06);
            }
            if (k.oath === 4)
                state(weak.slice(0, 2), "regen", 2);
            if (k.oath === 5)
                drain([[...foes].sort((x, y) => y.energy - x.energy)[0]], 12);
        }
        if (b.cinematics !== false)
            b.cinematic = { source: a.uid, serial: cue.serial };
    }
    else if (support) {
        switch (index) {
            case 0:
                cover(friends.filter(f => f.slot < 2), .13);
                on(friends.filter(f => f.slot < 2), f => { f.weaken = 0; });
                break;
            case 1:
                state(weak.slice(0, 2), "regen", 5);
                break;
            case 2:
                cleanse([weak[0]]);
                mend([weak[0]], .12);
                break;
            case 3:
                on([...friends].filter(f => f.uid !== a.uid).sort((x, y) => x.energy - y.energy).slice(0, 3), f => energy(f, 12));
                break;
            case 4:
                state([...friends].sort((x, y) => y.attack - x.attack).slice(0, 2), "haste", 4);
                break;
            case 5:
                hit([target], .8);
                state([target], "vulnerable", 5);
                target.mark = { school: a.school, until: b.tick + 20 };
                break;
            case 6:
                on([...foes].sort((x, y) => y.attack - x.attack).slice(0, 2), e => { e.weaken = 20; });
                break;
            case 7:
                target.shield = Math.round(target.shield * .6);
                state([target], "fracture", 4);
                break;
            case 8:
                on(group.slice(0, 2), e => control(e, e.boss ? 1 : 3));
                break;
            case 9:
                on([...friends].filter(f => f.uid !== a.uid).sort((x, y) => x.energy - y.energy).slice(0, 1), f => energy(f, 18));
                energy(a, 6);
                break;
            case 10:
                cover([a], .12);
                state([a], "thorns", 5);
                break;
            case 11:
                on(friends.filter(f => f.uid !== a.uid).slice(0, 2), f => { f.nextSkill = Math.max(b.tick + 1, f.nextSkill - 8); });
                break;
            case 12:
                state(weak.slice(0, 2), "barrier", 4);
                cover(weak.slice(0, 2), .08);
                break;
            case 13: {
                const injured = friends.filter(f => f.hp < f.maxHp * .5);
                mend(friends, .08);
                on(injured, f => energy(f, 6));
                break;
            }
            case 14:
                hit([target], 1);
                target.burn = 20;
                target.wither = 12;
                break;
            case 15: {
                const t = friends.filter(f => f.slot < 2);
                on(t, f => { f.burn = 0; f.wither = 0; });
                mend(t, .12);
                break;
            }
        }
        a.nextSupport = b.tick + SUPPORT_MOVES[index][2] * 4;
    }
    else {
        switch (index) {
            case 0:
                hit([target], 1.15);
                hit([target], 1.15 * (target.hp < target.maxHp * .5 ? 1.2 : 1));
                break;
            case 1: {
                const t = back[0] ?? target;
                hit([t], 2.2);
                drain([t], 10);
                break;
            }
            case 2:
                hit([...new Set([...group, ...foes.filter(e => e.mark && e.mark.until >= b.tick)])], 1.55);
                break;
            case 3:
                hit([target], 1.9 * (a.shield > 0 ? 1.2 : 1));
                state([target], "fracture", 4);
                break;
            case 4:
                for (const [i, t] of [target, ...foes.filter(e => e.uid !== target.uid)].slice(0, 3).entries())
                    hit([t], 1.5 - i * .4);
                break;
            case 5:
                hit([target], 1.8);
                if (target.burn)
                    hit([target], .6);
                target.burn = 20;
                break;
            case 6:
                cover([a], .18);
                hit([target], 1.2);
                state([a], "taunt", 3);
                break;
            case 7:
                cover(friends.filter(f => f.slot < 2), .14);
                hit([target], 1.5);
                break;
            case 8:
                hit([target], 1.5);
                state([weak[0]], "barrier", 4);
                break;
            case 9: {
                const t = foes.find(e => e.style === "mender") ?? target;
                hit([t], 2.1);
                on([t], e => { e.wither = 16; });
                break;
            }
            case 10: {
                const t = foes.find(e => e.shield > 0) ?? target;
                t.shield = Math.round(t.shield * .65);
                hit([t], 2.7);
                break;
            }
            case 11:
                hit(back.length ? back : foes, 1.6);
                on([[...foes].sort((x, y) => y.energy - x.energy)[0]], e => control(e, 3));
                break;
            case 12:
                hit([target], 2.1);
                on([target], e => control(e, 2));
                break;
            case 13:
                hit([target], 2);
                mend([a], .06);
                {const stolen=Math.min(8,target.energy);drain([target],8);energy(a,stolen);}
                break;
            case 14:
                cover([weak[0]], .12);
                state([a], "thorns", 4);
                break;
            case 15:
                mend([weak[0]], .18);
                state([weak[0]], "regen", 4);
                break;
            case 16:
                cleanse(weak.slice(0, 2));
                mend(weak.slice(0, 2), .16);
                break;
            case 17:
                mend([weak[0]], .16);
                on([weak[0]], f => energy(f, 12));
                break;
            case 18: {
                const urgent = weak[0].hp < weak[0].maxHp * .35;
                mend([weak[0]], .22);
                if (urgent)
                    cover([weak[0]], .08);
                break;
            }
            case 19:
                on(friends, f => { f.burn = 0; });
                mend(friends, .1);
                break;
            case 20:
                hit([target], 1.6);
                on(back.length ? back : [target], e => control(e, 3));
                break;
            case 21:
                hit([target], 1.8);
                {const stolen=Math.min(16,target.energy);drain([target],16);energy(a,Math.min(8,stolen));}
                break;
            case 22:
                hit([target], 2);
                trait(a, "evade", 1);
                break;
            case 23: {
                const t = [target, ...foes.filter(e => e.uid !== target.uid)].slice(0, 2);
                hit(t, 1.3);
                on(t, e => { e.weaken = 16; });
                break;
            }
            case 24:
                hit([target], 1.7);
                state([target], "vulnerable", 4);
                break;
        }
        a.nextSkill = b.tick + PRIMARY_MOVES[index][2] * 4;
        if (a.rank >= 2 && k.passive === 9)
            on(friends.filter(f => f.uid !== a.uid), f => energy(f, 2));
    }
    // React with the existing elemental system once per cast, not once per hit.
    if (target.hp > 0 && (!support || index === 5 || index === 14)) {
        const reaction = target.mark && target.mark.until >= b.tick ? reactionName(target.mark.school, a.school) : null;
        if (reaction) {
            delete target.mark;
            if (reaction === "Bốc hơi")
                hit([target], .8 / offense);
            if (reaction === "Nở rộ") {
                target.burn = 20;
                target.weaken = 20;
            }
            if (reaction === "Sinh trưởng")
                ops.heal(b, a, friends, .1, reaction);
            if (reaction === "Mộng ấm")
                for (const f of friends)
                    ops.shield(b, a, [f], f.maxHp * .12, reaction);
            ops.event(b, a, "reaction", [target], 0, reaction);
        }
        else
            target.mark = { school: a.school, until: b.tick + 20 };
    }
    if (!burst)
        energy(a, 12);
    cue.targets = [...recipients];
    if (!cue.targets.length)
        cue.targets = [target.uid];
    // Keep the authoritative ultimate cue even when a multi-hit AoE fills the event window.
    if (!b.events.includes(cue))
        b.events = [cue, ...b.events.slice(-23)];
}
export function awakeningDamageFactor(b: RpgBattle, a: RpgActor, t: RpgActor, normal: boolean) {
    let factor = t.traits?.vulnerable ? 1.15 : 1;
    if (t.traits?.barrier)
        factor *= .82;
    if (normal && t.traits?.evade) {
        t.traits.evade--;
        factor *= .4;
    }
    if (a.side === "ally" && a.rank >= 2) {
        const p = awakenedKit(a.id).passive;
        if (p === 0 && a.hp < a.maxHp * .5 || p === 1 && t.mark && t.mark.until >= b.tick || p === 5 && (t.stun || t.weaken))
            factor *= 1.12;
    }
    return factor;
}
export function awakeningAttack(b: RpgBattle, a: RpgActor, t: RpgActor, ops: Ops) {
    if (a.side === "ally") {
        a.traits ??= {};
        a.traits.attacks = (a.traits.attacks ?? 0) + 1;
        if (a.rank >= 2) {
            const p = awakenedKit(a.id).passive;
            if (p === 2 && a.traits.attacks % 3 === 0)
                t.burn = Math.max(t.burn, 12);
            if (p === 3)
                energy(a, 2);
            if (p === 11 && a.traits.attacks % 3 === 0) {
                const other = living(b, "enemy").find(e => e.uid !== t.uid);
                if (other)
                    ops.damage(b, a, other, .35);
            }
        }
    }
    const reflect = (t.traits?.thorns ? (t.traits.thornsPower ?? 20) / 100 : 0) + (t.side === "ally" && t.rank >= 2 && awakenedKit(t.id).passive === 10 ? .12 : 0);
    if (reflect && a.hp > 0)
        ops.damage(b, t, a, reflect);
}
export function awakeningTick(b: RpgBattle, a: RpgActor, ops: Ops) {
    if (a.hp <= 0)
        return;
    const t = a.traits ??= {};
    if (a.side === "ally" && a.rank >= 2 && awakenedKit(a.id).passive === 4 && a.hp < a.maxHp * .35 && !t.rescue) {
        t.rescue = 1;
        a.wither = 0;
        ops.heal(b, a, [a], .12, PASSIVE_MOVES[4][0]);
    }
    if (t.regen && b.tick % 4 === 0)
        ops.heal(b, a, [a], .025, "Tái sinh");
    for (const key of ["vulnerable", "regen", "haste", "taunt", "thorns", "fracture", "barrier"] as const)
        if (t[key])
            t[key] = Math.max(0, t[key]! - 1);
    if(!t.thorns)delete t.thornsPower;
}
