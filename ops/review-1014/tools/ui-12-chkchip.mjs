// 체크리스트 칩(#hchk, D-day 칩)이 존 태그(#hzone), 메인 칩(#hmq), ☰(#hmenu)과 겹치는지 잰다. 칩 문구는 homeCheckChip이 만드는 형식 그대로.
const L = await import('./ui-lib.mjs');
const browser = await L.chromium.launch();
for (const [w, h] of L.SIZES) {
  const { ctx, page } = await L.openPage(browser, w, h, '#nointro');
  await L.homeSetup(page, 'S.done=[QUESTS[0].id]; S.todayQ=[QUESTS[1].id];');
  for (const [name, html] of [['짧은', '<b>D-12</b> 첫 출근 · 남은 할 일 11'], ['긴', '<b>D-30</b> 퇴사 · 실업급여 · 남은 할 일 10']]) {
    await page.evaluate((html) => { const el = document.getElementById('hchk'); el.hidden = false; el.innerHTML = html; }, html);
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => { const g = (id) => { const e = document.getElementById(id); if (!e || e.hidden) return null; const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom].map(Math.round); }; return { chk: g('hchk'), zone: g('hzone'), mq: g('hmq'), menu: g('hmenu') }; });
    const x = (a, b) => a && b && Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 0 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 0;
    console.log(`${w}x${h} ${name} chk=${r.chk} zone=${r.zone} mq=${r.mq} menu=${r.menu}`, x(r.chk, r.zone) ? '<< 존 태그와 겹침' : '', x(r.chk, r.mq) ? '<< 메인 칩과 겹침' : '', x(r.chk, r.menu) ? '<< ☰와 겹침' : '');
    if (name === '긴') await L.shot(page, `s12-chk-${w}`);
  }
  await ctx.close();
}
await browser.close();
