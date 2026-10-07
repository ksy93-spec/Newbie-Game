// 처음 켠 사람처럼: 오프닝 → 프롤로그 → 온보딩 → 첫 안내 → 첫 퀘스트 → 결과 → 그 뒤 하루.
// 세 신분 × 360×640. 실제 탭(page.click / page.tap)으로만 넘긴다(상태 주입 없음).
import { open, closeBrowser, shot, sleep, screen, BASE, playQuest, clearOverlays, walkToQuest, openQuests } from './qa-lib.mjs';
import fs from 'node:fs';

const out = {};
for (const [k, status] of [['stu', '대학생'], ['job', '취준생'], ['work', '직장인']]) {
  const R = out[status] = { steps: [], issues: [] };
  const log = (s) => { R.steps.push(s); console.log(status, s); };
  const { ctx, page, logs } = await open({ url: BASE, view: 's' });
  // 1. 오프닝 메뉴
  await page.waitForSelector('#opening .omb', { timeout: 8000 });
  const keys = await page.$$eval('#opening .omb', (bs) => bs.map((b) => b.dataset.k));
  log('opening menu ' + keys.join(','));
  if (k === 'stu') await shot(page, '01-opening');
  await page.click('#opening .omb[data-k="new"]');
  // 2. 프롤로그: 화면을 눌러 넘긴다
  await sleep(1300);
  let taps = 0; const t0 = Date.now();
  while (await page.$('#opening') && Date.now() - t0 < 60000) {
    await page.mouse.click(180, 300); taps++; await sleep(120);
    if (taps === 6 && k === 'stu') await shot(page, '01-prologue');
  }
  log('prologue taps ' + taps + ' in ' + (Date.now() - t0) + 'ms');
  await sleep(400);
  log('screen after prologue ' + await screen(page));
  // 3. 온보딩
  await page.click(`#obbody .opt:has-text("${status === '대학생' ? '재학 중' : status === '취준생' ? '취업 준비 중' : '일하는 중'}")`);
  for (let i = 0; i < 6; i++) {
    const nb = await page.$('#obnext');
    const txt = await nb.textContent();
    if (await nb.isDisabled()) { await page.click('#obbody .opt >> nth=1'); }
    if (i === 1 && k === 'stu') await shot(page, '01-onboard-step2');
    const scr0 = await screen(page);
    if (scr0 !== 'onboard') break;
    if (await page.$('#obbody .hcard') && k === 'work') await shot(page, '01-onboard-hero');
    await page.click('#obnext'); await sleep(200);
    if (/시작/.test(txt)) break;
  }
  await sleep(800);
  log('after onboard: ' + await screen(page) + ' S.onboarded=' + await page.evaluate(() => S.onboarded));
  // 4. 첫 안내 대화: 상자를 눌러 넘긴다
  await sleep(1200);
  let tt = 0;
  while (await page.evaluate(() => !!window.TUT) && tt < 30) { await page.click('#htutor'); tt++; await sleep(250); }
  log('intro talk taps ' + tt);
  await sleep(1600);
  if (k === 'stu' || k === 'work') await shot(page, '01-home-first-' + k);
  const chip = await page.evaluate(() => { const g = document.getElementById('hguide'); return g && !g.hidden ? g.textContent : null; });
  log('guide chip: ' + chip);
  const toastTxt = await page.evaluate(() => { const t = document.getElementById('htoast'); return t.hidden ? '' : t.textContent; });
  log('toast: ' + toastTxt);
  // 5. 첫 안내 칩으로 첫 퀘스트
  if (chip) {
    await page.click('#hguide');
    try { await page.waitForFunction(() => document.getElementById('quest').classList.contains('on'), null, { timeout: 20000 }); }
    catch (e) { R.issues.push('guide chip did not reach quest'); log('guide failed, map=' + await page.evaluate(() => ME.map + ' ' + ME.tx + ',' + ME.ty)); }
  }
  if (await screen(page) === 'quest') {
    if (k === 'stu') { await page.waitForFunction(() => !document.getElementById('qnext').hidden, null, { timeout: 8000 }); await shot(page, '01-quest-intro'); }
    const r = await playQuest(page, { acc: 0.7 });
    log('quest end screen ' + r);
    await sleep(500);
    await shot(page, '01-result-' + k);
    const rr = await page.evaluate(() => ({ big: document.getElementById('rbig').textContent, xp: document.getElementById('rxp').textContent, ad: !!document.getElementById('rdbl') }));
    log('result ' + JSON.stringify(rr));
    await page.click('#rback');
    await sleep(1500);
  }
  // 6. 첫 퀘스트 뒤 안내들
  let talks = 0;
  for (let i = 0; i < 80; i++) {
    const st = await page.evaluate(() => ({ tut: !!window.TUT, q: !!(window.TUT && typeof TUT.lines[TUT.i] === 'object'), tip: !document.getElementById('itip').hidden, nm: window.TUT ? TUT.name : '' }));
    if (st.tip) { const tx = await page.evaluate(() => document.getElementById('itipbox').innerText.replace(/\s+/g, ' ').slice(0, 100)); log('sheet: ' + tx); await page.evaluate(() => closeTip()); await sleep(300); continue; }
    if (st.q) { log('talk choice from ' + st.nm); await page.click('#htutorop button >> nth=-1'); await sleep(300); continue; }
    if (st.tut) { talks++; await page.click('#htutor'); await sleep(200); continue; }
    if (i > 10) break; await sleep(500);
  }
  log('after-quest talk taps ' + talks);
  if (k === 'work') await shot(page, '01-home-after1-' + k);
  // 7. 오늘 남은 퀘스트를 걸어가서 푼다
  let n = 1;
  for (let round = 0; round < 8; round++) {
    const ids = await openQuests(page);
    if (!ids.length) { log('no more open quests today; done=' + n); break; }
    const res = await walkToQuest(page, ids[0]);
    if (res !== 'ok') { log('walk ' + ids[0] + ' -> ' + res); R.issues.push('walk ' + ids[0] + ' ' + res); if (/배가|체력|피곤/.test(res)) break; await clearOverlays(page); continue; }
    await playQuest(page, { acc: 0.8 }); n++;
    await page.click('#rback'); await sleep(1200);
    await clearOverlays(page);
  }
  const fin = await page.evaluate(() => ({ lv: S.lv, coin: S.coin, done: S.done.length, full: S.full, energy: S.energy, tier: S.tier, open: openLeft(), locked: dripLocked().length, mq: mqNext() && mqNext().id, mqReady: mqReady(mqNext()), chip: document.getElementById('hmq').hidden ? null : document.getElementById('hmq').innerText }));
  log('end of day1 ' + JSON.stringify(fin));
  await sleep(3000);
  await shot(page, '01-home-end-' + k);
  const tst = await page.evaluate(() => ({ tut: window.TUT && TUT.name, tip: !document.getElementById('itip').hidden && document.getElementById('itipbox').innerText.slice(0, 120) }));
  log('overlay at end ' + JSON.stringify(tst));
  R.logs = logs.slice();
  await ctx.close();
}
fs.writeFileSync(new URL('./out/01-firstday.json', import.meta.url), JSON.stringify(out, null, 1));
await closeBrowser();
