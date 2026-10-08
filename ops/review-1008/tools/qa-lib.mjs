// QA 공용 도구. 저장소 루트에서 node ops/review-1008/tools/qa-*.mjs 로 실행한다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';

const here = path.dirname(url.fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '../../..');
export const IMG = path.resolve(here, '../img');
export const BASE = url.pathToFileURL(path.resolve(ROOT, 'prototype/newbie-quest-demo.html')).href;
export const GAME = BASE + '#nointro';
export const PROBE = url.pathToFileURL(path.resolve(ROOT, 'tests/probe.html')).href;
const { chromium } = await import('playwright');
export { chromium };

export const VIEWS = { s: { width: 360, height: 640, dsf: 3 }, m: { width: 390, height: 844, dsf: 3 }, l: { width: 412, height: 915, dsf: 2.625 } };

let browser = null;
export async function getBrowser() {
  if (!browser) browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  return browser;
}
export async function closeBrowser() { if (browser) await browser.close(); browser = null; }

/** 새 창을 연다. logs 에 pageerror·console.error 를 모은다 */
export async function open({ url: u = GAME, view = 's', bridge = false, initState = null, reduce = false, touch = true } = {}) {
  const b = await getBrowser();
  const v = typeof view === 'string' ? VIEWS[view] : view;
  const ctx = await b.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dsf || 2, hasTouch: touch, isMobile: touch, locale: 'ko-KR', timezoneId: 'Asia/Seoul', reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('console.error: ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  if (initState) await page.addInitScript((s) => { try { if (!sessionStorage.getItem('qa_seeded')) { localStorage.setItem('nq.v8', s); sessionStorage.setItem('qa_seeded', '1'); } } catch (e) {} }, typeof initState === 'string' ? initState : JSON.stringify(initState));
  if (bridge) {
    const { buildBeforeScript } = await import(url.pathToFileURL(path.resolve(ROOT, 'src/bridge/injected.mjs')).href);
    await page.addInitScript(() => { window.__rn = []; window.ReactNativeWebView = { postMessage: (m) => { window.__rn.push(JSON.parse(m)); } }; });
    await page.addInitScript(buildBeforeScript({}));
  }
  await page.goto(u);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100, timeout: 30000 });
  return { ctx, page, logs };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function shot(page, name) { const p = path.join(IMG, 'qa-' + name + '.png'); await page.screenshot({ path: p }); return p; }

/** 저장이 실제로 디스크(다른 창)에 넘어갈 때까지 기다린다 */
export async function flush(page, key = 'nq.v8') {
  const want = await page.evaluate((k) => localStorage.getItem(k), key);
  const probe = await page.context().newPage();
  try { await probe.goto(PROBE); for (let i = 0; i < 80; i++) { if ((await probe.evaluate((k) => localStorage.getItem(k), key)) === want) return true; await probe.waitForTimeout(100); } return false; }
  finally { await probe.close(); }
}
export async function reload(page) {
  await flush(page);
  await page.reload();
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100, timeout: 30000 });
}

/** 보이는 화면 id */
export const screen = (page) => page.evaluate(() => { const e = document.querySelector('.screen.on'); return e && e.id; });

/** 홈 위의 대화 상자·시트를 닫는다(실제 탭으로) */
export async function clearOverlays(page, max = 40) {
  for (let i = 0; i < max; i++) {
    const st = await page.evaluate(() => ({ tut: !!window.TUT, tutq: !!(window.TUT && TUT.lines[TUT.i] && typeof TUT.lines[TUT.i] === 'object'), tip: !document.getElementById('itip').hidden, cine: !!document.getElementById('opening'), mqp: !!window.MQP, mv: !!document.getElementById('mvbanner') }));
    if (st.mqp) { await page.evaluate(() => MQP.skip()); await sleep(80); await page.evaluate(() => MQP && MQP.next({ type: 'test' })); await sleep(120); continue; }
    if (st.cine) { const sk = await page.$('#opening .cskip'); if (sk) await sk.click().catch(() => {}); else await page.evaluate(() => window.skipOpening && skipOpening()); await sleep(700); continue; }
    if (st.tutq) { await page.evaluate(() => { const b = document.querySelector('#htutorop button:last-child'); if (b) b.click(); else typeSkip(); }); await sleep(150); continue; }
    if (st.tut) { await page.evaluate(() => stepTutor()); await sleep(60); continue; }
    if (st.tip) { await page.evaluate(() => closeTip()); await sleep(200); continue; }
    if (st.mv) { await page.evaluate(() => document.getElementById('mvbanner').click()); continue; }
    return i;
  }
  return max;
}

