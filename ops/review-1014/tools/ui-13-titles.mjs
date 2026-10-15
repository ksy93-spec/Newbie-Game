// 컷신 제목 카드의 제목(bold 20px)·부제(8px)가 논리 폭 160을 넘는지 잰다(playMQ drawTitle과 같은 글꼴).
const L = await import('./ui-lib.mjs');
const browser = await L.chromium.launch();
const { ctx, page } = await L.openPage(browser, 360, 640, '#nointro');
await page.evaluate(async () => { try { await document.fonts.load('bold 20px Galmuri14'); await document.fonts.ready; } catch (e) {} });
const r = await page.evaluate(() => {
  const cv = document.createElement('canvas'), cx = cv.getContext('2d'), out = [], W = 160;
  const t20 = (s) => { cx.font = 'bold 20px Galmuri14,Galmuri11,monospace'; return cx.measureText(s).width; };
  const t8 = (s) => { cx.font = '8px ' + CFONT; return cx.measureText(s).width; };
  const chk = (src, title, sub) => { const a = t20(title || ''), b = t8(sub || ''); if (a > W - 8) out.push([src, '제목', title, Math.round(a)]); if (b > W - 8) out.push([src, '부제', sub, Math.round(b)]); };
  MQ_LIST.forEach((c) => chk('mq:' + c.id, c.title, c.sub));
  Object.keys(CS_STORY).forEach((k) => chk('cs:' + k, CS_STORY[k].title, CS_STORY[k].sub));
  Object.keys(LIFE_MID).forEach((k) => { const e = LIFE_MID[k]; chk('mid:' + k, e.title, '30대 후반 · ' + e.sub); });
  Object.keys(LIFE_YEARS).forEach((k) => chk('years:' + k, LIFE_YEARS[k].title, LIFE_YEARS[k].sub));
  chk('birth', LIFE_BIRTH.title, LIFE_BIRTH.sub); chk('end', LIFE_END.title, LIFE_END.sub);
  return out; });
console.log(r.length ? r.map((x) => x.join(' | ')).join('\n') : '제목/부제 넘침 없음');
await ctx.close(); await browser.close();
