// 리뷰 1008 CX: 새 사용자와 5일차 사용자로 자주 하는 일의 탭 수·대기·거리를 잰다.
// 실행: node ops/review-1008/tools/cx-run.mjs  (저장소 루트에서)
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const GAME = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href + '#nointro';
const IMG = 'ops/review-1008/img/';
const OUT = {};
const b = await chromium.launch();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(seed) {
  const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => (OUT.errors ||= []).push(String(e)));
  await p.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await p.goto(GAME); await p.waitForFunction(() => window.S && window.QUESTS);
  if (seed) { await p.evaluate(seed); await wait(400); }
  return { ctx, p };
}
const shot = (p, n) => p.screenshot({ path: IMG + 'cx-' + n + '.png' });
const vis = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; }, sel);
const screen = (p) => p.evaluate(() => document.querySelector('.screen.on')?.id || '');

// 대화 상자를 끝까지 넘긴다. 보기가 있으면 고를 글자(pick)나 첫 보기
async function drainTalk(p, pick, cap = 40) {
  let taps = 0, waited = 0;
  for (let i = 0; i < cap; i++) {
    if (!(await vis(p, '#htutor'))) break;
    const opts = await p.$$('#htutor .topts button');
    if (opts.length && await vis(p, '#htutorop')) {
      let target = opts[0];
      if (pick) for (const o of opts) if (pick.test(await o.textContent())) { target = o; break; }
      await target.click(); taps++;
    } else { await p.click('#htutor', { position: { x: 30, y: 10 } }); taps++; }
    await wait(250); waited += 250;
  }
  return taps;
}

// ── A. 새 사용자 ─────────────────────────────────────────────
{
  const { ctx, p } = await newPage();
  const A = { onboardTaps: 0 };
  const t0 = Date.now();
  await shot(p, 'a01-onboard');
  for (let i = 0; i < 30 && (await screen(p)) === 'onboard'; i++) {
    const did = await p.evaluate(() => {
      const ob = document.getElementById('onboard');
      const cards = [...ob.querySelectorAll('.hcard')]; const opts = [...ob.querySelectorAll('.opt')];
      const sel = [...ob.querySelectorAll('[aria-pressed="true"]')];
      const nb = document.getElementById('obnext');
      if (!sel.length && cards.length) { cards[0].click(); return 'card'; }
      if (!sel.length && opts.length) { opts[opts.length > 2 ? 2 : 0].click(); return 'opt'; }
      if (nb && !nb.disabled && nb.offsetParent) { nb.click(); return 'next'; }
      return '';
    });
    if (did) A.onboardTaps++;
    if (i === 1) await shot(p, 'a02-onboard-q');
    await wait(700);
  }
  A.onboardMs = Date.now() - t0;
  // 프롤로그 컷신이 뜨면 SKIP
  await wait(800);
  A.cineSkip = 0;
  for (let i = 0; i < 5; i++) { if (await vis(p, '.cskip')) { await p.click('.cskip'); A.cineSkip++; await wait(600); } }
  await wait(1500);
  A.screenAfterOnboard = await screen(p);
  await shot(p, 'a03-home-first');
  A.tutTaps = await drainTalk(p);
  await wait(1200);
  A.tutTaps += await drainTalk(p);
  await shot(p, 'a04-after-tutor');
  A.guideVisible = await vis(p, '#hguide');
  A.guideText = await p.evaluate(() => document.getElementById('hguide').textContent);
  if (A.guideVisible) {
    const g0 = Date.now(); await p.click('#hguide');
    for (let i = 0; i < 120; i++) { if ((await screen(p)) === 'quest' || (await vis(p, '#htutor'))) break; await wait(100); }
    A.guideWalkMs = Date.now() - g0; A.afterGuide = await screen(p);
    if (await vis(p, '#htutor')) { await shot(p, 'a05-guide-talk'); A.guideTalkTaps = await drainTalk(p); }
  }
  // 퀘스트 풀기: 정답을 알고 고른다(탭 수만 센다)
  await wait(500); A.questScreen = await screen(p);
  if (A.questScreen === 'quest') {
    await shot(p, 'a06-quest');
    let qt = 0;
    for (let i = 0; i < 60 && (await screen(p)) === 'quest'; i++) {
      const r = await p.evaluate(() => {
        const ch = [...document.querySelectorAll('#qchoices button')].filter((x) => !x.disabled && x.offsetParent);
        if (ch.length) {
          const q = window.RUN && RUN.q && RUN.q.qs && RUN.q.qs[RUN.i];
          let k = 0; if (q) { const want = (q.o || q.a || [])[q.c ?? q.ans ?? 0]; const f = ch.findIndex((x) => want && x.textContent.includes(String(want).slice(0, 8))); if (f >= 0) k = f; }
          ch[k].click(); return 'choice';
        }
        const nx = document.getElementById('qnext'); if (nx && !nx.hidden && nx.offsetParent) { nx.click(); return 'next'; }
        const d = document.querySelector('#quest .dlg'); if (d) { d.click(); return 'dlg'; }
        return '';
      });
      if (r) qt++; await wait(350);
    }
    A.questTaps = qt; A.afterQuest = await screen(p);
    if (A.afterQuest === 'result') { await wait(1500); await shot(p, 'a07-result'); await shot(p, 's-result'); }
    A.resultGains = await p.evaluate(() => [...document.querySelectorAll('#rgains .gain')].map((g) => g.textContent));
    if (await vis(p, '#rback')) { await p.click('#rback'); await wait(1500); }
    await shot(p, 'a08-home-after-first');
    A.afterFirstTalkTaps = await drainTalk(p); await wait(800);
    await shot(p, 'a09-home-after-talk');
    A.guideAfterFirst = await vis(p, '#hguide');
    A.mqChip = (await vis(p, '#hmq')) ? await p.textContent('#hmq') : null;
    A.tierLine = await p.textContent('#htier');
  }
  OUT.newPlayer = A;
  await ctx.close();
}

