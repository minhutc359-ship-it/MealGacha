import { useEffect, useRef } from "react";
import { drawChannel, drawProjectile, drawImpact, VFX_COLORS, type VfxKind, type VfxPoint } from "../../game/battleVfx";
import { actorAnchor } from "../../game/adventureRpg/formationLayout";
import { spiritKit } from "../../game/adventureRpg/skills";
import type { RpgActor, RpgBattle, RpgEvent } from "../../game/adventureRpg/types";
import { ELEMENTAL_IMPACTS } from "../../game/visualPack";
import { acquireCharacterImage, subscribeCharacterClock } from "../../infrastructure/assets/characterSprites";
import { renderDpr, renderIsLight, subscribeRenderQuality } from "../../infrastructure/presentation/renderQuality";
type Cue = {
    event: RpgEvent;
    actor: RpgActor;
    targets: RpgActor[];
    start: number;
    variant: number;
};
function effectKind(c: Cue, target: RpgActor): VfxKind {
    if (c.event.animation === "support")
        return c.actor.school === "tide" ? "summon" : c.actor.school === "grove" ? "heal" : c.actor.school === "hearth" ? "shield" : "projectile";
    if (c.event.animation === "attack")
        return c.actor.role === "mage" ? "projectile" : "slash";
    if (target.side === c.actor.side)
        return c.actor.role === "healer" || c.actor.style === "mender" || c.actor.school === "grove" ? "heal" : "shield";
    return c.actor.role === "striker" || c.actor.style === "raider" ? "slash" : c.actor.role === "trickster" || c.actor.style === "hexer" ? "shatter" : "wave";
}
function sigil(ctx: CanvasRenderingContext2D, p: VfxPoint, radius: number, age: number, c: Cue, low: boolean) {
    const colors = VFX_COLORS[c.event.school], t = Math.min(1, age / 1200);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = Math.sin(t * Math.PI) * .7;
    ctx.strokeStyle = colors[1];
    ctx.fillStyle = colors[2];
    ctx.lineWidth = 1.5;
    const count = low ? 3 : 5 + c.variant;
    const role = c.actor.boss ? ({ "boss-drum": "guardian", "char-hound": "striker", "bamboo-wraith": "trickster", "boss-lotus": "healer" }[c.actor.id] ?? "mage") : c.actor.role;
    if (role === "guardian" || c.actor.style === "bulwark") {
        ctx.scale(1, .55);
        ctx.rotate(t * .8);
        for (let r = 0; r < 2; r++) {
            ctx.beginPath();
            for (let i = 0; i <= 6; i++) {
                const a = i * Math.PI / 3, x = Math.cos(a) * radius * (.75 + r * .25), y = Math.sin(a) * radius * (.75 + r * .25);
                if (i)
                    ctx.lineTo(x, y);
                else
                    ctx.moveTo(x, y);
            }
            ctx.stroke();
        }
    }
    else if (role === "trickster" || c.actor.style === "hexer") {
        for (let i = 0; i < count; i++) {
            const a = i * Math.PI * 2 / count + t, x = Math.cos(a) * radius, y = Math.sin(a) * radius * .7;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(-x, -y);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    else if (role === "healer" || c.actor.style === "mender") {
        for (let i = 0; i < count; i++) {
            const a = i * Math.PI * 2 / count + t, x = Math.cos(a) * radius * .7, y = Math.sin(a) * radius * .4 - t * radius * .5;
            ctx.beginPath();
            ctx.ellipse(x, y, radius * .14, radius * .3, a, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    else if (role === "striker" || c.actor.style === "raider") {
        ctx.rotate(-.6);
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * (.65 + i * .18), radius * .35, t + i * .5, Math.PI * .7, Math.PI * 1.7);
            ctx.stroke();
        }
    }
    else {
        for (let i = 0; i < count; i++) {
            const a = i * Math.PI * 2 / count - t;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * radius * .6, Math.sin(a) * radius * .6);
            ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, radius * .55, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}
/** One shared presentation clock, pixel-sized effects, no React updates per frame. */
export function RpgBattleVfx({ battle, paused, quiet }: {
    battle: RpgBattle;
    paused: boolean;
    quiet: boolean;
}) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const state = useRef({ id: "", wave: -1, serial: 0, cues: [] as Cue[], paused, frozen: null as number | null });
    useEffect(() => {
        const s = state.current, now = performance.now();
        if (s.id !== battle.id || battle.serial < s.serial) {
            s.id = battle.id;
            s.serial = 0;
            s.cues = [];
        }
        if (s.wave !== battle.wave) {
            s.wave = battle.wave;
            s.cues = [];
        }
        if (paused && !s.paused)
            s.frozen = now;
        if (!paused && s.frozen !== null) {
            for (const c of s.cues)
                c.start += now - s.frozen;
            s.frozen = null;
        }
        s.paused = paused;
        for (const e of battle.events) {
            if (e.serial <= s.serial || battle.tick - e.tick > 4 || !(e.animation || ["burst", "skill", "guard", "reaction"].includes(e.kind)))
                continue;
            const actor = battle.actors.find(a => a.uid === e.source);
            if (!actor)
                continue;
            const targets = battle.actors.filter(a => e.targets.includes(a.uid));
            if (!targets.length)
                continue;
            s.cues.push({ event: e, actor: { ...actor }, targets: targets.map(a => ({ ...a })), start: s.frozen ?? now, variant: actor.side === "ally" ? spiritKit(actor.id, actor.role).variant : actor.phase });
        }
        s.serial = battle.serial;
        s.cues = s.cues.slice(-32);
    }, [battle, paused]);
    useEffect(() => {
        const surface = canvas.current, ctx = surface?.getContext("2d");
        if (!surface || !ctx || quiet)
            return;
        const texture = acquireCharacterImage(ELEMENTAL_IMPACTS);
        let width = 1, height = 1, wide = false, hiddenAt: number | null = null;
        const draw = (now: number) => {
            const s = state.current;
            if (document.hidden || s.paused)
                return;
            ctx.clearRect(0, 0, width, height);
            s.cues = s.cues.filter(c => now - c.start < 1700);
            const low = renderIsLight(), size = Math.min(42, width * .095, height * .15);
            const point = (a: RpgActor) => { const p = actorAnchor(a, wide); return { x: p.x * width / 100, y: p.y * height / 100 - size * .55 }; };
            for (const c of s.cues) {
                const age = now - c.start, source = point(c.actor), ultimate = c.event.kind === "burst", normal = c.event.animation === "attack", contact = normal ? 300 : ultimate ? 540 : 380;
                const scale = ultimate ? 1.3 : normal ? .7 : 1, extent = size * scale;
                if (!normal && age < contact)
                    drawChannel(ctx, source, c.event.school, age / contact, size, low);
                if (ultimate || c.actor.boss && c.event.animation === "enemy")
                    sigil(ctx, source, extent * 1.2, age, c, low);
                for (const target of c.targets) {
                    const p = point(target), kind = effectKind(c, target);
                    if (age > 80 && age < contact) {
                        const shots = ultimate && c.variant === 1 ? 3 : 1;
                        for (let i = 0; i < shots; i++) {
                            const from = { x: source.x, y: source.y + (i - 1) * extent * .25 };
                            drawProjectile(ctx, from, p, c.event.school, (age - 80) / (contact - 80), extent * .27, low, kind);
                        }
                    }
                    if ((ultimate && c.actor.role === "trickster") || c.actor.style === "hexer" && c.event.animation === "enemy")
                        sigil(ctx, p, extent * .8, Math.max(0, age - 180), c, low);
                    const repeat = ultimate && c.actor.role === "striker" ? 3 : ultimate && c.variant === 2 ? 2 : 1;
                    for (let i = 0; i < repeat; i++)
                        drawImpact(ctx, p, c.event.school, (age - contact - i * 130) / 1000, extent, kind, low, low ? undefined : texture.image);
                }
                if (surface.dataset.signature !== `${c.actor.role}:${c.event.school}:${c.variant}`)
                    surface.dataset.signature = `${c.actor.role}:${c.event.school}:${c.variant}`;
            }
            surface.dataset.active = String(s.cues.length);
        };
        const resize = () => { wide = window.matchMedia("(max-height:480px) and (orientation:landscape)").matches; width = Math.max(1, surface.clientWidth); height = Math.max(1, surface.clientHeight); const dpr = renderDpr(); surface.width = Math.round(width * dpr); surface.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(performance.now()); };
        const visibility = () => { const now = performance.now(); if (document.hidden)
            hiddenAt = now;
        else if (hiddenAt !== null) {
            if (!state.current.paused)
                for (const c of state.current.cues)
                    c.start += now - hiddenAt;
            hiddenAt = null;
        } };
        const observer = new ResizeObserver(resize);
        observer.observe(surface);
        resize();
        const quality = subscribeRenderQuality(resize), clock = subscribeCharacterClock(draw, () => !state.current.paused && state.current.cues.length > 0);
        document.addEventListener("visibilitychange", visibility);
        return () => { texture.release(); observer.disconnect(); quality(); clock(); document.removeEventListener("visibilitychange", visibility); };
    }, [quiet]);
    return quiet ? null : <canvas ref={canvas} className="rpg-vfx-canvas" aria-hidden="true" data-vfx="rpg-elemental"/>;
}
