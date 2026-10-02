// assets/art/의 그림을 게임 HTML의 ART_DATA_BEGIN/END 사이에 base64로 붙여 넣는다.
// 실행: node tools/art/embed.mjs  (먼저 python3 tools/art/slice.py로 잘라 둔다)
// 게임은 ART를 CAST에 합쳐서 castCv('이름')으로 꺼내 쓴다. npc_는 대화창 그림을 덮어쓴다.
// 한 줄 형식: 이름:[게임 안 너비, 높이, 'webp base64']. 저장 해상도는 그림 자체 크기다(게임 안 크기의 최대 4배).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'assets/art');
const html = path.join(root, 'prototype/newbie-quest-demo.html');
/* 게임에서 쓰는 묶음만 넣는다. 엽서(pc_)와 외벽 질감(tx_)은 쓰는 곳이 생기면 더한다. */
const USE = ['npc_', 'it_', 'fu_', 'ho_', 'bg_', 'ui_', 'gt_', 'gb_', 'hb_'];

const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
const rows = Object.keys(index).filter((k) => USE.some((p) => k.startsWith(p))).sort().map((k) => {
  const [w, h] = index[k], extra = index[k].slice(4);       /* 옷·뒷모습은 어깨 y, 발 y, 가운데 x를 더 싣는다 */
  const b64 = fs.readFileSync(path.join(dir, k + '.webp')).toString('base64');
  return ' ' + JSON.stringify(k) + ':[' + w + ',' + h + ",'" + b64 + "'" + extra.map((v) => ',' + v).join('') + ']';
});
const block = '/* ART_DATA_BEGIN */\nvar ART={\n' + rows.join(',\n') + '\n};\n/* ART_DATA_END */';
const src = fs.readFileSync(html, 'utf8');
const re = /\/\* ART_DATA_BEGIN \*\/[\s\S]*?\/\* ART_DATA_END \*\//;
if (!re.test(src)) { console.error('표시(ART_DATA_BEGIN/END)를 찾지 못했다'); process.exit(1); }
fs.writeFileSync(html, src.replace(re, () => block));
console.log('붙여 넣음 ' + rows.length + '개, ' + Math.round(block.length / 1024) + 'KB');
