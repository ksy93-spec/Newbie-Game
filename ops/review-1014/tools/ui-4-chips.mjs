// 홈 위에 겹쳐 뜨는 칩들(안내 칩, 메인 칩, 체크 칩, 근처 줄, 장소 줄)이 십자키·미니맵·메뉴 칩과 부딪치는지 잰다.
const L = await import('./ui-lib.mjs');
const browser = await L.chromium.launch();
const ONLY = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const STATES = {
  'new': '',                                   // 첫 상담 안내(S.done 비어 있음)
  'done1': 'S.done=[QUESTS[0].id]; S.todayQ=[QUESTS[1].id,QUESTS[2].id];',   // 다음 퀘스트 안내
};
for (const [w, h] of L.SIZES) {
  if (ONLY && !ONLY.includes(w)) continue;
  for (const [name, code] of Object.entries(STATES)) {
    const { ctx, page, logs } = await L.openPage(browser, w, h, '#nointro');
    await L.homeSetup(page, code);
    await page.evaluate(() => { try { guideSync(); mqChip(); } catch (e) { console.log(e); } });
    await page.waitForTimeout(400);
    await L.shot(page, `s4-${name}-${w}`);
    const res = await L.audit(page, { root: '#home', ignore: ['#scene', '.mapfade', '.hud', '.hud *'] });
    console.log(L.fmt(`chips ${name} ${w}x${h}`, res));
    console.log('  ', res.els.filter(e => /guide|dpad|minimap|menuchip|mqchip|chkchip|zonetag/.test(e.n)).map(e => e.n.split('.')[0] + '「' + e.t + '」[' + e.r.join(',') + ']').join('\n   '));
    await ctx.close();
  }
}
await browser.close();
