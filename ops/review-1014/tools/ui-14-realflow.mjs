// 세이브 없이 시작해 인생 모드 → 출생 카드 → 출생 컷신 → 첫 홈까지 실제로 눌러 가며, 매 단계 겹침을 잰다.
const L = await import('./ui-lib.mjs');
const { playCine } = await import('../../../tests/cine.mjs');
const browser = await L.chromium.launch();
const ONLY = process.argv[2] ? process.argv[2].split(',').map(Number) : [360, 390];
for (const [w, h] of L.SIZES) {
  if (!ONLY.includes(w)) continue;
  const { ctx, page, logs } = await L.openPage(browser, w, h);
  await page.waitForTimeout(1200);
  await page.click('#opening .omb[data-k="life"]'); await page.waitForTimeout(800);
  await page.click('#obnext'); await page.waitForTimeout(800);
  await L.shot(page, `s14-birthcine-title-${w}`);
  const n = await playCine(page, [0, 0, 0, 0, 0, 0, 0, 0], { timeout: 60000 }).catch((e) => 'ERR ' + e);
  console.log(`${w}x${h} 컷신 선택 수`, n);
  await page.waitForTimeout(2500);
  await L.shot(page, `s14-firsthome-${w}`);
  const st = await page.evaluate(() => ({ tut: !!TUT, tutText: TUT && TUT.lines && String(TUT.lines[0]).slice(0, 30), map: ME.map, opening: !!document.getElementById('opening'), tip: !document.getElementById('itip').hidden }));
  console.log(JSON.stringify(st));
  const r = await L.audit(page, { root: '#home', ignore: ['#scene', '.mapfade', '.hud', '.hud *'] });
  console.log(L.fmt(`첫 홈 ${w}x${h}`, r).split('\n').filter((x) => !/sceneinfo|htoday|작은칸 button「[▲◀▶▼]」/.test(x)).join('\n'));
  // 튜토리얼을 눌러 닫으며 한 단계씩 찍는다
  for (let i = 0; i < 6; i++) {
    const t = await page.evaluate(() => !!TUT); if (!t) break;
    await page.evaluate(() => stepTutor()); await page.waitForTimeout(700);
    if (i === 1) await L.shot(page, `s14-tutor2-${w}`);
  }
  await page.waitForTimeout(1200);
  await L.shot(page, `s14-after-tutor-${w}`);
  const r2 = await L.audit(page, { root: '#home', ignore: ['#scene', '.mapfade', '.hud', '.hud *'] });
  console.log(L.fmt(`튜토리얼 뒤 홈 ${w}x${h}`, r2).split('\n').filter((x) => !/sceneinfo|htoday|작은칸 button「[▲◀▶▼]」/.test(x)).join('\n'));
  console.log('로그', logs.join('|'));
  await ctx.close();
}
await browser.close();
