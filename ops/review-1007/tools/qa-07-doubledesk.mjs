// 창구 사람 두 번 탭 재현: 퀘스트가 두 번 시작되면서 무슨 일이 생기는지, 그리고 '결과 보기' 두 번.
import { open, closeBrowser, shot, sleep, screen, seed, clearOverlays } from './qa-lib.mjs';
const tileXY = (page, tx, ty) => page.evaluate(([tx, ty]) => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect(), m = curMap(), cam = camOf(m); return { x: r.left + ((tx * TS + TS / 2 - cam.x) * cam.z) * (r.width / SW), y: r.top + ((ty * TS + TS / 2 - cam.y) * cam.z) * (r.height / SH) }; }, [tx, ty]);
for (const gap of [60, 250, 600]) {
  const { ctx, page, logs } = await open({ view: 'm' });
  await seed(page, '직장인'); await clearOverlays(page);
  const tgt = await page.evaluate(() => { const id = S.todayQ[0], did = QPLACE[id]; let mk = null, sp = null; Object.keys(MAPS).forEach((k) => (MAPS[k].spots || []).forEach((s) => { if (s.kind === 'desk' && s.id === did) { mk = k; sp = s; } })); enterMap(mk, sp.x, sp.y + 1); ME.dir = 3; drawScene(); return { x: sp.x, y: sp.y }; });
  await sleep(600);
  const p = await tileXY(page, tgt.x, tgt.y);
  await page.touchscreen.tap(p.x, p.y); await sleep(gap); await page.touchscreen.tap(p.x, p.y);
  const tl = [];
  for (let t = 0; t < 12; t++) { await sleep(150); tl.push(await page.evaluate(() => (document.querySelector('.screen.on').id[0]) + (document.getElementById('wipe').className || '-') + ':' + (document.getElementById('qtext').textContent.length))); }
  await page.waitForFunction(() => !document.getElementById('qnext').hidden); await page.click('#qnext');
  // 문제를 푸는 중 두 번째 와이프가 끼어드는지
  const answers = [];
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => typeSkip());
    await page.waitForSelector('#qchoices:not([hidden]) .choice', { timeout: 5000 }).catch(() => {});
    const s = await page.evaluate(() => ({ i: RUN.i, n: RUN.q.qs.length, marks: RUN.marks.length }));
    await page.evaluate(() => { const ok = RUN.q.qs[RUN.i].ok; const b = document.querySelector(`#qchoices .choice[data-orig="${ok}"]`); if (b) b.click(); });
    await page.waitForFunction(() => !document.getElementById('qnext').hidden);
    await sleep(700);
    const lab = await page.textContent('#qnext'); answers.push(s.i + '/' + s.n + ':' + lab);
    if (/결과/.test(lab)) break;
    await page.click('#qnext');
  }
  const bb = await page.$eval('#qnext', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.touchscreen.tap(bb.x, bb.y); await sleep(90);
  const under = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.className) + ':' + (e.textContent || '').trim().slice(0, 30) : null; }, [bb.x, bb.y]);
  await page.touchscreen.tap(bb.x, bb.y); await sleep(400);
  const r = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, full: S.full, energy: S.energy, starts: S.log.filter((e) => e.n === 'quest_start').length, finishes: S.log.filter((e) => e.n === 'quest_finish').length, ad: !!document.querySelector('.adwrap'), coin: S.coin }));
  console.log('gap', gap, JSON.stringify({ tl, answers, under, r, logs }));
  if (gap === 60) await shot(page, '07-after-result-double');
  await ctx.close();
}
await closeBrowser();