// ── B. 5일차 사용자 ─────────────────────────────────────────
const day5 = () => {
  S = fresh(); S.status = '직장인'; applyStarter(); Object.assign(S, { years: 2, company: '중소기업', region: '수도권', age: 29 });
  S.onboarded = true; S.tut = 1; S.prologue = 1;
  S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
  rollDay();
  const done = QUESTS.filter((q) => fits(q) && !q.keys && !q.trip).slice(0, 9).map((q) => q.id);
  S.done = done; S.lv = 5; S.xp = 120; S.coin = 820; S.streak = 5; S.best = 5;
  S.stats = { ju: 14, sik: 9, ui: 6, geum: 8, jik: 11 }; S.tier = 1; S.peak = 2; S.paid = 1;
  S.full = 30; S.energy = 70; S.clean = 60; S.mood = 70;
  S.pos = { map: 'room', tx: 3, ty: 4, dir: 0 };
  save(); render('home');
};
async function day5Page() { const r = await newPage(day5); await wait(900); await drainTalk(r.p); await wait(300); if (await vis(r.p, '#itip')) await r.p.evaluate(() => closeTip()); return r; }

{
  const { ctx, p } = await day5Page();
  const B = {};
  await shot(p, 'b01-home-day5'); await shot(p, 's-home-hud');
  B.where = await p.evaluate(() => ME.map);
  B.guideVisible = await vis(p, '#hguide');
  B.mq = (await vis(p, '#hmq')) ? await p.textContent('#hmq') : null;
  B.tier = await p.textContent('#htier');
  B.sub = await p.textContent('#hsub');
  // 글자 크기: 홈에서 보이는 글자 요소 중 12px 미만
  B.tinyText = await p.evaluate(() => { const out = []; document.querySelectorAll('#home *').forEach((e) => { if (!e.childNodes.length) return; const t = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(''); if (!t) return; const r = e.getBoundingClientRect(); if (!r.width || e.closest('[hidden]')) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 12) out.push(fs + 'px ' + t.slice(0, 14)); }); return out; });
  // J1 오늘 할 일
  await p.click('#htoday'); await wait(500); await shot(p, 'b02-today-sheet');
  B.todayButtons = await p.evaluate(() => [...document.querySelectorAll('#itip button')].map((x) => x.textContent));
  await p.evaluate(() => closeTip());
  // J2 퀘스트 위치: 이동 목록
  await p.click('#hmini'); await wait(400); await shot(p, 'b03-travel');
  B.travelRows = await p.evaluate(() => [...document.querySelectorAll('#htravel button')].map((x) => x.textContent));
  await p.evaluate(() => { document.getElementById('htravel').hidden = true; });
  // 열린 퀘스트가 있는 창구와 걷는 거리(타일, 0.22초/칸)
  B.questSpots = await p.evaluate(() => {
    const res = [];
    for (const k of Object.keys(MAPS)) for (const s of (MAPS[k].spots || [])) if (s.kind === 'desk' && questAtDesk(s.id)) {
      const area = k.split('_')[0], m = MAPS[area], inner = MAPS[k];
      const w = (m.warps || []).find((x) => x.to === k);
      let outT = 0, inT = 0;
      if (w && area !== k) { const pa = pathTo(m, w.x, w.y, 0, m.spawn.x, m.spawn.y); outT = pa ? pa.length : -1; }
      const adj = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([dx, dy]) => [s.x + dx, s.y + dy]).filter(([x, y]) => walkable(inner, x, y));
      let best = 99; for (const [x, y] of adj) { const pa = pathTo(inner, x, y, 0, inner.spawn.x, inner.spawn.y); if (pa && pa.length < best) best = pa.length; }
      inT = best;
      res.push({ map: k, desk: s.label, q: questAtDesk(s.id).q.title, tilesOut: outT, tilesIn: inT, sec: +((outT + inT) * 0.22).toFixed(1) });
    }
    return res;
  });
  // J4 먹기: 방 → 동네 → 편의점 → 점원
  B.eat = await p.evaluate(() => { const t = MAPS.town, pa = pathTo(t, 8, 2, 0, t.spawn.x, t.spawn.y), mm = MAPS.town_mart, pb = pathTo(mm, 3, 5, 0, mm.spawn.x, mm.spawn.y); return { tilesTown: pa ? pa.length : -1, tilesMart: pb ? pb.length : -1 }; });
  await p.evaluate(() => { enterMap('town_mart', 3, 5); ME.dir = 1; drawScene(); });
  await wait(500);
  await p.evaluate(() => { const s = MAPS.town_mart.spots.find((x) => x.who === 'mart' || x.id === 'mart'); triggerSpot(s); });
  await wait(600); await shot(p, 'b04-eat-talk');
  let et = 0; for (let i = 0; i < 12; i++) { if (await vis(p, '#htutorop')) break; await p.click('#htutor', { position: { x: 30, y: 10 } }); et++; await wait(300); }
  B.eatTapsToMenu = et; B.eatOpts = await p.evaluate(() => [...document.querySelectorAll('#htutorop button')].map((x) => x.textContent));
  await shot(p, 'b05-eat-menu');
  et = 0;
  const pickFood = async () => { const o = await p.$$('#htutorop button'); for (const x of o) if (/먹을 것|삼각김밥|도시락/.test(await x.textContent())) { await x.click(); return true; } return false; };
  for (let i = 0; i < 3; i++) { if (await vis(p, '#htutorop') && await pickFood()) { et++; await wait(500); if (await vis(p, '#htutorop')) await shot(p, 'b06-eat-menu2'); } else break; }
  B.eatTapsMenu = et; B.eatFullAfter = await p.evaluate(() => S.full);
  B.eatCloseTaps = await drainTalk(p, /괜찮아요/);
  // J8 집으로
  await p.click('#hmini'); await wait(300);
  B.homeRow = await p.evaluate(() => [...document.querySelectorAll('#htravel button')].findIndex((x) => x.textContent.includes(TIERS[S.tier].name)));
  await p.evaluate(() => { document.getElementById('htravel').hidden = true; });
  // J9 설정
  await p.click('#hmenu'); await wait(500); await shot(p, 'b07-codex-top');
  B.settings = await p.evaluate(() => { const sc = document.querySelector('#codex .scroll'), st = document.getElementById('csettings'); return { y: Math.round(st.getBoundingClientRect().top - sc.getBoundingClientRect().top), vh: sc.clientHeight, total: sc.scrollHeight }; });
  await p.evaluate(() => document.getElementById('csettings').scrollIntoView()); await wait(200); await shot(p, 'b08-settings');
  await p.evaluate(() => { const t = document.getElementById('cthemes'); t.scrollIntoView(); }); await wait(200); await shot(p, 's-codex-themes');
  OUT.day5 = B;
  await ctx.close();
}

