// 태어남 카드가 첫 화면에 얼마나 보이는지(390x844). 실행: node ops/review-1009/tools/cx-fold.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(root, 'prototype/newbie-quest-demo.html')).href;
const b = await chromium.launch();
for (const [w, h] of [[390, 844], [360, 640]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  await p.goto(BASE); await p.waitForSelector('.omb', { timeout: 8000 }); await p.click('.omb[data-k="life"]'); await p.waitForTimeout(2500);
  if (w === 390) await p.screenshot({ path: path.join(root, 'ops/review-1009/img/cx-390x844-birth-top.png') });
  console.log(w, h, JSON.stringify(await p.evaluate(() => { const H = innerHeight, nx = document.getElementById('obnext').getBoundingClientRect().top;
    const rows = [...document.querySelectorAll('.bcard > *')].map((e) => { const r = e.getBoundingClientRect(); return [e.className, Math.round(r.top), Math.round(r.bottom), r.bottom <= nx ? 'visible' : 'below']; });
    const top = [...document.querySelectorAll('#onboard > *')].map((e) => [e.id || e.className, Math.round(e.getBoundingClientRect().height)]);
    return { H, nextTop: Math.round(nx), rows, top }; })));
}
await b.close();
