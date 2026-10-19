import type { RpgActor } from "./types";
import { rpgAttackBand, rpgAttackRange } from "./attackRange";
// Foot anchors sit on the courtyard, below the horizon and the separate HUD.
const ALLY = [[38, 65], [37, 85], [14, 59], [15, 77], [24, 88]];
const ENEMY = [[62, 65], [63, 85], [86, 59], [85, 77], [76, 88], [73, 62]];
export function actorAnchor(actor: Pick<RpgActor, "side" | "slot">, wide = false) {
    if (wide)
        return { x: (actor.side === "ally" ? [40, 32, 9, 17, 24] : [57, 64, 71, 78, 85, 92])[actor.slot] ?? 50, y: 82 };
    const [x, y] = (actor.side === "ally" ? ALLY : ENEMY)[actor.slot] ?? [50, 75];
    return { x, y };
}

/** Presentation-only travel. Melee closes to contact, range 2 takes a short
 * step, and long range keeps formation with a small opposite recoil. */
export function actorAttackMotion(actor: RpgActor, target: RpgActor, wide = false) {
    const from = actorAnchor(actor, wide), to = actorAnchor(target, wide);
    const vectorX = to.x - from.x, vectorY = to.y - from.y;
    const distance = Math.max(.001, Math.hypot(vectorX, vectorY));
    const range = rpgAttackRange(actor), band = rpgAttackBand(actor);
    const contactGap = wide ? 9 : actor.boss || target.boss ? 16 : 13;
    const factor = range <= 1
        ? Math.max(0, Math.min(.82, (distance - contactGap) / distance))
        : range === 2 ? .28 : 0;
    const recoil = range <= 1 ? .035 : range === 2 ? .025 : .045;
    return {
        range,
        band,
        x: vectorX * factor,
        y: vectorY * factor,
        windupX: -vectorX * recoil,
        windupY: -vectorY * recoil,
    };
}
