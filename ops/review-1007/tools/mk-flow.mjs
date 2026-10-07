// 마케팅·첫인상: 처음 켠 사람의 첫 60초~5분을 재고 찍는다.
// 실행: node ops/review-1007/tools/mk-flow.mjs [w h dpr tag]
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
const { chromium } = await import('playwright');

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(root, 'prototype/newbie-quest-demo.html')).href;
const IMG = path.join(root, 'ops/review-1007/img');
const [W, H, DPR, TAG] = [+(process.argv[2] || 390), +(process.argv[3] || 844), +(process.argv[4] || 2), process.argv[5] || 'a'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: true, isMobile: true, locale: 'ko-KR' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

let taps = 0;
const log = [];
const T0 = Date.now();
const now = () => ((Date.now() - T0) / 1000).toFixed(2);
function mark(name, extra) { const r = { t: +now(), taps, name, ...(extra || {}) }; log.push(r); console.log(JSON.stringify(r)); }
async function shot(name) { await page.screenshot({ path: path.join(IMG, `mk-${TAG}-${name}.png`) }); }
async function tap(sel) { taps++; await page.locator(sel).first().click({ timeout: 8000 }); }
async function tapXY(x, y) { taps++; await page.mouse.click(x, y); }
const sleep = (ms) => page.waitForTimeout(ms);

await page.goto(BASE);
await page.waitForFunction(() => window.S && document.getElementById('opening'), null, { polling: 50 });
mark('opening_visible');
await sleep(600); await shot('01-title-drop');
await page.waitForSelector('.omenu:not([hidden]) .omb', { timeout: 5000 });
mark('menu_visible');
await sleep(400); await shot('02-title-menu');
const menuTxt = await page.$$eval('.omb', (bs) => bs.map((b) => b.textContent));
mark('menu_items', { menuTxt });

// 시작하기
await tap('.omb.main');
mark('tap_start');
await sleep(300); await shot('03-coin');
await page.waitForSelector('#opening.cine', { timeout: 5000 });
mark('prologue_visible');
// 프롤로그 정보: 장면 수와 글자 수(초당 16글자)
const pro = await page.evaluate(() => PROLOGUE.map((p) => (p.text || []).reduce((a, l) => a + l.length + 6, 0)));
mark('prologue_info', { panels: pro.length, chars: pro, readSecAt16cps: +(pro.reduce((a, b) => a + b, 0) / 16).toFixed(1) });
// 사람처럼: 글자가 다 찍힐 때까지 기다렸다가 한 번 누른다(+0.8초 읽기)
for (let i = 0; i < pro.length; i++) {
  await sleep(Math.round(pro[i] / 16 * 1000) + 800);
  if (i === 1 || i === 3 || i === 5) await shot('04-prologue-' + i);
  const box = await page.locator('#opening canvas').boundingBox();
  await tapXY(box.x + box.width / 2, box.y + box.height * 0.4);
}
let extra = 0;
while (await page.evaluate(() => !!document.getElementById('opening')) && extra < 20) {
  await sleep(1200); if (!(await page.evaluate(() => !!document.getElementById('opening')))) break;
  const box = await page.locator('#opening canvas').boundingBox(); if (!box) break;
  await tapXY(box.x + box.width / 2, box.y + box.height * 0.4); extra++; }
await page.waitForFunction(() => !document.getElementById('opening'), null, { timeout: 5000 });
mark('prologue_done', { extraTaps: extra });
await sleep(300);
await shot('05-onboard-status');

// 온보딩
const obTimes = [];
async function obPick(idx) {
  const t = Date.now();
  await tap(`#obbody .opt >> nth=${idx}`);
  await tap('#obnext');
  obTimes.push(Date.now() - t);
}
const firstQ = await page.textContent('#obbody .ob-q');
await obPick(1); // 취준생? 순서 확인용
const st = await page.evaluate(() => S.status);
mark('ob_status', { q: firstQ, status: st });
await shot('06-onboard-q2');
await obPick(0);
await shot('07-onboard-q3');
await obPick(0);
mark('ob_questions_done');
await sleep(200);
await shot('08-hero-pick');
// 주인공 하나 골라 보고 시작
await tap('#obbody .hcard >> nth=3');
await sleep(200);
await shot('09-hero-picked');
await tap('#obnext');
mark('onboard_done', { steps: await page.evaluate(() => obSteps().length) });

// 홈: 첫 지도
await sleep(400);
await shot('10-home-first');
mark('home_visible');
// 부동산 사장 안내
await page.waitForSelector('#htutor:not([hidden])', { timeout: 6000 }).catch(() => {});
const tutLines = await page.evaluate(() => TUT ? TUT.lines.length : 0);
mark('tutor_visible', { lines: tutLines });
await sleep(800);
await shot('11-home-tutor');
let guard = 0;
while (await page.evaluate(() => !!TUT) && guard++ < 30) {
  // 글자 다 찍히길 기다렸다 누름(17ms/글자)
  const len = await page.evaluate(() => (TW && TW.full ? TW.full.length : 0));
  await sleep(Math.min(3000, len * 17 + 900));
  await tap('#htutor');
}
mark('tutor_done');
await sleep(1800);
await shot('12-home-after-tutor');
const coinAfter = await page.evaluate(() => ({ coin: S.coin, claimed: S.claimed, claimC: S.claimC, toast: !document.getElementById('htoast').hidden && document.getElementById('htoast').textContent }));
mark('first_passive_reward', coinAfter);

// 안내 칩
const chip = await page.evaluate(() => { const g = document.getElementById('hguide'); return g && !g.hidden ? g.textContent : null; });
mark('guide_chip', { chip });
await shot('13-home-guidechip');
if (chip) await tap('#hguide');
const tw0 = Date.now();
await page.waitForFunction(() => !!window.RUN && document.getElementById('quest').classList.contains('on'), null, { timeout: 30000, polling: 100 });
mark('quest_screen', { walkMs: Date.now() - tw0, q: await page.evaluate(() => RUN.q.id + ' ' + RUN.q.title + ' n=' + RUN.q.qs.length) });
await sleep(1200);
await shot('14-quest-intro');
await page.waitForSelector('#qnext:not([hidden])', { timeout: 10000 });
await tap('#qnext');
const nq = await page.evaluate(() => RUN.q.qs.length);
for (let i = 0; i < nq; i++) {
  await page.waitForSelector('#qchoices:not([hidden]) .choice', { timeout: 10000 });
  await sleep(500);
  if (i === 0) await shot('15-quest-question');
  const ok = await page.evaluate(() => RUN.q.qs[RUN.i].ok);
  // 정답 고르기
  taps++;
  await page.evaluate((o) => { document.querySelector(`#qchoices .choice[data-orig="${o}"]`).click(); }, ok);
  await sleep(500);
  if (i === 0) await shot('16-quest-answer');
  await tap('#qnext');
}
await page.waitForFunction(() => document.getElementById('result').classList.contains('on'), null, { timeout: 8000 });
mark('result_visible', await page.evaluate(() => ({ big: document.getElementById('rbig').textContent, xp: document.getElementById('rxp').textContent, coin: S.coin, lv: S.lv })));
await sleep(150); await shot('17-result-150ms');
await sleep(700); await shot('18-result');
await tap('#rback');
await sleep(1500);
await shot('19-home-after-first-quest');
mark('back_home', { tut: await page.evaluate(() => TUT && TUT.tut) });

fs.writeFileSync(path.join(root, `ops/review-1007/tools/mk-flow-${TAG}.json`), JSON.stringify({ W, H, DPR, log, obTimes, errs }, null, 1));
console.log('errors', errs);
await browser.close();