/** 지금 RUN 퀘스트를 실제 버튼 탭으로 끝낸다. acc: 맞힐 확률 */
export async function playQuest(page, { acc = 1, rng = Math.random, tap = true } = {}) {
  await page.waitForFunction(() => document.getElementById('quest').classList.contains('on') && window.RUN, null, { timeout: 8000, polling: 50 });
  // 인트로
  await page.waitForFunction(() => !document.getElementById('qnext').hidden, null, { timeout: 15000, polling: 50 });
  await page.click('#qnext');
  for (let guard = 0; guard < 20; guard++) {
    const scr = await screen(page);
    if (scr !== 'quest') return scr;
    await page.evaluate(() => typeSkip());
    await page.waitForFunction(() => !document.getElementById('qchoices').hidden || !document.getElementById('qnext').hidden, null, { timeout: 8000, polling: 50 });
    const st = await page.evaluate(() => ({ answered: RUN.marks[RUN.i] !== undefined, ok: RUN.q.qs[RUN.i] && RUN.q.qs[RUN.i].ok }));
    if (!st.answered) {
      const right = rng() < acc;
      const sel = right ? `#qchoices .choice[data-orig="${st.ok}"]` : `#qchoices .choice:not([data-orig="${st.ok}"]):not(.gone)`;
      if (tap) await page.locator(sel).first().click(); else await page.evaluate((s) => document.querySelector(s).click(), sel);
    }
    await page.waitForFunction(() => !document.getElementById('qnext').hidden, null, { timeout: 8000, polling: 50 });
    const label = await page.textContent('#qnext');
    await page.click('#qnext');
    if (/결과/.test(label)) { await page.waitForFunction(() => document.getElementById('result').classList.contains('on'), null, { timeout: 5000 }); return 'result'; }
    await sleep(50);
  }
  return await screen(page);
}

/** 상태 하나로 바로 홈에 선다(안내 다 본 상태) */
export const ALL_TUTS = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
export async function seed(page, status, extra = {}) {
  await page.evaluate(([st, ex, tuts]) => {
    S = fresh(); S.status = st; applyStarter();
    const base = st === '대학생' ? { living: '자취', region: '수도권', age: 22 } : st === '취준생' ? { prep: '공채', region: '수도권', age: 26 } : { years: 0, region: '수도권', age: 27, company: '중소기업' };
    Object.assign(S, base); S.onboarded = true; S.prologue = 1; S.tut = 1; S.tuts = tuts.slice();
    Object.assign(S, ex); S.todayQ = pickDaily(); save(); render('home');
  }, [status, extra, ALL_TUTS]);
  await sleep(300);
}

export function writeJson(name, obj) { fs.writeFileSync(path.join(here, '..', 'tools', 'out-' + name + '.json'), JSON.stringify(obj, null, 1)); }

/** 날짜 바꾸기 심: Date.now / new Date() 를 window.__shift(ms) 만큼 민다. 새로고침해도 유지 */
export async function installDateShim(page) {
  await page.addInitScript(() => {
    const OD = Date; let off = 0;
    try { off = +sessionStorage.getItem('qa_shift') || 0; } catch (e) {}
    function FD(...a) { if (!(this instanceof FD)) return OD(); return a.length ? new OD(...a) : new OD(OD.now() + off); }
    FD.prototype = OD.prototype; FD.now = () => OD.now() + off; FD.parse = OD.parse; FD.UTC = OD.UTC;
    window.Date = FD;
    window.__shift = (ms) => { off = ms; try { sessionStorage.setItem('qa_shift', String(ms)); } catch (e) {} };
    window.__getShift = () => off;
  });
}