// J5 장비, J6 이사, 캐릭터 탭 스탯
{
  const { ctx, p } = await day5Page();
  const C = {};
  await p.evaluate(() => render('char')); await wait(400); await shot(p, 's-char');
  C.charText = await p.evaluate(() => document.querySelector('#char .dmid').innerText);
  // 이사: 거처 칸 → 시트
  await p.evaluate(() => { const b = [...document.querySelectorAll('#dollB .dslot')][0]; b.click(); }); await wait(400); await shot(p, 'c01-house');
  C.houseOpen = await p.evaluate(() => ({ tip: !document.getElementById('itip').hidden, text: (document.querySelector('#char .doll')?.innerText || '').slice(0, 300), btns: [...document.querySelectorAll('#itip button, #char .scroll button')].map((x) => x.textContent).filter((t) => /이사|옮기|입주|움막|텐트/.test(t)).slice(0, 6) }));
  // 텐트(2) 줄을 찾아 누른다
  const mv = await p.evaluate(() => { const el = [...document.querySelectorAll('#char button, #itip button')].find((x) => /텐트/.test(x.textContent) && !x.disabled); if (!el) return 'no-row'; el.click(); return el.textContent; });
  C.houseRow = mv; await wait(400); await shot(p, 'c02-house-tip');
  C.houseTipBtns = await p.evaluate(() => [...document.querySelectorAll('#itip button')].map((x) => x.textContent));
  const mv2 = await p.evaluate(() => { const el = [...document.querySelectorAll('#itip button')].find((x) => /이사|옮기|입주/.test(x.textContent)); if (!el) return null; el.click(); return el.textContent; });
  C.houseConfirm = mv2; await wait(500); C.tierAfter = await p.evaluate(() => S.tier); await shot(p, 'c03-house-after');
  C.extraBtns = await p.evaluate(() => [...document.querySelectorAll('#itip button')].map((x) => x.textContent));
  // 장비: 무기 칸
  await p.evaluate(() => { render('char'); const s = [...document.querySelectorAll('#dollL .dslot, #dollR .dslot')][0]; s.click(); }); await wait(400); await shot(p, 'c04-gear-slot');
  C.gearView = await p.evaluate(() => ({ tip: !document.getElementById('itip').hidden, bag: document.getElementById('baglab').textContent, items: document.querySelectorAll('#baggrid > *').length, hint: document.getElementById('baghint').textContent }));
  // 상점 경로
  await p.evaluate(() => render('shop')); await wait(500); await shot(p, 'c05-shop');
  C.shop = await p.evaluate(() => { const rows = [...document.querySelectorAll('#shopbody .item')]; const sc = document.querySelector('#shop .scroll'); const first = rows.find((r) => !r.disabled); return { rows: rows.length, firstBuyableY: first ? Math.round(first.getBoundingClientRect().top) : null, scrollH: sc.scrollHeight, vh: sc.clientHeight, sections: [...document.querySelectorAll('#shopbody .sectlab')].map((x) => x.textContent) }; });
  // 보스 안내(스탯 문구)
  await p.evaluate(() => { enterMap('bank', 15, 5); drawScene(); triggerSpot(MAPS.bank.spots.find((s) => s.kind === 'boss')); }); await wait(500); await shot(p, 's-boss-toast');
  C.bossToast = await p.evaluate(() => document.getElementById('htoast').textContent);
  OUT.equipMove = C;
  await ctx.close();
}
fs.writeFileSync('ops/review-1008/tools/cx-out.json', JSON.stringify(OUT, null, 1));
console.log(JSON.stringify(OUT, null, 1).slice(0, 12000));
await b.close();
