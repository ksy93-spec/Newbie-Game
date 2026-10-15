// 탭 화면, 퀘스트 화면, 결과 화면, 팝업, 토스트, 튜토리얼 말풍선을 네 크기에서 잰다.
const L = await import('./ui-lib.mjs');
const browser = await L.chromium.launch();
const ONLY = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const FILTER = process.argv[3] || '';
const IGN = ['#scene', '.mapfade', 'canvas.bg', '#wipe', '#wipe *'];
const ev = (page, code) => page.evaluate(code);
const STATES = [
  ['tab-quests', async (p) => { await ev(p, `render('quests')`); }],
  ['tab-char', async (p) => { await ev(p, `render('char')`); }],
  ['tab-shop', async (p) => { await ev(p, `render('shop')`); }],
  ['tab-wiki', async (p) => { await ev(p, `render('wiki')`); }],
  ['tab-codex', async (p) => { await ev(p, `render('codex')`); }],
  ['quest-intro', async (p) => { await ev(p, `startQuest(QUESTS[0])`); await p.waitForTimeout(1800); }],
  ['quest-q', async (p) => { await ev(p, `startQuest(QUESTS[0])`); await p.waitForTimeout(1500); await ev(p, `(()=>{ var b=document.getElementById('qnext'); if(b&&!b.hidden) b.click(); })()`); await p.waitForTimeout(2500); }],
  ['quest-explain', async (p) => { await ev(p, `startQuest(QUESTS[0])`); await p.waitForTimeout(1500); await ev(p, `(()=>{ var b=document.getElementById('qnext'); if(b&&!b.hidden) b.click(); })()`); await p.waitForTimeout(2500);
     await ev(p, `(()=>{ var c=document.querySelector('#qchoices .choice'); if(c) c.click(); })()`); await p.waitForTimeout(900); }],
  ['result', async (p) => { await ev(p, `startQuest(QUESTS[0])`); await p.waitForTimeout(1500); await ev(p, `(()=>{ RUN.correct=RUN.q.qs.length; RUN.marks=RUN.q.qs.map(function(){return 1;}); finish(false); })()`); await p.waitForTimeout(1200); }],
  ['result-fail', async (p) => { await ev(p, `startQuest(QUESTS[0])`); await p.waitForTimeout(1500); await ev(p, `(()=>{ RUN.correct=0; RUN.marks=RUN.q.qs.map(function(){return 0;}); finish(true); })()`); await p.waitForTimeout(1200); }],
  ['tip-today', async (p) => { await ev(p, `todaySheet()`); }],
  ['tip-house5', async (p) => { await ev(p, `houseTip(5)`); }],
  ['tip-house6', async (p) => { await ev(p, `S.peak=6; houseTip(6)`); }],
  ['tip-house9', async (p) => { await ev(p, `S.peak=9; houseTip(9)`); }],
  ['tip-long', async (p) => { await ev(p, `openTip('<div class="ih"><div><span class="inm">아주 긴 제목이 들어간 창 제목입니다 열두글자 넘음</span><span class="isub">부제도 길게 길게 길게 길게 길게 길게 길게</span></div></div><hr>'+Array(14).fill('<div class="il">긴 줄 하나입니다 긴 줄 하나입니다 긴 줄 하나입니다 긴 줄 하나입니다</div>').join(''),'#FFC53C',[{t:'확인',f:function(){closeTip();}},{t:'두 번째 단추 이름이 긴 편',f:function(){}}])`); }],
  ['toast-home', async (p) => { await ev(p, `toast('코인을 많이 얻었어요 ￦1,200 · 청결이 줄었어요 · 다음 퀘스트가 열렸어요')`); await p.waitForTimeout(300); }],
  ['toast-tip', async (p) => { await ev(p, `houseTip(5); toast('토스트가 팝업 위에 떠요 · 긴 문장 긴 문장 긴 문장')`); await p.waitForTimeout(300); }],
  ['toast-quest', async (p) => { await ev(p, `startQuest(QUESTS[0])`); await p.waitForTimeout(1200); await ev(p, `toast('퀘스트 화면 위 토스트 · 긴 문장 긴 문장 긴 문장 긴 문장')`); await p.waitForTimeout(300); }],
  ['tutor-home', async (p) => { await ev(p, `S.tuts=[]; TUT_COOL=0; checkTutor()`); await p.waitForTimeout(2500); }],
  ['tutor-choice', async (p) => { await ev(p, `talkTo({name:'부동산 사장',face:'gpa',lines:[{q:'계약서에 꼭 확인해야 하는 것은 무엇일까요? 질문이 길어서 두세 줄로 넘어갈 수 있습니다.',a:['등기부등본의 근저당과 소유자 확인','집주인이 말한 시세 그대로 믿기','공인중개사 말만 듣고 바로 계약하기'],ok:0,right:function(){return ['맞아.'];},wrong:function(){return ['아니야.'];}}]})`); await p.waitForTimeout(3500); }],
  ['travel', async (p) => { await ev(p, `document.getElementById('hmini').click()`); await p.waitForTimeout(500); }],
  ['menu', async (p) => { await ev(p, `document.getElementById('hmenu').click()`); await p.waitForTimeout(600); }],
];
for (const [w, h] of L.SIZES) {
  if (ONLY && !ONLY.includes(w)) continue;
  for (const [name, fn] of STATES) {
    if (FILTER && !name.includes(FILTER)) continue;
    const { ctx, page, logs } = await L.openPage(browser, w, h, '#nointro');
    await L.homeSetup(page, 'S.done=[QUESTS[0].id]; S.todayQ=[QUESTS[1].id,QUESTS[2].id]; S.peak=S.paid=S.lastTier=S.tier=7; S.lv=9; S.coin=3000;', !name.startsWith('tutor'));
    try { await fn(page); } catch (e) { console.log(name, 'ERR', String(e).slice(0, 200)); }
    await page.waitForTimeout(500);
    await L.shot(page, `s7-${name}-${w}`);
    const root = /^(tip|toast-tip)/.test(name) ? '#itip' : '#app';
    const res = await L.audit(page, { root, ignore: IGN });
    console.log(L.fmt(`${name} ${w}x${h}`, res) + (logs.length ? '\n  로그 ' + logs.join(' | ') : ''));
    await ctx.close();
  }
}
await browser.close();
