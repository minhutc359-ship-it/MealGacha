const { chromium: playwright } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { default: chromium } = await import(process.env.CHROMIUM_MODULE || '@sparticuz/chromium');
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
const cwd = fileURLToPath(new URL('../../', import.meta.url)), output = path.join(cwd, 'dev/docs/depth-v350');
mkdirSync(output, { recursive: true });
const vite = await createServer({ root: cwd, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const loadModule = async (name) => vite.ssrLoadModule(`/src/${name}.ts`);
const { newGame } = await loadModule('game/progression'), { createAutoRun, poolSize } = await loadModule('game/autochess/economy'), { emptyAutoSave } = await loadModule('game/autochess/types'), { createCombat } = await loadModule('game/autochess/combat'), { repository } = await loadModule('infrastructure/storage/repository'), { parseGame } = await loadModule('game/storage'), { AUTO_UNITS } = await loadModule('game/autochess/catalog'), { CARDS, CARD_MAP, STARTER_DECK } = await loadModule('game/catalog'), { startBattle } = await loadModule('game/battle');
const user = repository.loadUser();
user.preferences.soundEnabled = false;
user.preferences.musicEnabled = false;
const game = (mode = 'survival') => { const run = createAutoRun(mode, 42, '2026-10-09', 'ui-' + mode); run.scene = null; return { ...newGame(), autoChess: { ...emptyAutoSave(), tutorialSeen: true, run } }; };
const prepare = game();
prepare.autoChess.run.gold = 80;
prepare.autoChess.run.inventory = ['lantern', 'ladle', 'herbs', 'bell', 'basket', 'book', 'spark', 'dew', 'fiber'];
prepare.autoChess.run.roster[0].items = ['lantern', 'book'];
function combatFixture(mode, health, win = false) { const s = game(mode), r = s.autoChess.run; r.wave = 2; r.bestWave = 1; r.paidWaves = [1]; r.score = 432; r.health = health; r.phase = 'combat'; r.rounds = 1; r.combat = createCombat(r); s.autoChess.campaignCleared = mode === 'campaign' ? 1 : 0; for (const a of r.combat.actors) {
    if (win) {
        if (a.side === 'enemy')
            a.hp = 0;
    }
    else if (a.side === 'ally') {
        a.hp = 1;
        a.stunnedUntil = 100000;
    }
    else {
        a.attack = a.baseAttack = 500;
        a.range = 6;
        a.interval = 3;
    }
} return s; }
const stress = game(), r = stress.autoChess.run;
r.wave = 15;
r.xp = 128;
r.roster = AUTO_UNITS.slice(0, 9).map((u, i) => ({ uid: `stress${i}`, id: u.id, star: 2, cell: 18 + i, items: i === 0 ? ['book', 'lantern'] : [] }));
r.shop = Array(5).fill(null);
r.pool = Object.fromEntries(AUTO_UNITS.map(u => [u.id, poolSize(u.cost) - r.roster.filter(p => p.id === u.id).reduce((n, p) => n + 3 ** (p.star - 1), 0)]));
r.phase = 'combat';
r.rounds = 1;
r.combat = createCombat(r);
for (const a of r.combat.actors) {
    a.hp = a.maxHp = 100000;
    a.mana = 100;
}
const tcg = { ...newGame() };
tcg.battle = startBattle(STARTER_DECK, null, 'wisdom', () => .42);
tcg.battle.player.mana = tcg.battle.player.maxMana = 7;
tcg.battle.player.graveyard = ['caravan-letter'];
tcg.battle.player.hand = ['sea-memory', 'herb', 'spark'];
tcg.battle.player.board = [];
tcg.battle.enemy.board = [];
tcg.battle.enemy.hand = [];
tcg.battle.enemy.deck = ['herb'];
tcg.battle.opening = false;
for (const f of [prepare, stress, tcg, combatFixture('survival', 3), combatFixture('campaign', 100)])
    assert(parseGame(f), 'valid UI fixture');
await vite.close();
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve, reject) => { server.stdout.on('data', chunk => { if (String(chunk).includes('127.0.0.1:4173'))
    resolve(); }); server.stderr.on('data', chunk => reject(Error(String(chunk)))); server.on('error', reject); setTimeout(() => reject(Error('preview startup timeout')), 10000).unref(); });
