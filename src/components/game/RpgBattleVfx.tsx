import { enemyVisual } from "../../game/enemyVisuals";
import { drawEnemyVfx } from "../../game/enemyVfx";
import { isEnemyPhaseEvent } from "../../game/enemyPresentation";
import { rpgVisualContact } from "../../game/visualTiming";
import { CAST_SIGILS, drawModelCast } from "../../game/ultimateShowcase";
import { starterCharacter } from "../../game/starterCharacters";
import { drawStarterVfx } from "../../game/starterVfx";
import { characterEffect, drawCharacterEffect } from "../../game/characterEffect";
import { awakenedKit } from "../../game/adventureRpg/awakening";
import { useEffect, useRef } from "react";
import { drawChannel, drawProjectile, drawImpact, type VfxKind } from "../../game/battleVfx";
import { actorAnchor } from "../../game/adventureRpg/formationLayout";
import { spiritKit } from "../../game/adventureRpg/skills";
import type { RpgActor, RpgBattle, RpgEvent, RpgRole } from "../../game/adventureRpg/types";
import { ELEMENTAL_IMPACTS } from "../../game/visualPack";
import { acquireCharacterImage, subscribeCharacterClock } from "../../infrastructure/assets/characterSprites";
import { renderDpr, renderIsLight, subscribeRenderQuality } from "../../infrastructure/presentation/renderQuality";
type Cue = {
    event: RpgEvent;
    actor: RpgActor;
    targets: RpgActor[];
    start: number;
    variant: number;
    awakened: boolean;
    combo: number;
};
function effectKind(c: Cue, target: RpgActor): VfxKind {
    if (c.awakened && c.event.animation === "support") return target.side!==c.actor.side?"shatter":c.actor.role==="healer"?"heal":c.actor.role==="guardian"?"shield":"summon";
    if (c.event.animation === "support")
        return c.actor.school === "tide" ? "summon" : c.actor.school === "grove" ? "heal" : c.actor.school === "hearth" ? "shield" : "projectile";
    if (c.event.animation === "attack")
        return c.actor.role === "mage" ? "projectile" : "slash";
    if (target.side === c.actor.side)
        return c.actor.role === "healer" || c.actor.style === "mender" || c.actor.school === "grove" ? "heal" : "shield";
    return c.actor.role === "striker" || c.actor.style === "raider" ? "slash" : c.actor.role === "trickster" || c.actor.style === "hexer" ? "shatter" : "wave";
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
        if (paused && (!s.paused || s.frozen === null))
            s.frozen = now;
        if (!paused && s.frozen !== null) {
            for (const c of s.cues)
                c.start += now - s.frozen;
            s.frozen = null;
        }
        s.paused = paused;
        for (const e of battle.events) {
            if (e.serial <= s.serial || battle.tick - e.tick > 4 || !(e.animation || ["burst", "skill", "guard", "reaction", "boss"].includes(e.kind)))
                continue;
            const actor = battle.actors.find(a => a.uid === e.source);
            if (!actor)
                continue;
            const targets = isEnemyPhaseEvent(e,actor) ? [actor] : battle.actors.filter(a => e.targets.includes(a.uid));
            if (!targets.length)
                continue;
            const awakened=battle.rulesVersion===530 && actor.side==="ally";
            const kit=awakened?awakenedKit(actor.id):null;
            let role=actor.role;
            if(kit && e.animation!=="attack")role=(e.animation==="ultimate"?(["guardian","mage","mage","healer","trickster","trickster","guardian","striker","mage","healer","trickster","trickster","guardian","mage","striker","healer","mage","healer","guardian","striker"] as RpgRole[])[kit.ultimate]:e.animation==="support"?(["guardian","healer","healer","mage","mage","trickster","trickster","striker","trickster","mage","guardian","mage","guardian","healer","striker","healer"] as RpgRole[])[kit.support]:kit.primary>=20?"trickster":kit.primary>=15?"healer":kit.primary>=9?"mage":kit.primary>=6?"guardian":"striker");
            s.cues=s.cues.filter(c=>!(c.actor.uid===actor.uid && c.event.animation===e.animation && c.event.tick===e.tick));
            s.cues.push({ awakened, combo: battle.chain?.count ?? 1, event: e, actor: { ...actor, role }, targets: targets.map(a => ({ ...a })), start: s.frozen ?? now, variant: kit?kit.motif:actor.side === "ally" ? spiritKit(actor.id, actor.role).variant : actor.phase });
        }
        s.serial = battle.serial;
        s.cues = s.cues.slice(-12);
    }, [battle, paused, quiet]);
    useEffect(() => {
        const surface = canvas.current, ctx = surface?.getContext("2d");
        if (!surface || !ctx)
            return;
        const texture = acquireCharacterImage(ELEMENTAL_IMPACTS);
        const icons = acquireCharacterImage(CAST_SIGILS);
        const effectLeases = new Map<string, ReturnType<typeof acquireCharacterImage>>();
        const authoredEffect = (id: string) => {
            const effect = characterEffect(id);
            if (!effect) return null;
            let lease = effectLeases.get(effect.path);
            if (!lease) { lease = acquireCharacterImage(effect.path); effectLeases.set(effect.path, lease); }
            return lease.image;
        };
        let width = 1, height = 1, wide = false, lastDraw = 0, hiddenAt: number | null = null;
        const draw = (now: number) => {
            const s = state.current;
            if (document.hidden || s.paused)
                return;
            if(now-lastDraw<32)return;lastDraw=now;
            ctx.clearRect(0, 0, width, height);
            s.cues = s.cues.filter(c => now - c.start < (c.event.kind==="burst"?2400:1100));
            const low = renderIsLight() || quiet, size = Math.min(42, width * .095, height * .15);
            const point = (a: RpgActor) => { const p = actorAnchor(a, wide); return { x: p.x * width / 100, y: p.y * height / 100 - size * .55 }; };
            for (const c of s.cues) {
                const age = now - c.start, source = point(c.actor), ultimate = c.event.kind === "burst", normal = c.event.animation === "attack", contact = rpgVisualContact(c.event.animation);
                const enemy=enemyVisual(c.actor.id);
                if(enemy && isEnemyPhaseEvent(c.event,c.actor)) {drawEnemyVfx(ctx,c.actor.id,source.x,source.y,size,age,quiet,true);surface.dataset.enemyPhase=c.actor.id;continue;}
                const anchor=(starterCharacter(c.actor.id)??enemy)?.anchors.cast; if(anchor){source.x+=(anchor[0]-.5)*size;source.y+=(anchor[1]-.5)*size;}
                const scale = ultimate ? 1.3 : normal ? .7 : 1, extent = size * scale;
                if (ultimate) {
                    const p = actorAnchor(c.actor, wide);
                    drawModelCast(ctx, p.x * width / 100, p.y * height / 100, size * 1.65, c.event.school, age, c.actor.id, icons.image, c.combo, quiet);
                }
                if (ultimate && c.awakened) {
                    const points = c.targets.slice(0,low?3:5).map(point);
                    const center = {x:points.reduce((n,p)=>n+p.x,0)/points.length,y:points.reduce((n,p)=>n+p.y,0)/points.length};
                    const custom = authoredEffect(c.actor.id);
                    if(age<360) drawChannel(ctx,source,c.event.school,age/360,size*.55,low);
                    else if(age<960 && c.targets.some(t=>t.side!==c.actor.side)) drawProjectile(ctx,source,center,c.event.school,(age-360)/600,extent*.22,low,"projectile");
                    if(custom && age>=360 && age<1980)
                        drawCharacterEffect(ctx,c.actor.id,custom,center.x,center.y,extent*.82,(age-360)/1620,low);
                    if(age>=960 && age<1980) for(const target of c.targets.slice(0,low?3:5)) {
                        const p=point(target),kind=effectKind(c,target);
                        drawImpact(ctx,p,c.event.school,(age-960)/1020,extent*.58,kind,low);
                    }
                    // Large procedural silhouettes used to cover the actors here.
                    // Model motion is now primary; authored art is optional and the
                    // shared school impact is the complete fallback.
                    surface.dataset.ultimate=custom?"character-asset":"school-fallback";
                    continue;
                }
                if (!normal && age < contact) drawChannel(ctx,source,c.event.school,age/contact,size*.6,low);
                for(const target of c.targets.slice(0,low?3:5)) {
                    const p=point(target),kind=effectKind(c,target);
                    if(age>80 && age<contact && target.side!==c.actor.side) {
                        const t=(age-80)/(contact-80);
                        drawProjectile(ctx,source,p,c.event.school,t,extent*.22,low,kind);
                    }
                    // The school impact is always the base layer. Character/boss
                    // signatures may accent it, but can no longer replace it.
                    drawImpact(ctx,p,c.event.school,(age-contact)/650,extent,kind,low,low?undefined:texture.image);
                    if(starterCharacter(c.actor.id)) drawStarterVfx(ctx,c.actor.id,p.x,p.y,extent*.75,age-contact,false,low,kind === "heal" || kind === "shield" ? kind : normal ? "attack" : "skill");
                    else if(enemy && (!normal || enemy.accent)) {drawEnemyVfx(ctx,c.actor.id,p.x,p.y,extent,age-contact,quiet);surface.dataset.enemySignature=c.actor.id;}
                }
                if (surface.dataset.signature !== `${c.actor.role}:${c.event.school}:${c.variant}`)
                    surface.dataset.signature = `${c.actor.role}:${c.event.school}:${c.variant}`;
            }
            surface.dataset.active = String(s.cues.length);surface.dataset.combatArt = "ready";
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
        return () => { texture.release(); icons.release(); effectLeases.forEach(lease=>lease.release()); observer.disconnect(); quality(); clock(); document.removeEventListener("visibilitychange", visibility); };
    }, [quiet]);
    return <canvas ref={canvas} className="rpg-vfx-canvas" aria-hidden="true" data-vfx="rpg-elemental"/>;
}
