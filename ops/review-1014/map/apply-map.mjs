// 맵 길막힘 고치기. 저장소 루트에서 실행한다.
//   node ops/review-1014/map/apply-map.mjs [입력 html] [출력 html]
//   입력 기본: prototype/newbie-quest-demo.html, 출력 기본: 입력과 같은 파일
// 맵 하나의 구역(시작 글자부터 그 맵의 eggs: 앞까지) 안에서 찾을 글자가 정확히 한 번 나와야 바꾼다.
// 하나라도 못 찾거나 두 번 이상 나오면 아무것도 쓰지 않고 멈춘다.
import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve(process.argv[2] || 'prototype/newbie-quest-demo.html');
const dst = path.resolve(process.argv[3] || src);

// [맵 시작 글자, 찾을 글자, 바꿀 글자, 이유]
const FIX = [
  // 1. 주택가: 동네에서 내려와 빌라 문으로 가는 한 칸짜리 보도(7행)를 아파트 게시판이 막고 있었다.
  //    게시판을 보도 바로 위 잔디 칸(16,6)으로 올린다. 아래 보도 칸(16,7)에서 그대로 읽힌다.
  ['MAPS.villa={', "{x:15,y:7,kind:'thing',id:'aptboard'", "{x:16,y:6,kind:'thing',id:'aptboard'", '주택가 게시판이 보도 막음'],
  // 2. 주택가: 건물 뒤 잔디길(1행) 가운데 나무 한 그루가 길을 끊었다.
  ['MAPS.villa={', "'gggggtggggggggggg_rr_g',", "'ggggggggggggggggg_rr_g',", '주택가 건물 뒤 나무'],
  // 2-1. 학교 앞: 좌판 뒤 잔디 구석을 나무(2,12)가 막아 돌아가야 했다.
  ['\n campus:{spawn:', "'ggtgg___gggggQQQQ_gggt',", "'ggggg___gggggQQQQ_gggt',", '학교 앞 좌판 뒤 나무'],
  // 3. 전통시장: 정육점 가격표가 칼국숫집 문 앞 보도(9행)를 막았다. 바로 아래 정육 좌판(7,10) 위로 옮긴다.
  ['MAPS.market={', "{x:6,y:9,kind:'thing',id:'meatprice'", "{x:7,y:10,kind:'thing',id:'meatprice'", '시장 가격표가 보도 막음'],
  // 4. 전통시장: 반찬가게 사장이 윗줄 보도(3행)를 막았다. 자기 좌판 옆 빈칸(3,4)에 선다.
  ['MAPS.market={', "{x:3,y:3,kind:'talk',id:'vendor'", "{x:3,y:4,kind:'talk',id:'vendor'", '반찬가게 사장이 보도 막음'],
  // 5. 전통시장: 찻길 끝 나무(19,14)가 찻길 오른쪽 보도로 가는 유일한 길목을 좁혔다.
  ['MAPS.market={', "'ggtgggggggggtggggggtgg',", "'ggtgggggggggtggggggggg',", '시장 찻길 끝 나무'],
  // 6. 고용센터 앞: 학교 앞에서 남쪽 잔디로 넘어오면 연못과 나무(2,18)에 갇혔다. 나무를 뺀다.
  ['\n center:{spawn:', "'ggtgggggggtgggggg_rrgg',", "'ggggggggggtgggggg_rrgg',", '고용센터 앞 서쪽 잔디 갇힘'],
  // 7. 고용센터 앞: 시장 방향 안내판(16,18)이 시장 가는 보도 옆 잔디를 막았다. 길 모퉁이(16,15)로 올린다.
  ['\n center:{spawn:', "{x:16,y:18,kind:'thing',id:'tomarket'", "{x:16,y:15,kind:'thing',id:'tomarket'", '시장 방향 안내판'],
  // 8. 동네: 주택가 방향 안내판(16,17)이 벤치와 붙어 보도 옆을 막았다. 길 모퉁이(16,15)로 올린다.
  ['\n town:{spawn:', "{x:16,y:17,kind:'thing',id:'tovilla'", "{x:16,y:15,kind:'thing',id:'tovilla'", '주택가 방향 안내판'],
  // 9. 회사 앞: 횡단보도를 건너자마자 푸드트럭 좌판(8~10,15)과 사장이 앞을 막았다. 오른쪽(14~16)으로 옮긴다.
  ['\n office:{spawn:', "'ggggggggAAAggggggggggg',", "'ggggggggggggggAAAggggg',", '회사 앞 푸드트럭 좌판'],
  ['\n office:{spawn:', "'ggtgggggg_gggggggtgggg',", "'ggtgggggggggggg_gtgggg',", '회사 앞 푸드트럭 자리'],
  ['\n office:{spawn:', "{x:9,y:16,kind:'talk',id:'truck'", "{x:15,y:16,kind:'talk',id:'truck'", '푸드트럭 사장'],
  // 10. 휴게소: 고속도로 안내판(20,11)이 주유소 오른쪽 길을 막았다. 맨 끝 칸(21,11)으로 민다.
  ['MAPS.rest={', "{x:20,y:11,kind:'thing',id:'hwsign'", "{x:21,y:11,kind:'thing',id:'hwsign'", '휴게소 고속도로 안내판'],
  // 11·12. 전주·대구 야시장: 판매대가 가운데 통로(6행)를 막았다. 아랫줄 좌판 사이 빈칸(9,7)으로 붙인다.
  ['MAPS.jeonju_market={', "{x:9,y:6,kind:'talk',id:'nightvendor'", "{x:9,y:7,kind:'talk',id:'nightvendor'", '전주 야시장 판매대'],
  ['MAPS.daegu_market={', "{x:9,y:6,kind:'talk',id:'smvendor'", "{x:9,y:7,kind:'talk',id:'smvendor'", '대구 야시장 판매대'],
  // 13·14. 감천문화마을: 조형물과 주민이 골목 한가운데 서 있었다. 큰 골목(10~11열) 바로 옆 잔디 칸으로 비킨다.
  //    집 사이 한 칸짜리 잔디 통로에 두면 그 통로가 막히므로, 큰 골목과 나란한 칸을 고른다.
  ['MAPS.busan_gamcheon={', "{x:4,y:9,kind:'thing',id:'prince'", "{x:9,y:10,kind:'thing',id:'prince'", '감천 어린 왕자 조형물'],
  ['MAPS.busan_gamcheon={', "{x:15,y:6,kind:'talk',id:'gcresident'", "{x:12,y:5,kind:'talk',id:'gcresident'", '감천 마을 주민'],
  // 15~18. 자갈치시장: 한 칸짜리 보도에 상인·저울·팻말이, 부두 끝에 회센터 사장이 서 있었다.
  //    상인은 맨 왼쪽 두 칸 빈터의 벽 쪽 칸(0,4)으로, 저울·팻말은 좌판 위로, 회센터 사장은 부두 맨 끝으로.
  ['MAPS.busan_jagalchi={', "{x:6,y:5,kind:'talk',id:'jgfish'", "{x:0,y:4,kind:'talk',id:'jgfish'", '자갈치 상인'],
  ['MAPS.busan_jagalchi={', "{x:11,y:5,kind:'thing',id:'scale2'", "{x:11,y:4,kind:'thing',id:'scale2'", '자갈치 저울(좌판 위로)'],
  ['MAPS.busan_jagalchi={', "{x:16,y:3,kind:'thing',id:'origin2'", "{x:16,y:4,kind:'thing',id:'origin2'", '자갈치 원산지 팻말(좌판 위로)'],
  ['MAPS.busan_jagalchi={', "{x:20,y:8,kind:'talk',id:'jghoe'", "{x:21,y:8,kind:'talk',id:'jghoe'", '자갈치 회센터 사장(부두 끝으로)'],
];

