// 화면에 뜬 것을 사람처럼 하나씩 눌러 넘기는 운전기. 퀘스트 보기는 정답 버튼을 실제로 누른다.
import { tapCine, tapTutor, visButtons, shot } from './lib.mjs';
export async function scr(page) {
  return page.evaluate(() => ({ on: [...document.querySelectorAll('.screen.on, section.on')].map((e) => e.id).join(','),
    cine: !!document.getElementById('opening'), mq: !!window.MQP, tut: !!(document.getElementById('htutor') && !document.getElementById('htutor').hidden),
    tip: !!(document.getElementById('itip') && !document.getElementById('itip').hidden), place: !!window.PLACE, map: window.ME && ME.map }));
}
// 오늘 할 일 → 다음 퀘스트로 가기
export async function goNext(page, log) {
  await settle(page, log);
  await page.locator('#htoday').click();
  await page.waitForTimeout(400);
  const btns = await page.$$eval('#itipbox button', (bs) => bs.map((b) => b.textContent.trim()));
  const g = page.locator('#itipbox button', { hasText: '다음 퀘스트로 가기' });
  if (!(await g.count())) { log.push('today sheet: no guide button ' + JSON.stringify(btns)); await page.locator('#itipbox button').last().click().catch(() => {}); return false; }
  log.push('guide: ' + (await g.first().textContent()));
  await g.first().click();
  return true;
}
// 한 퀘스트를 실제 탭으로 끝낸다
export async function playQuest(page, log, name) {
  const t0 = Date.now(); let stuck = 0, last = '';
  while (Date.now() - t0 < 90000) {
    const s = await scr(page);
    const key = JSON.stringify(s);
    if (s.cine) { const r = await tapCine(page, { max: 200 }); log.push('cine ' + r.scenes.length + ' scenes, picks ' + r.picks.length + ': ' + r.scenes.slice(0, 2).join(' / ').slice(0, 120)); continue; }
    if (s.tut) { const l = await tapTutor(page); log.push('talk: ' + l.filter((x, i) => i === l.length - 1 || !l[i + 1].startsWith(x)).join(' | ').slice(0, 300)); continue; }
    if (s.on.includes('quest')) {
      const nx = page.locator('#qnext:visible');
      const ch = page.locator('#qchoices:visible .choice:not([disabled])');
      if (await ch.count()) { const ok = await page.evaluate(() => RUN.q.qs[RUN.i].ok); await page.locator(`#qchoices .choice[data-orig="${ok}"]`).click(); await page.waitForTimeout(500); continue; }
      if (await nx.count()) { await nx.click(); await page.waitForTimeout(400); continue; }
      const any = page.locator('#quest button:visible:not([disabled])');
      if (await any.count()) { await page.waitForTimeout(500); stuck++; } else { await page.waitForTimeout(300); stuck++; }
    } else if (s.tip) {
      const bt = await page.$$eval('#itipbox button', (bs) => bs.map((b) => b.textContent.trim()));
      log.push('sheet: ' + (await page.textContent('#itipbox')).replace(/\s+/g, ' ').slice(0, 140) + ' | btns ' + JSON.stringify(bt));
      if (name) await shot(page, name + '-sheet' + log.length);
      const pref = ['계속', '확인', '받기', '닫기', '좋아요'];
      let clicked = false;
      for (const p of pref) { const b = page.locator('#itipbox button', { hasText: p }); if (await b.count()) { await b.first().click(); clicked = true; break; } }
      if (!clicked) await page.locator('#itipbox button').last().click();
      await page.waitForTimeout(400);
      if (s.on.includes('home') && log.questDone) return true;
      continue;
    } else if (s.on.includes('home') && !s.place) {
      return true;
    } else {
      // 결과 화면 등
      const bs = await visButtons(page);
      const cand = page.locator('.screen.on button:visible:not([disabled]), section.on button:visible:not([disabled])');
      if (key === last) stuck++; else stuck = 0; last = key;
      if (stuck > 6) { log.push('STUCK ' + key + ' ' + JSON.stringify(bs)); if (name) await shot(page, name + '-stuck'); return false; }
      const want = ['홈으로', '계속', '확인', '받기', '돌아가기', '나가기'];
      let done = false;
      for (const w of want) { const b = cand.filter({ hasText: w }); if (await b.count()) { await b.first().click(); done = true; log.push('tap ' + w + ' on ' + s.on); break; } }
      if (!done) await page.waitForTimeout(500);
    }
    await page.waitForTimeout(250);
  }
  log.push('TIMEOUT ' + JSON.stringify(await scr(page)));
  return false;
}
// 홈이 2초 동안 조용해질 때까지 컷신·대화·시트를 탭으로 넘긴다
export async function settle(page, log, name, quietMs = 2000) {
  const t0 = Date.now(); let quiet = 0;
  while (Date.now() - t0 < 60000) {
    const s = await scr(page);
    if (s.cine) { const r = await tapCine(page, { max: 200 }); log.push('cine(' + r.scenes.length + ',picks ' + r.picks.length + '): ' + r.scenes.join(' / ').slice(0, 220)); quiet = 0; continue; }
    if (s.tut) { const l = await tapTutor(page); log.push('talk: ' + l.filter((x, i) => i === l.length - 1 || !l[i + 1].startsWith(x)).join(' | ').slice(0, 300)); quiet = 0; continue; }
    if (s.tip) { const bt = await page.$$eval('#itipbox button', (bs) => bs.map((b) => b.textContent.trim()));
      log.push('sheet: ' + (await page.textContent('#itipbox')).replace(/\s+/g, ' ').slice(0, 160) + ' | btns ' + JSON.stringify(bt));
      if (name) await shot(page, name + '-sheet' + log.length);
      let c = false; for (const p of ['계속', '확인', '받기', '좋아요', '닫기']) { const b = page.locator('#itipbox button', { hasText: p }); if (await b.count()) { await b.first().click(); c = true; break; } }
      if (!c) await page.locator('#itipbox button').last().click().catch(() => page.keyboard.press('Escape'));
      quiet = 0; await page.waitForTimeout(400); continue; }
    quiet += 250; if (quiet >= quietMs) return s;
    await page.waitForTimeout(250);
  }
  return null;
}
