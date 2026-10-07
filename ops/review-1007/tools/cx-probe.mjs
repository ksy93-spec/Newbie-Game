// CX 점검 3: 장비 칸 이름이 칸 밖으로 잘리는지, 주인공 카드 이름이 그림을 덮는지 잰다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const here = path.dirname(url.fileURLToPath(import.meta.url));
const BASE = url.pathToFileURL(path.resolve(here, '../../../prototype/newbie-quest-demo.html')).href + '#nointro';
const b = await chromium.launch();
for (const [w, h] of [[360, 640], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await p.goto(BASE); await p.waitForFunction(() => window.S && window.QUESTS);
  const r = await p.evaluate(() => {
    S = fresh(); S.status = '직장인'; applyStarter(); Object.assign(S, { years: 2, region: '수도권' }); S.onboarded = true; S.tut = 1; S.prologue = 1; save(); rollDay(); render('char');
    const out = { dslot: [], hero: [] };
    document.querySelectorAll('#char .dcol .dslot').forEach((s) => { const sr = s.getBoundingClientRect(); const dn = s.querySelector('.dn'); const cv = s.querySelector('canvas');
      if (!dn) return; const dr = dn.getBoundingClientRect();
      out.dslot.push({ label: s.querySelector('.dl').textContent, name: dn.textContent, slotBottom: Math.round(sr.bottom), nameBottom: Math.round(dr.bottom), canvasH: cv ? Math.round(cv.getBoundingClientRect().height) : 0, clipped: dr.bottom > sr.bottom - 3 }); });
    document.querySelectorAll('#pavatar .hcard').forEach((c) => { const cv = c.querySelector('canvas').getBoundingClientRect(); const nm = c.querySelector('span').getBoundingClientRect();
      out.hero.push({ overlap: Math.round(cv.bottom - nm.top), cardH: Math.round(c.getBoundingClientRect().height) }); });
    return out; });
  console.log(w, JSON.stringify(r));
  await ctx.close();
}
await b.close();
