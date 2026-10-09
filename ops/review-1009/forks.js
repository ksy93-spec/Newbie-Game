/* 인생 모드 2단계 · 큰 결정 갈림길 대본 (스토리 리드, 리뷰 1009, 2026-10-09)
   붙이는 곳: prototype/newbie-quest-demo.html, ops/life-1009/life-scenes.js 블록(LIFE_TITLES 아래, lifeRp 위).
   장면 모양은 LIFE_YEARS · MQ 장면과 같다: {bg, cast:[[열쇠,'L'|'C'|'R']], who, text:[..], doc:{t,rows,bad}, choice, fx, sfx}
   선택 장면: choice:{q, fork, opts:[{a, ok, note, v, then:[장면]}]}
     - 엔진(playMQ)이 읽는 것은 opts[].a · ok · note 뿐이다. q는 엔진이 안 쓴다(질문은 그 장면 text가 맡는다). 기록용으로 둔다.
     - fork(갈림길 id)와 v(고른 값), then(고른 뒤 바로 이어 틀 장면 1~2개)은 새 열쇠다. 엔진 고칠 곳 두 줄은 story.md 7절.
     - 갈림길에는 틀린 답이 없다. 그래서 ok는 모두 1이고, note는 "무엇이 바뀌는지"를 숫자로 적는다.
   배경은 bg_ 그림 15장 안에서만: apartment bank cafe carlot hometown livingroom meeting modelhouse night office phone road station town weddinghall
   인물: hero halbae partner + 이미 있는 NPC peerf peerm deskf officem (MQ_JOB·MQ_HOME에서 쓰는 그림)
   {중괄호}는 lifeForkScenes가 채운다: lifeFillVals()의 값 + {c4}{c6}{c7}{c8}(그 칸까지 보증금 차액) {ageKo}(지금 나이 한글)
   결과는 S.life.picks[forkId] = {v, age, done} 로 쌓인다. 결산 카드·칭호·이후 대본이 lifePickV(id)로 읽는다. */

var LIFE_FORK_ORDER = ['leave', 'job', 'rent', 'car', 'marry'];

/* 한글 나이: 24 → '스물넷'. 서랍 속 종이, 결산 줄, 장면 첫 줄이 같이 쓴다 */
function lifeAgeKo(n) {
  var T = { 2: '스물', 3: '서른', 4: '마흔', 5: '쉰', 6: '예순' }, O = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
  return (T[Math.floor(n / 10)] || '') + O[n % 10];
}

/* 첫 직장: S.company 값은 OB.company의 네 갈래 그대로 (4331줄) */
var LIFE_JOB_CO = {
 big:   { co: '제조·대기업', label: '대기업',   fx: { coin: 150, stat: { jik: 4 } },         flag: { dep: 50 },
          note: '월급이 크고 일이 잘게 나뉜다. 코인 +150 · 일 +4. 2장 전세 때 사내 대출 지원 ￦50.' },
 small: { co: '중소기업',    label: '중소기업', fx: { coin: 60, stat: { jik: 6 } },          flag: { aid: 100 },
          note: '일을 넓게 배운다. 코인 +60 · 일 +6. 3장 앞에 청년 지원 ￦100이 들어온다.' },
 start: { co: '스타트업',    label: '스타트업', fx: { coin: 30, stat: { jik: 2, ui: 2 } },   flag: { stock: 1 },
          note: '월급은 적고 속도는 빠르다. 코인 +30 · 일 +2 · 옷 +2. 일 퀘스트가 더 자주 뜬다. 예순에 스톡옵션 한 장을 뒤집는다.' },
 pub:   { co: '공공·금융',   label: '공공·금융', fx: { coin: 100, stat: { geum: 5 } },        flag: { steady: 150 },
          note: '천천히 오르지만 꾸준하다. 코인 +100 · 돈 +5. 예순 결산에 꾸준한 월급 ￦150.' }
};
/* 학교 갈래마다 세 곳. 4년제 셋째 칸은 전공이 사회(geum)·교육(ju)이면 공공·금융, 아니면 스타트업 */
var LIFE_JOB_SET = { '4년제': ['big', 'small', 'start'], '4년제·공공': ['big', 'small', 'pub'], '전문대': ['small', 'big', 'start'], '고졸': ['big', 'small', 'pub'] };
/* 자리 이름(6자 안쪽). 열쇠는 약력 majorSt(jik 공학, geum 사회, ui 인문·예체능, sik 자연·의약, ju 교육), 고졸은 hs */
var LIFE_JOB_ROLE = {
 jik:  { big: '생산기술',   small: '설계 보조',  start: '개발자',     pub: '시설직' },
 geum: { big: '영업관리',   small: '회계 담당',  start: '운영 매니저', pub: '창구 텔러' },
 ui:   { big: '홍보팀',     small: '디자이너',   start: '콘텐츠 기획', pub: '홍보 담당' },
 sik:  { big: '품질관리',   small: '연구 보조',  start: '식품 MD',    pub: '보건직' },
 ju:   { big: '사내 교육',  small: '학원 강사',  start: '교육 기획',  pub: '교육 행정' },
 hs:   { big: '생산직',     small: '현장 사무',  start: '물류 관리',  pub: '고졸 공채' }
};

/* 장마다 드는 돈. lifeBeforeCh의 gift 줄을 lifeChMoney()로 바꾼다 (story.md 2절) */
var LIFE_RENT = { 4: 20, 5: 30, 6: 40 };   /* 월세 칸: 고시원 · 반지하 · 원룸 월세. 전세·자가는 0 */

