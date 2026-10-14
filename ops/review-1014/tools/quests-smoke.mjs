// 새 퀘스트를 넣은 복사본을 브라우저로 열어, 인생 모드 나이 조건과 실제 풀이가 되는지 본다.
// 사용: node ops/review-1014/tools/quests-smoke.mjs <퀘스트를 넣은 게임 파일 복사본>
//   (먼저: cp prototype/newbie-quest-demo.html X && node ops/review-1014/quests/apply.mjs X)
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
const { chromium } = await import('playwright');

const FILE = process.argv[2];
if (!FILE) { console.error('게임 파일 복사본 경로를 주세요'); process.exit(2); }
const NEW = ['pay1','tax3','learn1','ju6','ju7','geum5','cari1','hlth0','irp1','irp2','quit1','baby1','baby2','ju8','ju9','ju10','ju11','ins2','cari2','tax4','sik3',
  'pen2','pen3','care1','care2','tax5','hlth1','ju12','ju13','ju14','scam3','job8','sik4','pen4','ju15','inh1','ju16','hlth2','jik4','sik5','scam4'];
const browser = await chromium.launch();
let bad = 0;
for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('error: ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(url.pathToFileURL(path.resolve(FILE)).href + '#nointro');
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 }); S.onboarded = true; S.lv = 9; save(); });
  await page.evaluate(() => { lifeNew(); obStep = 0; stopWalk(); obRender(); go('onboard'); });
  const r = await page.evaluate((ids) => {
    S.onboarded = true; S.status = '직장인';
    const at = (a) => { S.life.age = a; return ids.filter((id) => fits(QMAP[id])).length; };
    const out = { n: QUESTS.length, missing: ids.filter((id) => !QMAP[id]), f25: at(25), f33: at(33), f45: at(45), f55: at(55) };
    S.life.age = 45; out.pen2_45 = fits(QMAP.pen2); out.pen4_45 = fits(QMAP.pen4);
    S.life.age = 25; out.pen2_25 = fits(QMAP.pen2);
    S.life.age = 55; dripEnsure(); out.open55 = openLeft();
    return out; }, NEW);
  console.log(vp.width + 'x' + vp.height, JSON.stringify(r));
  if (r.n < 88 || r.missing.length || r.f25 !== 8 || r.f45 !== 33 || r.f55 !== 41 || !r.pen2_45 || r.pen4_45 || r.pen2_25) { bad++; console.log('  x 나이 조건이 예상과 다름'); }
  // 하나씩 풀어 보기(정답만 눌러서 결과 화면까지)
  for (const id of (vp.width === 360 ? NEW : NEW.slice(0, 6))) {
    const ok = await page.evaluate((id) => { const q = QMAP[id]; S.full = 100; S.energy = 100; if (S.drip.u.indexOf(id) < 0) S.drip.u.push(id);
      S.done = S.done.filter((x) => x !== id); startQuest(q); return !!window.RUN && RUN.q.id === id; }, id);
    if (!ok) { bad++; console.log('  x 시작 못 함', id); continue; }
    const tapNext = async () => { await page.waitForSelector('#qnext:not([hidden])', { timeout: 8000 }); await page.click('#qnext'); };
    try {
      await tapNext();                                         // 첫마디 → 들어보기
      for (let i = 0; i < 3; i++) {
        await page.waitForSelector('#qchoices:not([hidden]) .choice', { timeout: 8000 });
        const clicked = await page.evaluate(() => { const it = RUN.q.qs[RUN.i]; const b = [...document.querySelectorAll('#qchoices .choice')].find((x) => +x.dataset.orig === it.ok && !x.disabled);
          if (!b) return false; b.click(); return true; });
        if (!clicked) throw new Error('보기 버튼 없음 Q' + (i + 1));
        await tapNext();                                       // 해설 → 계속
      }
    } catch (e) { bad++; console.log('  x', id, String(e.message).split('\n')[0]); }
    await page.waitForTimeout(400);
    const done = await page.evaluate((id) => S.done.indexOf(id) >= 0, id);
    if (!done) { bad++; console.log('  x 끝까지 못 감', id); }
    const sw = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (sw) { bad++; console.log('  x 가로 스크롤', id); }
    await page.evaluate(() => { try { go('home'); } catch (e) {} });
  }
  if (logs.length) { bad++; console.log('  콘솔 오류', logs.slice(0, 5)); }
  await ctx.close();
}
await browser.close();
console.log(bad ? `문제 ${bad}` : '문제 없음');
process.exit(bad ? 1 : 0);
