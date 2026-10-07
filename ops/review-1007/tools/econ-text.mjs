// 콘텐츠 분량(글자 수) 측정: 읽는 시간 추정용
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const GAME = url.pathToFileURL(path.resolve(process.cwd(), 'prototype/newbie-quest-demo.html')).href + '#nointro';
const b = await chromium.launch(); const page = await (await b.newContext()).newPage();
await page.goto(GAME); await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
const r = await page.evaluate(() => {
  const L = s => (s || '').replace(/<[^>]+>/g, '').length;
  const q = QUESTS.map(q => L(q.intro) + q.qs.reduce((a, x) => a + L(x.q) + x.a.reduce((c, y) => c + L(y), 0) + L(x.why), 0));
  const mq = MQ_LIST.map(c => { const d = c.key ? window[c.key] : null; if (!d) return [c.id, null];
    const sc = d.scenes || []; let n = 0, ch = 0; sc.forEach(s => { n++; const t = [].concat(s.text || [], s.q || [], (s.a || []).map(a => a.t || a), (s.opts||[]).map(o=>o.t||o)); ch += t.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('').length; });
    return [c.id, n, ch]; });
  const ep = EPISODES.map(e => [e.id, e.beats.length, JSON.stringify(e.beats).length]);
  const boss = BOSSES.map(x => [x.id, x.qs.length, x.qs.reduce((a, y) => a + L(y.q) + y.a.join('').length + L(y.why), 0)]);
  return { qAvg: Math.round(q.reduce((a, b) => a + b, 0) / q.length), qMin: Math.min(...q), qMax: Math.max(...q), mq, ep, boss, lease: typeof LEASE_CH!=='undefined'?[LEASE_CH.length, JSON.stringify(LEASE_CH).length]:null };
});
console.log(JSON.stringify(r, null, 1)); await b.close();