let html = fs.readFileSync(src, 'utf8');
const bad = [];
const edits = [];
for (const [start, find, rep, why] of FIX) {
  const a = html.indexOf(start);
  if (a < 0 || html.indexOf(start, a + 1) >= 0) { bad.push(`맵 시작 글자 ${a < 0 ? '없음' : '여러 번'}: ${start} (${why})`); continue; }
  const e1 = html.indexOf('eggs:', a), e2 = html.indexOf('\nMAPS.', a + 1);
  const end = Math.min(e1 < 0 ? Infinity : e1, e2 < 0 ? Infinity : e2);
  if (!isFinite(end)) { bad.push(`맵 끝을 못 찾음: ${start}`); continue; }
  const block = html.slice(a, end);
  const i = block.indexOf(find);
  if (i < 0 || block.indexOf(find, i + 1) >= 0) { bad.push(`찾을 글자 ${i < 0 ? '없음' : '여러 번'}: ${start} … ${find} (${why})`); continue; }
  edits.push({ at: a + i, len: find.length, rep, why });
}
if (bad.length) { console.error('멈춤. 아무것도 쓰지 않았다.\n' + bad.join('\n')); process.exit(1); }
const at = edits.map((e) => e.at);
if (new Set(at).size !== at.length) { console.error('멈춤. 같은 자리를 두 번 바꾸려 했다.'); process.exit(1); }
edits.sort((x, y) => y.at - x.at).forEach((e) => { html = html.slice(0, e.at) + e.rep + html.slice(e.at + e.len); });
fs.writeFileSync(dst, html);
console.log(`바꾼 곳 ${edits.length}개 → ${path.relative(process.cwd(), dst)}`);
edits.sort((x, y) => x.at - y.at).forEach((e) => console.log(' · ' + e.why));