const browser = await playwright.launch({ executablePath: process.env.CHROMIUM_PATH || await chromium.executablePath(), args: chromium.args, headless: true, env: { ...process.env, LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR || process.env.LD_LIBRARY_PATH || '/tmp' } });
const errors = [], failedRequests = [], checks = [], metrics = [];
let page, context;
async function open(save, url = '/autochess', viewport = { width: 390, height: 720 }) { await page?.close(); if (!context)
    context = await browser.newContext({ viewport }); await context.route('**/fonts.googleapis.com/**', r => r.abort()); page = await context.newPage(); await page.setViewportSize(viewport); page.setDefaultTimeout(12000); page.on('pageerror', e => errors.push(String(e))); page.on('response', r => { if (r.status() >= 400 && r.url().includes('127.0.0.1'))
    failedRequests.push(`${r.status()} ${r.url()}`); }); await page.addInitScript(([s, u]) => { localStorage.setItem('foodchest.tcg.v1', JSON.stringify(s)); localStorage.setItem('foodchest.user.v1', JSON.stringify(u)); window.__drawCount = 0; const clear = CanvasRenderingContext2D.prototype.clearRect; CanvasRenderingContext2D.prototype.clearRect = function (...a) { if (this.canvas.closest('.ac-board'))
    window.__drawCount++; return clear.apply(this, a); }; }, [save, user]); await page.goto(`http://127.0.0.1:4173${url}`, { waitUntil: 'networkidle' }); }
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('foodchest.tcg.v1')));
const geometry = async (label) => { const m = await page.evaluate(() => { const box = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right }; }; return { width: innerWidth, height: innerHeight, scrollH: document.documentElement.scrollHeight, scrollW: document.documentElement.scrollWidth, board: box(document.querySelector('.ac-cell-grid')), shop: document.querySelector('.ac-shop') ? box(document.querySelector('.ac-shop')) : null, controls: box(document.querySelector('.ac-fight-controls') ?? document.querySelector('.ac-market-toolbar')), professions: [...document.querySelectorAll('.ac-shop-profession')].map(e => ({ text: e.textContent, ...box(e) })) }; }); metrics.push({ label, ...m }); assert(m.scrollH <= m.height + 1, `${label}: outer vertical overflow`); assert(m.scrollW <= m.width + 1, `${label}: horizontal overflow`); assert(m.controls.bottom <= m.height + 1, `${label}: controls clipped`); if (m.shop)
    assert(m.shop.bottom <= m.height + 1, `${label}: shop clipped`); assert(m.board.width > 180, `${label}: board too small`); for (const p of m.professions)
    assert(p.height > 0 && p.bottom <= m.height, `${label}: profession invisible`); };
