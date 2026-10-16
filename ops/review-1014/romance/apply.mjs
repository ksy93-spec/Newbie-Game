// 인연 트랙(romance.js)을 게임 파일에 붙이고 엔진·연결 고리를 바꾼다.
// 저장소 루트에서: node ops/review-1014/romance/apply.mjs [입력 html] [출력 html]
//   입력 기본값 prototype/newbie-quest-demo.html, 출력 기본값은 입력과 같은 파일.
// 찾을 글자가 하나라도 없거나 두 번 이상 나오면 아무것도 쓰지 않고 멈춘다. 이미 붙인 파일이면 멈춘다.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const IN = process.argv[2] || 'prototype/newbie-quest-demo.html';
const OUT = process.argv[3] || IN;
let html = fs.readFileSync(IN, 'utf8');
const src = fs.readFileSync(path.join(here, 'romance.js'), 'utf8');

if (html.includes('var LOVE_CAST =')) { console.error('이미 적용된 파일이다 (LOVE_CAST가 있다). 쓰지 않는다.'); process.exit(1); }
if (/<\/script/i.test(src)) { console.error('romance.js 안에 </script 가 있다. 쓰지 않는다.'); process.exit(1); }

const EDITS = [
  { id: 'R1 romance.js 붙이기 (하루 루프 앞)',
    find: '/* ══════════ 하루 루프 ══════════ */',
    repl: src.trim() + '\n\n/* ══════════ 하루 루프 ══════════ */' },

  { id: 'R2 playMQ: 인생 모드 컷신의 배우자 자리를 지금 상태로',
    find: 'function playMQ(o){\n  if(MQP) return;',
    repl: "function playMQ(o){\n  if(MQP) return;\n  if(typeof loveDress==='function') o=loveDress(o)||o;   /* romance 1014 */" },

  { id: 'R3 playMQ pick: ok가 null이면 맞고 틀림 없는 선택(등급에 안 셈, 해설이 없으면 바로 넘김)',
    find: "    st.picked=j; st.n++; if(op.ok) st.ok++;\n    sfx(op.ok?'good':'bad');\n    if(o.onPick) try{ o.onPick(p,op,j); }catch(e){}\n    var note={type:'note',ok:!!op.ok,who:op.ok?'좋은 판단':'대가가 남는다',text:[op.note||''],bg:p.bg,cast:p.cast};\n    list.splice(st.i+1,0,note);",
    repl: "    var neu=op.ok===null; st.picked=j; if(!neu){ st.n++; if(op.ok) st.ok++; }   /* romance 1014: 마음의 선택은 등급에 안 센다 */\n    sfx(neu?'tap':op.ok?'good':'bad');\n    if(o.onPick) try{ o.onPick(p,op,j); }catch(e){}\n    var note={type:'note',ok:!!op.ok,neu:neu,who:neu?(op.who||'마음에 남은 것'):op.ok?'좋은 판단':'대가가 남는다',text:[op.note||''],bg:p.bg,cast:p.cast};\n    if(!neu||op.note) list.splice(st.i+1,0,note);" },

  { id: 'R4 playMQ drawBox: 마음의 선택 해설은 보라 테두리',
    find: "    var edge=p.type==='note'?(p.ok?'#62C85C':'#F4705A'):'#57517A';",
    repl: "    var edge=p.type==='note'?(p.neu?'#D9B8FF':p.ok?'#62C85C':'#F4705A'):'#57517A';" },
  { id: 'R5 playMQ drawBox: 마음의 선택 이름표 색',
    find: "p.type==='note'?(p.ok?'#9BE38F':'#FF9A86'):'#FFE79B'",
    repl: "p.type==='note'?(p.neu?'#E6D4FF':p.ok?'#9BE38F':'#FF9A86'):'#FFE79B'" },

  { id: 'R6 lifeStageCheck: 홈에 올 때 상태 맞추기',
    find: 'if(!lifeOn()||!S.life||!S.onboarded||S.life.over||lifeStageCheck.t) return;',
    repl: "if(typeof loveSync==='function') loveSync();   /* romance 1014: 5장 나이·제목, 일반 모드면 되돌림 */\n  if(!lifeOn()||!S.life||!S.onboarded||S.life.over||lifeStageCheck.t) return;" },
  { id: 'R7 lifeStageCheck: 중간 장이 없으면 인연 사건',
    find: '  if(!lifeStageReady(lifeStageNext())) return;',
    repl: "  if(!lifeStageReady(lifeStageNext())){ if(typeof loveCheck==='function') loveCheck(); return; }   /* romance 1014 */" },

  { id: 'R8 mqData: 약혼하지 않았으면 5장은 나 하나의 설계',
    find: 'function mqData(c){ return c.key?window[c.key]:null; }',
    repl: "function mqData(c){ var lv=(c.id==='wedding'&&typeof loveWedData==='function')?loveWedData():null; return lv||(c.key?window[c.key]:null); }   /* romance 1014 */" },

  { id: 'R9 lifeMidFlags: 배우자·아이 갈래를 인연 상태로',
    find: "  return { solo: m === 'solo', own: own, tight: p.income === '빠듯', p_hs: p.path === '고졸', p_jc: p.path === '전문대' };",
    repl: "  var lv = (typeof loveMidFlags === 'function') ? loveMidFlags() : null;   /* romance 1014 */\n  return { solo: lv ? lv.solo : m === 'solo', kid: lv ? lv.kid : m !== 'solo', couple: lv ? lv.couple : false, own: own, tight: p.income === '빠듯', p_hs: p.path === '고졸', p_jc: p.path === '전문대' };" },

  { id: 'R10 lifeEnd: 예순 생일 장면(배우자·아이·친구)과 서랍 속 종이 나이',
    find: 'concat(lifeFill(LIFE_END.part1,f))',
    repl: "concat(typeof loveEndPart1==='function'?loveEndPart1(f,tid):lifeEndScenes('part1',f,tid))" },

  { id: 'R11 lifeTitleId: 결혼은 인연 상태로 본다',
    find: "wed=typeof mqDone==='function'&&mqDone('wedding');",
    repl: "wed=(typeof loveOn==='function'&&loveOn())?loveHasSpouse():(typeof mqDone==='function'&&mqDone('wedding'));" },
  { id: 'R12 lifeTitleId: 비혼 + 자가 칭호',
    find: "if(wed&&own&&S.mq&&S.mq.done&&S.mq.done.wedding==='good') return 'family';",
    repl: "if(wed&&own&&S.mq&&S.mq.done&&S.mq.done.wedding==='good') return 'family'; if(own&&typeof loveOn==='function'&&loveOn()&&loveS().stage==='solo') return 'solo';" },

  { id: 'R13 lifeSummary: 함께 한 줄',
    find: '    mins:Math.max(1,Math.round((S.life.ms||0)/60000))}; }',
    repl: "    mins:Math.max(1,Math.round((S.life.ms||0)/60000)),with:(typeof loveWith==='function'?loveWith():'')}; }" },
  { id: 'R14 lifeCardHtml: 함께 한 줄 보이기',
    find: '\'<div class="lcf">인생 번호 \'',
    repl: '(sm.with?\'<div class="lcs">\'+esc(sm.with)+\'</div>\':\'\')+\'<div class="lcf">인생 번호 \'' }
];

const bad = [];
for (const e of EDITS) {
  const n = html.split(e.find).length - 1;
  if (n !== 1) bad.push(`${e.id}: 찾을 글자 ${n}번`);
}
if (bad.length) { console.error('멈춤. 아무것도 쓰지 않았다.\n' + bad.join('\n')); process.exit(1); }
for (const e of EDITS) html = html.replace(e.find, () => e.repl);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`적용 ${EDITS.length}건 → ${OUT}`);
EDITS.forEach((e) => console.log(' - ' + e.id));
