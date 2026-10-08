/* 인생 모드 1단계 대본 (스토리 리드, 2026-10-09)
   장면 모양은 CS_STORY · MQ 장면과 같다: {bg, cast:[[열쇠,'L'|'C'|'R']], who, text:[..], doc:{t,rows,bad}, fx, sfx}
   배경은 지금 있는 bg_ 그림 15장만 쓴다: apartment bank cafe carlot hometown livingroom meeting
   modelhouse night office phone road station town weddinghall
   인물 열쇠: hero, halbae, partner (portraitSrc가 바로 꺼낸다)
   {중괄호}는 lifeFill이 재생 직전에 채운다. 채울 값이 없으면 그대로 남으니 값은 꼭 넣는다.
     {name}      주인공 이름 (HEROES.name, 3자)
     {region}    출신 지역 글자: 수도권 / 광역시 / 지방 소도시
     {household} 집안 형편 글자: 넉넉한 편 / 보통 / 빠듯한 편
     {trait}     성향 글자 (6자 안쪽)
     {home}      첫 거처 이름 (TIERS.name 또는 '본가 방', 6자 안쪽)
     {start}     LIFE_START[region]  (엔딩 "막 ___ 누군가")
     {startBg}   LIFE_START_BG[region] (엔딩 마지막 장면 배경)
     {title}     인생 칭호 이름 (LIFE_TITLES[id].name)
   열쇠 값: region = 'cap' | 'metro' | 'etc', household = 'rich' | 'mid' | 'tight'
   재생: playMQ({kicker:'LIFE', title, sub, scenes:lifeFill(...), endScenes:function(){return [];}, onDone})
   선택지(choice)는 없다. 큰 결정 갈림길은 2단계. */

var LIFE_START    = { cap: '독립한', metro: '상경한', etc: '상경한' };
var LIFE_START_BG = { cap: 'station', metro: 'station', etc: 'hometown' };
/* 할배가 기억하는 고향. 할배 = 이 판의 주인공이므로 카드에 따라 바뀐다 (story.md 3절) */
var LIFE_HOMETOWN = { cap: '광역버스 첫차 서는 동네', metro: '지하철 종점 동네', etc: '버스가 하루 네 번 서는 마을' };

/* (a) 태어남: 태어남 카드를 확정한 뒤 1번. 약 26초 */
var LIFE_BIRTH = {
 title: '태어남', sub: '스무 살, 카드 한 장',
 head: [
  { bg: 'night', fx: 'fade',
    text: ['지구에 80억 명.', '그중 한 명으로', '태어났다.'] },
  { bg: 'night',
    doc: { t: '태어남 카드', rows: [['이름', '{name}'], ['출신', '{region}'], ['집안', '{household}'], ['성향', '{trait}']], bad: [] },
    text: ['스무 살, 대학생.', '이게 내 카드다.'] } ],
 /* 지역마다 하나: 그 동네 풍경 */
 place: {
  cap:   { bg: 'station', cast: [['hero', 'C']],
           text: ['수도권 토박이.', '노선도는 눈 감고도', '그릴 수 있다.'] },
  metro: { bg: 'town', cast: [['hero', 'C']],
           text: ['광역시 아파트 단지.', '서울은 KTX로', '두세 시간.'] },
  etc:   { bg: 'hometown', cast: [['hero', 'C']],
           text: ['산 너머 버스가', '하루 네 번 서는', '마을.'] } },
 meet: [
  { bg: 'town', fx: 'fade', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
    text: ['허허, 카드 한 장', '받았구먼.', '어디 좀 보세.'] } ],
 /* 지역마다 하나: 할배가 출신 칸을 읽는다 */
 region: {
  cap:   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
           text: ['집이 가까운 게', '큰 밑천이야.', '아낀 월세는 모으게.'] },
  metro: { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
           text: ['서울 안 가도', '길은 있네.', '가는 것도 자네 몫이고.'] },
  etc:   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
           text: ['...하루 네 번 버스라.', '허허, 잘 알지.', '아주 잘 알아.'] } },
 /* 형편마다 하나: 할배가 집안 칸을 읽는다 */
 household: {
  rich:  { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
           text: ['집안 덕은', '출발선까지야.', '그다음은 자네 걸음이네.'] },
  mid:   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
           text: ['보통이 제일 많지.', '그만큼 물어볼 사람도', '많다는 뜻이야.'] },
  tight: { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
           text: ['빠듯하게 자라면', '돈 귀한 걸 알지.', '그게 자네 무기야.'] } },
 /* 그 외 + 빠듯: 할배가 걸어온 첫 인생과 같은 카드. 형편 장면 뒤에 하나 더 */
 same: { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
         text: ['...이 카드는', '어째 낯이 익구먼.'] },
 tail: [
  { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '나',
    text: ['그럼 저는', '뭐부터 해요?'] },
  { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
    text: ['카드는 정해졌어도', '사는 건 자네가', '정하는 거야.'] },
  { bg: 'town', fx: 'confetti', cast: [['hero', 'C']],
    text: ['스무 살 봄.', '{home}에서', '인생이 시작됐다.'] } ]
};

