// ops/meeting-1001/ 의 메인 퀘스트 배경(mq-scenes.js)과 장 대본(ch-*.js)을 게임 HTML의 표시 사이에 붙여 넣는다.
// 대본을 고친 뒤 다시 돌리면 표시 사이만 새로 바뀐다.  사용: node tools/mq-import.mjs
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'ops/meeting-1001');
const html = path.join(root, 'prototype/newbie-quest-demo.html');
const files = ['mq-scenes.js', 'ch-job.js', 'ch-lease.js', 'ch-card.js', 'ch-car.js', 'ch-wedding.js', 'ch-home.js'];
const A = '/* ── MQ_DATA_BEGIN: tools/mq-import.mjs 가 ops/meeting-1001/ 에서 붙여 넣는다. 여기를 직접 고치지 말 것 ── */';
const B = '/* ── MQ_DATA_END ── */';
let body = '';
for (const f of files) {
  const p = path.join(src, f);
  if (!fs.existsSync(p)) { console.log('없음:', f); continue; }
  const code = fs.readFileSync(p, 'utf8').replace(/<\/script/gi, '<\\/script');
  new Function(code);                                     // 문법 확인
  body += '\n/* ' + f + ' */\n' + code.trim() + '\n';
}
let s = fs.readFileSync(html, 'utf8');
const block = A + body + B;
if (s.includes(A)) s = s.slice(0, s.indexOf(A)) + block + s.slice(s.indexOf(B) + B.length);
else {
  const at = s.indexOf('/* ══════════ 메인 퀘스트 컷신 플레이어 ══════════');
  if (at < 0) throw new Error('엔진 위치를 못 찾음');
  s = s.slice(0, at) + block + '\n' + s.slice(at);
}
fs.writeFileSync(html, s);
console.log('붙여 넣음', Math.round(body.length / 1024) + 'KB');