/** 퀘스트 창구까지 걸어가서 말을 건다(지도 이동 → 문 → 창구). 실패하면 이유 문자열 */
export async function walkToQuest(page, qid, { timeout = 20000 } = {}) {
  const plan = await page.evaluate((id) => {
    const q = QMAP[id]; if (!q) return { err: 'no quest' };
    const did = QPLACE[id]; let mk = null, sp = null;
    Object.keys(MAPS).forEach((k) => (MAPS[k].spots || []).forEach((s) => { if (s.kind === 'desk' && s.id === did) { mk = k; sp = s; } }));
    if (!mk) return { err: 'no desk' };
    const area = mk.split('_')[0];
    return { mk, area, interior: !!MAPS[mk].interior, open: mapOpen(area) };
  }, qid);
  if (plan.err) return plan.err;
  if (!plan.open) return 'map locked ' + plan.area;
  // 1) 작은 지도 → 지역
  const cur = await page.evaluate(() => ME.map);
  if (cur !== plan.mk && cur.split('_')[0] !== plan.area) {
    await page.click('#hmini');
    await page.waitForSelector('#htravel:not([hidden])');
    const ok = await page.evaluate((area) => { const i = MAP_ORDER.indexOf(area); const bs = document.querySelectorAll('#htravel button'); const b = bs[MAP_ORDER.filter((id) => mapById(id)).indexOf(area)]; if (!b || b.disabled) return false; b.click(); return true; }, plan.area);
    if (!ok) return 'travel btn missing ' + plan.area;
    await sleep(300);
  }
  // 실내라면 바깥에서 그 문으로
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const st = await page.evaluate(([mk, id]) => {
      if (TUT || MQP || document.getElementById('opening')) return { busy: 1 };
      if (document.getElementById('quest').classList.contains('on')) return { inq: 1 };
      if (!document.getElementById('itip').hidden) return { tip: 1 };
      if (MOVE) return { moving: 1 };
      const m = curMap();
      if (ME.map === mk) {
        const did = QPLACE[id]; const s = (m.spots || []).find((x) => x.kind === 'desk' && x.id === did);
        if (Math.abs(s.x - ME.tx) + Math.abs(s.y - ME.ty) <= 1) { faceSpot(s); triggerSpot(s); return { trig: 1 }; }
        const nr = adjacentTo(m, s); if (!nr) return { err: 'no adjacent' };
        goTo(nr.x, nr.y, () => { faceSpot(s); drawScene(); triggerSpot(s); }); return { go: 1 };
      }
      if (MAPS[mk].interior) {
        const w = (m.warps || []).find((x) => x.to === mk);
        if (w) { if (!goTo(w.x, w.y, null)) { return { err: 'no path to door ' + mk + ' from ' + ME.map }; } return { door: 1 }; }
        // 다른 실내에 있으면 밖으로
        const out = (m.warps || []).find((x) => MAPS[x.to] && !MAPS[x.to].interior);
        if (out) { goTo(out.x, out.y, null); return { out: 1 }; }
        return { err: 'no door to ' + mk + ' on ' + ME.map };
      }
      enterMap(mk, MAPS[mk].spawn.x, MAPS[mk].spawn.y); return { warp: 1 };
    }, [plan.mk, qid]);
    if (st.inq) return 'ok';
    if (st.err) return st.err;
    if (st.busy) { await clearOverlays(page, 5); }
    if (st.tip) { const tx = await page.evaluate(() => document.getElementById('itipbox').innerText.slice(0, 80)); return 'sheet: ' + tx; }
    await sleep(st.moving || st.go || st.door ? 250 : 150);
    if (st.trig) { await sleep(900); const s2 = await screen(page); if (s2 === 'quest') return 'ok'; const tt = await page.evaluate(() => { const t = document.getElementById('htoast'); return !t.hidden ? t.textContent : (!document.getElementById('itip').hidden ? 'sheet:' + document.getElementById('itipbox').innerText.slice(0, 60) : ''); }); return 'not started: ' + tt; }
  }
  return 'timeout';
}

/** 오늘 열린, 아직 안 푼, 갈 수 있는 퀘스트 id 목록 */
export const openQuests = (page) => page.evaluate(() => QUESTS.filter((q) => !q.trip && fits(q) && S.done.indexOf(q.id) < 0 && qOpen(q) && qReach(q)).map((q) => q.id));

/** 배 채우기·체력: 실제 편의점 대신 상태만 채운다(긴 세션용) */
export const refill = (page) => page.evaluate(() => { S.full = 100; S.energy = 100; S.clean = 100; S.mood = 100; save(); hudRefresh(); });