try {
    for (const [label, viewport] of [['portrait', { width: 390, height: 720 }], ['landscape', { width: 844, height: 390 }], ['desktop', { width: 1366, height: 768 }]]) {
        await open(prepare, '/autochess', viewport);
        await page.locator('.ac-shop-profession').first().waitFor();
        assert.equal(await page.locator('.ac-shop-profession').count(), 5);
        await geometry('prepare-' + label);
        await page.screenshot({ path: output + `/prepare-${label}.png` });
    }
    checks.push('Shop professions remain visible with school badges at 390x720, 844x390 and 1366x768; no outer scroll/clipped controls');
    await open(prepare);
    await page.getByRole('button', { name: /Túi/ }).click();
    assert.equal(await page.locator('.ac-item-token .ac-item-art').count(), 9);
    await page.getByRole('button', { name: 'Công thức và hướng dẫn trang bị' }).click();
    assert.equal(await page.locator('.ac-item-grid .ac-item-art').count(), 9);
    assert.equal(await page.locator('.ac-recipe-list .ac-item-art').count(), 18);
    await page.screenshot({ path: output + '/inventory.png' });
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await page.locator('button[data-cell="20"]').click({ button: 'right' });
    await page.getByRole('dialog', { name: 'Cơm tấm' }).waitFor();
    assert.equal(await page.locator('.ac-equipped-items .ac-item-art').count(), 2);
    await page.screenshot({ path: output + '/equipped-items.png' });
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    checks.push('Nine inventory illustrations, six recipe outputs and both equipped item illustrations render in unit details');
    for (const [mode, health] of [['survival', 3], ['campaign', 100]]) {
        await open(combatFixture(mode, health));
        await page.getByRole('dialog', { name: 'Một vòng chưa giữ được' }).waitFor();
        const after = await stored();
        assert.equal(after.autoChess.run.wave, 2);
        assert(after.autoChess.run.health > 0);
        assert.equal(after.autoChess.records.length, 0);
        if (mode === 'survival')
            assert.equal(after.autoChess.run.health, 2);
        else
            assert.equal(after.autoChess.campaignCleared, 1);
        await page.screenshot({ path: output + `/retry-${mode}.png` });
        await page.getByRole('button', { name: 'Chuẩn bị lại đợt 2 →', exact: true }).click();
        const retry = await stored();
        assert.equal(retry.autoChess.run.wave, 2);
        assert.equal(retry.autoChess.run.phase, 'prepare');
        assert.equal(retry.autoChess.run.combat, null);
        checks.push(`${mode}: actual combat loss opens retry without score/unlock; UI prepares the same wave with retained willpower`);
    }
    await open(combatFixture('survival', 1));
    await page.getByRole('dialog', { name: 'Kỷ lục của một đêm' }).waitFor();
    const ended = await stored();
    assert.equal(ended.autoChess.run.health, 0);
    assert.equal(ended.autoChess.records.length, 1);
    assert.equal(ended.autoChess.records[0].score, 432);
    assert.equal(await page.getByRole('button', { name: 'Chuẩn bị lại đợt 2 →', exact: true }).count(), 0);
    checks.push('Third survival loss ends the run, preserves 432 points from won waves and records once');
    await open(combatFixture('survival', 2, true));
    await page.locator('.ac-victory').waitFor();
    assert.equal(await page.locator('.ac-result-dialog').count(), 0);
    await page.screenshot({ path: output + '/victory-dance.png' });
    await page.getByRole('button', { name: 'Xem kết quả →', exact: true }).click();
    await page.getByRole('dialog', { name: 'Bàn vẫn sáng' }).waitFor();
    assert.equal((await stored()).autoChess.run.health, 2);
    await page.getByRole('button', { name: 'Qua đợt tiếp theo →', exact: true }).click();
    assert.equal((await stored()).autoChess.run.wave, 3);
    checks.push('Victory dance precedes results and wins advance without restoring survival willpower');
    for (const [label, viewport] of [['portrait', { width: 390, height: 720 }], ['landscape', { width: 844, height: 390 }], ['desktop', { width: 1366, height: 768 }]]) {
        await open(stress, '/autochess', viewport);
        await page.waitForTimeout(600);
        await geometry('combat-' + label);
        await page.screenshot({ path: output + `/combat-${label}.png` });
        if (label === 'desktop') {
            const timing = await page.evaluate(() => new Promise(res => { const at = performance.now(), count = window.__drawCount; let frames = 0; function sample(now) { frames++; if (now - at >= 3000)
                res({ seconds: (now - at) / 1000, rafFrames: frames, canvasFrames: window.__drawCount - count });
            else
                requestAnimationFrame(sample); } requestAnimationFrame(sample); }));
            metrics.push({ label: '18-actor-canvas-high', ...timing, fps: timing.canvasFrames / timing.seconds });
            await page.getByRole('button', { name: 'Chất lượng đồ họa Auto chess' }).click();
            assert.equal(await page.getByRole('button', { name: 'Chất lượng đồ họa Auto chess' }).getAttribute('aria-pressed'), 'false');
        }
    }
    checks.push('High/low renderer runs an 18-actor combat with updated cast/area/ward effects; desktop frame sample captured');
    await open(tcg, '/tcg');
    await page.locator('.tcg-viewport-battle').waitFor();
    await page.getByRole('button', { name: 'Ký ức đã mất: 1 đồng minh' }).click();
    await page.getByRole('dialog', { name: 'Ký ức đã mất' }).waitFor();
    assert(await page.getByText('Người đưa thư biển', { exact: true }).isVisible());
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await page.locator('.tcg-hand .tcg-card').first().click();
    await page.getByRole('button', { name: /Thi triển/ }).click();
    await page.waitForTimeout(1800);
    const revived = await stored();
    assert.equal(revived.battle.player.board.length, 1);
    assert.equal(revived.battle.player.board[0].cardId, 'caravan-letter');
    assert.equal(revived.battle.player.graveyard.length, 0);
    await page.screenshot({ path: output + '/tcg-revival.png' });
    assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth + 1), 'TCG battle viewport overflow');
    checks.push('TCG lost-memory viewer and revival play through UI; summoned actor and consumed memory persist');
    await open(stress);
    await page.getByRole('button', { name: 'Âm thanh và nhạc', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Âm thanh game', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Nhạc nền trận đấu & cutscene', exact: true }).check();
    await page.getByRole('button', { name: '♫ Phát thử', exact: true }).click();
    await page.getByText(/Đang phát ·/).waitFor();
    await page.locator('.tcg-music-styles input[value="8bit"]').check();
    await page.getByText(/Đang phát ·.*8-bit/).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('foodchest.user.v1')).preferences.musicStyle), '8bit');
    await page.getByRole('checkbox', { name: 'Giảm chuyển động', exact: true }).check();
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    assert(await page.locator('.ac-shell.is-reduced').isVisible());
    checks.push('Auto chess original/8-bit music buffers actually load/play through audio controls; reduced motion persists and renders');
    assert.deepEqual(errors, []);
    assert.deepEqual(failedRequests, []);
    writeFileSync(output + '/browser-results.json', JSON.stringify({ passed: true, checks, metrics, errors, failedRequests }, null, 2));
    console.log(JSON.stringify({ passed: true, checks, metrics }, null, 2));
}
catch (e) {
    console.error(e);
    if (page && !page.isClosed()) {
        await page.screenshot({ path: output + '/qa-failed.png' });
        writeFileSync(output + '/qa-failed-text.txt', await page.locator('body').innerText());
    }
    writeFileSync(output + '/browser-progress.json', JSON.stringify({ checks, metrics, errors, failedRequests }, null, 2));
    process.exitCode = 1;
}
finally {
    await context?.close();
    await browser.close();
    server.kill('SIGTERM');
}
