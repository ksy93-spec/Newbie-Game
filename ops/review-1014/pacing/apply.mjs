// 리뷰 1014 페이싱 제안을 게임 파일에 넣는다.
// 실행(저장소 루트): node ops/review-1014/pacing/apply.mjs [출력 경로]
//   출력 경로 기본값은 prototype/newbie-quest-demo.html. 리드는 복사본에 먼저 돌려 본다.
//   원본은 언제나 prototype/newbie-quest-demo.html에서 읽는다(IN=... 으로 바꿀 수 있다).
// 찾을 글자가 정확히 한 번 나오지 않으면 멈추고 아무것도 쓰지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const IN = process.env.IN || 'prototype/newbie-quest-demo.html';
const OUT = process.argv[2] || 'prototype/newbie-quest-demo.html';
let src = fs.readFileSync(IN, 'utf8');
const plan = fs.readFileSync(path.join(here, 'plan.js'), 'utf8');
const block = plan.slice(plan.indexOf('/* [PLAN] 시작 */'), plan.indexOf('/* [PLAN] 끝 */') + '/* [PLAN] 끝 */'.length);
if (!block.startsWith('/* [PLAN] 시작 */')) { console.error('plan.js에서 [PLAN] 블록을 못 찾음'); process.exit(1); }

const R = [
  // 1. 데이터와 새 함수: LIFE_AGES 바로 뒤
  ['LIFE_AGES 뒤에 계획 블록',
    "var LIFE_AGES={job:24,lease:26,card:27,car:29,wedding:32,home:37,end:60};\n",
    "var LIFE_AGES={job:24,lease:26,card:27,car:29,wedding:32,home:37,end:60};\n" + block + "\n"],
  // 2. 나이: 퀘스트 셋에 한 살 → 해마다 정한 활동 수, 상한은 다음 메인 장·중간 장의 한 해 전
  ['lifeAgeCalc',
    "  var L=S.life,a=L.anch,nx=(typeof mqNext==='function')?mqNext():null,cap=nx?lifeChAge(nx.id)-1:59;\n  return Math.max(a.age,Math.min(cap,a.age+Math.floor((S.done.length-a.done)/3))); }",
    "  var a=S.life.anch; return Math.max(a.age,Math.min(lifeCapAge(),lifeAgeRaw())); }"],
  // 3. 장을 시작할 때 기준점을 활동 수로
  ['lifeBeforeCh 기준점',
    "if(age&&S.life.anch.age<age){ S.life.anch={age:age,done:S.done.length}; }",
    "if(age&&S.life.anch.age<age){ S.life.anch={age:age,done:lifeActs()}; }"],
  // 4. 메인 장은 그 나이가 될 차례여야 열린다(인생 모드만)
  ['MQ_LIST 나이 조건',
    "MQ_LIST.forEach(function(c){ if(MQ_COPY[c.id]) c.sub=MQ_COPY[c.id].sub; });",
    "MQ_LIST.forEach(function(c){ if(MQ_COPY[c.id]) c.sub=MQ_COPY[c.id].sub; });\n" +
    "/* 인생 모드: 장의 나이가 될 차례(앞 해 몫을 다 채움)여야 열린다. 리뷰 1014 pacing */\n" +
    "MQ_LIST.forEach(function(c){ var o=c.open,w=c.wait; c.open=function(){ return (o()||lifeLate(c.id))&&lifeAgeOk(c.id); };\n" +
    "  c.wait=function(){ return (w&&w())||(lifeOn()&&!lifeAgeOk(c.id)?lifeAgeWait(c.id):null); }; });"],
  // 5. 6장을 깨도 바로 예순이 아니다
  ['mqAfter 6장 뒤',
    "if(c.id==='home') setTimeout(function(){ if(lifeOn()) lifeEnd(); else",
    "if(c.id==='home') setTimeout(function(){ if(lifeOn()) lifeStageCheck(); else"],
  ['lifeCatchUp 조건',
    "var end=!S.life.over&&mqDone('home'),card=",
    "var end=lifeEndReady(),card="],
  ['lifeCatchUp 결산',
    "if(!S.life.over&&mqDone('home')) return lifeEnd();",
    "if(lifeEndReady()) return lifeStagePlay(lifeStageNext());"],
  // 6. 홈에 올 때마다 중간 장 확인
  ['renderHome 훅',
    "todayBtn(); todayAuto(); upNoteShow(); lifeCatchUp(); };",
    "todayBtn(); todayAuto(); upNoteShow(); lifeCatchUp(); lifeStageCheck(); };"],
  // 7. 퀘스트 나이 조건: 인생 모드는 실제 나이, ageMin 새로 읽기
  ['fits 나이',
    "  if(f.ageMax!=null&&S.age>f.ageMax) return false;",
    "  var ag=lifeOn()&&S.life?S.life.age:S.age;\n  if(f.ageMax!=null&&ag>f.ageMax) return false;\n  if(f.ageMin!=null&&ag<f.ageMin) return false;"],
  // 8. 생활 이벤트: 인생 모드는 한 해에 하나(할 퀘스트가 없으면 더), 달은 나이로 돈다
  ['lifeEvMonth',
    "function lifeEvMonth(){ return +dayKey().slice(5,7); }",
    "function lifeEvMonth(){ return lifeOn()&&S.life?1+((S.life.age*5+(S.life.evn||0))%12):+dayKey().slice(5,7); }"],
  ['maybeLifeEvent 빈도',
    "  if(!force&&((S.evN||0)>=2||Math.random()>0.3)) return;",
    "  var lyr=lifeOn()&&S.life&&!S.life.over&&(S.life.evAge!==S.life.age||lifeNoQuests());\n  if(!force&&!lyr&&(lifeOn()||(S.evN||0)>=2||Math.random()>0.3)) return;"],
  ['maybeLifeEvent 세기',
    "S.evN=(S.evN||0)+1; S.evSeen.push(e.id); save();",
    "S.evN=(S.evN||0)+1; S.evSeen.push(e.id); if(lifeOn()&&S.life){ S.life.evAge=S.life.age; S.life.evn=(S.life.evn||0)+1; } save();"],
  ['maybeLifeEvent 고른 뒤 나이',
    "      var c=e.choices[k],d=c.d||{},res=[];",
    "      var c=e.choices[k],d=c.d||{},res=[]; if(lifeOn()) lifeTick();"],
  // 9. 인생 모드 레벨 조건 한 단계 낮춤(mqLv)
  ['3장 레벨', "mqDone('lease')&&mqDay('lease')&&S.lv>=6&&mapOpen('bank')", "mqDone('lease')&&mqDay('lease')&&S.lv>=mqLv(6)&&mapOpen('bank')"],
  ['3장 대기 글', "S.lv<6?'Lv.6이 되면'", "S.lv<mqLv(6)?'Lv.'+mqLv(6)+'이 되면'"],
  ['4장 레벨', "mqDone('card')&&mqDay('card')&&S.lv>=8;", "mqDone('card')&&mqDay('card')&&S.lv>=mqLv(8);"],
  ['4장 대기 글', "S.lv<8?'Lv.8이 되면'", "S.lv<mqLv(8)?'Lv.'+mqLv(8)+'이 되면'"],
  ['5장 레벨', "mqDone('car')&&mqDay('car')&&S.lv>=10;", "mqDone('car')&&mqDay('car')&&S.lv>=mqLv(10);"],
  ['5장 대기 글', "S.lv<10?'Lv.10이 되면'", "S.lv<mqLv(10)?'Lv.'+mqLv(10)+'이 되면'"],
];
const bad = [];
for (const [name, a] of R) { const n = src.split(a).length - 1; if (n !== 1) bad.push(`${name}: ${n}번`); }
if (bad.length) { console.error('찾을 글자가 정확히 한 번이 아님. 아무것도 쓰지 않음.\n' + bad.join('\n')); process.exit(1); }
for (const [, a, b] of R) src = src.replace(a, () => b);
fs.writeFileSync(OUT, src);
console.log(`바꿈 ${R.length}곳 → ${OUT}`);