/** 지도 위 어떤 자리(kind, id)까지 걸어가 말을 건다. 끝나면 {ok, screen, toast} */
export async function walkToSpot(page, kind, id, { timeout = 25000 } = {}) {
  const plan = await page.evaluate(([kind, id]) => {
    let mk = null;
    Object.keys(MAPS).forEach((k) => (MAPS[k].spots || []).forEach((s) => { if (s.kind === kind && (s.id === id || s.place === id)) mk = mk || k; }));
    if (!mk) return { err: 'no spot ' + kind + ':' + id };
    const area = mk.split('_')[0];
    return { mk, area, open: area === 'room' || mapOpen(area) };
  }, [kind, id]);
  if (plan.err) return { ok: false, why: plan.err };
  if (!plan.open) return { ok: false, why: 'map locked ' + plan.area };
  const cur = await page.evaluate(() => ME.map);
  if (cur !== plan.mk && cur.split('_')[0] !== plan.area) {
    await page.click('#hmini');
    await page.waitForSelector('#htravel:not([hidden])');
    const ok = await page.evaluate((area) => { const bs = document.querySelectorAll('#htravel button'); const b = bs[MAP_ORDER.filter((id) => mapById(id)).indexOf(area)]; if (!b || b.disabled) return false; b.click(); return true; }, plan.area);
    if (!ok) return { ok: false, why: 'travel btn ' + plan.area };
    await sleep(300);
  }
  const t0 = Date.now(); const startScr = await screen(page);
  while (Date.now() - t0 < timeout) {
    const st = await page.evaluate(([mk, kind, id]) => {
      const scr = document.querySelector('.screen.on').id;
      if (scr !== 'home') return { scr };
      if (window.MQP || document.getElementById('opening')) return { cine: 1 };
      if (TUT) return { talk: TUT.name };
      if (!document.getElementById('itip').hidden) return { tip: document.getElementById('itipbox').innerText.replace(/\s+/g, ' ').slice(0, 100) };
      if (MOVE || window.DRIVE) return { moving: 1 };
      const m = curMap();
      if (ME.map === mk) {
        const s = (m.spots || []).find((x) => x.kind === kind && (x.id === id || x.place === id));
        if (Math.abs(s.x - ME.tx) + Math.abs(s.y - ME.ty) <= 1) { faceSpot(s); triggerSpot(s); return { trig: 1 }; }
        const nr = adjacentTo(m, s); if (!nr) return { err: 'no adjacent' };
        goTo(nr.x, nr.y, () => { faceSpot(s); drawScene(); triggerSpot(s); }); return { go: 1 };
      }
      if (MAPS[mk] && MAPS[mk].interior) {
        const w = (m.warps || []).find((x) => x.to === mk);
        if (w) { if (!goTo(w.x, w.y, null)) return { err: 'no path to door ' + mk + ' from ' + ME.map }; return { door: 1 }; }
        const out = (m.warps || []).find((x) => MAPS[x.to] && !MAPS[x.to].interior);
        if (out) { goTo(out.x, out.y, null); return { out: 1 }; }
        return { err: 'no door to ' + mk + ' on ' + ME.map };
      }
      enterMap(mk, MAPS[mk].spawn.x, MAPS[mk].spawn.y); return { warp: 1 };
    }, [plan.mk, kind, id]);
    if (st.scr) return { ok: true, screen: st.scr };
    if (st.err) return { ok: false, why: st.err };
    if (st.cine) return { ok: true, screen: 'cine' };
    if (st.talk) return { ok: true, screen: 'talk:' + st.talk };
    if (st.tip) return { ok: true, screen: 'sheet', tip: st.tip };
    if (st.trig) {
      await sleep(1100);
      const s2 = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, cine: !!document.getElementById('opening'), talk: window.TUT && TUT.name, tip: document.getElementById('itip').hidden ? null : document.getElementById('itipbox').innerText.replace(/\s+/g, ' ').slice(0, 100), toast: document.getElementById('htoast').hidden ? null : document.getElementById('htoast').textContent }));
      return { ok: s2.scr !== 'home' || s2.cine || !!s2.talk || !!s2.tip, screen: s2.cine ? 'cine' : s2.talk ? 'talk:' + s2.talk : s2.tip ? 'sheet' : s2.scr, tip: s2.tip, toast: s2.toast };
    }
    await sleep(200);
  }
  return { ok: false, why: 'timeout' };
}
export async function playCine(page, picks = [], opt) { const m = await import('../../../tests/cine.mjs'); return m.playCine(page, picks, opt); }
/** 대화 상자를 끝까지 넘긴다. 질문이 나오면 pick 번째(기본 첫째) */
export async function finishTalk(page, pick = 0, max = 60) {
  for (let i = 0; i < max; i++) {
    const st = await page.evaluate(() => ({ tut: !!window.TUT, q: !!(window.TUT && typeof TUT.lines[TUT.i] === 'object'), nb: document.querySelectorAll('#htutorop button').length }));
    if (!st.tut) return i;
    if (st.q) { if (!st.nb) { await page.evaluate(() => typeSkip()); await sleep(100); continue; } await page.click(`#htutorop button >> nth=${pick}`); await sleep(250); continue; }
    await page.click('#htutor'); await sleep(120);
  }
  return max;
}
