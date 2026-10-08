// 제안한 짧은 컷신 12편을 지금 엔진(playMQ)에 그대로 넣어 본다: 줄 접힘, 길이 추정, 장면 캡처
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path'; import url from 'node:url'; import fs from 'node:fs';
const { chromium } = await import('playwright');
const GAME = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href + '#nointro';
const OUT = 'ops/review-1008/img/';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 360, height: 640 } });
const page = await ctx.newPage(); const logs = [];
page.on('pageerror', e => logs.push(String(e)));
await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(GAME); await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 });
  S.onboarded = true; S.tut = 1; S.tuts = ['intro','afterq','travel','check','needs','hungry','doors','room','gear','lv2','ep','pet','car','boss']; save(); render('home'); });
await page.addScriptTag({ content: fs.readFileSync('ops/review-1008/tools/story-scenes.js', 'utf8') + ';window.CS_STORY=CS_STORY;window.BOSS_FIRST=BOSS_FIRST;' });
await page.waitForTimeout(600);
// 제안 4절: pet_ 그림을 컷신 인물로
await page.evaluate(() => { const old = portraitSrc; window.portraitSrc = portraitSrc = function (k) {
  if (/^pet_/.test(k)) { const c = castCv(k); return c ? { cv: c, key: k, right: false, k: c.width / (c.lw || c.width) } : null; } return old(k); }; });
const fill = { n: 4, rev: 6, tier: '고시원', lv: 5, mq: '3장 첫 신용카드', bg: 'cafe' };
const stats = await page.evaluate((fill) => {
  const ctx = document.createElement('canvas').getContext('2d'); ctx.font = '8px ' + CFONT; const max = 160 - 30;
  const wrapN = (line) => { let n = 1, cur = ''; String(line).split(' ').forEach(w => { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > max && cur) { n++; cur = w; } else cur = t; }); return n; };
  const out = {};
  Object.keys(CS_STORY).forEach(id => { const c = CS_STORY[id]; let sc = c.scenes.slice(); if (id === 'boss1') sc = [BOSS_FIRST.mlm.scene].concat(sc);
    let secs = 1.6 + (c.reward ? 2.5 : 0), over = [], chars = 0;
    sc.forEach((p, i) => { const txt = p.text.map(s => s.replace(/\{(\w+)\}/g, (m, k) => fill[k])); const L = txt.reduce((a, l) => a + wrapN(l), 0);
      if (L > txt.length || L > 3) over.push(i + ':' + L); const ch = txt.reduce((a, l) => a + l.length + 4, 0); chars += ch; secs += ch / 18 + 1.4 + (p.doc ? 1.5 : 0); });
    out[id] = { scenes: sc.length, chars, secs: Math.round(secs), over }; });
  return out; }, fill);
const play = async (id, idx, name) => {
  await page.evaluate(({ id, fill }) => { const c = CS_STORY[id]; let sc = c.scenes.slice(); if (id === 'boss1') sc = [BOSS_FIRST.mlm.scene].concat(sc);
    sc = JSON.parse(JSON.stringify(sc).replace(/\{(\w+)\}/g, (m, k) => fill[k] != null ? fill[k] : m));
    playMQ({ no: '', title: c.title, sub: c.sub, scenes: sc }); }, { id, fill });
  await page.waitForTimeout(900);
  if (idx < 0) { await page.screenshot({ path: OUT + name }); }
  else { await page.evaluate(i => { const st = MQP; st.next(); while (st.cur() < i) { st.next(); st.next(); } }, idx + 1); await page.waitForTimeout(2600); await page.screenshot({ path: OUT + name }); }
  await page.evaluate(() => { const st = MQP; if (st) { let k = 0; while (MQP && k++ < 60) { st.next(); st.next(); } } }); await page.waitForTimeout(800); };
await play('home4', -1, 'story-try-title.png');
await play('home4', 0, 'story-try-gosiwon-missing.png');
await play('streak7', 1, 'story-try-bird.png');
await play('boss1', 0, 'story-try-boss-mlm.png');
await play('memory', 3, 'story-try-memory.png');
await play('lv2', 2, 'story-try-lv2-doc.png');
console.log(JSON.stringify({ stats, logs }, null, 1));
await b.close();
