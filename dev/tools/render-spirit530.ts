/** Offline video renderer. No runtime dependency, no random game state and no copied footage. */
import { CARD_MAP } from "../../src/game/catalog";
import { tcgCharacter, characterPose } from "../../src/game/tcgCharacterMotion";
import { livingClipFrame } from "../../src/game/livingClips";
import { characterBounds } from "../../src/infrastructure/assets/characterSprites";
import { SPRITE_SHEETS } from "../../src/game/autochess/presentation";
import { spiritArt } from "../../src/game/adventureRpg/spiritArt";
import { awakenedKit, ULTIMATE_MOVES } from "../../src/game/adventureRpg/awakening";
const SCHOOL = ["hearth", "ember", "grove", "tide", "sugar"];
const COLORS = ["#ffcc75", "#ff745d", "#9ee994", "#7de0ff", "#d2acff"];
const cache = new Map<string, HTMLImageElement>();
async function load(path: string) { let im = cache.get(path); if (!im) {
    im = new Image();
    im.src = path;
    await im.decode();
    cache.set(path, im);
} return im; }
const ease = (n: number) => { n = Math.max(0, Math.min(1, n)); return n * n * (3 - 2 * n); };
export async function prepareSpiritMovie(id: string) {
    const canvas = document.querySelector('canvas')!, ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const kit = awakenedKit(id), card = CARD_MAP[id], s = SCHOOL.indexOf(card.school), pattern = ULTIMATE_MOVES[kit.ultimate][2];
    const model = tcgCharacter(card)!, bounds = characterBounds(model)!, sheet = SPRITE_SHEETS[model.sheet], portrait = spiritArt(id)!;
    const [env, art, sprite, sigils] = await Promise.all([load('/dev/docs/web-v530/environments.webp'), load(portrait.path), load(sheet.path), load('/assets/rpg/awakening530/sigils.webp')]);
    await document.fonts.ready;
    const cw = env.width / 3, ch = env.height / 2, pa = art.width / 4, si = sigils.width / 12, accent = COLORS[s];
    function line(points: number[][], width: number, alpha: number, color = accent) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.globalAlpha = 1; }
    function ring(x: number, y: number, r: number, alpha: number, stretch = 1) { ctx.globalAlpha = alpha; ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, r, r * stretch, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    return {
        draw(time: number) {
            const p = time / 2.4, charge = ease(time / .65), strike = ease((time - .6) / 1), out = 1 - ease((time - 2.05) / .35);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.setTransform(2.5, 0, 0, 2.5, 0, 0);
            ctx.save();
            const zoom = 1.02 + p * .045;
            ctx.translate(256, 144);
            ctx.scale(zoom, zoom);
            ctx.translate(-256, -144);
            ctx.drawImage(env, (s % 3) * cw, Math.floor(s / 3) * ch, cw, ch, 0, -70, 512, 428);
            ctx.restore();
            const shade = ctx.createLinearGradient(0, 0, 0, 288);
            shade.addColorStop(0, '#04132455');
            shade.addColorStop(.45, '#07192544');
            shade.addColorStop(1, '#030d19ee');
            ctx.fillStyle = shade;
            ctx.fillRect(0, 0, 512, 288);
            // Distinct portrait cut-in with original identity; the caster beneath uses actual raster cast poses.
            const cut = 1 - ease((time - .6) / .65);
            ctx.save();
            ctx.globalAlpha = .8 * cut;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(180, 0);
            ctx.lineTo(145, 288);
            ctx.lineTo(0, 288);
            ctx.clip();
            ctx.drawImage(art, portrait.cell % 4 * pa, Math.floor(portrait.cell / 4) * pa, pa, pa, -18 + (1 - charge) * -80, -4, 294, 294);
            ctx.restore();
            const x = 169 + Math.sin(strike * Math.PI) * (kit.ultimate === 7 || kit.ultimate === 19 ? 100 : 22), y = 238 - Math.sin(strike * Math.PI) * 12;
            const poseTime = Math.max(0, (time - .25) * 780 / 1.3), pose = model.sheet.startsWith('living-') ? livingClipFrame('cast', poseTime) : characterPose('cast', poseTime, model.sheet !== 'base', false, model.sheet.startsWith('roster'));
            const f = bounds.row.frames[pose], scale = 141 / (bounds.bottom - bounds.top);
            ctx.save();
            ctx.translate(x, y - bounds.bottom * scale);
            ctx.drawImage(sprite, f[0], f[1], f[2], f[3], -f[4] * scale, -f[5] * scale, f[2] * scale, f[3] * scale);
            ctx.restore();
            ring(x, 244, 36 + charge * 16, .5, .28);
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = charge * .65 * out;
            ctx.translate(350, 141);
            ctx.rotate((p - .5) * .2 * (kit.motif % 2 ? -1 : 1));
            const z = 68 + strike * 25;
            ctx.drawImage(sigils, kit.iconCell % 12 * si, Math.floor(kit.iconCell / 12) * si, si, si, -z, -z, z * 2, z * 2);
            ctx.restore();
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const power = charge * out;
            if (['citadel', 'bastion', 'balance', 'counter'].includes(pattern)) {
                for (let i = 0; i < 5; i++) {
                    const xx = 260 + i * 34, hh = (92 + i % 2 * 35) * strike;
                    line([[xx - 15, 226], [xx - 15, 226 - hh], [xx, 206 - hh], [xx + 15, 226 - hh], [xx + 15, 226]], 2, power * .55);
                }
                for (let i = 0; i < 3; i++)
                    ring(338, 210, 35 + i * 30 + strike * 18, power * .65, .38);
            }
            else if (['lotus', 'reunion', 'renewal', 'sanctuary'].includes(pattern)) {
                for (let i = 0; i < 12; i++) {
                    const angle = i * Math.PI / 6 + kit.motif * .07;
                    ctx.save();
                    ctx.translate(340, 166);
                    ctx.rotate(angle + p * .3);
                    ctx.globalAlpha = power * .5;
                    ctx.fillStyle = accent;
                    ctx.beginPath();
                    ctx.ellipse(0, -strike * 54, 11 + strike * 9, 38 * strike, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                ring(340, 166, 80 * strike, power * .65);
            }
            else if (['blade', 'shadow', 'judgement'].includes(pattern)) {
                for (let i = 0; i < 4; i++) {
                    const phase = Math.max(0, Math.min(1, (time - .5 - i * .23) / .45));
                    if (phase > 0 && phase < 1) {
                        const xx = 280 + i * 21;
                        line([[xx - 65, 215 - phase * 120], [xx + 65, 95 + phase * 115]], 3, Math.sin(phase * Math.PI) * .8);
                        line([[xx - 70, 212 - phase * 120], [xx + 70, 90 + phase * 115]], 1, Math.sin(phase * Math.PI));
                    }
                }
            }
            else if (['meteor', 'phoenix'].includes(pattern)) {
                for (let i = 0; i < 5; i++) {
                    const q = ((Math.max(0, time - .5) + i * .12) % 1);
                    const xx = 370 + (i - 2) * 20;
                    line([[xx - 120 * q, 30 + 170 * q], [xx - 140 * q, 10 + 170 * q]], 3, Math.sin(q * Math.PI) * power);
                    ring(xx - 120 * q, 30 + 170 * q, 3 + q * 9, power * .65);
                }
                if (pattern === 'phoenix')
                    for (let i = 0; i < 3; i++)
                        line([[340, 170], [270 - i * 10, 140 - strike * 55], [230 - i * 18, 135 - strike * 70]], 2, power * .7);
            }
            else if (['moon', 'mirror', 'chains', 'drain'].includes(pattern)) {
                for (let i = 0; i < 7; i++) {
                    const angle = i * Math.PI * 2 / 7 + p * .8 + kit.motif * .13;
                    const xx = 340 + Math.cos(angle) * 62 * strike, yy = 151 + Math.sin(angle) * 52 * strike;
                    line([[340, 151], [xx, yy], [xx + 10, yy + 16], [xx, yy + 31], [xx - 10, yy + 16], [xx, yy]], 1.2, power * .6);
                }
                ring(340, 151, 65 * strike, power * .65);
            }
            else if (pattern === 'frost') {
                for (let i = 0; i < 8; i++) {
                    const angle = i * Math.PI / 4;
                    const xx = 340 + Math.cos(angle) * 71 * strike, yy = 156 + Math.sin(angle) * 71 * strike;
                    line([[340, 156], [xx, yy]], 2, power * .8);
                    line([[xx - 8, yy - 9], [xx, yy], [xx + 8, yy - 9]], 1, power * .8);
                }
            }
            else if (pattern === 'tide') {
                for (let n = 0; n < 5; n++) {
                    const pts = [];
                    for (let i = 0; i < 35; i++)
                        pts.push([218 + i * 7, 181 + Math.sin(i * .19 - time * 6 + n) * (18 + n * 5) * strike]);
                    line(pts, 2 - n * .2, power * (.8 - n * .12));
                }
            }
            else {
                for (let n = 0; n < 4; n++)
                    ring(340, 150, (20 + n * 18) * strike, power * (.85 - n * .15));
                for (let i = 0; i < 12; i++) {
                    const a = i * Math.PI / 6 + p * .6;
                    line([[340 + Math.cos(a) * 23, 150 + Math.sin(a) * 23], [340 + Math.cos(a) * 90 * strike, 150 + Math.sin(a) * 90 * strike]], 1, power * .5);
                }
            }
            // Per-character constellation has a different path, number and phase, without rapid flashes.
            for (let i = 0; i < 18 + kit.motif; i++) {
                const angle = i * 2.399 + kit.motif * .18, rad = 25 + ((i * 17 + time * 40) % 95);
                const xx = 325 + Math.cos(angle + p) * rad, yy = 150 + Math.sin(angle + p) * rad * .8;
                ctx.globalAlpha = power * .45;
                ctx.fillStyle = accent;
                ctx.beginPath();
                ctx.arc(xx, yy, 1 + i % 3 * .4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#f3dbab';
            ctx.font = '10px "Be Vietnam Pro", sans-serif';
            ctx.fillText('SOUL OF MEAL · ' + card.name, 20, 22);
            ctx.fillStyle = '#fff3de';
            ctx.font = 'bold 16px "Be Vietnam Pro", sans-serif';
            ctx.fillText(kit.title + ' · ' + ULTIMATE_MOVES[kit.ultimate][0], 20, 265);
            ctx.fillStyle = accent;
            ctx.fillRect(20, 276, Math.min(472, 472 * p), 1.5);
            // Keep authored pixels lossless until the final H.264 pass. JPEG here used
            // to soften every frame before the video encoder saw it.
            return canvas.toDataURL('image/png').split(',')[1];
        }, pattern, motif: kit.motif, id, title: kit.title,
    };
}