/* (b) 세월: 메인 장 사이 나이 건너뛰기. 각 10~15초. age는 제안값(story.md 2절), 바꾸면 text도 같이 바꾼다 */
var LIFE_YEARS = {
 y24: { age: 24, before: 'job', title: '세월', sub: '스물넷',
  scenes: [
   { bg: 'phone', fx: 'fade', cast: [['hero', 'C']],
     text: ['스물넷.', '첫 출근 한 달 전.'] },
   { bg: 'phone', cast: [['hero', 'C']],
     text: ['졸업장을 받았다.', '학자금 고지서도', '같이 왔다.'] },
   { bg: 'office', cast: [['hero', 'C']],
     text: ['다음 달부터는', '여기가 내 자리다.'] },
   { bg: 'phone', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 정장보다', '근로계약서를', '먼저 챙기게.'] } ] },

 y26: { age: 26, before: 'lease', title: '세월', sub: '스물여섯',
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
     text: ['스물여섯.', '월세 계약이', '석 달 남았다.'] },
   { bg: 'town', cast: [['hero', 'C']],
     text: ['통장에 모인 돈,', '보증금 하나만큼.', '거의 전부다.'] },
   { bg: 'town', cast: [['hero', 'C']], who: '나',
     text: ['이번엔 전세로', '가 볼까?'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['큰돈이 내 손을', '떠나는 날이', '제일 위험하네.'] } ] },

 y27: { age: 27, before: 'card', title: '세월', sub: '스물일곱',
  scenes: [
   { bg: 'bank', fx: 'fade', cast: [['hero', 'C']],
     text: ['스물일곱.', '카드 만들라는 전화가', '이번 주만 세 통.'] },
   { bg: 'bank', cast: [['hero', 'C']], who: '나',
     text: ['연회비 없대요.', '포인트도 준대요.'] },
   { bg: 'bank', cast: [['hero', 'C']],
     text: ['지갑에 카드 한 장이', '더 들어오려 한다.'] },
   { bg: 'bank', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 한도는', '자네 돈이 아니야.', '빌린 돈이지.'] } ] },

 y29: { age: 29, before: 'car', title: '세월', sub: '스물아홉',
  scenes: [
   { bg: 'road', fx: 'fade', cast: [['hero', 'C']],
     text: ['스물아홉.', '자기 전마다', '중고차 앱을 연다.'] },
   { bg: 'road', cast: [['hero', 'C']], who: '나',
     text: ['서른 전에', '한 대는 있어야', '하지 않나?'] },
   { bg: 'carlot', cast: [['hero', 'C']],
     text: ['주말엔 매매단지를', '세 바퀴 돌았다.'] },
   { bg: 'road', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['차값보다', '한 달 유지비를', '먼저 세어 보게.'] } ] },

 y32: { age: 32, before: 'wedding', title: '세월', sub: '서른둘',
  scenes: [
   { bg: 'cafe', fx: 'fade', cast: [['hero', 'L'], ['partner', 'R']],
     text: ['서른둘.', '이번 청첩장엔', '내 이름이 있다.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['partner', 'R']], who: '나',
     text: ['식장은 어디로', '할까?'] },
   { bg: 'weddinghall', cast: [['hero', 'L'], ['partner', 'R']],
     text: ['식장 견적서는', '생각보다 길었다.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 식장 전에', '서로 통장부터', '보여 주게.'] } ] },

 y37: { age: 37, before: 'home', title: '세월', sub: '서른일곱',
  scenes: [
   { bg: 'apartment', fx: 'fade', cast: [['hero', 'L'], ['partner', 'R']],
     text: ['서른일곱.', '전세 만기를', '세 번째 맞는다.'] },
   { bg: 'apartment', cast: [['hero', 'L'], ['partner', 'R']], who: '나',
     text: ['이번엔 이사 말고', '우리 집 볼까?'] },
   { bg: 'modelhouse', cast: [['hero', 'C']],
     text: ['모델하우스는', '언제나 밝다.'] },
   { bg: 'modelhouse', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['집은 사는 곳이자', '제일 큰 빚이야.', '둘 다 보게.'] } ] },

 /* 6장 뒤 → 결산. 가장 긴 건너뛰기. 할배가 점점 말이 없어지는 것이 복선 */
 y60: { age: 60, before: 'end', title: '세월', sub: '마흔, 쉰, 그리고',
  scenes: [
   { bg: 'livingroom', fx: 'fade', cast: [['hero', 'L'], ['partner', 'R']],
     text: ['마흔, 쉰.', '대출은 줄고', '흰머리는 늘었다.'] },
   { bg: 'station', cast: [['hero', 'C']],
     text: ['회사를 나왔다.', '명함 대신', '버스카드가 남았다.'] },
   { bg: 'night', cast: [['hero', 'C']],
     text: ['할배는 갈수록', '말이 줄었다.', '가끔 나를 오래 봤다.'] },
   { bg: 'night', fx: 'fade',
     text: ['그리고,', '예순.'] } ] }
};

/* (c) 예순 엔딩. part1(약 17초) → 인생 결산 카드(화면) → part2(약 36초) → THE END → 공유.
   지금 ENDING(playCinema)의 줄을 살리고, 나이가 같아진 뒤의 이야기로 옮겼다 (story.md 3절) */
var LIFE_END = {
 title: '예순', sub: '인생 결산',
 part1: [
  { bg: 'livingroom', fx: 'fade', cast: [['hero', 'L'], ['partner', 'R']],
    text: ['예순 번째 생일.', '큰 초 여섯 개.'] },
  { bg: 'livingroom', cast: [['hero', 'L'], ['partner', 'R']], who: '배우자',
    text: ['서랍 정리하다가', '이게 다 나왔어.'] },
  { bg: 'livingroom',
    doc: { t: '서랍 속 종이', rows: [['스물넷', '근로계약서'], ['스물여섯', '전세 계약서'], ['서른둘', '혼인신고서'], ['서른일곱', '등기권리증']], bad: [] },
    who: '나', text: ['종이는 한곳에.', '누가 그랬더라.'] },
  { bg: 'night', fx: 'fade', cast: [['hero', 'C']],
    text: ['그날 밤,', '그 사람이', '마지막으로 왔다.'] } ],
 /* 여기서 인생 결산 카드를 띄운다. 닫으면 part2 */
 part2: [
  { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
    text: ['허허, 이게 자네', '예순 해구먼.', '칭호도 받았네.'] },
  { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
    text: ['{title}.', '...내 카드보다', '훨씬 낫구먼.'] },
  { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
    text: ['사실 자네한테', '숨긴 게 하나 있네.'] },
  { bg: 'night', fx: 'flash', sfx: 'win', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
    text: ['나는...', '마흔 해 뒤의', '자네라네.'] },
  { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
    text: ['그때 아무도', '안 알려 줘서', '참 많이 잃었거든.'] },
  { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '나',
    text: ['...그럼 마흔 해 동안', '알려 준 건 전부,', '당신이 겪은 일?'] },
  { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
    text: ['허허, 이제야', '우리 나이가', '같아졌구먼.'] },
  { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '미래의 나',
    text: ['이제 자네 차례일세.', '언젠가 막 {start}', '누군가를 만나면,'] },
  { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '미래의 나',
    text: ['그 사람의 귀인이', '되어 주게.'] },
  { bg: 'night', fx: 'fade', cast: [['hero', 'C']],
    text: ['창에 비친 얼굴이', '그 사람을', '닮아 있었다.'] },
  /* 마지막: 예순의 나(halbae 그림)가 스무 살 누군가(hero 그림)를 만난다. 프롤로그 첫 대사를 그대로 */
  { bg: '{startBg}', fx: 'fade', cast: [['halbae', 'L'], ['hero', 'R']], who: '나',
    text: ['허허, 그 얼굴 보니', '딱 옛날 생각이', '나는구먼.'] },
  { bg: '{startBg}', fx: 'confetti', sfx: 'win', cast: [['halbae', 'L'], ['hero', 'R']],
    text: ['그리고 오늘도,', '누군가의 귀인이', '된다.'] } ]
};

/* (d) 인생 칭호. cond는 제안(디자인 리드가 수치 확정). lines는 결산 카드에 2~3줄, 첫 줄은 해설, 마지막 줄은 할배 한마디 */
var LIFE_TITLES = {
 home:    { name: '내 집의 주인', cond: '거처가 자가(TIERS.own)',
            lines: ['전세 만기 알림이', '더는 오지 않는다.', '"허허, 문패 한번 좋구먼."'] },
 saver:   { name: '티끌 태산', cond: '모은 돈 상위',
            lines: ['커피 한 잔을 아껴', '예순 해를 쌓았다.', '"작은 돈이 큰 돈 지키네."'] },
 scholar: { name: '살림 박사', cond: '스탯 다섯 합 상위',
            lines: ['집, 밥, 옷, 돈, 일.', '모르는 서류가 없다.', '"이제 자네가 가르치게."'] },
 shield:  { name: '사기 불패', cond: '보스 전부 처음에 이김',
            lines: ['목소리 큰 사람에게', '한 번도 지지 않았다.', '"종이 한 장의 힘이야."'] },
 steady:  { name: '하루 한 걸음', cond: '출석·복습 많음',
            lines: ['빠진 날보다', '나온 날이 많았다.', '"꾸준함이 이기더군."'] },
 family:  { name: '한 지붕 두 이름', cond: '결혼 + 자가',
            lines: ['계약서마다', '이름이 둘이었다.', '"둘이 고르면 덜 틀리네."'] },
 bloom:   { name: '늦게 핀 꽃', cond: '형편 빠듯 출신이 자가 도달',
            lines: ['출발은 늦었지만', '끝은 남 못지않았다.', '"카드는 패일 뿐이야."'] },
 light:   { name: '가벼운 발걸음', cond: '어디에도 안 걸릴 때(기본값)',
            lines: ['큰 집은 없어도', '큰 빚도 없었다.', '"잃지 않은 것도 버는 걸세."'] }
};

/* 채우기. csFill과 같은 방식: {키}를 f[키]로 바꾼다 */
function lifeRp(s, f) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return f[k] != null ? f[k] : m; }); }
function lifeFill(scenes, f) {
  return scenes.map(function (p) {
    var q = JSON.parse(JSON.stringify(p));
    q.bg = lifeRp(q.bg, f); q.text = q.text.map(function (t) { return lifeRp(t, f); });
    if (q.doc) q.doc.rows = q.doc.rows.map(function (r) { return r.map(function (c) { return lifeRp(c, f); }); });
    return q; });
}
/* card = {region:'cap'|'metro'|'etc', household:'rich'|'mid'|'tight', regionText, householdText, traitText, home} */
function lifeBirthScenes(card, name) {
  var B = LIFE_BIRTH, sc = B.head.concat([B.place[card.region]], B.meet, [B.region[card.region], B.household[card.household]]);
  if (card.region === 'etc' && card.household === 'tight') sc.push(B.same);
  sc = sc.concat(B.tail);
  return lifeFill(sc, { name: name, region: card.regionText, household: card.householdText, trait: card.traitText, home: card.home });
}
function lifeEndScenes(part, card, titleId) {
  return lifeFill(LIFE_END[part], { title: (LIFE_TITLES[titleId] || LIFE_TITLES.light).name,
    start: LIFE_START[card.region], startBg: LIFE_START_BG[card.region] });
}
