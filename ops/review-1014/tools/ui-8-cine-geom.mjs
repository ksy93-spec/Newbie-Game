// 컷신(MQP) 화면의 상자 배치를 대본 전체에 대해 계산한다. playMQ의 wrap/drawBox/drawChoices/drawDoc과 같은 식을 쓴다.
// 점검: 선택지 상자 vs 서류 상자, 선택지 vs 말한 이 이름표, 선택지가 SKIP 단추 칸까지 올라감, 대화 상자 vs 서류, 서류 줄이 4줄을 넘어 잘림.
const L = await import('./ui-lib.mjs');
const fs = await import('node:fs');
const browser = await L.chromium.launch();
const { ctx, page } = await L.openPage(browser, 360, 640, '#nointro');
await page.evaluate(async () => { try { await document.fonts.ready; } catch (e) {} });
const res = await page.evaluate(() => {
  const W = 160, out = { scenes: 0, hits: [], srcs: {} };
  lifeNew(); const p = lifeGen(lifeSeedNew()); S.life.prof = p; S.life.seed = p.seed; birthApply(); S.onboarded = true; S.tut = 1;
  const cv = document.createElement('canvas'), cx = cv.getContext('2d');
  const wrap = (lines, max) => { cx.font = '8px ' + CFONT; const o = [];
    (lines || []).forEach((line) => { const words = String(line).split(' '); let cur = '';
      words.forEach((wd) => { const t2 = cur ? cur + ' ' + wd : wd;
        if (cx.measureText(t2).width > max && cur) { o.push(cur); cur = wd; }
        else if (cx.measureText(t2).width > max) { const ch = t2.split(''); let c2 = ''; ch.forEach((c) => { if (cx.measureText(c2 + c).width > max) { o.push(c2); c2 = c; } else c2 += c; }); cur = c2; }
        else cur = t2; });
      if (cur) o.push(cur); });
    return o; };
  const geom = (sc, H) => {
    const iss = [];
    if (!sc || sc.type === 'title' || sc.type === 'reward') {
      if (sc && sc.type === 'reward') { const rows = (sc.rows || []).length; if (90 + rows * 14 > H - 40) iss.push('보상 줄 ' + rows + '개가 아래 영웅/문구까지 내려옴'); }
      return iss; }
    const Ls = wrap(sc.text, W - 30), bh = Math.max(64, Ls.length * 12 + 16), by = H - 12 - bh;
    let docB = 0;
    if (sc.doc) { const d = sc.doc, w = W - 16, rows = (d.rows || []).slice(0, 4);
      const two = rows.map((r) => cx.measureText(String(r[0])).width + cx.measureText(String(r[1])).width + 14 > w);
      const h = 16 + rows.reduce((a, r, j) => a + (two[j] ? 22 : 12), 0); docB = 28 + h;
      if ((d.rows || []).length > 4) iss.push('서류 줄 ' + d.rows.length + '개 중 4개만 그려 나머지가 사라짐');
      if (docB > by) iss.push('서류(아래 ' + docB + ')가 대화 상자(위 ' + by + ')를 덮음'); }
    if (by < 4) iss.push('대화 상자가 위로 ' + by + 'px 넘침');
    if (sc.choice) { const opts = sc.choice.opts; let y = by - 6; const rects = [];
      for (let j = opts.length - 1; j >= 0; j--) { const Lo = wrap([(j + 1) + '. ' + opts[j].a], W - 34), h = Lo.length * 11 + 8; y -= h; rects.unshift({ y, h, n: Lo.length }); y -= 4; }
      const top = rects[0].y;
      if (sc.who) iss.push('선택지 맨 아래 상자가 말한 이「' + sc.who + '」이름표(' + (by - 11) + '~' + (by - 3) + ')를 ' + Math.max(0, by - 6 - (by - 11)) + 'px 덮음');
      if (sc.doc && top < docB) iss.push('선택지 맨 위(' + top + ')가 서류 아래(' + docB + ')와 ' + (docB - top) + 'px 겹침');
      if (top < 20) iss.push('선택지 맨 위가 ' + top + ' → SKIP 단추 칸(0~18)과 겹치거나 화면 밖');
      const tl = rects.reduce((a, r) => a + r.n, 0); }
    return iss; };
  const caps = [];
  const grab = (src, scenes) => { if (!scenes) return; out.srcs[src] = scenes.length; caps.push([src, scenes]); };
  // 메인 퀘스트
  try { MQ_LIST.forEach((c) => { if (c.id === 'lease') { try { grab('lease', leaseScenes()); } catch (e) {} return; } const d = mqData(c); if (d) grab('mq:' + c.id, d.scenes); }); } catch (e) { out.err = String(e); }
  try { grab('rent', rentScenes()); } catch (e) {}
  // 이야기
  try { Object.keys(CS_STORY).forEach((id) => { try { grab('cs:' + id, csFill(id, 'jeonse')); } catch (e) {} }); } catch (e) {}
  // 인생 모드
  try { const f = lifeFillVals(); grab('birth', lifeBirthScenes(f)); } catch (e) { out.err2 = String(e); }
  try { Object.keys(LIFE_YEARS).forEach((k) => { const y = LIFE_YEARS[k]; try { grab('years:' + k, lifeFill(y.scenes, lifeFillVals())); } catch (e) {} }); } catch (e) {}
  try { const f = lifeFillVals(); grab('end1', lifeFill(LIFE_END.part1, f)); grab('end2', lifeFill(LIFE_END.part2, f)); } catch (e) {}
  const combos = [lifeMidFlags(), Object.fromEntries(LIFE_MID_FLAGS.map((k) => [k, true])), Object.fromEntries(LIFE_MID_FLAGS.map((k) => [k, false]))];
  Object.keys(LIFE_MID).forEach((id) => combos.forEach((fl, ci) => { try { grab('mid:' + id + '#' + ci, lifeMidScenes(id, fl, LIFE_MID[id].age, true)); } catch (e) {} }));
  Object.keys(LIFE_MID_YEARS).forEach((k) => combos.forEach((fl, ci) => { try { grab('midy:' + k + '#' + ci, lifeMidYearScenes(k, fl)); } catch (e) {} }));
  const seen = new Set();
  for (const H of [284, 346, 355]) for (const [src, scenes] of caps) scenes.forEach((sc, i) => {
    const iss = geom(sc, H); out.scenes++;
    iss.forEach((m) => { const k = src.replace(/#\d$/, '') + '|' + i + '|' + m + '|' + H; if (seen.has(k)) return; seen.add(k);
      out.hits.push({ H, src: src.replace(/#\d$/, ''), i, m, text: ((sc.text || []).join(' ')).slice(0, 36), who: sc.who || '' }); }); });
  return out; });
console.log('장면', res.scenes, '출처', Object.keys(res.srcs).length, res.err || '', res.err2 || '');
const by = {};
for (const h of res.hits) { const k = h.m.replace(/\d+/g, 'N'); (by[k] = by[k] || []).push(h); }
for (const [k, v] of Object.entries(by)) { console.log('\n## ' + k + ' — ' + v.length + '건'); v.slice(0, 12).forEach((h) => console.log(`  H${h.H} ${h.src}#${h.i} ${h.m} 「${h.text}」 who=${h.who}`)); }
fs.writeFileSync(L.TMP + '/ui-cine-geom.json', JSON.stringify(res, null, 1));
await ctx.close(); await browser.close();
