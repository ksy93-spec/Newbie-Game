// CS 리뷰: 처음 켠 사람 흐름(저장 없이) + 약력 30장 + 대량 표본 점검
// 실행: node ops/review-1009/tools/cs-profiles.mjs  (저장소 루트에서)
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url'; import fs from 'node:fs';
const ROOT = process.cwd();
const BASE = url.pathToFileURL(path.resolve(ROOT, 'prototype/newbie-quest-demo.html')).href;
const OUT = path.resolve(ROOT, 'ops/review-1009');
const browser = await chromium.launch();
const res = { flow: {} };
for (const [w, h] of [[360, 640], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage(); const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  await page.goto(BASE);
  let ok = false;
  for (let i = 0; i < 40 && !ok; i++) {
    await page.waitForTimeout(500);
    const b = page.locator('.omenu button:has-text("인생 모드")');
    if (await b.count() && await b.first().isVisible()) { await b.first().click(); ok = true; }
    else await page.mouse.click(w / 2, h / 2);
  }
  await page.waitForTimeout(1200);
  const card = ok ? await page.textContent('#obbody').catch(() => null) : null;
  await page.screenshot({ path: `${OUT}/img/cs-card-${w}.png` });
  // 카드 확정 → 태어남 컷신 대사 수집
  let cine = [];
  if (ok) {
    await page.click('#obnext').catch(() => {});
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(700);
      const t = await page.evaluate(() => { const els = [...document.querySelectorAll('[class*=cine] , [id*=cine], [class*=mq], [id*=mq]')].filter((e) => e.offsetParent); return els.map((e) => e.innerText).join(' | ').slice(0, 300); });
      if (t && cine[cine.length - 1] !== t) cine.push(t);
      await page.mouse.click(w / 2, h * 0.7);
      if (await page.evaluate(() => document.getElementById('home')?.classList.contains('on'))) break;
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/img/cs-home-${w}.png` });
  }
  res.flow[w] = { menuOk: ok, card, cine, hud: await page.evaluate(() => (document.querySelector('#hud, .hud, header')?.innerText || '').slice(0, 200)), toasts: await page.evaluate(() => [...document.querySelectorAll('.toast,#toast')].map((e) => e.innerText)), logs };
  await ctx.close();
}
// 약력 30장 + 대량 표본
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(BASE + '#nointro');
await page.waitForFunction(() => window.S && window.lifeGen, null, { polling: 100 });
Object.assign(res, await page.evaluate(() => {
  const A = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; let s = 12345;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const seed = () => 'v1-' + Array.from({ length: 6 }, () => A[Math.floor(rnd() * 31)]).join('');
  const save0 = S.life, mode0 = S.mode;
  const cards = [];
  for (let i = 0; i < 30; i++) {
    const p = lifeGen(seed()), d = document.createElement('div');
    S.life = { prof: p, rolls: 1, prev: [] }; birthRender(d);
    const f = lifeFillVals(); const sc = lifeBirthScenes(f);
    cards.push({ seed: p.seed, text: d.innerText.replace(/\n+/g, ' / ').replace(/^.*?삼세판\. */, '').replace(/다시 태어나기 \(.*$/, ''), birth: sc.map((x) => x.text.join(' ')).join(' ‖ '), fxHome: lifeFx(p).home, home: f.home });
  }
  // 대량 표본
  const N = 20000, c = {}, inc = (k) => { c[k] = (c[k] || 0) + 1; }, schools = {}, ex = {};
  const note = (k, v) => { inc(k); (ex[k] = ex[k] || []).length < 4 && ex[k].push(v); };
  for (let i = 0; i < N; i++) {
    const p = lifeGen(seed()), fx = lifeFx(p);
    inc('sido:' + p.sido); inc('path:' + p.path); inc('living:' + p.living); inc('band:' + p.band); inc('sibs:' + p.sibs); if (p.multi) inc('multi');
    schools[p.hs] = (schools[p.hs] || 0) + 1;
    if (p.path === '고졸' && p.firstJob === '과외') note('고졸+과외', p.seed);
    if (p.sibs === '외동' && /형제/.test(p.phone)) note('외동+형제에게 물려받은 폰', p.seed + ' ' + p.phone);
    if (/중고폰/.test(p.phone) && /새로 산/.test(p.phone)) note('새로 산 중고폰', p.phone);
    if (p.food === '엄마표 김밥' && /아빠와|조부모/.test(p.parents)) note('엄마 없는 집+엄마표 김밥', p.parents);
    if (p.multi && ((/^엄마/.test(p.multi) && p.parents === '아빠와 나') || (/^아빠/.test(p.multi) && p.parents === '엄마와 나') || p.parents === '조부모님과')) note('다문화 문구와 가족 칸 어긋남', p.parents + ' / ' + p.multi);
    if (p.sido === '세종') note('2006년생 세종 출생(세종시 2012 출범)', p.sido + ' ' + p.sgg + ' ' + p.dong);
    if (p.band === '그 외' && /동$/.test(p.dong)) inc('그 외인데 동(도시) 주소');
    if (p.living === '자취' && fx.home !== '자취방') note('카드 첫 거처≠컷신 {home}', fx.home + ' vs 자취방');
    if (p.band === '수도권' && p.living !== '본가') note('수도권 비본가 + "아낀 월세" 대사', p.living);
    if (p.parents === '부모님 두 분' && p.sibs === '외동') inc('x');
    if (p.living === '기숙사' && p.path === '고졸') note('고졸 기숙사', p.seed);
    if (/1학년/.test(p.major)) inc('x2');
  }
  S.life = save0; S.mode = mode0;
  const odd = Object.keys(schools).filter((k) => /^(정자|주례|사직|석사|하단|무거|왕조|내외|수송|상인|가정|온천|매탄|망원|수완|비전|무실|효자|중|상|우|좌|교|연)/.test(k));
  const stems = [...new Set(Object.keys(schools).map((k) => k.replace(/(정보|공업|상업|디자인)?(마이스터고|외고|예고|고)$/, '')))].sort();
  return { cards, counts: c, ex, odd: odd.slice(0, 60), stems, N };
}));
await browser.close();
fs.writeFileSync('/tmp/claude-0/-home-user-Newbie-Game/887117d1-4617-5cc3-8513-2fb8b844491c/scratchpad/cs-out.json', JSON.stringify(res, null, 1));
console.log('ok');
