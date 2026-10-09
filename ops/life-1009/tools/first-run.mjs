// 처음 켠 사람(저장 없음) 흐름: 오프닝 메뉴 → 모드 → 온보딩 다음 버튼이 눌리는지
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const mode = process.argv[2] || 'life';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href);
await page.waitForSelector('#opening .omb', { timeout: 10000 });
const keys = await page.$$eval('#opening .omb', (bs) => bs.map((x) => x.dataset.k));
await page.tap('#opening .omb[data-k="' + (mode === 'life' ? 'life' : 'new') + '"]');
await page.waitForTimeout(3000);
const st = await page.evaluate(() => ({ screen: (document.querySelector('.screen.on') || {}).id, opening: !!document.getElementById('opening'), mode: S.mode, slot: SLOT,
  next: (() => { const n = document.getElementById('obnext'); return n ? { dis: n.disabled, txt: n.textContent } : null; })(), body: document.getElementById('obbody').textContent.slice(0, 80) }));
console.log('menu', JSON.stringify(keys)); console.log(JSON.stringify(st));
const nb = await page.$('#obnext'); const box = await nb.boundingBox();
const top = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.id || e.className || e.tagName : null; }, [box.x + box.width / 2, box.y + box.height / 2]);
console.log('at next button:', top, JSON.stringify(box));
await page.screenshot({ path: path.join(ROOT, 'ops/life-1009/img/first-' + mode + '.png') });
console.log(JSON.stringify(errs)); await b.close();
