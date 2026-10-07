// 마케팅·첫인상: 결과에서 홈으로 돌아올 때 경험치 막대와 코인 숫자가 움직이는지 잰다
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
const { chromium } = await import('playwright');
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(root, 'prototype/newbie-quest-demo.html')).href;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(BASE + '#nointro');
await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
const r = await page.evaluate(async () => {
  S = fresh(); S.status = '대학생'; applyStarter(); Object.assign(S, { living: '자취', region: '수도권' });
  S.onboarded = true; S.tut = 1; S.tuts = TUT_STEPS.map((t) => t.id); S.claimed = dayKey(); S.todayQ = pickDaily(); S.tipTools = 1; save(); render('home');
  await new Promise((r) => setTimeout(r, 300));
  const before = { w: document.getElementById('hxp').style.width, coin: document.getElementById('hcoin').textContent };
  const q = QUESTS.filter((x) => qOpen(x) && fits(x) && !x.keys)[0]; startQuest(q);
  await new Promise((r) => { const iv = setInterval(() => { if (!document.getElementById('qnext').hidden) { clearInterval(iv); r(); } }, 20); });
  document.getElementById('qnext').click();
  for (let i = 0; i < q.qs.length; i++) {
    await new Promise((r) => { const iv = setInterval(() => { if (!document.getElementById('qchoices').hidden && document.querySelector('#qchoices .choice')) { clearInterval(iv); r(); } }, 20); });
    document.querySelector(`#qchoices .choice[data-orig="${RUN.q.qs[RUN.i].ok}"]`).click(); await new Promise((r) => setTimeout(r, 30)); document.getElementById('qnext').click(); }
  await new Promise((r) => setTimeout(r, 200));
  const mv = document.getElementById('mvbanner'); if (mv) mv.click();
  document.getElementById('rback').click();
  const samples = [];
  const t0 = performance.now();
  for (const ms of [0, 100, 300, 600, 900]) { while (performance.now() - t0 < ms) await new Promise((r) => requestAnimationFrame(r));
    const e = document.getElementById('hxp'); samples.push({ ms, px: Math.round(e.getBoundingClientRect().width), coin: document.getElementById('hcoin').textContent }); }
  return { before, samples };
});
console.log(JSON.stringify(r));
await browser.close();