/* ══════════ 갈림길 다섯 ══════════ */
var LIFE_FORKS = {

 /* 1. 독립하기 — 본가·기숙사 카드만. 자취 카드는 이미 독립했으니 건너뛴다 */
 leave: {
  title: '독립', sub: '나갈까, 버틸까',
  /* 본가: 스스로 고른다. 안 나가면 2장 앞(rent)에서 한 번 더 묻는다 */
  home: [
   { bg: 'livingroom', fx: 'fade', cast: [['hero', 'C']],
     text: ['본가 방, 내 책상.', '부엌 냄새가', '문틈으로 들어온다.'] },
   { bg: 'phone', cast: [['hero', 'C']],
     doc: { t: '혼자 살면 드는 돈', rows: [['고시원', '보증금 ￦{c4} · 월세'], ['원룸 월세', '보증금 ￦{c6} · 월세'], ['본가', '￦0 · 장마다 +￦40']], bad: [] },
     text: ['방값을 세어 봤다.', '생각보다', '숫자가 크다.'] },
   { bg: 'livingroom', cast: [['hero', 'C']], who: '나',
     text: ['나도 이제', '나가 살아야 하나?'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 나가는 건', '용기고, 버티는 건', '셈이야.'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['둘 다 틀린 건', '아니네.', '자네는 어느 쪽인가?'],
     choice: { q: '독립할까?', fork: 'leave', opts: [
       { v: 'stay', ok: 1, a: '본가에 남아 돈을 모은다',
         note: '방값 대신 통장이 큰다. 장마다 ￦40, 지금 돈 +3. 대신 방이 좁아 세간은 두 칸뿐이고, 저절로 이사하지 않는다.',
         then: [ { bg: 'livingroom', cast: [['hero', 'C']],
                   text: ['조금만 더 있자.', '대신 아낀 방값은', '한 푼도 안 쓴다.'] } ] },
       { v: 'gosi', ok: 1, a: '고시원으로 나간다 (보증금 ￦{c4})',
         note: '작아도 내 방이다. 집 +4. 장마다 월세 ￦20이 나가고, 방값 아낌은 끝난다.',
         then: [ { bg: 'station', fx: 'fade', cast: [['hero', 'C']],
                   text: ['가방 두 개.', '창 없는 방이지만', '문은 내가 잠근다.'] } ] },
       { v: 'oneroom', ok: 1, a: '원룸 월세로 나간다 (보증금 ￦{c6})',
         note: '창이 있는 방. 집 +6 · 옷 +2. 원룸 월세 칸을 집 스탯과 상관없이 연다. 장마다 월세 ￦40.',
         then: [ { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
                   text: ['부모님 집에서', '버스로 세 정거장.', '그래도 내 방이다.'] } ] } ] } } ],

  /* 기숙사: 졸업하면 반드시 나간다. 남기 칸 대신 "본가로 들어가기"(대학이 고향에 있을 때만) */
  dorm: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
     text: ['졸업식 다음 주.', '기숙사 방을', '비워 달란다.'] },
   { bg: 'phone', cast: [['hero', 'C']],
     doc: { t: '어디로 갈까', rows: [['고시원', '보증금 ￦{c4} · 월세'], ['원룸 월세', '보증금 ￦{c6} · 월세'], ['본가', '{homeRow}']], bad: [] },
     text: ['상자에 짐을', '넣다 말고', '방값부터 셌다.'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 짐이', '생각보다 많구먼.', '어디로 옮길 텐가?'],
     choice: { q: '기숙사를 나가면 어디로?', fork: 'leave', opts: [
       { v: 'gosi', ok: 1, a: '고시원으로 간다 (보증금 ￦{c4})',
         note: '기숙사 보증금만큼은 이미 낸 셈이다. 집 +4. 장마다 월세 ￦20.',
         then: [ { bg: 'station', fx: 'fade', cast: [['hero', 'C']],
                   text: ['가방 두 개.', '창 없는 방이지만', '문은 내가 잠근다.'] } ] },
       { v: 'oneroom', ok: 1, a: '원룸 월세로 간다 (보증금 ￦{c6})',
         note: '창이 있는 방. 집 +6 · 옷 +2. 원룸 월세 칸을 집 스탯과 상관없이 연다. 장마다 월세 ￦40.',
         then: [ { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
                   text: ['학교 앞을 떠나', '처음 고른 동네.', '창으로 볕이 든다.'] } ] },
       { v: 'home', ok: 1, near: 1, a: '본가로 들어간다',
         note: '방값이 0이 된다. 장마다 ￦40, 돈 +3. 대신 2장 앞에서 독립을 한 번 더 고른다.',
         then: [ { bg: 'livingroom', fx: 'fade', cast: [['hero', 'C']],
                   text: ['4년 만의 내 방.', '책상 위 먼지가', '그대로다.'] } ] } ] } } ]
 },

 /* 2. 첫 직장 — 세월 y24 뒤, MQ_JOB 앞. 문서 상자와 보기는 lifeJobOpts()가 학교·전공으로 채운다 */
 job: {
  title: '첫 직장', sub: '세 군데 중 한 곳',
  scenes: [
   { bg: 'phone', fx: 'flash', cast: [['hero', 'C']],
     text: ['[문자] 최종 면접', '합격 안내', '세 곳에서 왔다.'] },
   { bg: 'phone', cast: [['hero', 'C']],
     doc: { t: '붙은 곳', rows: '{jobRows}', bad: [] },
     text: ['세 군데 다', '나쁘지 않다.', '그래서 어렵다.'] },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 첫 회사가', '평생 회사는', '아니라네.'] },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['다만 첫 버릇은', '오래가지.', '어디로 가겠나?'],
     choice: { q: '첫 직장', fork: 'job', opts: '{jobOpts}' } } ],
  /* 고른 뒤 이어지는 한 장면. {co} {role}은 고른 회사 */
  then: { bg: 'office', fx: 'fade', cast: [['hero', 'C']],
          doc: { t: '명함', rows: [['회사', '{co}'], ['자리', '{role}'], ['이름', '{name}']], bad: [] },
          text: ['명함이 나왔다.', '이름 석 자 위에', '회사 이름.'] }
 },

 /* 3. 전세 vs 월세 유지 — 세월 y26 뒤, 2장 앞. 본가에 남은 사람은 nest판 */
 rent: {
  title: '첫 전세', sub: '묶일 돈, 샐 돈',
  move: [
   { bg: 'town', cast: [['hero', 'C']],
     doc: { t: '2년 셈 (게임 코인)', rows: [['원룸 전세', '보증금 ￦{c7} · 월세 0'], ['월세 유지', '그대로 · 장마다 ￦{rentNow}'], ['2장', '전세는 지금 · 월세는 투룸 때']], bad: [] },
     text: ['전세는 목돈이', '묶이고, 월세는', '다달이 샌다.'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 묶일 돈과', '샐 돈 중에', '자네는 뭘 고르겠나?'],
     choice: { q: '전세로 옮길까?', fork: 'rent', opts: [
       { v: 'jeonse', ok: 1, a: '원룸 전세로 옮긴다 (보증금 ￦{c7})',
         note: '월세가 끝난다. 2장(전세 계약)을 지금 시작한다. 큰돈이 한 번에 나가니 서류를 끝까지 본다.',
         then: [ { bg: 'town', cast: [['hero', 'C']],
                   text: ['통장을 거의', '다 비울 날이', '다가온다.'] } ] },
       { v: 'wolse', ok: 1, a: '월세로 2년 더 산다',
         note: '목돈이 안 묶인다. 지금 코인 +80 · 돈 +4. 월세는 계속 나간다. 2장은 투룸 전세(집 48)가 열리면 투룸으로 바로 계약한다.',
         then: [ { bg: 'town', cast: [['hero', 'C']],
                   text: ['2년만 더.', '그사이 목돈을', '하나 더 만든다.'] } ] } ] } } ],
  nest: [
   { bg: 'livingroom', cast: [['hero', 'C']],
     doc: { t: '2년 셈 (게임 코인)', rows: [['원룸 전세', '보증금 ￦{c7} · 월세 0'], ['본가', '￦0 · 장마다 +￦40'], ['2장', '전세는 지금 · 본가는 투룸 때']], bad: [] },
     text: ['본가에서 모은 돈,', '전세 보증금에', '거의 닿는다.'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 모은 걸', '쓸 때가 왔구먼.', '아니면 더 모을 텐가?'],
     choice: { q: '이번엔 나갈까?', fork: 'rent', opts: [
       { v: 'jeonse', ok: 1, a: '전세로 바로 독립한다 (보증금 ￦{c7})',
         note: '월세를 한 번도 안 내고 전세로 간다. 방값 아낌은 끝난다. 2장(전세 계약)을 지금 시작한다.',
         then: [ { bg: 'livingroom', cast: [['hero', 'C']],
                   text: ['이삿짐 상자에', '엄마가 반찬을', '꾹꾹 눌러 담았다.'] } ] },
       { v: 'home2', ok: 1, a: '본가에서 2년 더 모은다',
         note: '장마다 ￦40이 계속 쌓인다 · 돈 +3. 2장은 투룸 전세(집 48)가 열리면 본가에서 투룸으로 바로 간다.',
         then: [ { bg: 'livingroom', cast: [['hero', 'C']],
                   text: ['2년만 더.', '대신 다음 집은', '방이 두 개다.'] } ] } ] } } ]
 },

 /* 4. 차 사기 / 안 사기 — 세월 y29 뒤, 4장 앞 */
 car: {
  title: '첫 차', sub: '키냐, 통장이냐',
  scenes: [
   { bg: 'carlot', cast: [['hero', 'C']],
     doc: { t: '장마다 셈 (게임 코인)', rows: [['차 있음', '유지비 ￦50'], ['차 없음', '아낀 돈 ￦50'], ['4장', '둘 다 견적서는 읽는다']], bad: [] },
     text: ['차값보다', '다달이 나갈 돈을', '먼저 적어 봤다.'] },
   { bg: 'road', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 차는 사는 날', '한 번이 아니라', '타는 날마다 사는 거야.'],
     choice: { q: '차를 살까?', fork: 'car', opts: [
       { v: 'buy', ok: 1, a: '한 대 산다',
         note: '어디든 빨리 간다. 옷 +2 · 일 +2. 4장이 끝난 뒤부터 장마다 유지비 ￦50.',
         then: [ { bg: 'carlot', cast: [['hero', 'C']],
                   text: ['서른 전에 한 대.', '대신 견적서는', '한 줄씩 읽는다.'] } ] },
       { v: 'nobuy', ok: 1, a: '안 산다. 버스와 카셰어로',
         note: '돈 +4. 4장이 끝난 뒤부터 장마다 ￦50을 아낀다. 4장은 견적서만 읽고 사지 않는다. 차는 나중에 상점에서도 살 수 있다.',
         then: [ { bg: 'station', cast: [['hero', 'C']],
                   text: ['막차는 아쉽지만', '할부 고지서는', '안 온다.'] } ] } ] } } ]
 },

 /* 5. 결혼 / 늦게 / 비혼 — 5장 앞. 세월 y32보다 먼저 튼다(고른 값에 따라 y32 · y35 · y32s 중 하나가 이어진다) */
 marry: {
  title: '서른하나', sub: '둘이냐, 하나냐',
  scenes: [
   { bg: 'cafe', fx: 'fade', cast: [['hero', 'C']],
     text: ['서른하나.', '청첩장이 한 달에', '두 장씩 온다.'] },
   { bg: 'night', cast: [['hero', 'C']], who: '나',
     text: ['나는 어떻게', '살고 싶더라?'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 결혼은', '숙제가 아니라', '고르는 거야.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['어느 쪽이든', '돈 얘기는 똑같이', '해야 하네.'],
     choice: { q: '어떻게 살까?', fork: 'marry', opts: [
       { v: 'wed', ok: 1, a: '만나는 사람과 결혼을 준비한다',
         note: '5장은 서른둘에 결혼 준비. 옷 +2. 5장이 끝나면 맞벌이로 장마다 ￦60.',
         then: [ { bg: 'cafe', cast: [['hero', 'L'], ['partner', 'R']],
                   text: ['그 사람에게', '먼저 말을', '꺼냈다.'] } ] },
       { v: 'late', ok: 1, a: '몇 해 더 있다가 한다',
         note: '5장이 서른다섯으로, 6장이 서른여덟로 밀린다. 그사이 모은 돈 ￦150 · 돈 +3. 5장이 끝나면 맞벌이로 장마다 ￦60.',
         then: [ { bg: 'cafe', cast: [['hero', 'L'], ['partner', 'R']],
                   text: ['조금만 더', '각자 서 보자고', '둘이 정했다.'] } ] },
       { v: 'solo', ok: 1, a: '혼자 사는 삶을 설계한다',
         note: '5장이 "혼자 사는 설계"로 바뀐다(연금, 보험, 차용증). 돈 +4 · 집 +2. 6장 내 집도 혼자 이름으로 산다.',
         then: [ { bg: 'night', cast: [['hero', 'C']],
                   text: ['혼자여도', '빈칸 없는 삶.', '그렇게 정했다.'] } ] } ] } } ]
 }
};

/* ══════════ 고른 값에 따라 바뀌는 뒤 대본 ══════════ */

/* 세월 갈래. LIFE_YEARS 옆에 그대로 붙인다. lifeYearPick(id)가 고른다 */
var LIFE_YEARS_FORK = {
 /* 늦게: 5장 앞 세월이 서른다섯 */
 y35: { age: 35, before: 'wedding', title: '세월', sub: '서른다섯',
  scenes: [
   { bg: 'cafe', fx: 'fade', cast: [['hero', 'L'], ['partner', 'R']],
     text: ['서른다섯.', '이번 청첩장엔', '내 이름이 있다.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['partner', 'R']], who: '나',
     text: ['늦었다는 말은', '남의 셈이지.'] },
   { bg: 'weddinghall', cast: [['hero', 'L'], ['partner', 'R']],
     text: ['식장 견적서는', '생각보다 길었다.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 식장 전에', '서로 통장부터', '보여 주게.'] } ] },
 /* 비혼: 5장 앞 세월 */
 y32s: { age: 32, before: 'wedding', title: '세월', sub: '서른둘',
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
     text: ['서른둘.', '친구 집들이에서', '혼자 일찍 나왔다.'] },
   { bg: 'night', cast: [['hero', 'C']], who: '나',
     text: ['혼자 아프면', '누가 알지?'] },
   { bg: 'bank', cast: [['hero', 'C']],
     text: ['노후 계산기를', '처음 두드려 봤다.'] },
   { bg: 'bank', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 혼자 사는 건', '종이를 혼자', '챙긴다는 뜻이야.'] } ] }
};

/* y37 · y60 · LIFE_END.part1 고칠 줄. 키는 [장면 번호] */
var LIFE_FORK_PATCH = {
 y37: {
  /* rent가 wolse·home2면 첫 전세가 늦었으니 만기 횟수를 안 센다 */
  late_rent: { 0: { text: ['{ageKo}.', '투룸 전세 만기가', '또 돌아왔다.'] } },
  /* rent가 jeonse일 때 첫 줄 (나이만 바뀜) */
  base:      { 0: { text: ['{ageKo}.', '전세 만기를', '세 번째 맞는다.'] } },
  solo:      { 0: { cast: [['hero', 'C']] },
               1: { cast: [['hero', 'C']], text: ['이번엔 이사 말고', '내 집 볼까?'] } } },
 y60: {
  solo:      { 0: { cast: [['hero', 'C']], text: ['마흔, 쉰.', '대출은 줄고', '흰머리는 늘었다.'] } } },
 part1: {
  /* 비혼: 생일상에 1장의 입사 동기(peerf)가 온다. 마흔 해 친구 */
  solo:      { 0: { cast: [['hero', 'L'], ['peerf', 'R']], text: ['예순 번째 생일.', '입사 동기들이 왔다.', '상 위엔 {food}.'] },
               1: { cast: [['hero', 'L'], ['peerf', 'R']], who: '입사 동기',
                    text: ['서랍 좀 열어 봐.', '종이가 한가득이네.'] } } }
};

/* 서랍 속 종이(LIFE_END.part1 문서 상자) 네 줄을 고른 값과 실제 나이로 만든다 */
function lifeDrawerRows() {
  var a = function (id) { return lifeAgeKo(lifeChAge(id) || LIFE_AGES[id]); }, m = lifePickV('marry'), r = lifePickV('rent');
  var own = !!(TIERS[S.tier] && TIERS[S.tier].own);
  return [[a('job'), '근로계약서'],
          [a('lease'), r && r !== 'jeonse' ? '투룸 전세 계약서' : '전세 계약서'],
          m === 'solo' ? [a('wedding'), '연금저축 통장'] : [a('wedding'), '혼인신고서'],
          own ? [a('home'), '등기권리증'] : [a('home'), '전세 계약서']];
}

/* ══════════ 5장 비혼판: 혼자 사는 설계 ══════════
   mqStart('wedding')이 lifePickV('marry')==='solo'면 MQ_WEDDING 대신 이 대본을 튼다. 장 id·보상(MQ_REWARD.wedding)은 그대로라
   mqDone('wedding')이 참이 되고 6장이 열린다. 제목·문구만 LIFE_SOLO_COPY로 바꾼다.
   사실 확인: 이 작업 환경에서 공식 사이트를 열지 않았다. 아래 숫자는 기억에 기댄 값이라 통합 전 원문 확인 필요(story.md 6절). */
var LIFE_SOLO_COPY = { title: '혼자 사는 설계', sub: '연금 통장부터 차용증까지',
  card: ['5장 클리어! 혼자 사는 설계', '혼자 챙길 종이를 다 챙겼다.'],
  share: '뉴비 퀘스트 5장 혼자 사는 설계 깼다. 연금계좌 한도랑 실손 중복, 게임에서 먼저 봄',
  unlock: ['경주·대구 가는 길', '1인 세간'] };
var MQ_SOLO = {
  id: 'wedding', no: 5, title: '혼자 사는 설계', sub: '연금 통장부터 차용증까지',
  asof: '2026-10',
  src: [
    ['국세청 연금계좌 세액공제', 'https://www.nts.go.kr'],
    ['금융감독원 파인', 'https://fine.fss.or.kr'],
    ['내보험 찾아줌', 'https://cont.insure.or.kr'],
    ['국민건강보험공단 간호·간병통합서비스', 'https://www.nhis.or.kr'],
    ['찾기쉬운 생활법령정보', 'https://www.easylaw.go.kr']
  ],
  scenes: [
    { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
      text: ['허허, 혼자 살기로', '했다고? 좋지.', '대신 종이가 늘 걸세.'] },
    { bg: 'bank', cast: [['hero', 'C']], who: '나',
      text: ['노후 준비는', '뭐부터 하지?'] },
    { bg: 'bank', cast: [['hero', 'L'], ['deskf', 'R']], who: '은행 창구 직원',
      text: ['연금저축이나 IRP에', '넣으시면 세금을', '돌려받아요.'] },
    { bg: 'bank', cast: [['hero', 'L'], ['deskf', 'R']],
      doc: { t: '연금계좌 세액공제', rows: [['납입 한도', '합쳐서 연 900만 원'], ['연금저축만', '그중 600만 원'], ['공제율', '13.2~16.5%'], ['받는 나이', '55세부터']], bad: [] },
      who: '은행 창구 직원', text: ['다만 일찍 깨면', '돌려받은 세금을', '다시 내셔야 해요.'],
      choice: { opts: [
        { a: '한도와 해지 조건부터 본다', ok: 1,
          note: '연금저축과 IRP를 합쳐 연 900만 원까지 세액공제 대상이다. 연금으로 받기 전에 깨면 공제받은 몫에 기타소득세가 붙는다.' },
        { a: '공제 많이 받게 다 넣는다', ok: 0,
          note: '급한 돈까지 묶으면 중도 해지 때 세금을 다시 낸다. 비상금을 따로 남기고 넣는다.' } ] } },
    { bg: 'night', cast: [['hero', 'C']],
      text: ['밤새 열이 났다.', '혼자 사니까', '보험부터 떠올랐다.'] },
    { bg: 'cafe', cast: [['hero', 'L'], ['officem', 'R']], who: '보험 설계사',
      text: ['실손 하나 더', '드시면 병원비를', '두 번 받으세요.'],
      choice: { opts: [
        { a: '실손은 겹쳐도 한 번만 나온다', ok: 1,
          note: '실손보험은 여러 개 들어도 실제 낸 병원비 안에서 나눠 보상한다. 하나면 된다. 내 가입 내역은 "내보험 찾아줌"에서 본다.' },
        { a: '두 번이라니 하나 더 든다', ok: 0,
          note: '보험료는 두 번 내고, 보상은 실제 병원비 안에서 나뉜다. 겹친 실손은 해지를 생각해 본다.' } ] } },
    { bg: 'night', cast: [['hero', 'C']],
      doc: { t: '혼자 입원할 때', rows: [['간호·간병통합', '보호자 없이 입원'], ['비용', '건강보험 적용'], ['병원', '병동 있는지 확인']], bad: [] },
      text: ['보호자 없이도', '입원할 수 있는', '병동이 있다.'] },
    { bg: 'town', cast: [['hero', 'L'], ['peerm', 'R']], who: '대학 동기',
      text: ['나 급한데', '300만 원만', '빌려줄 수 있어?'],
      choice: { opts: [
        { a: '차용증을 쓰고 계좌로 보낸다', ok: 1,
          note: '금액, 갚을 날, 이자, 두 사람 서명을 적는다. 돈은 계좌로 보내야 기록이 남는다. 개인 사이 빌려준 돈은 10년이 지나면 받을 권리가 사라질 수 있다.' },
        { a: '친구 사이에 무슨 종이야', ok: 0,
          note: '말로 한 약속도 계약이지만, 다투면 증명할 길이 없다. 종이 한 장이 친구를 지킨다.' } ] } },
    { bg: 'livingroom', cast: [['hero', 'C']],
      doc: { t: '나 하나의 서류함', rows: [['연금계좌', '납입 영수증'], ['보험', '실손 하나'], ['차용증', '원본 보관'], ['비상 연락', '한 사람 정하기']], bad: [] },
      text: ['서류함 하나에', '혼자 사는 법이', '다 들어갔다.'],
      choice: { opts: [
        { a: '아플 때 연락할 사람을 정해 둔다', ok: 1,
          note: '혼자 사는 사람일수록 비상 연락처 한 명을 정해 휴대폰 긴급 정보와 서류함에 적어 둔다.' },
        { a: '아직 젊으니 나중에', ok: 0,
          note: '응급실은 나이를 묻지 않는다. 연락할 사람이 없으면 병원도 가족을 찾느라 시간을 쓴다.' } ] } },
    { bg: 'night', fx: 'confetti', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
      text: ['허허, 혼자 사는 건', '외로운 게 아니라', '가벼운 거라네.'] },
    { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
      text: ['다만 가벼울수록', '종이는 무겁게', '챙기게.'] }
  ],
  ends: {
    good: ['연금, 보험, 차용증.', '혼자 챙길 종이를 다 챙겼다.'],
    ok: ['큰 탈은 없었다.', '몇 장은 내년에 챙기자.'],
    bad: ['혼자라서 몰랐던 것들이', '나중에 한꺼번에 왔다.']
  }
};

/* 6장(MQ_HOME) 비혼판: 배우자를 빼고 이 줄들로 바꾼다. 키는 그 장면 text[0] */
var LIFE_SOLO_HOME = {
  '모델하우스 사람 봐.':  { who: '나', text: ['모델하우스 사람 봐.', '나도 넣을 수 있을까?'] },
  '두 분이면 신혼부부나': { text: ['혼자시면', '생애최초 특별공급', '조건부터 보세요.'],
                           rows: [['공통', '무주택 세대구성원'], ['청약통장', '순위 요건 확인'], ['1인 가구', '공고 조건 확인'], ['생애최초', '소득세 5년 납부']] },
  '열쇠 받았으니까':      { who: '나', text: ['열쇠 받았으니까', '이제 내 집', '맞겠지?'] },
  '등기 완료.':           { text: ['등기 완료.', '갑구 맨 아래에', '내 이름이 올랐다.'] },
  '관리비 고지서 왔어.':  { who: '나', text: ['관리비 고지서 왔다.', '장기수선충당금은', '이제 내 몫이다.'] }
};
/* 차를 안 산 사람: 5장 첫 줄 "허허, 차도 뽑았겠다."와 4장 뒷부분 */
var LIFE_NOCAR = {
  wedding0: { text: ['허허, 차 대신', '통장을 키웠구먼.', '이제 둘이 할 일일세.'] },
  solo0:    null,   /* MQ_SOLO 첫 줄은 차와 상관없다 */
  car: {
    '차 샀다며?':          { who: '친구', text: ['렌터카 빌리면', '나도 한 번만', '몰아 봐도 되지?'] },
    '고속도로 입구가':      { text: ['차는 없어도', '갈 곳은 많다.', '버스가 데려다준다.'] },
    '허허, 차 키보다':      { text: ['허허, 안 사는 것도', '셈을 해 본 사람만', '고를 수 있다네.'] } },
  ends: { good: ['광고, 할부, 보험, 유지비.', '다 따져 보고 안 샀다.'],
          ok: ['안 사길 잘했다.', '읽다 만 줄은 다음에.'],
          bad: ['안 샀는데도', '견적서는 여전히 어렵다.'] }
};

/* 전세를 미룬 사람(rent가 wolse·home2): 2장 앞 컷신(MQ_LEASE_WRAP.intro)과 할배 알림(MQ_LIST lease.ann)이 "원룸 전세"를 말한다 */
var LIFE_LEASE_LATE = {
  intro: {
    '원룸 전세가 열렸다고?': { text: ['투룸 전세가 열렸다고?', '허허, 큰 날이 왔구먼.'] },
    '월세는 매달 조금씩':    { home2: 1, text: ['본가에서 모은 돈,', '전세는 그걸', '한 번에 다 거는 거야.'] } },
  ann: ['투룸 전세가 열렸네. 2년 미룬 계약, 이번엔 처음부터 끝까지 보세.', '보증금은 자네가 모은 돈 거의 전부일 걸세. 같이 보지.']
};

/* ══════════ 결산 카드 ══════════
   큰 결정 줄: 결산 카드에 "{나이} · {줄}" 꼴로 고른 순서대로. 16자 안쪽 */
var LIFE_FORK_LINE = {
 leave: { stay: '본가에서 버티며 모음', gosi: '고시원으로 독립', oneroom: '원룸 월세로 독립', home: '기숙사에서 본가로' },
 job:   { big: '대기업 {role} 입사', small: '중소기업 {role} 입사', start: '스타트업 {role} 입사', pub: '공공·금융 {role} 입사' },
 rent:  { jeonse: '첫 전세로 옮김', wolse: '월세로 2년 더', home2: '본가에서 2년 더' },
 car:   { buy: '첫 차를 샀다', nobuy: '차 없이 살기로' },
 marry: { wed: '결혼했다', late: '늦게, 결혼했다', solo: '혼자 사는 삶을 골랐다' }
};
/* 결산 카드 칸 "함께" (사는 곳 · 모은 코인 · 메인 · 보스 옆 다섯째 칸) */
var LIFE_WITH = { wed: '배우자와 둘', late: '배우자와 둘', solo: '혼자, 내 방식' };
/* 예순에 한 번 정산하는 것 (스톡옵션, 꾸준한 월급) */
var LIFE_SETTLE_LINE = { stockWin: '스톡옵션 · ￦1,000', stockLose: '스톡옵션 · 종이 한 장', steady: '꾸준한 월급 · ￦150' };

/* 칭호 하나 더(비혼 + 자가). family의 조건은 "marry가 wed·late + 자가"로 바뀐다 */
var LIFE_TITLE_SOLO = { solo: { name: '내 이름 한 줄', cond: '비혼 + 자가',
  lines: ['계약서마다', '이름이 하나였다.', '"혼자 골라도 안 틀리네."'] } };

/* ══════════ 함수 (제안. lifeFill·lifeFillVals·lifeChAge 옆에 붙인다) ══════════ */
function lifePickV(id) { var p = S.life && S.life.picks && S.life.picks[id]; return p ? p.v : null; }
function lifeForkVals(extra) {
  var f = Object.assign({}, lifeFillVals(), extra || {}), cost = function (i) { return tierCost(i); };
  f.c4 = cost(4); f.c6 = cost(6); f.c7 = cost(7); f.c8 = cost(8);
  f.rentNow = LIFE_RENT[S.tier] || 0; f.ageKo = lifeAgeKo(S.life.age);
  return f; }
/* 첫 직장 보기 세 개: 학교 갈래와 전공으로 */
function lifeJobOpts() {
  var p = S.life.prof || {}, st = p.majorSt || 'hs', set = p.path === '4년제' && (st === 'geum' || st === 'ju') ? '4년제·공공' : (p.path || '4년제');
  return (LIFE_JOB_SET[set] || LIFE_JOB_SET['4년제']).map(function (k) {
    var C = LIFE_JOB_CO[k], role = LIFE_JOB_ROLE[st][k], T = LIFE_FORKS.job.then;
    return { v: k, ok: 1, a: C.label + ' · ' + role, note: C.note, co: C.co, role: role,
             then: lifeFill([T], Object.assign(lifeForkVals(), { co: C.label, role: role })) }; }); }
/* 갈림길 장면을 채운다. lifeFill은 text·doc만 채우니 보기(a·note·then)도 채운다 */
function lifeForkScenes(scenes, f) {
  return scenes.map(function (p) {
    var q = lifeFill([p], f)[0];
    if (q.doc && q.doc.rows === '{jobRows}') q.doc.rows = lifeJobOpts().map(function (o) { return [o.a.split(' · ')[0], o.role]; });
    if (p.choice) {
      var opts = p.choice.opts === '{jobOpts}' ? lifeJobOpts() : p.choice.opts;
      var near = !(S.life.prof && S.life.prof.away);
      q.choice = { q: p.choice.q, fork: p.choice.fork, opts: opts.filter(function (o) { return !o.near || near; }).map(function (o) {
        var r = Object.assign({}, o); r.a = lifeRp(o.a, f); r.note = lifeRp(o.note, f);
        if (o.then && !o.co) r.then = lifeFill(o.then, f); return r; }) }; }
    return q; }); }
/* 장면 패치: 키가 장면 번호인 표를 덮어쓴다 */
function lifePatch(scenes, patch, f) {
  if (!patch) return scenes;
  Object.keys(patch).forEach(function (i) { var o = patch[i], q = scenes[+i]; if (!q) return;
    if (o.cast) q.cast = o.cast; if (o.who) q.who = o.who; if (o.text) q.text = o.text.map(function (t) { return lifeRp(t, f); }); });
  return scenes; }
/* 텍스트 첫 줄로 찾아 바꾸는 패치 (MQ_HOME 비혼판, MQ_CAR 차 없음판). 배우자는 cast에서 뺀다 */
function lifeLinePatch(scenes, map, dropPartner) {
  return scenes.map(function (p) {
    var q = JSON.parse(JSON.stringify(p)), o = q.text && map[q.text[0]];
    if (dropPartner && q.cast) { q.cast = q.cast.filter(function (c) { return c[0] !== 'partner'; });
      if (q.cast.length === 1 && q.cast[0][0] === 'hero') q.cast = [['hero', 'C']]; }
    if (o) { if (o.who) q.who = o.who; if (o.text) q.text = o.text; if (o.rows && q.doc) q.doc.rows = o.rows; }
    return q; }); }
/* 고른 값을 적고 효과를 준다. onPick(p, op)에서 부른다 */
function lifeForkApply(fork, op) {
  var L = S.life; if (!L.picks) L.picks = {};
  L.picks[fork] = { v: op.v, age: L.age, done: S.done.length };
  var add = function (k, n) { S.stats[k] = Math.min(100, (S.stats[k] || 0) + n); }, coin = function (n) { S.coin = Math.max(0, S.coin + n); };
  if (fork === 'leave') {
    if (op.v === 'stay') add('geum', 3);
    if (op.v === 'home') { L.nest = '본가'; S.tier = 0; applyLifeTiers(); add('geum', 3); }
    if (op.v === 'gosi' || op.v === 'oneroom') { var to = op.v === 'gosi' ? 4 : 6;
      add('ju', op.v === 'gosi' ? 4 : 6); if (op.v === 'oneroom') add('ui', 2);
      S.peak = Math.max(S.peak, to); L.nest = null;
      var mv = tierMove(to);
      if (!mv.ok) { if (lifeLiving() === '기숙사') { S.coin = 0; S.tier = to; S.paid = Math.max(S.paid || 0, to); toast('모자란 보증금은 집에서 보태 줬어요'); }
                    else { L.pend = to; toast('보증금 ￦' + mv.cost + '이 모이면 이사해요'); } }
      L.left = 1; applyLifeTiers(); } }
  if (fork === 'job') { var C = LIFE_JOB_CO[op.v]; S.company = C.co; L.jobRole = op.role; L.jobFlag = C.flag;
    coin(C.fx.coin); Object.keys(C.fx.stat).forEach(function (k) { add(k, C.fx.stat[k]); }); }
  if (fork === 'rent') { if (op.v === 'wolse') { coin(80); add('geum', 4); } if (op.v === 'home2') add('geum', 3); }
  if (fork === 'car') { if (op.v === 'buy') { add('ui', 2); add('jik', 2); } else add('geum', 4); }
  if (fork === 'marry') {
    if (op.v === 'wed') add('ui', 2);
    if (op.v === 'late') { coin(150); add('geum', 3); L.ages = { wedding: 35, home: 38 }; }
    if (op.v === 'solo') { add('geum', 4); add('ju', 2); } }
  ev('life_fork', { fork: fork, v: op.v, age: L.age }); save(); hudRefresh(); }
/* 장 시작 때 드는 돈·들어오는 돈 (lifeBeforeCh의 gift 줄을 바꾼다). 돌려준 줄을 토스트로 하나씩 */
function lifeChMoney(id) {
  var p = S.life.prof || {}, out = [], n = function (v, t) { if (v) { S.coin = Math.max(0, S.coin + v); out.push(t + ' ' + (v > 0 ? '+' : '-') + '￦' + Math.abs(v)); } };
  if (lifeNest() && lifeLiving() === '본가') n(40, '아낀 방값');
  if (p.income === '넉넉') n(60, '집에서 보탠 돈');
  if (!lifeNest() && LIFE_RENT[S.tier]) n(-LIFE_RENT[S.tier], '월세');
  var F = S.life.jobFlag || {};
  if (id === 'lease' && F.dep) n(F.dep, '사내 대출 지원');
  if (id === 'card' && F.aid) n(F.aid, '청년 지원');
  if (mqDone('car')) n(lifePickV('car') === 'buy' ? -50 : lifePickV('car') === 'nobuy' ? 50 : 0, lifePickV('car') === 'buy' ? '차 유지비' : '아낀 차값');
  if (mqDone('wedding') && /^(wed|late)$/.test(lifePickV('marry') || '')) n(60, '맞벌이');
  return out; }
/* 예순 정산: lifeEnd에서 lifeSummary 전에 */
function lifeSettleForks() {
  var F = S.life.jobFlag || {}, rows = [];
  if (F.stock) { var win = lifeRng(S.life.seed || 'v1-AAAAAA', 'stock')() < 0.2; if (win) S.coin += 1000; rows.push(win ? LIFE_SETTLE_LINE.stockWin : LIFE_SETTLE_LINE.stockLose); }
  if (F.steady) { S.coin += F.steady; rows.push(LIFE_SETTLE_LINE.steady); }
  return rows; }
/* 결산 카드 "큰 결정" 줄들 */
function lifeForkLog() {
  var P = (S.life && S.life.picks) || {};
  return LIFE_FORK_ORDER.filter(function (k) { return P[k]; }).map(function (k) {
    var line = (LIFE_FORK_LINE[k] || {})[P[k].v] || ''; return lifeAgeKo(P[k].age) + ' · ' + line.replace('{role}', S.life.jobRole || ''); }); }
/* 세월 고르기: 결혼 갈래와 전세 갈래를 반영한 장면 */
function lifeYearPick(id) {
  var m = lifePickV('marry'), r = lifePickV('rent'), key = { job: 'y24', lease: 'y26', card: 'y27', car: 'y29', wedding: 'y32', home: 'y37' }[id];
  if (id === 'wedding') key = m === 'late' ? 'y35' : m === 'solo' ? 'y32s' : 'y32';
  var y = LIFE_YEARS[key] || LIFE_YEARS_FORK[key], f = lifeForkVals(), sc = lifeFill(y.scenes, f);
  if (key === 'y37') { lifePatch(sc, LIFE_FORK_PATCH.y37[r && r !== 'jeonse' ? 'late_rent' : 'base'], f); if (m === 'solo') lifePatch(sc, LIFE_FORK_PATCH.y37.solo, f); }
  return { y: y, scenes: sc }; }
/* 장과 상관없는 갈림길(독립)을 홈에서 튼다. mqIdle()일 때만 */
function lifeForkPlay(fork) {
  if (!lifeOn() || lifePickV(fork) || MQP) return false;
  var src = fork === 'leave' ? (lifeLiving() === '기숙사' && lifeNest() ? LIFE_FORKS.leave.dorm : LIFE_FORKS.leave.home) : LIFE_FORKS[fork].scenes;
  var f = lifeForkVals({ homeRow: S.life.prof && S.life.prof.away ? '멀어서 못 감' : '￦0 · 장마다 +￦40' });
  S.life.forkQ = null; save();
  playMQ({ kicker: 'LIFE', title: LIFE_FORKS[fork].title, sub: LIFE_FORKS[fork].sub, scenes: lifeForkScenes(src, f),
    endScenes: function () { return []; },
    onPick: function (p, op) { if (p.choice && p.choice.fork) lifeForkApply(p.choice.fork, op); },
    onDone: function () { render('home'); hudRefresh(); } });
  return true; }
