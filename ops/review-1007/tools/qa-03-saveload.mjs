// 저장·불러오기: 퀘스트 중 새로고침, 보스 중, 사건 중, 컷신 중(메인 1장), 전세 계약 중, 옛 버전 저장, 처음부터 하기.
import { open, closeBrowser, shot, sleep, screen, GAME, BASE, playQuest, clearOverlays, seed, reload, flush, playCine, finishTalk, walkToSpot, refill, getBrowser } from './qa-lib.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import { execSync } from 'node:child_process';

const R = {};
const rec = (k, v) => { R[k] = v; console.log(k, JSON.stringify(v)); };
const st = (page) => page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, lv: S.lv, xp: S.xp, coin: S.coin, full: S.full, energy: S.energy, done: S.done.length, mq: JSON.stringify(S.mq.done), cur: S.mq.cur, i: S.mq.i, chip: document.getElementById('hmq').hidden ? null : document.getElementById('hmq').innerText.replace(/\n/g, ' '), toast: document.getElementById('htoast').hidden ? null : document.getElementById('htoast').textContent, opening: !!document.getElementById('opening'), mqp: !!window.MQP }));

// A. 퀘스트 중 새로고침
{
  const { ctx, page, logs } = await open({ view: 'm' });
  await seed(page, '직장인');
  const qid = await page.evaluate(() => S.todayQ[0]);
  const before = await st(page);
  await page.evaluate((id) => startQuest(QMAP[id]), qid);
  await page.waitForFunction(() => !document.getElementById('qnext').hidden, null, { timeout: 8000 });
  await page.click('#qnext');
  await page.evaluate(() => typeSkip());
  await page.waitForSelector('#qchoices:not([hidden]) .choice');
  await page.click('#qchoices .choice >> nth=0');
  const mid = await st(page);
  await reload(page); await sleep(2500);
  const after = await st(page);
  await shot(page, '03-reload-midquest');
  rec('A_midquest', { before, mid, after, logs: logs.slice() });
  await ctx.close();
}
// B. 보스 중 새로고침
{
  const { ctx, page, logs } = await open({ view: 'm' });
  await seed(page, '직장인', { lv: 5 });
  await page.evaluate(() => { S.stats.ju = 40; save(); startBoss(bossById('jeonse')); });
  await page.waitForFunction(() => !document.getElementById('bnext').hidden, null, { timeout: 15000 });
  await page.click('#bnext'); await sleep(300);
  const mid = await st(page);
  await reload(page); await sleep(2500);
  const after = await st(page);
  await shot(page, '03-reload-midboss');
  rec('B_midboss', { mid, after, fightId: await page.evaluate(() => S.fightId), logs: logs.slice() });
  await ctx.close();
}
// C. 사건 중 새로고침
{
  const { ctx, page, logs } = await open({ view: 'm' });
  await seed(page, '직장인');
  await page.evaluate(() => epStart(epById('first-job')));
  await sleep(500); await page.evaluate(() => typeSkip());
  await page.click('#epchoices .choice >> nth=0');
  const mid = await st(page);
  await reload(page); await sleep(2500);
  rec('C_midep', { mid, after: await st(page), logs: logs.slice() });
  await ctx.close();
}
// D. 메인 1장 컷신 중 새로고침: 선택 2개 뒤 → 다시 열면 이어 보기, 보상 두 번 받지 않는지
{
  const { ctx, page, logs } = await open({ view: 'm' });
  await seed(page, '직장인');
  await page.evaluate(() => { S.done = ['ju1', 'sik1', 'stu1']; S.mq.ann = {}; save(); render('home'); });
  await sleep(500);
  await page.click('#hmq');
  await page.waitForFunction(() => !!window.MQP);
  // 선택 두 개까지
  let picks = 0;
  for (let i = 0; i < 200 && picks < 2; i++) {
    const s = await page.evaluate(() => { const p = MQP.list()[MQP.cur()] || {}; return { choice: !!p.choice, picked: MQP.picked }; });
    if (s.choice && s.picked === null) { await page.evaluate(() => MQP.pick(0)); picks++; } else await page.evaluate(() => MQP.next({ type: 'test' }));
    await sleep(30);
  }
  const mid = await st(page);
  await shot(page, '03-cine-before-reload');
  await reload(page); await sleep(2500);
  const after = await st(page);
  await shot(page, '03-cine-after-reload');
  // 이어 보기
  await clearOverlays(page);
  const chip = await page.evaluate(() => document.getElementById('hmq').innerText);
  await page.click('#hmq');
  await page.waitForFunction(() => !!window.MQP);
  const resumeFrom = await page.evaluate(() => ({ from: MQP.o.from, ok: MQP.ok, n: MQP.n, resume: MQP.o.resume }));
  // 끝까지 가다가 보상 장면에서 새로고침
  for (let i = 0; i < 300; i++) {
    const s = await page.evaluate(() => { if (!window.MQP) return null; const p = MQP.list()[MQP.cur()] || {}; return { choice: !!p.choice, picked: MQP.picked, type: p.type || '' }; });
    if (!s || s.type === 'reward') break;
    if (s.choice && s.picked === null) await page.evaluate(() => MQP.pick(0)); else await page.evaluate(() => MQP.next({ type: 'test' }));
    await sleep(30);
  }
  const atReward = await st(page);
  await reload(page); await sleep(2500);
  const afterReward = await st(page);
  await clearOverlays(page);
  const afterReward2 = await st(page);
  rec('D_cine', { mid, after, chip, resumeFrom, atReward, afterReward, afterReward2, logs: logs.slice() });
  await ctx.close();
}
// E. 처음부터 하기(시작 메뉴) / 수집 노트의 "처음부터 다시"
{
  const { ctx, page, logs } = await open({ view: 's' });
  await seed(page, '직장인', { lv: 7, coin: 999 });
  await page.evaluate(() => { enterMap('town_estate', 6, 8); });
  await flush(page);
  await page.goto(BASE); await page.waitForSelector('#opening .omb[data-k="cont"]', { timeout: 8000 });
  await page.click('#opening .omb[data-k="new"]');
  await shot(page, '03-wipe-confirm');
  await page.click('#opening .omb[data-k="wipe"]');
  await sleep(1500);
  const p1 = await st(page);
  // 프롤로그 넘기고 온보딩 끝까지
  await page.waitForSelector('#opening .cskip', { timeout: 5000 }).then((b) => b.click()).catch(() => {});
  await sleep(800);
  const ob = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, step: obStep, status: S.status, pos: S.pos, ME: ME.map }));
  await page.click('#obbody .opt >> nth=2'); await page.click('#obnext'); await page.click('#obbody .opt >> nth=0'); await page.click('#obnext'); await page.click('#obbody .opt >> nth=0'); await page.click('#obnext'); await page.click('#obnext');
  await sleep(1500);
  const home = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, map: ME.map, lv: S.lv, coin: S.coin, tut: window.TUT && TUT.name }));
  await shot(page, '03-after-wipe-home');
  // 수집 노트의 처음부터 다시: 확인 없이 지우는가
  await clearOverlays(page);
  await page.evaluate(() => { S.lv = 9; S.coin = 5000; save(); render('codex'); });
  await page.click('#reset');
  await sleep(300);
  const afterReset = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, lv: S.lv, coin: S.coin, confirm: !document.getElementById('itip').hidden }));
  await shot(page, '03-codex-reset');
  rec('E_wipe', { p1, ob, home, afterReset, logs: logs.slice() });
  await ctx.close();
}
// F. 옛 버전 저장 → 지금 버전
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nq-old-'));
  const vers = [['6c47a55', '09-27 펫'], ['434a3b4', '09-28 프롤로그'], ['ae95edb', '09-29 A·B'], ['14e838e', '09-30 D(메인 전)'], ['5da4288', '10-01 메인 QA'], ['b7e0955', '10-02 그림 주인공']];
  const out = [];
  for (const [c, nm] of vers) {
    const f = path.join(dir, 'g-' + c + '.html');
    fs.writeFileSync(f, execSync(`git show ${c}:prototype/newbie-quest-demo.html`, { maxBuffer: 1 << 28 }));
    const b = await getBrowser();
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const logs = [], oldLogs = [];
    page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') logs.push('console.error: ' + m.text()); });
    await page.goto(url.pathToFileURL(f).href + '#nointro');
    await page.waitForFunction(() => window.S && window.QUESTS, null, { timeout: 20000 });
    // 옛 버전에서 중반까지 논 저장을 만든다
    const made = await page.evaluate(() => {
      try {
        S.status = '직장인'; S.years = 2; S.region = '수도권'; S.age = 28; S.company = '중소기업'; S.onboarded = true; S.tut = 1;
        if (typeof applyStarter === 'function') applyStarter();
        const qs = QUESTS.filter((q) => typeof fits !== 'function' || fits(q)).slice(0, 8);
        qs.forEach((q) => { if (S.done.indexOf(q.id) < 0) S.done.push(q.id); if (q.reward && S.owned.indexOf(q.reward) < 0) S.owned.push(q.reward); Object.keys(q.stat || {}).forEach((k) => { S.stats[k] = Math.min(100, (S.stats[k] || 0) + q.stat[k]); }); });
        S.lv = 6; S.xp = 30; S.coin = 1400; S.tier = 5; S.peak = 6; if ('paid' in S) S.paid = 5;
        if (S.review) S.review.push({ q: qs[0].id, i: 0, box: 0, due: '2026-09-01' });
        if (typeof FURNI !== 'undefined' && Array.isArray(S.furni)) { const ids = Object.keys(FURNI).slice(0, 2); ids.forEach((id) => S.furni.push(S.furni.length && typeof S.furni[0] === 'string' ? id : { id, x: null, y: null })); }
        const mapKeys = typeof MAPS !== 'undefined' ? Object.keys(MAPS) : [];
        const away = mapKeys.find((k) => /trip|gangneung|busan|korea/.test(k)) || mapKeys[mapKeys.length - 1];
        S.pos = { map: away || 'town', tx: 5, ty: 5, dir: 0 };
        if (typeof save === 'function') save();
        return { ok: 1, keys: Object.keys(S).length, mq: 'mq' in S, pos: S.pos, ver: typeof CONTENT !== 'undefined' ? CONTENT.ver : null, avatar: S.avatar };
      } catch (e) { return { err: String(e) }; }
    });
    oldLogs.push(...logs.splice(0));
    await sleep(500);
    // 같은 저장소에서 지금 버전으로 연다(업데이트)
    await page.goto(GAME);
    await page.waitForFunction(() => window.S && window.QUESTS, null, { timeout: 20000 });
    await sleep(3000);
    const now = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, lv: S.lv, map: ME.map, pos: S.pos, mqgf: S.mq && S.mq.gf, chip: document.getElementById('hmq').hidden ? null : document.getElementById('hmq').innerText.replace(/\n/g, ' '), avatar: S.avatar, hero: S.hero, tier: S.tier, peak: S.peak, drip: S.drip && S.drip.u.length, open: openLeft() }));
    await shot(page, '03-oldsave-' + c);
    // 모든 탭과 화면을 돌아본다
    const tabs = {};
    for (const t of ['char', 'shop', 'wiki', 'codex', 'home']) { try { await page.evaluate((t) => render(t), t); await sleep(300); tabs[t] = 'ok'; } catch (e) { tabs[t] = String(e).slice(0, 100); } }
    await clearOverlays(page);
    let q = null;
    try { await page.evaluate(() => { S.full = 100; S.energy = 100; const id = QUESTS.filter((q) => !q.trip && fits(q) && S.done.indexOf(q.id) < 0 && qOpen(q))[0]; startQuest(id); }); q = await playQuest(page, { acc: 1 }); } catch (e) { q = 'fail ' + e.message.slice(0, 80); }
    out.push({ c, nm, made, now, tabs, q, oldLogs, logs: logs.slice() });
    console.log(c, JSON.stringify(out[out.length - 1]).slice(0, 600));
    await ctx.close();
  }
  rec('F_oldsaves', out);
}
// G. 망가진 저장(값이 빠지거나 모르는 id)
{
  const bad = [
    ['unknown map', { onboarded: true, status: '직장인', years: 0, region: '수도권', pos: { map: 'nowhere', tx: 3, ty: 3, dir: 0 } }],
    ['unknown items', { onboarded: true, status: '대학생', living: '자취', region: '수도권', equip: { weapon: 'laser', top: 'zzz', head: 'hnone', bottom: 'beige', pet: 'dragon', mount: 'ufo' }, owned: ['laser', 'zzz'] }],
    ['unknown quests', { onboarded: true, status: '취준생', prep: 0, region: '수도권', done: ['nope1', 'ju1'], todayQ: ['nope2'], review: [{ q: 'nope3', i: 0, box: 0, due: '2026-01-01' }], drip: { v: 1, u: ['nope4'], g: 3, d0: '2026-10-01', at: null } }],
    ['tier out of range', { onboarded: true, status: '직장인', years: 0, region: '수도권', tier: 20, peak: 30, lastTier: 20 }],
    ['null stats', { onboarded: true, status: '직장인', years: 0, region: '수도권', stats: null }],
    ['corrupt json', '{"onboarded":true,"status":"직장'],
  ];
  const out = [];
  for (const [nm, s] of bad) {
    const { ctx, page, logs } = await open({ view: 'm', initState: typeof s === 'string' ? s : s });
    await sleep(2500);
    const r = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, map: typeof ME !== 'undefined' && ME.map })).catch((e) => ({ err: String(e) }));
    let tabs = {};
    for (const t of ['char', 'shop', 'codex', 'home']) { try { await page.evaluate((t) => render(t), t); tabs[t] = 'ok'; } catch (e) { tabs[t] = String(e).split('\n')[0].slice(0, 120); } }
    out.push({ nm, r, tabs, logs: logs.slice(0, 5) });
    console.log(nm, JSON.stringify(out[out.length - 1]));
    if (logs.length) await shot(page, '03-badsave-' + nm.replace(/\s/g, '-'));
    await ctx.close();
  }
  rec('G_badsaves', out);
}
fs.writeFileSync(new URL('./out/03-saveload.json', import.meta.url), JSON.stringify(R, null, 1));
await closeBrowser();
