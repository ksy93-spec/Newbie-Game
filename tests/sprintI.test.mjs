// 첫 월세 계약: 원룸 월세가 처음 열리면 이사 전에 계약 컷신을 겪는다.
// 실행: node --test tests/sprintI.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';
import { playCine } from './cine.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
const here = path.dirname(url.fileURLToPath(import.meta.url));
const BASE = url.pathToFileURL(path.resolve(here, '../prototype/newbie-quest-demo.html')).href;

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage(); const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('error: ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(BASE + '#nointro');
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.evaluate(() => { Object.assign(S, { status: '대학생', living: '자취', region: '수도권', age: 24, onboarded: true, tut: 1, tuts: ['intro', 'room', 'town'] });
    S.tier = S.peak = S.paid = S.lastTier = 5; S.stats.ju = 36; S.coin = 1000; save(); render('home'); });
  return { ctx, page, logs };
}

test('1. 퀘스트로 원룸 월세가 열리면 바로 이사하지 않고 월세 계약 컷신이 뜨고, 다 고르면 이사한다', async () => {
  const { ctx, page, logs } = await open();
  const mv = await page.evaluate(() => { const g = tierGrow(); const m = g && g.wasTop ? tierMove(S.peak) : null; save(); render('home'); return { m, tier: S.tier, peak: S.peak }; });
  assert.equal(mv.peak, 6); assert.equal(mv.tier, 5, '계약 전에는 옮기지 않는다'); assert.equal(mv.m.rent, 1);
  await page.waitForFunction(() => { if (TUT) endTalk(); return window.MQP && MQP.o.title === '첫 월세 계약'; }, null, { timeout: 10000, polling: 200 });
  const n = await playCine(page, [0, 0, 0, 0, 0, 0, 0], { timeout: 40000 });
  assert.equal(n, 7, '선택 일곱 번');
  const r = await page.evaluate(() => ({ tier: S.tier, done: S.rentDone, best: S.rentBest, rent: S.rent }));
  assert.equal(r.tier, 6); assert.equal(r.done, 1); assert.equal(r.best, 'good'); assert.equal(r.rent, null);
  // 두 번째부터는 계약 없이 바로 옮긴다
  const again = await page.evaluate(() => { tierMove(5); const m = tierMove(6); return { ok: m.ok, rent: !!m.rent }; });
  assert.deepEqual(again, { ok: 1, rent: false });
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('2. 거처 창에서는 "월세 계약하러 가기", 보증금이 모자라면 계약도 못 연다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { S.peak = 6; save(); houseTip(6); });
  assert.match(await page.textContent('#itipbox .ibtns'), /월세 계약하러 가기/);
  await page.click('#itipbox .ibtns button:has-text("월세 계약하러 가기")');
  await page.waitForFunction(() => window.MQP && MQP.o.title === '첫 월세 계약', null, { timeout: 8000 });
  await playCine(page, [1, 1, 1, 1, 1, 1, 1], { timeout: 40000 });
  assert.equal(await page.evaluate(() => S.rentBest), 'bad');
  assert.equal(await page.evaluate(() => S.tier), 6);
  await page.evaluate(() => { closeTip(); S.tier = 5; S.paid = 5; S.rentDone = 0; S.coin = 5; save(); houseTip(6); });
  assert.doesNotMatch(await page.textContent('#itipbox .ibtns'), /월세 계약/);
  assert.equal(await page.evaluate(() => tierMove(6).rent || 0), 0);
  assert.deepEqual(logs, []);
  await ctx.close();
});
