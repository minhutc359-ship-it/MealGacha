import type { RpgActor } from "./types";
// Foot anchors sit on the courtyard, below the horizon and the separate HUD.
const ALLY = [[38, 65], [37, 85], [14, 59], [15, 77], [24, 88]];
const ENEMY = [[62, 65], [63, 85], [86, 59], [85, 77], [76, 88], [73, 62]];
export function actorAnchor(actor: Pick<RpgActor, "side" | "slot">, wide = false) {
    if (wide)
        return { x: (actor.side === "ally" ? [40, 32, 9, 17, 24] : [57, 64, 71, 78, 85, 92])[actor.slot] ?? 50, y: 82 };
    const [x, y] = (actor.side === "ally" ? ALLY : ENEMY)[actor.slot] ?? [50, 75];
    return { x, y };
}
