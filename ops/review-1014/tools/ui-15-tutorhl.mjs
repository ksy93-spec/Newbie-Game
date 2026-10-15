// 튜토리얼 'travel'(작은 지도를 가리키는 말풍선)에서 말풍선이 강조 대상(#hmini)을 덮는지 잰다.
const L = await import('./ui-lib.mjs');
const browser = await L.chromium.launch();
for (const [w, h] of L.SIZES) {
  const { ctx, page } = await L.openPage(browser, w, h, '#nointro');
  await L.homeSetup(page, 'S.done=[QUESTS[0].id]; S.tuts=["intro","afterq"];', false);
  await page.evaluate(() => { TUT_COOL = 0; checkTutor(); });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => { const g = (s) => { const e = document.querySelector(s); if (!e || e.hidden) return null; const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom].map(Math.round); }; return { tut: TUT && TUT.tut, hl: !!document.querySelector('.hl'), bubble: g('#htutor'), mini: g('#hmini'), dpad: g('#hdpad'), menu: g('#hmenu') }; });
  const cov = r.bubble && r.mini && Math.min(r.bubble[2], r.mini[2]) - Math.max(r.bubble[0], r.mini[0]) > 0 && Math.min(r.bubble[3], r.mini[3]) - Math.max(r.bubble[1], r.mini[1]) > 0;
  console.log(`${w}x${h}`, JSON.stringify(r), cov ? '<< 말풍선이 강조 대상 미니맵을 덮음' : '');
  await L.shot(page, `s15-travel-tutor-${w}`);
  await ctx.close();
}
await browser.close();
