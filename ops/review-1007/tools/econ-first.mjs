// 첫 세션: 신분별 첫 안내 퀘스트가 무엇이고, 그것을 깨면 거처가 열리는지(첫 "아하")
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const GAME = url.pathToFileURL(path.resolve(process.cwd(), 'prototype/newbie-quest-demo.html')).href + '#nointro';
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await page.goto(GAME); await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
for (const p of [{ status: '직장인', years: 0, region: '수도권', age: 27 }, { status: '직장인', years: 2, region: '수도권', age: 29 }, { status: '대학생', living: '자취', region: '수도권', age: 23 }, { status: '취준생', prep: 1, region: '광역시', age: 26 }]) {
  const r = await page.evaluate((p) => {
    S = fresh(); Object.assign(S, p); applyStarter(); S.onboarded = true; S.tut = 1; S.tuts = ['intro']; S.todayQ = pickDaily(); save(); render('home');
    const g = guideTarget(); const today = S.todayQ.slice();
    // 안내가 가리키는 퀘스트를 만점으로 풀었다고 치고 거처가 열리는지
    const qid = (g && (g.qid || (g.q && g.q.id))) || today[0]; const q = QMAP[qid];
    const ju0 = S.stats.ju; Object.keys(q.stat).forEach(k => S.stats[k] += q.stat[k]); const gr = tierGrow();
    return { today, guide: g ? Object.keys(g).reduce((o, k) => (typeof g[k] !== 'object' ? (o[k] = g[k], o) : o), {}) : null, first: qid, theme: q.theme, ju0, ju1: S.stats.ju, peak: S.peak, unlocked: !!gr, cost: TIER_DEP[S.peak], coin: S.coin + Math.round(q.coin) };
  }, p);
  console.log(p.status, p.years ?? '', JSON.stringify(r));
}
await b.close();
