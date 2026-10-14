// 리뷰 1014 퀘스트 넣기. 찾을 글자가 정확히 한 번씩 있어야 하고, 하나라도 못 찾으면 아무것도 쓰지 않는다.
// 사용: node ops/review-1014/quests/apply.mjs [게임파일=prototype/newbie-quest-demo.html]
// 리드가 복사본에 먼저 돌려 본다: cp prototype/newbie-quest-demo.html /tmp/x.html && node ops/review-1014/quests/apply.mjs /tmp/x.html
import fs from 'node:fs';

const OUT = process.argv[2] || 'prototype/newbie-quest-demo.html';
const DATA = new URL('./quests.js', import.meta.url);
let html = fs.readFileSync(OUT, 'utf8');
const src = fs.readFileSync(DATA, 'utf8');
const iM = src.indexOf('/* @@MAIN */'), iP = src.indexOf('/* @@QPLACE */');
if (iM < 0 || iP < 0) { console.error('quests.js 표시(@@MAIN/@@QPLACE)를 못 찾음'); process.exit(1); }
const mainPart = src.slice(iM, iP).trimEnd() + '\n';
const placePart = src.slice(iP).trimEnd() + '\n';
if (html.includes("Q('pay1',")) { console.error('이미 들어가 있음(pay1). 멈춤.'); process.exit(1); }

const edits = [
  { name: '퀘스트 묶음', find: "QUESTS.forEach(function(q){ if(SRC_BY_ID[q.id]) q.src=SRC_BY_ID[q.id]; });",
    to: f => mainPart + f },
  { name: 'QPLACE 창구', find: " sub1:'m_table',labor1:'l_labor',labor2:'l_labor',labor3:'l_labor',wage1:'c_alba',ins1:'o_senior',trip5:'g_info'};\n",
    to: f => f + placePart },
  { name: 'qAge 함수', find: 'function fits(q){ var f=q.fit||{};',
    to: f => '/* 퀘스트 나이 조건(ageMin)은 인생 모드면 진짜 나이, 아니면 온보딩 나이 구간(24/29/34/40)으로 본다 */\n' +
      "function qAge(){ return (typeof lifeOn==='function'&&lifeOn()&&S.life&&S.life.age!=null)?S.life.age:S.age; }\n" + f },
  { name: 'fits ageMin', find: '  if(f.ageMax!=null&&S.age>f.ageMax) return false;\n',
    to: f => f + '  if(f.ageMin!=null&&(qAge()==null||qAge()<f.ageMin)) return false;\n' },
  { name: 'score 나이 퀘스트 우선', find: 'function score(q){ var n=0;\n',
    to: f => f + '  if((q.fit||{}).ageMin!=null) n+=8;   /* 그 나이가 돼야 열리는 퀘스트는 열리면 앞으로 */\n' },
];
for (const e of edits) {
  const n = html.split(e.find).length - 1;
  if (n !== 1) { console.error(`"${e.name}" 찾을 글자가 ${n}번 나옴(1번이어야 함). 아무것도 쓰지 않음.`); process.exit(1); }
}
for (const e of edits) html = html.replace(e.find, () => e.to(e.find));
fs.writeFileSync(OUT, html);
console.log(`넣음: ${edits.map(e => e.name).join(', ')} → ${OUT}`);
