// 리뷰 1014 · 이야기 순서(story-logic) 안전 수정 적용 스크립트.
// 실행(저장소 루트): node ops/review-1014/story-logic/apply.mjs [입력 html] [출력 html]
//   입력 기본값 prototype/newbie-quest-demo.html, 출력 기본값은 입력과 같다(덮어씀).
// 찾을 글자가 하나라도 없거나 두 번 이상 나오면 아무것도 쓰지 않고 멈춘다. 이미 적용한 파일에도 멈춘다.
// 설명: ops/review-1014/story-logic.md 4절 "바로 고칠 것".
import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve(process.argv[2] || 'prototype/newbie-quest-demo.html');
const dst = path.resolve(process.argv[3] || src);
const MARK = '/* story-logic 1014 */';

const P = [
// ── 1. 거처 문 닫기: 취업 전에는 원룸 월세까지, 결혼 전에는 원룸 전세까지 ──
{ id: 'S1 tierCap', old:
`function tierCap(){ return mqOk('home')?TIERS.length-1:Math.max(8,S.peak>=9?S.peak:8); }`,
  new:
`function tierCap(){ var c=mqOk('home')?TIERS.length-1:Math.max(8,S.peak>=9?S.peak:8);
  ${MARK} /* 인생 모드: 취업 전에는 원룸 월세까지, 결혼 준비 전에는 원룸 전세까지만 연다.
     학생이 전세 계약을 하거나, 2장 직후 투룸 전세로 6장 조건을 미리 채우는 일을 막는다. 이미 연 칸은 그대로 */
  if(lifeOn()&&S.life&&!S.life.over){ if(!mqDone('job')) c=Math.min(c,Math.max(6,S.peak)); else if(!mqDone('wedding')) c=Math.min(c,Math.max(7,S.peak)); }
  return c; }
function tierHoldText(){ if(lifeOn()&&S.life&&S.peak<8) return !mqDone('job')?'전세는 취업하고 나서 열림':'투룸 전세는 결혼 준비(5장) 뒤에'; return '자가는 메인 6장 뒤에 열림'; }` },
{ id: 'S1b hold text', old:
`:hold?'<span class="micro">자가는 메인 6장 뒤에 열림</span>'`,
  new:
`:hold?'<span class="micro">'+tierHoldText()+'</span>'` },

// ── 2. 기숙사는 학생 때까지 + 3장 뒤 할배 회상을 인생 시간에 ──
{ id: 'S2 dorm out', old:
`  if(S.status!=='직장인'&&typeof mqDone==='function'&&mqDone('job')){ S.status='직장인'; S.company=S.company||'중소기업'; }`,
  new:
`  if(S.status!=='직장인'&&typeof mqDone==='function'&&mqDone('job')){ S.status='직장인'; S.company=S.company||'중소기업'; }
  ${MARK} /* 기숙사는 학생 때까지. 졸업(전문대 22, 4년제 24)하면 다음 칸으로 나간다. 원룸 월세가 열려 있으면 첫 월세 계약이 이어진다 */
  if(lifeNest()&&p.living==='기숙사'&&S.status!=='대학생'&&!S.rent){ S.peak=Math.max(S.peak,4); var dto=Math.min(S.peak,6),dm=tierMove(dto);
    if(!dm.ok&&!dm.rent&&dto>4) dm=tierMove(4);
    if(!dm.ok&&!dm.rent){ S.tier=4; S.paid=Math.max(S.paid||0,4); dm={ok:1}; }
    if(dm.ok) setTimeout(function(){ if(!MQP) toast('기숙사를 나왔어요 · '+TIERS[S.tier].name); hudRefresh(); },2200); }
  /* 할배 고향 회상(memory)은 일반 모드에서 "3장 다음 날"에 줄을 선다. 인생 모드는 하루에 수십 년이 가므로 3장 뒤 바로 */
  if(typeof mqDone==='function'&&mqDone('card')&&p.band==='그 외'&&typeof csWant==='function') csWant('memory');` },

// ── 3. 이야기 줄: 인생 모드는 하루 두 편 제한 없이 그 자리에서, 지난 거처의 "첫날"은 버린다 ──
{ id: 'S3 csTick', old:
`  if(C.n>=2||(S.first===dayKey()&&C.n>=1)) return false;
  var e=C.q.shift(); return csPlay(e.id,e.arg,false); }`,
  new:
`  if(!lifeOn()&&(C.n>=2||(S.first===dayKey()&&C.n>=1))) return false;   ${MARK} /* 인생 모드는 하루 몫 대신 그 자리에서 */
  var e=C.q.shift();
  if(lifeOn()&&e.id==='home6'&&S.tier!==RENT_TIER){ save(); return csTick(); }   /* 원룸 월세를 이미 떠났으면 "첫날" 이야기는 버린다 */
  return csPlay(e.id,e.arg,false); }` },

// ── 4. 월급이 없는 사람의 첫 월세(대학생·취준생) ──
{ id: 'S4 rent student', old:
`function rentPlay(){`,
  new:
`${MARK} /* 아직 월급이 없는 사람(대학생·취준생)의 첫 월세: 마지막 "첫 연말정산" 장면을 기록 모아 두기로 바꾼다 */
function rentScenesFit(){ var sc=rentScenes(); if(S.status==='직장인') return sc;
  sc[sc.length-1]={bg:'phone',cast:[['hero','C']],who:'나',text:['월세 이체 내역,','이거 모아 둘 필요가','있을까?'],
    choice:{opts:[{a:'계약서와 월세 이체 내역을 한 폴더에 모아 둔다',ok:1,note:'월세 세액공제는 일해서 번 소득(근로소득)이 있어야 받는다. 취업한 뒤 연말정산 때 계약서와 이체 내역이 그대로 쓰인다. 요건은 국세청 안내로 확인한다.'},
      {a:'아직 월급이 없으니 버린다',ok:0,note:'계약서는 보증금을 돌려받을 때, 나갈 때 원상복구를 다툴 때 근거다. 이체 내역은 취업한 뒤 월세 세액공제에도 쓴다.'}]}};
  return sc; }
function rentPlay(){` },
{ id: 'S4b rent call', old: `scenes:rentScenes(),`, new: `scenes:rentScenesFit(),` },
{ id: 'S4c home6 student', old:
`  if(id==='boss1'){ var bf=BOSS_FIRST[arg]`,
  new:
`  if(id==='home6'&&lifeOn()&&S.status!=='직장인') sc=sc.map(function(p,i){ return i===3?Object.assign({},p,{text:['월세는 매달 나가는','돈이야. 용돈이나 알바비','들어오는 날 빠지게 해 두게.']}):i===4?Object.assign({},p,{text:['월세 낸 기록은','버리지 말게. 일을 시작하면','연말정산 때 쓰네.']}):p; });   ${MARK}
  if(id==='boss1'){ var bf=BOSS_FIRST[arg]` },

// ── 5. 고졸의 스물둘·스물넷: 신분(취준생)과 글을 맞춘다. 1장 "첫 취업"은 첫 정규직 ──
{ id: 'S5a y22 hs', old: `'첫 일자리에서', '두 번째 겨울.'`, new: `'알바만 하며', '두 번째 겨울.'` },
{ id: 'S5b y22 hs', old: `['계속 다닐까,', '옮겨 볼까?']`, new: `['알바 말고', '진짜 일자리를 찾을까?']` },
{ id: 'S5c y22 hs', old: `['월급날 통장을', '한참 봤다.']`, new: `['알바비 들어온', '통장을 한참 봤다.']` },
{ id: 'S5d y24 hs', old: `sc[1].text=['일한 지 몇 해.','이력서 한 줄이','조금 늘었다.'];`,
  new: `sc[1].text=['알바와 계약직으로','몇 해. 이번엔','정규직이 목표다.'];` },

// ── 6. 스물여섯 세월: 월세 계약이 없는 고시원·반지하도 본가·기숙사처럼 ──
{ id: 'S6 y26', old: `  if(id==='lease'&&lifeNest()) sc[0].text=`, new: `  if(id==='lease'&&(lifeNest()||S.tier<6)) sc[0].text=` },

// ── 7. 장을 시작한 나이를 적어 두고, 예순의 서랍 속 종이에 그 나이를 쓴다 ──
{ id: 'S7a yrs age', old:
`  lifeTick(); save();
  var y=LIFE_YEARS[LIFE_YKEY[id]]; if(!y) return false;`,
  new:
`  lifeTick(); S.life.yrs[id]=S.life.age||1; save();   ${MARK} /* 장을 시작한 나이(결산 서랍 속 종이) */
  var y=LIFE_YEARS[LIFE_YKEY[id]]; if(!y) return false;` },
{ id: 'S7b drawer rows', old:
`rows: [['스물넷', '근로계약서'], ['스물여섯', '전세 계약서'], ['서른둘', '혼인신고서'], ['서른일곱', '등기권리증']]`,
  new:
`rows: [['{a_job}', '근로계약서'], ['{a_lease}', '전세 계약서'], ['{a_wedding}', '혼인신고서'], ['{a_home}', '등기권리증']]` },
{ id: 'S7c drawer fill', old:
`  return lifeFill(LIFE_END[part], { title:`,
  new:
`  var yr = (typeof S !== 'undefined' && S && S.life && S.life.yrs) || {}, ak = function (k, d) { return lifeMidAgeKo(yr[k] > 1 ? yr[k] : d); };   ${MARK}
  return lifeFill(LIFE_END[part], { a_job: ak('job', 24), a_lease: ak('lease', 26), a_wedding: ak('wedding', 32), a_home: ak('home', 37), title:` },

// ── 8. 6장 "첫 내 집 마련"을 깼으면 중간 사건은 자가 갈래(대출 갈아타기)로 ──
{ id: 'S8 own flag', old:
`  var own = !!(typeof TIERS !== 'undefined' && S && TIERS[S.tier] && TIERS[S.tier].own);`,
  new:
`  var own = !!(typeof TIERS !== 'undefined' && S && TIERS[S.tier] && TIERS[S.tier].own) || !!(typeof mqDone === 'function' && lifeOn() && mqDone('home'));   ${MARK}` },

// ── 9. 생활 이벤트가 인생 순서를 따르게 ──
{ id: 'S9a mvAge', old:
`  S.coin-=c; S.tier=i; S.paid=Math.max(S.paid||0,i);`,
  new:
`  S.coin-=c; S.tier=i; S.paid=Math.max(S.paid||0,i); if(lifeOn()&&S.life) S.life.mvAge=S.life.age;` },
{ id: 'S9b lifeEvOk', old:
`function lifeEvOk(e,m){ return (!e.when||e.when())&&(!e.months||e.months.indexOf(m)>=0); }`,
  new:
`function lifeEvOk(e,m){ return (!e.when||e.when())&&(!e.months||e.months.indexOf(m)>=0)&&lifeEvFit(e); }
${MARK} /* 인생 모드에서 사건이 나이·장 순서와 어긋나지 않게: 카드는 3장 뒤, 차 보험은 4장 뒤, 입사 서류·첫 명세서는 입사 무렵,
   회사 사건은 희망퇴직(55) 전, 청약통장 권유는 청년 나이·무주택, 이사 직후 사건은 그해 이사한 사람만 */
function lifeEvFit(e){ if(!lifeOn()||!S.life) return true; var a=S.life.age,id=e.id;
  if((id==='ev_revolving'||id==='ev_annualfee')&&!mqDone('card')) return false;
  if(id==='ev_carins'&&!mqDone('car')) return false;
  if(id==='ev_usedcar'&&a<27) return false;
  if((id==='ev_payslip'||id==='ev_newhire')&&!(a<=LIFE_AGES.job+1||(lifeStageDone('m34')&&a<=35))) return false;
  if(/^ev_(nopay|overtime|annualleave|newhire|payslip|yearend)$/.test(id)&&lifeStageDone('m55')) return false;
  if(id==='ev_subscription'&&(a>34||(TIERS[S.tier]&&TIERS[S.tier].own))) return false;
  if(id==='ev_movein'&&S.life.mvAge!==a) return false;
  return true; }` },
{ id: 'S9c yearend msg', old: `기한을 넘겨 월세 세액공제를 못 받았다.`, new: `기한을 넘겨 받을 수 있던 공제를 놓쳤다.` },
{ id: 'S9d yearend pick', old: `{t:'간소화 자료와 월세 영수증을 챙겨 낸다'`, new: `{t:'간소화 자료와 빠진 영수증을 챙겨 낸다'` },

// ── 10. 퀘스트 첫마디와 열림 순서 ──
{ id: 'S10a fit after', old:
`function fits(q){ var f=q.fit||{};`,
  new:
`${MARK} /* 인생 모드에서 그 장을 깬 뒤에만 여는 퀘스트("차 샀다며?") */
var LIFE_FIT_AFTER={cari1:'car',cari2:'car'};
function fits(q){ var f=q.fit||{};
  if(lifeOn()&&S.life&&LIFE_FIT_AFTER[q.id]&&!mqDone(LIFE_FIT_AFTER[q.id])) return false;` },
{ id: 'S10b care1', old: `'어머님 혼자 지내시기 힘들어지셨다고요? 장기요양부터 신청해 봐요.'`, new: `'부모님 혼자 지내시기 힘들어지셨다고요? 장기요양부터 신청해 봐요.'` },
{ id: 'S10c ju16', old: `'부모님 집을 물려받았는데 내 집도 있어요. 두 채가 된 건가요?'`, new: `'나중에 부모님 집을 물려받으면 내 집까지 두 채가 돼요. 미리 알아 둬요.'` },
];

let html = fs.readFileSync(src, 'utf8');
if (html.includes(MARK)) { console.error('이미 적용된 파일이다: ' + src); process.exit(1); }
const bad = [];
for (const p of P) {
  const n = html.split(p.old).length - 1;
  if (n !== 1) bad.push(`${p.id}: 찾을 글자 ${n}번 (1번이어야 함)`);
}
if (bad.length) { console.error('멈춤. 아무것도 쓰지 않았다.\n' + bad.join('\n')); process.exit(1); }
for (const p of P) {
  const i = html.indexOf(p.old);
  html = html.slice(0, i) + p.new + html.slice(i + p.old.length);
}
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, html);
console.log(`적용 ${P.length}건: ${src} → ${dst}`);
P.forEach((p) => console.log(' - ' + p.id));
