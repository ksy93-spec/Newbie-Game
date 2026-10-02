// assets/art/hero/의 주인공 겹(몸·윗옷·바지)을 게임 HTML의 HERO_DATA_BEGIN/END 사이에 넣는다.
// 실행: node tools/art/embed-heroes.mjs  (먼저 python3 tools/art/heroes.py)
// 이름·소개·시작 보너스·지도용 머리 모양은 아래 ROSTER에서 고친다.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'assets/art/hero');
const html = path.join(root, 'prototype/newbie-quest-demo.html');
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));

/* 머리색: b 바탕, h 밝은 곳(지도 위 작은 인물에 쓴다) */
const BLACK = { b: '#2B2733', h: '#4A4458' }, BROWN = { b: '#6B4A33', h: '#8E6A4E' }, ASH = { b: '#9E9EA8', h: '#CACAD2' }, DBROWN = { b: '#4A3628', h: '#6B5340' };
const ROSTER = {
  doyun:   { name: '김도윤', g: 'm', age: 24, one: '가계부 앱만 세 개 쓰는 알뜰파', bonus: 'geum', hs: 'short', hair: BLACK, glasses: 1 },
  haeun:   { name: '이하은', g: 'f', age: 23, one: '동네 맛집 지도가 머릿속에 있는 먹짱', bonus: 'sik', hs: 'bob', hair: BROWN },
  junhyuk: { name: '박준혁', g: 'm', age: 27, one: '면접 스무 번에도 웃는 체대 출신', bonus: 'jik', hs: 'short', hair: BLACK },
  seoyun:  { name: '최서윤', g: 'f', age: 26, one: '자격증 수집이 취미인 계획형', bonus: 'ui', hs: 'long', hair: BLACK },
  woojin:  { name: '정우진', g: 'm', age: 28, one: '계약서는 끝까지 읽는 신중파', bonus: 'ju', hs: 'wave', hair: BROWN, glasses: 1 },
  jimin:   { name: '한지민', g: 'f', age: 25, one: '방 꾸미기에 진심인 디자이너 지망생', bonus: 'ui', hs: 'short', hair: ASH },
  taeyang: { name: '오태양', g: 'm', age: 22, one: '부산에서 막 올라온 넉살 좋은 막내', bonus: 'sik', hs: 'short', hair: BLACK },
  narae:   { name: '윤나래', g: 'f', age: 29, one: '이직 준비하며 적금 붓는 현실파', bonus: 'geum', hs: 'wave', hair: DBROWN },
};
const uri = (f) => 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64');
const rows = Object.keys(ROSTER).map((id) => {
  const m = meta[id], r = ROSTER[id];
  const o = { name: r.name, hero: 1, faceRight: 1, w: m.w, h: m.h, k: m.k, hip: m.hip, split: m.split, eye: m.eye, fcx: m.fcx, hx: m.hx, hy: m.hy,
    hairBase: [40, 40, 50], topBase: m.topBase, botBase: m.botBase,
    info: { g: r.g, age: r.age, one: r.one, bonus: r.bonus, desc: { hs: r.hs, hair: r.hair, glasses: r.glasses || 0 } },
    L: { body: uri(id + '_body.webp'), top: uri(id + '_top.webp'), bot: uri(id + '_bot.webp'), hand: uri(id + '_empty.webp'), hair: uri(id + '_empty.webp') } };
  return ' h_' + id + ':' + JSON.stringify(o);
});
const block = '/* HERO_DATA_BEGIN */\nObject.assign(AVATARS,{\n' + rows.join(',\n') + '\n});\nAVATARS.stuM.hide=1; AVATARS.stuF.hide=1;\n/* HERO_DATA_END */';
const src = fs.readFileSync(html, 'utf8');
const re = /\/\* HERO_DATA_BEGIN \*\/[\s\S]*?\/\* HERO_DATA_END \*\//;
if (!re.test(src)) { console.error('표시(HERO_DATA_BEGIN/END)를 찾지 못했다'); process.exit(1); }
fs.writeFileSync(html, src.replace(re, () => block));
console.log('주인공 ' + rows.length + '명, ' + Math.round(block.length / 1024) + 'KB');
