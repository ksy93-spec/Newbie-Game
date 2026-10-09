// CX 리뷰: 처음 켠 사람으로 인생 모드 첫 15분. 실행: node ops/review-1009/tools/cx-play.mjs [width] [height]
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path';
import url from 'node:url';

const W = +(process.argv[2] || 360), H = +(process.argv[3] || 640);
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(root, 'prototype/newbie-quest-demo.html')).href;
const IMG = path.join(root, 'ops/review-1009/img');
const tag = W + 'x' + H;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e));
page.on('console', (m) => { if (m.type() === 'error') logs.push('error: ' + m.text()); });
let n = 0;
const shot = async (name, full = false) => { const f = `cx-${tag}-${String(++n).padStart(2, '0')}-${name}.png`; await page.screenshot({ path: path.join(IMG, f), fullPage: full }); console.log('SHOT', f); };
const state = (label) => page.evaluate((label) => {
  const vis = (id) => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return e.hidden || r.width === 0 ? 'hidden' : `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} "${(e.innerText || '').replace(/\s+/g, ' ').slice(0, 80)}"`; };
  return { label, hnm: vis('hnm'), hsub: vis('hsub'), htoday: vis('htoday'), htier: vis('htier'), itip: vis('itip'), mqp: !!window.MQP, tut: typeof TUT !== 'undefined' && !!TUT, opening: !!document.getElementById('opening'),
    screen: [...document.querySelectorAll('.screen.on, section.on')].map((e) => e.id).join(','), toast: [...document.querySelectorAll('.toast, #toast')].map((e) => e.innerText).join('|'),
    life: window.S && S.life ? { age: S.life.age, status: S.status, coin: S.coin, tier: S.tier, done: S.done.length, streak: S.streak, claimed: S.claimed } : null };
}, label).then((s) => console.log('STATE', JSON.stringify(s)));
const cine = async (prefix, maxShots = 3) => {
  await page.waitForFunction(() => !!window.MQP, null, { timeout: 8000, polling: 50 });
  let i = 0; const t0 = Date.now(); const texts = [];
  while (Date.now() - t0 < 40000) {
    const s = await page.evaluate(() => { if (!window.MQP) return null; const p = MQP.list()[MQP.cur()] || {}; return { cur: MQP.cur(), len: MQP.list().length, choice: !!p.choice, picked: MQP.picked, text: (p.text || []).join(' ') }; });
    if (!s) break;
    if (texts[texts.length - 1] !== s.text) texts.push(s.text);
    if (i < maxShots && s.cur >= i) { await page.waitForTimeout(1200); await shot(prefix + '-' + s.cur); i++; }
    if (s.choice && s.picked === null) await page.evaluate(() => MQP.pick(0));
    else await page.evaluate(() => MQP && MQP.next({ type: 'test' }));
    await page.waitForTimeout(60);
  }
  console.log('CINE', prefix, texts.length, JSON.stringify(texts.filter(Boolean)));
  await page.waitForTimeout(300);
};

await page.goto(BASE);
await page.waitForTimeout(1500);
await shot('opening');
await page.waitForSelector('.omb', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(400);
await shot('menu');
console.log('MENU', await page.$$eval('.omb', (b) => b.map((x) => x.innerText.replace(/\n/g, ' / '))));
await page.click('.omb[data-k="life"]');
await page.waitForTimeout(2500);
await shot('birth-top');
const card = await page.evaluate(() => { const b = document.querySelector('.bcard'), ob = document.getElementById('obbody'), nx = document.getElementById('obnext');
  const r = b.getBoundingClientRect(), nr = nx.getBoundingClientRect();
  return { cardH: Math.round(r.height), cardTop: Math.round(r.top), obScroll: ob.scrollHeight, obClient: ob.clientHeight, nextY: Math.round(nr.top), lines: b.innerText.split('\n').length, chars: b.innerText.length, text: document.getElementById('obbody').innerText }; });
console.log('CARD', JSON.stringify(card));
await shot('birth-full', true);
await page.evaluate(() => { const ob = document.getElementById('obbody'); ob.scrollTop = 99999; const s = document.scrollingElement; s.scrollTop = 99999; document.querySelector('#obbody button')?.scrollIntoView(); });
await page.waitForTimeout(300);
await shot('birth-bottom');
await page.click('#obbody button:has-text("다시 태어나기")');
await page.waitForTimeout(600);
await shot('birth-reroll');
await page.click('#obnext');
await page.waitForTimeout(800);
await cine('birthcine', 4);
for (const t of [1500, 3000, 6000]) { await page.waitForTimeout(t); await shot('home-' + t); await state('home+' + t); }
console.log('HOMETEXT', JSON.stringify(await page.evaluate(() => document.getElementById('home')?.innerText.replace(/\s+/g, ' ').slice(0, 1500))));
// 떠 있는 것 닫기: 대화·시트
for (let k = 0; k < 6; k++) {
  const o = await page.evaluate(() => { const tp = document.getElementById('itip'); if (tp && !tp.hidden) { const t = document.getElementById('itipbox').innerText.replace(/\s+/g, ' ').slice(0, 300); return 'itip: ' + t; } if (typeof TUT !== 'undefined' && TUT) return 'tut'; if (window.MQP) return 'mqp'; return null; });
  if (!o) break; console.log('OVERLAY', o);
  if (o.startsWith('itip')) { await shot('overlay-' + k); await page.evaluate(() => closeTip()); }
  else if (o === 'mqp') await cine('mqp' + k, 2);
  else { await shot('tut-' + k); await page.mouse.click(W / 2, H - 80); }
  await page.waitForTimeout(1200);
}
await state('after-overlays');
await shot('home-clear');
// 오늘 할 일
if (await page.isVisible('#htoday')) { await page.click('#htoday'); await page.waitForTimeout(600); await shot('today-sheet');
  console.log('TODAY', JSON.stringify(await page.evaluate(() => document.getElementById('itipbox').innerText.replace(/\s+/g, ' ')))); await page.evaluate(() => closeTip()); }
// 퀘스트 세 개 → 한 살
await page.evaluate(() => { S.done.push('cx1', 'cx2', 'cx3'); hudRefresh(); });
await page.waitForTimeout(900); await shot('age-toast'); await state('age+1');
// 1장 세월 컷신
await page.evaluate(() => { lifeBeforeCh('job', function () { render('home'); }); });
await cine('y24', 3);
await page.waitForTimeout(1000); await shot('age24-home'); await state('age24');
// 예순 결산
await page.evaluate(() => { MQ_LIST.forEach((c) => { S.mq.done[c.id] = 'good'; }); S.tier = S.peak = 9; save(); lifeEnd(); });
await cine('y60', 3);
await page.waitForSelector('#itip:not([hidden]) .lcard', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(500); await shot('lcard');
console.log('LCARD', JSON.stringify(await page.evaluate(() => { const b = document.getElementById('itipbox'); return { text: b.innerText, h: b.getBoundingClientRect().height, btns: [...b.querySelectorAll('button')].map((x) => x.innerText) }; })));
await page.click('#itipbox button:has-text("계속")').catch(() => {});
await page.waitForTimeout(500);
await cine('end2', 2);
await page.waitForTimeout(800); await shot('lcard-after');
console.log('AFTER', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#itipbox button')].map((x) => x.innerText))));
console.log('LOGS', JSON.stringify(logs));
await browser.close();
