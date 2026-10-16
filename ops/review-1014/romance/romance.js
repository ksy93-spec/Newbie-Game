/* ══════════ 인생 모드 · 인연 트랙 (리뷰 1014, ops/review-1014/romance.md) ══════════
   대학생 · 취업 초반 · 20대 후반 · 30대 소개팅 · 결혼정보회사 · 재회 · 40대 늦은 만남에서 여러 사람을 만나고,
   고른 말에 따라 마음(aff)과 돈 생각 맞춤(fit)이 쌓여 결혼, 비혼, 늦은 결혼에 닿는다. 결혼하면 아이 결정이 이어진다.
   붙이는 곳: prototype/newbie-quest-demo.html, lifeTmi 함수 뒤(하루 루프 앞). ES5 그대로다. 적용: ops/review-1014/romance/apply.mjs
   장면 모양은 MQ 장면과 같다: {bg, cast:[[열쇠,'L'|'C'|'R']], who, text:[..], doc:{t,rows,bad}, choice:{opts:[..]}, fx}
   - 배경은 ART의 bg_ 그림만: apartment bank cafe carlot hometown livingroom meeting modelhouse night office phone road station town weddinghall
   - cast 열쇠: hero halbae gpa gma 같은 그림 열쇠, 그리고 자리표
       @c 이 사건의 상대  @p 지금 사귀는(또는 배우자) 사람  @f 동기 친구  @m 결정사 매니저  @s 직장 선배  @k 첫째 아이
   - 글자 자리표(loveRp): {c} {p} {f} {m} {s} 이름, {c.은} {p.과}처럼 점 뒤에 조사를 쓰면 받침에 맞춰 바꾼다
       (이/가, 은/는, 을/를, 과/와, 아/야, 랑=이랑/랑, 예=이에요/예요, 로=으로/로)
     {ageKo} 지금 나이 한글, {name} 주인공 이름, {yrs} 만난 햇수, {cpar} 상대가 아이에게 엄마/아빠
   - 보기: {a, ok, note, aff, fit, coin, go, then}
       ok:null 은 맞고 틀림이 없는 마음의 선택(엔진 고침: playMQ pick이 등급에 안 센다). 돈 지식이 걸린 보기만 ok:1/0
       aff·fit 은 상대(@c, 없으면 @p)의 마음과 돈 생각 맞춤에 더한다. go는 상태를 바꾼다(loveGo). then은 고른 뒤 이어 틀 장면
   - 장면 need:'free'|'dating'|'notdating' 는 사건을 틀기 직전 상태로 넣고 뺀다. textBy:{상대 id:[..]}는 상대마다 다른 줄
   사실(제도·기관)은 기관 이름만 적고 금액은 쓰지 않았다. 출처와 "확인 필요"는 romance.md 6절. */

var LOVE_ASOF = '2026-10';
var LOVE_AUTO = true;           /* 홈에서 저절로 틀기. 검사 도구는 끈다 */
var LOVE_TH = { confess: 22, propose: 30, engage: 30, engageFit: 3 };

/* ── 1. 사람들 ──
   name: 상대 성별(F/M)마다 이름 하나. 성은 인생 번호로 LOVE_SUR에서 고른다(loveFull).
   art: 지금 있는 그림으로 대신한다. artNew: 챗GPT 시트(ops/review-1014/romance/chatgpt.md)를 넣으면 저절로 바뀐다.
   age: 주인공과의 나이 차. val: 돈 생각(쓰기, 집, 부모, 아이). */
var LOVE_SUR = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오'];
var LOVE_CAST = {
 seo:  { name: { F: '서윤', M: '서준' }, art: { F: 'partnerF', M: 'partnerM' }, artNew: { F: 'lvSeoF', M: 'lvSeoM' }, age: 0,
         job: '사진 동아리 동기, 공무원 시험을 거쳐 구청 주무관', type: '차분한 계획형',
         val: { spend: '저축(월급 절반 적금)', house: '낮음(전세로 충분)', parents: '가깝다(주말마다 본가)', kids: '둘' },
         yes: ['나도.', '근데 나 한동안', '바쁠 거야.'] },
 han:  { name: { F: '하은', M: '한결' }, art: { F: 'mlmf', M: 'peerm' }, artNew: { F: 'lvHanF', M: 'lvHanM' }, age: 1,
         job: '카페 알바 선배, 바리스타, 언젠가 내 가게', type: '밝고 즉흥적',
         val: { spend: '쓰는 편(경험·여행)', house: '없음(동네가 중요)', parents: '일찍 독립, 거리가 있다', kids: '아직 모름' },
         yes: ['진짜?', '나 지금', '엄청 좋아.'] },
 ji:   { name: { F: '지민', M: '지훈' }, art: { F: 'peerf', M: 'peerm' }, artNew: { F: 'lvJiF', M: 'lvJiM' }, age: 0,
         job: '입사 동기(다른 팀), 영업기획', type: '야심 있고 계산이 빠름',
         val: { spend: '쓰고 굴린다(투자 관심)', house: '높음(서울 아파트)', parents: '넉넉, 도움 기대', kids: '하나' },
         yes: ['계산은', '나중에 하자.', '좋아.'] },
 so:   { name: { F: '소연', M: '승우' }, art: { F: 'deskf', M: 'partnerM' }, artNew: { F: 'lvSoF', M: 'lvSoM' }, age: 2,
         job: '대학병원 간호사(3교대)', type: '다정하지만 단단함',
         val: { spend: '철저한 저축(가계부 십 년)', house: '중간(신혼 특공 노림)', parents: '홀어머니께 매달 생활비', kids: '하나' },
         yes: ['저도요.', '근무표부터', '보내 줄게요.'] },
 yoon: { name: { F: '윤아', M: '윤호' }, art: { F: 'partnerF', M: 'fp' }, artNew: { F: 'lvYoonF', M: 'lvYoonM' }, age: 1,
         job: 'IT 개발자', type: '솔직하고 효율을 따짐',
         val: { spend: '큰돈은 아끼고 취미엔 씀', house: '높음(학군지 매매)', parents: '집을 보태 주겠다, 근처 살라는 조건', kids: '둘, 빨리' },
         yes: ['좋아요.', '돌려 말 안 해서', '더 좋아요.'] },
 min:  { name: { F: '민서', M: '민재' }, art: { F: 'peerf', M: 'officem' }, artNew: { F: 'lvMinF', M: 'lvMinM' }, age: 2,
         job: '세무사(결혼정보회사 소개)', type: '신중하고 숫자에 밝음, 은근 낭만',
         val: { spend: '각자 통장 + 공동 통장', house: '청약 가점으로 매매', parents: '어머니가 예단·예물 체면을 챙김', kids: '상의해서, 없어도' },
         yes: ['조건표엔', '없던 답이네요.', '좋아요.'] },
 eun:  { name: { F: '은재', M: '은호' }, art: { F: 'mlmf', M: 'peerm' }, artNew: { F: 'lvEunF', M: 'lvEunM' }, age: 1,
         job: '물리치료사, 동네 러닝 모임', type: '느긋하고 농담이 많음',
         val: { spend: '아이 학비와 노후 먼저', house: '지금 집 유지', parents: '연로한 부모님 돌봄 중', kids: '중학생 아이 하나(혼자 키움)' },
         yes: ['아이한테도', '천천히 말할게요.', '좋아요.'] }
};
/* 곁에 있는 사람들. 친구는 상대 그림과 겹치지 않게 고른다 */
var LOVE_PEOPLE = {
 friend:  { F: { key: 'peerm', name: '현수' }, M: { key: 'peerf', name: '수빈' } },
 senior:  { key: 'fp', name: '김 과장' },
 manager: { key: 'deskf', name: '오 실장' }
};

/* ── 2. 만남 사건 ──
   age: 틀 수 있는 나이 [처음, 끝]. need(H): 조건. c: 상대 id, '@p'(지금 상대), 함수(H→id). extra:1이면 그해 다른 사건 뒤에도 뜬다.
   fin: 마지막 장면을 지나면 부르는 go. LOVE_ORDER가 같은 해 우선순위다. */
var LOVE_EVENTS = {

 /* ═══ 대학생 · 스무 살 언저리 ═══ */
 club: { age: [20, 21], c: 'seo', title: '사진 동아리', sub: '첫 출사',
  need: function (H) { return H.free && H.student && !H.met('seo'); },
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
     text: ['{ageKo}, 삼월.', '동아리 박람회', '천막이 줄지었다.'] },
   { bg: 'town', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['사진 동아리예요.', '카메라 없어도', '폰이면 돼요.'] },
   { bg: 'town', cast: [['hero', 'L'], ['@f', 'R']], who: '동기 {f}',
     text: ['가입비 내고', '회비는 따로래.', '그래도 갈래?'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['첫 출사 뒤풀이,', '정산할 총무가', '아직 없어요.'],
     choice: { opts: [
      { a: '내가 정산 맡을게요. 영수증은 단톡에 올리고', ok: null, aff: 15, fit: 1,
        note: '{c.이} 고개를 끄덕였다. 돈 얘기를 숨기지 않는 사람. 첫인상이 그렇게 남았다.' },
      { a: '사진 찍으러 같이 가요', ok: null, aff: 12,
        note: '둘이 골목을 한참 걸었다. {c.은} 셔터보다 걸음이 느렸다.' },
      { a: '인사만 하고 먼저 간다', ok: null, aff: 3,
        note: '그날은 거기까지. 동아리 단톡방에 이름 하나가 늘었다.' } ] } },
   { bg: 'night', cast: [['hero', 'C']],
     text: ['그날 찍은 사진 중', '흔들린 한 장을', '지우지 않았다.'] } ] },

 alba: { age: [20, 22], c: 'han', title: '카페 알바', sub: '주휴수당',
  need: function (H) { return H.free && !H.met('han') && (H.path === '고졸' || H.age >= 21); },
  scenes: [
   { bg: 'cafe', fx: 'fade', cast: [['hero', 'C']],
     text: ['{ageKo}.', '집 앞 카페에서', '알바를 시작했다.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['나 여기 2년째야.', '모르는 거 있으면', '다 물어봐.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     doc: { t: '근로계약서 (요약)', rows: [['일하는 시간', '주 15시간 이상'], ['주휴수당', '적혀 있지 않음'], ['서명', '아직']], bad: [1] },
     text: ['근데 사장님이', '우린 주휴수당', '없다더라?'],
     choice: { opts: [
      { a: '주 15시간 넘으면 주휴수당이 붙는대. 같이 물어보자', ok: 1, aff: 15, fit: 1,
        note: '한 주 정해진 근로가 15시간 이상이고 다 나오면 주휴수당이 붙는다(근로기준법, 고용노동부). 계약서에 적어 달라고 둘이 같이 말했다.' },
      { a: '괜히 말했다가 잘리면 어떡해', ok: 0, aff: 5,
        note: '모르고 넘기면 받을 돈을 못 받는다. 말하기 어려우면 고용노동부 상담센터 1350에 먼저 묻는다.' },
      { a: '{c.이} 말해 줘. 나는 뒤에 있을게', ok: 0, aff: -3,
        note: '{c.이} 혼자 사장님 앞에 섰다. 받긴 했지만 그날 {c.은} 조금 서운해 보였다.' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['마감하고', '떡볶이 먹을래?', '오늘은 내가 살게.'],
     choice: { opts: [
      { a: '좋아. 다음엔 내가 살게', ok: null, aff: 8,
        note: '번갈아 사기로 했다. {c.은} 다음 약속을 그 자리에서 잡았다.' },
      { a: '오늘은 피곤해서 다음에', ok: null, aff: 1,
        note: '{c.은} "그래, 다음에!" 하고 웃었다. 다음은 생각보다 늦게 왔다.' } ] } } ] },

 team: { age: [21, 22], c: 'seo', title: '축제 사진전', sub: '그날 밤의 말',
  need: function (H) { return H.free && H.met('seo') && !H.gone('seo') && H.aff('seo') >= 10; },
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
     text: ['{ageKo}, 가을.', '축제 사진전', '준비로 밤을 샜다.'] },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['전시 끝나면', '나 휴학하고', '시험 준비해.'] },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['공무원 시험.', '알바하면서', '두 해만 해 보려고.'],
     choice: { opts: [
      { a: '그럼 전시 사진은 내가 끝까지 같이 걸게', ok: null, aff: 8,
        note: '새벽 세 시, 마지막 액자를 둘이 같이 걸었다.' },
      { a: '두 해면 금방이야. 학원비는 알아봤어?', ok: null, aff: 5, fit: 1,
        note: '{c.은} 인강과 학원 값을 적은 메모를 보여 줬다. 생각보다 꼼꼼했다.' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '나',
     text: ['저기, {c}...'],
     choice: { opts: [
      { a: '좋아한다고 말한다', ok: null, go: 'confess' },
      { a: '시험 끝나면 밥 사 달라고만 한다', ok: null, aff: 5,
        note: '{c.은} "꼭 살게" 하고 웃었다. 하지 못한 말은 사진첩에 남았다.' },
      { a: '응원한다고 말하고 돌아선다', ok: null, go: 'friend',
        note: '좋은 동기로 남았다. 그것도 하나의 답이었다.' } ] } } ] },

 han2: { age: [21, 23], c: 'han', title: '여행 가자', sub: '할부 열두 달',
  need: function (H) { return H.free && H.met('han') && !H.gone('han') && H.aff('han') >= 10; },
  scenes: [
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['방학 때', '제주도 가자!', '항공권 특가 떴어.'] },
   { bg: 'phone', cast: [['hero', 'C']],
     doc: { t: '여행 예산 (예시)', rows: [['항공', '특가'], ['숙소', '{c} 추천'], ['결제', '카드 할부'], ['통장', '알바비 조금']], bad: [2] },
     text: ['{c.은} 벌써', '숙소까지', '골라 뒀다.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['할부로 하면', '한 달에 얼마', '안 돼!'],
     choice: { opts: [
      { a: '모은 만큼만 가자. 여행 통장을 같이 붓자', ok: 1, aff: 8, fit: 2,
        note: '할부는 다음 달 알바비를 당겨 쓰는 일이다. 무이자가 아니면 수수료도 붙는다(금융감독원 파인). {c.은} 아쉬워하다가 통장 이름을 "제주"로 지었다.' },
      { a: '좋아, 할부로 가자', ok: 0, aff: 10, fit: -1,
        note: '여행은 좋았다. 석 달 동안 알바비가 카드값으로 나갔다. {c.이} 먼저 "다음엔 모아서 가자" 했다.' },
      { a: '나는 이번엔 빠질게', ok: null, aff: 2,
        note: '{c.은} 친구들과 다녀와서 귤 한 상자를 건넸다.' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['마감 뒤', '셔터를 내리다', '눈이 마주쳤다.'],
     choice: { opts: [
      { a: '사귀자고 말한다', ok: null, go: 'confess' },
      { a: '그냥 웃고 만다', ok: null, aff: 2, go: 'soft',
        note: '그 겨울, {c.은} 다른 동네 카페로 옮겼다. 연락은 가끔 했다.' } ] } } ] },

 grad: { age: [23, 24], c: '@p', title: '졸업 앞에서', sub: '둘의 계획',
  need: function (H) { return H.dating && (H.p === 'seo' || H.p === 'han') && H.age > H.since; },
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
     text: ['{ageKo}, 겨울.', '졸업 사진을', '찍었다.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     textBy: { seo: ['시험 한 번', '더 보려고.', '독서실 끊었어.'], han: ['나 바리스타', '자격증 땄어.', '언젠간 내 가게.'] },
     text: ['나 다른 도시로', '갈 것 같아.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['우리', '어떡할까?'],
     choice: { opts: [
      { a: '멀어도 만나자. 데이트 통장은 반씩 붓자', ok: null, aff: 10, fit: 1,
        note: '주말마다 버스를 탔다. 차비는 데이트 통장에서 나갔다. 둘 다 그 통장을 아꼈다.' },
      { a: '네 일이 먼저야. 바쁜 철엔 연락을 줄이자', ok: null, aff: 5,
        note: '연락은 줄었고 믿음은 그대로였다. 시험 날 아침엔 문자 한 줄을 보냈다.' },
      { a: '각자 자리 잡을 때까지 멈추자', ok: null, go: 'part',
        note: '울지 않으려고 커피만 마셨다. 사진첩 폴더는 지우지 않았다.' } ] } } ] },

 /* ═══ 사귀는 동안 (누구와든) ═══ */
 dtong: { age: [22, 39], c: '@p', title: '데이트 통장', sub: '누가 낼까',
  need: function (H) { return H.dating && H.age > H.since; },
  scenes: [
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['우리 데이트비,', '이번 달에', '꽤 나왔더라.'] },
   { bg: 'phone', cast: [['hero', 'C']], who: '나',
     doc: { t: '이번 달 데이트 (예시)', rows: [['밥·카페', '거의 한 사람'], ['영화', '반반'], ['선물', '각자'], ['합계', '생각보다 큼']], bad: [0] },
     text: ['어떻게', '나눌까?'],
     choice: { opts: [
      { a: '모임통장을 만들어 달마다 같이 넣자', ok: null, aff: 8, fit: 2,
        note: '한 통장에 넣고 거기서 쓴다. 누가 더 냈는지 셈이 사라졌다. 버는 돈 차이가 크면 비율로 넣어도 된다.' },
      { a: '지금 더 버는 내가 더 낼게', ok: null, aff: 6, fit: 1,
        note: '{c.은} 고마워하면서도 "나도 낼 수 있어" 했다. 둘이 비율을 다시 적었다.' },
      { a: '그때그때 번갈아 내자', ok: null, aff: 5,
        note: '편했다. 다만 누가 마지막에 냈는지 가끔 헷갈렸다.' } ] } } ] },

 anniv: { age: [23, 39], c: '@p', title: '기념일', sub: '선물과 할부',
  need: function (H) { return H.dating && H.age >= H.since + 2; },
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
     text: ['{ageKo}.', '{c.과} 만난 지', '{yrs}년째.'] },
   { bg: 'phone', cast: [['hero', 'C']], who: '나',
     text: ['기념일 선물,', '명품 지갑을', '할부로 살까?'],
     choice: { opts: [
      { a: '할부 대신 둘이 가고 싶던 곳에 갈 여행 적금을 든다', ok: null, aff: 10, fit: 2,
        note: '{c.은} 적금 통장 첫 장을 사진으로 찍어 뒀다.' },
      { a: '무이자 할부로 지갑을 산다', ok: null, aff: 8,
        note: '{c.은} 좋아했다. 할부 문자는 열두 달 동안 왔다.' },
      { a: '손편지와 저녁 한 끼', ok: null, aff: 9, fit: 1,
        note: '{c.은} 편지를 다 읽고 한참 말이 없었다. 좋은 쪽으로.' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['내년에도', '이렇게 하자.'] } ] },

 /* ═══ 취업 초반 ═══ */
 peer: { age: [24, 25], c: 'ji', title: '입사 동기', sub: '첫 회식',
  need: function (H) { return H.free && H.worker && !H.met('ji'); },
  scenes: [
   { bg: 'office', fx: 'fade', cast: [['hero', 'C']],
     text: ['{ageKo}.', '입사 동기', '단톡방이 생겼다.'] },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['다른 팀', '{c.예}.', '2차 가요?'] },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['저는 회사 대출로', '오피스텔 들어가요.', '월세 아까워서.'] },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['다음 달에', '청약 공부', '같이 할래요?'],
     choice: { opts: [
      { a: '좋아요. 청약통장부터 확인해 봐요', ok: null, aff: 12, fit: 1,
        note: '{c.은} 말이 빨랐고 숫자는 더 빨랐다. 다음 주 점심, 둘이 청약홈 화면을 같이 봤다.' },
      { a: '저는 아직 집 생각은 없어요', ok: null, aff: 4, fit: -1,
        note: '{c.은} "그럴 수 있죠" 했다. 그래도 회식마다 옆자리였다.' },
      { a: '사내 연애는 안 하는 걸로', ok: null, go: 'friend',
        note: '좋은 동기 하나가 생겼다. 회사 생활엔 그것도 크다.' } ] } } ] },

 ji2: { age: [25, 27], c: 'ji', title: '영끌', sub: '지금 아니면 끝?',
  need: function (H) { return H.free && H.met('ji') && !H.gone('ji') && H.aff('ji') >= 10; },
  scenes: [
   { bg: 'phone', cast: [['hero', 'C']], who: '[톡] {c}',
     text: ['이번 분양 봤어?', '지금 아니면', '끝이래.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     doc: { t: '{c}의 계산', rows: [['계약금', '신용대출'], ['중도금', '집단대출'], ['잔금', '그때 가서'], ['달마다 갚을 돈', '안 셈']], bad: [0, 3] },
     text: ['신용대출까지', '끌어오면', '계약금은 돼.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '나',
     text: ['음...'],
     choice: { opts: [
      { a: '달마다 갚을 돈부터 같이 셈해 보자. DSR에 신용대출도 들어가', ok: 1, aff: 8, fit: 2,
        note: 'DSR은 모든 대출의 한 해 원리금을 소득과 견준다. 신용대출도 들어간다(금융위원회). {c.은} 계산기를 두드리다 "좀 더 모으자" 했다.' },
      { a: '너라면 잘할 거야. 응원해', ok: 0, aff: 6, fit: -1,
        note: '{c.은} 계약했다. 그해 금리가 올랐고 {c.은} 점심을 편의점에서 먹기 시작했다.' },
      { a: '나는 그렇게까지는 못 해', ok: null, aff: 2, fit: -1,
        note: '{c.은} "너는 너무 조심해" 했다. 서로 다른 걸 처음 알았다.' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['회식이 끝나고', '둘만 남았다.'],
     choice: { opts: [
      { a: '사귀자고 말한다', ok: null, go: 'confess' },
      { a: '좋은 동기로 남는다', ok: null, go: 'friend',
        note: '다음 날도 웃으며 인사했다. 그걸로 됐다.' } ] } } ] },

 han3: { age: [26, 29], c: 'han', title: '가게 자리', sub: '보증',
  need: function (H) { return H.p === 'han' || (H.free && H.met('han') && H.aff('han') >= 20 && H.gone('han') !== 'friend'); },
  scenes: [
   { bg: 'town', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['자리 찾았어!', '역 앞 2층.', '권리금이 좀 있어.'] },
   { bg: 'bank', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     doc: { t: '대출 서류 (예시)', rows: [['대출', '창업 자금'], ['보증인', '빈칸'], ['보증 범위', '대출 전액'], ['못 갚으면', '보증인이 갚음']], bad: [2, 3] },
     text: ['대출 받으려면', '보증인이 하나', '필요하대.'] },
   { bg: 'bank', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['너 이름만', '빌려주면 돼.'],
     choice: { opts: [
      { a: '보증은 못 서. 대신 정책자금과 상권부터 같이 보자', ok: 1, aff: 4, fit: 2,
        note: '보증을 서면 빌린 사람이 못 갚을 때 내가 갚는다(금융감독원). 소상공인 정책자금과 상권정보는 소상공인시장진흥공단에서 본다. {c.은} 서운해하다가 일주일 뒤 상권 지도를 들고 왔다.' },
      { a: '너니까 서 줄게', ok: 0, aff: 8, fit: -2, coin: -100,
        note: '가게는 열었다. 두 해 뒤 문을 닫던 날, 독촉장이 내 이름으로도 왔다.' },
      { a: '우리 사이에 돈 얘기는 하지 말자', ok: 0, aff: -4, fit: -1,
        note: '말하지 않은 돈은 사라지지 않는다. {c.은} 다른 보증인을 찾았고, 둘 사이에 말 못 한 게 하나 생겼다.' } ] } } ] },

 /* ═══ 20대 후반 · 소개 ═══ */
 so1: { age: [27, 29], c: 'so', title: '선배의 소개', sub: '첫 만남과 계산서',
  need: function (H) { return H.free && H.worker && !H.met('so'); },
  scenes: [
   { bg: 'office', cast: [['hero', 'L'], ['@s', 'R']], who: '{s}',
     text: ['주말에 시간 돼?', '좋은 사람 있어.', '병원에서 일해.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['3교대라', '약속 잡기가', '늘 어려워요.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['두 시간이', '금방 갔다.', '계산서가 왔다.'],
     choice: { opts: [
      { a: '오늘은 제가 낼게요', ok: null, aff: 7,
        note: '{c.은} "그럼 다음은 제가요" 하고 날짜를 먼저 잡았다.' },
      { a: '반씩 내요', ok: null, aff: 8, fit: 1,
        note: '{c.은} 웃으며 송금 버튼을 눌렀다. "이게 편해요."' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['저는 가계부를', '십 년째 써요.', '이상해요?'],
     choice: { opts: [
      { a: '저도 써 볼까요. 비상금은 얼마나 둬요?', ok: null, aff: 8, fit: 2,
        note: '{c.은} 석 달 치 생활비를 비상금으로 둔다고 했다. 그날 처음으로 내 통장을 열어 봤다.' },
      { a: '저는 남는 걸 저축해요', ok: null, aff: 3, fit: -1,
        note: '{c.은} 잠깐 말이 없다가 "써 보면 달라요" 했다. 다음 약속은 잡혔다.' } ] } } ] },

 so2: { age: [28, 30], c: 'so', title: '어머니께 보내는 돈', sub: '숨기지 않는 사람',
  need: function (H) { return H.free && H.met('so') && !H.gone('so') && H.aff('so') >= 12; },
  scenes: [
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['나 매달', '어머니께', '생활비 보내.'] },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['혼자 사시거든.', '결혼해도', '이건 계속할 거야.'],
     choice: { opts: [
      { a: '그건 네 몫이야. 결혼하면 금액은 같이 정하자', ok: null, aff: 12, fit: 2,
        note: '부모님께 드리는 돈은 숨기지 않고 둘의 예산에 한 줄로 올린다. 금액과 기간을 같이 정하면 서운함이 준다.' },
      { a: '나중에 우리 돈이 모자라면?', ok: null, aff: 2, fit: 1,
        note: '{c.은} "그때 같이 고민하자" 했다. 걱정을 말한 건 잘했다. 말투가 조금 차가웠을 뿐.' },
      { a: '그건 좀 부담된다', ok: null, aff: -8, fit: -1,
        note: '{c.은} "말해 줘서 고마워" 했다. 그 뒤로 연락이 조금씩 줄었다.' } ] } },
   { bg: 'town', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['병원 앞에서', '퇴근을 기다렸다.'],
     choice: { opts: [
      { a: '사귀자고 말한다', ok: null, go: 'confess' },
      { a: '조금 더 천천히 만난다', ok: null, aff: 3,
        note: '{c.은} 근무표를 보내 왔다. 쉬는 날에 동그라미가 쳐 있었다.' } ] } } ] },

 reunion1: { age: [27, 30], c: function (H) { return H.goneOf(['seo', 'han'], ['part', 'soft']); }, title: '동기 결혼식', sub: '다시 만난 사람',
  need: function (H) { return H.free && !!H.goneOf(['seo', 'han'], ['part', 'soft']); },
  scenes: [
   { bg: 'weddinghall', fx: 'fade', cast: [['hero', 'C']],
     text: ['{ageKo}.', '동기 결혼식', '뒷줄에 앉았다.'] },
   { bg: 'weddinghall', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     textBy: { seo: ['오랜만이야.', '나 그 시험', '붙었어.'], han: ['오랜만!', '나 이제', '가게 준비해.'] },
     text: ['오랜만이야.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['그때 우리', '참 어렸지.'],
     choice: { opts: [
      { a: '그때 못 한 말이 있다고 말한다', ok: null, aff: 10, go: 'confess' },
      { a: '잘 지내서 다행이라고 말한다', ok: null, go: 'friend',
        note: '커피를 다 마시고 각자 지하철을 탔다. 마음이 조금 가벼워졌다.' } ] } } ] },

 /* ═══ 결혼 이야기 ═══ */
 propose: { age: [26, 39], c: '@p', title: '우리 얘기', sub: '빚·연봉·부모님',
  need: function (H) { return H.dating && H.age > H.since && H.aff(H.p) >= LOVE_TH.propose && !H.L.propTry; },
  scenes: [
   { bg: 'livingroom', fx: 'fade', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['{ageKo}.', '{c.과} 만난 지', '{yrs}년.'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['결혼 얘기', '하기 전에', '돈 얘기부터 하자.'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'R']], who: '나',
     doc: { t: '둘이 쓴 표', rows: [['모은 돈', '각자 적기'], ['빚', '학자금·할부 다'], ['연봉', '숫자 그대로'], ['부모님', '도움·부양 여부']], bad: [] },
     text: ['빚도', '적어야 해?'],
     choice: { opts: [
      { a: '빚까지 다 적는다', ok: 1, aff: 5, fit: 2,
        note: '결혼 뒤에 알게 된 빚은 액수보다 믿음을 더 깎는다. 내 신용정보는 신용평가회사 누리집이나 앱에서 직접 떼어 보여 줄 수 있다(조회 방법 확인 필요).' },
      { a: '모은 돈만 적고, 빚은 갚고 나서 말한다', ok: 0, fit: -1,
        note: '숨긴 빚은 언젠가 나온다. 갚고 나서 말하면 "왜 그때 말 안 했어"가 남는다.' } ] } },
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     textBy: { seo: ['우리 부모님이', '전세금 조금', '보태 주신대.'], ji: ['우리 집에서', '집 살 때', '보태 준대.'],
               so: ['어머니 생활비는', '계속 보낼 거야.', '금액 정하자.'], yoon: ['부모님이 집을', '보태 주신대.', '근처 살면.'],
               min: ['우리 엄마가', '예단은 꼭', '하재.'], han: ['나 가게 대출이', '조금 남았어.'] },
     text: ['부모님 얘기도', '해야겠지?'],
     choice: { opts: [
      { a: '부모님 돈은 받는 건지 빌리는 건지 정하고 종이로 남기자', ok: 1, fit: 2,
        note: '부모님께 받은 돈은 증여면 신고하고, 빌린 거면 차용증과 이자 기록을 남긴다(국세청). 혼인할 때 부모님 증여에는 따로 공제가 있다(국세청, 한도 확인 필요).' },
      { a: '부모님 일은 각자 알아서 하자', ok: null,
        note: '편해 보였지만 큰돈은 결국 둘의 돈이 된다. {c.은} "그래도 같이 알고는 있자" 했다.' },
      { a: '양가 똑같이 맞추자', ok: null, fit: 1,
        note: '똑같이는 쉽지 않다. 형편이 다르면 숫자보다 마음을 맞춘다. 그래도 표에 적은 건 잘했다.' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '나',
     text: ['그래서', '말인데...'],
     choice: { opts: [
      { a: '결혼하자고 말한다', ok: null, go: 'engage' },
      { a: '아직은 아니라고 말한다', ok: null, go: 'wait',
        note: '{c.은} "그래, 우리 속도대로" 했다. 표는 서랍에 넣었다.' } ] } } ] },

 propose2: { age: [27, 40], c: '@p', title: '한 해 뒤', sub: '다시 꺼낸 표',
  need: function (H) { return H.dating && H.L.propTry === 1 && H.age > (H.L.propAge || 0); },
  scenes: [
   { bg: 'cafe', fx: 'fade', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['{ageKo}.', '{c.과} 다시', '마주 앉았다.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['작년 그 표,', '나 다시 봤어.'],
     choice: { opts: [
      { a: '이번엔 둘이 처음부터 다시 쓰자', ok: null, fit: 2, aff: 5, go: 'engage2' },
      { a: '우리 여기까지 하자', ok: null, go: 'part',
        note: '오래 걸었다. 헤어지는 말도 둘이 같이 정했다.' } ] } } ] },

 parents: { age: [26, 40], c: '@p', extra: 1, title: '인사', sub: '예단·예물·축의금',
  need: function (H) { return H.engaged && H.age > H.L.engAt; },
  scenes: [
   { bg: 'hometown', fx: 'fade', cast: [['hero', 'L'], ['gma', 'R']], who: '어머니',
     text: ['그래서', '언제 인사 오니?'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'C'], ['gpa', 'R']], who: '아버지',
     text: ['예단은', '어떻게', '할 거냐?'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     doc: { t: '예단·예물 (집마다 다름)', rows: [['예단', '생략·간소·관례'], ['예물', '반지 하나'], ['함', '생략 가능'], ['정하는 사람', '우리 둘']], bad: [] },
     text: ['우리 둘이', '먼저 정해서', '말씀드리자.'],
     choice: { opts: [
      { a: '둘이 정한 예산을 먼저 말씀드리고 양가에 같은 말로 전한다', ok: 1, aff: 5, fit: 2,
        note: '예단·예물은 법으로 정한 것도, 정해진 금액도 없다. 둘이 기준을 먼저 정해 같은 말로 전하면 오해가 준다.' },
      { a: '부모님 뜻대로 하시게 둔다', ok: 0, fit: -1,
        note: '양가 뜻이 다르면 둘이 말을 나르는 통로가 된다. 오가는 말이 커질수록 둘의 예산이 흔들린다.' },
      { a: '다 생략하자고 통보한다', ok: 0, aff: -2,
        note: '생략도 방법이다. 다만 통보는 상처가 된다. 이유를 같이 말씀드리는 쪽이 낫다.' } ] } },
   { bg: 'weddinghall', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['축의금 장부를', '누가 맡을지도', '정했다.'],
     choice: { opts: [
      { a: '부모님 손님 몫은 부모님께, 우리 손님 몫은 우리 통장에', ok: null, fit: 1,
        note: '집마다 다르다. 미리 정해 두면 식 끝나고 봉투 앞에서 다투지 않는다.' },
      { a: '다 합쳐서 식비부터 낸다', ok: null, fit: 1,
        note: '그것도 방법이다. 장부는 꼭 적는다. 답례하고 남의 경조사 갈 때 쓴다.' } ] } } ] },

 newhome: { age: [26, 40], c: '@p', extra: 1, title: '신혼집', sub: '전세·매매·대출',
  need: function (H) { return H.engaged && H.seen('parents'); },
  scenes: [
   { bg: 'phone', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['신혼집 앱을', '밤마다 연다.'] },
   { bg: 'bank', cast: [['hero', 'L'], ['@c', 'C'], ['@m2', 'R']], who: '은행 창구 직원',
     doc: { t: '신혼 집 돈 (요약)', rows: [['신혼 전세자금', '주택도시기금'], ['대상', '혼인 7년·예정 3개월'], ['소득·자산', '기준 확인 필요'], ['신혼 특공', '청약홈 공고별']], bad: [] },
     text: ['신혼부부 전용', '전세자금 대출도', '있어요.'] },
   { bg: 'bank', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     textBy: { ji: ['처음부터', '사는 게', '낫지 않아?'], yoon: ['처음부터', '사는 게', '낫지 않아?'] },
     text: ['전세로 시작해서', '같이 모으자.'],
     choice: { opts: [
      { a: '달마다 갚을 돈과 소득 기준부터 셈하고 정책 대출을 먼저 본다', ok: 1, fit: 2,
        note: '신혼부부 전세자금·구입자금 대출은 주택도시기금이 소득·자산 기준을 본다. 기준은 자주 바뀌니 기금 누리집과 은행에서 확인한다.' },
      { a: '둘 연봉이면 은행이 알아서 한도를 주겠지', ok: 0, fit: -1,
        note: '한도는 갚을 수 있는 돈이 아니다. 금리가 오르면 한도 끝까지 빌린 집이 먼저 흔들린다.' } ] } },
   { bg: 'apartment', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['계약 전날,', '등기부를', '둘이 같이 뗐다.'],
     choice: { opts: [
      { a: '계약하고 이삿날 바로 전입신고와 확정일자를 한다', ok: 1, fit: 1,
        note: '전세 보증금은 계약서, 전입신고, 확정일자가 지킨다(주택임대차보호법). 둘이 낸 돈 비율은 따로 적어 둔다.' },
      { a: '바쁘니 전입은 결혼식 끝나고', ok: 0,
        note: '전입이 늦으면 그사이 생긴 담보에 밀릴 수 있다. 이삿날 바로 한다.' } ] } } ] },

 /* ═══ 30대 · 혼자, 소개팅, 결정사 ═══ */
 solo: { age: [31, 36], c: null, title: '서른의 식탁', sub: '나는 어떻게 살까',
  need: function (H) { return H.free && !H.L.soloAsk; },
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
     text: ['{ageKo}.', '청첩장이 한 달에', '두 장씩 온다.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@f', 'R']], who: '동기 {f}',
     text: ['너는', '결혼 생각 있어?', '나는 반반.'] },
   { bg: 'night', cast: [['hero', 'C']], who: '나',
     text: ['나는 어떻게', '살고 싶더라?'] },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 결혼은', '숙제가 아니라', '고르는 거야.'],
     choice: { opts: [
      { a: '혼자 사는 삶을 내 방식으로 설계한다', ok: null, go: 'solo',
        note: '혼자여도 빈칸 없는 삶. 연금, 보험, 비상 연락처를 내 이름으로 챙기기로 했다.' },
      { a: '열어 둔다. 좋은 사람이 오면 만난다', ok: null, go: 'open',
        note: '서두르지 않기로 했다. 만나는 일도 혼자 사는 일도 같은 무게로 두었다.' },
      { a: '결혼정보회사 상담을 받아 본다', ok: null, go: 'agencyQ',
        note: '다음 주 토요일, 상담 예약 문자가 왔다.' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['어느 쪽이든', '돈 얘기는', '똑같이 해야 하네.'] } ] },

 intro2: { age: [31, 34], c: 'yoon', title: '서른의 소개팅', sub: '연봉을 묻는 사람',
  need: function (H) { return H.free && !H.met('yoon'); },
  scenes: [
   { bg: 'phone', cast: [['hero', 'C']], who: '[톡] {f}',
     text: ['내 회사 동료', '소개해 줄까?', '착한데 직진이야.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['개발 일 해요.', '돌려 말하는 걸', '잘 못해요.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['솔직히 연봉', '물어봐도', '돼요?'],
     choice: { opts: [
      { a: '아직 이르다고 말하고, 돈 쓰는 습관부터 얘기한다', ok: null, aff: 10, fit: 1,
        note: '{c.은} "그게 더 중요하죠" 했다. 둘 다 적금 하나, 취미에 쓰는 돈 하나가 있었다.' },
      { a: '숫자 그대로 말한다', ok: null, aff: 8,
        note: '{c.도} 자기 연봉을 말했다. 솔직해서 편했다. 조금 빨랐다는 생각도 들었다.' },
      { a: '그런 질문은 불편하다고 말한다', ok: null, aff: 5,
        note: '{c.은} 바로 사과했다. "제가 서둘렀네요." 그 말이 오히려 좋았다.' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['다음 주에', '또 볼래요?'],
     choice: { opts: [
      { a: '좋아요', ok: null, aff: 8, note: '{c.은} 그 자리에서 식당을 예약했다.' },
      { a: '조금 생각해 볼게요', ok: null, aff: 0, note: '{c.은} "편할 때 연락 주세요" 했다.' } ] } } ] },

 yoon2: { age: [32, 35], c: 'yoon', title: '부모님의 조건', sub: '집을 보태 주신대',
  need: function (H) { return H.met('yoon') && !H.gone('yoon') && H.aff('yoon') >= 12 && (H.free || H.p === 'yoon') && !H.engaged && !H.married; },
  scenes: [
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['우리 부모님이', '집값을 보태', '주신대.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     doc: { t: '부모님 제안', rows: [['돈', '집값 일부'], ['조건', '부모님 집 근처'], ['명의', '부모님'], ['서류', '없음']], bad: [2, 3] },
     text: ['대신 근처에', '살라고 하시고,', '명의는 부모님.'],
     choice: { opts: [
      { a: '고맙지만 조건은 둘이 정하자. 받는 건지 빌리는 건지 종이로 남기자', ok: 1, aff: 8, fit: 2,
        note: '명의가 부모님이면 그 집은 부모님 것이다. 받으면 증여로 신고하고, 빌리면 차용증과 이자를 남긴다(국세청). {c.은} "부모님께 같이 가서 말하자" 했다.' },
      { a: '감사히 받고 근처에 산다', ok: null, aff: 5,
        note: '집 걱정은 덜었다. 주말마다 저녁을 같이 먹었다. 좋은 날도, 숨 막히는 날도 있었다.' },
      { a: '그 조건이면 받지 말자', ok: null, aff: 2, fit: 1,
        note: '{c.은} 한참 있다가 "부모님은 서운하시겠다" 했다. 둘이 모은 돈으로 작게 시작하기로 했다.' } ] } },
   { bg: 'night', need: 'free', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['헤어지는 길,', '{c.이}', '뒤를 돌아봤다.'],
     choice: { opts: [
      { a: '사귀자고 말한다', ok: null, go: 'confess' },
      { a: '천천히 더 만난다', ok: null, aff: 3, note: '{c.은} "천천히도 좋아요" 했다.' } ] } } ] },

 agency: { age: [32, 37], c: 'min', title: '결혼정보회사', sub: '가입 계약서',
  need: function (H) { return H.free && !H.met('min') && (H.L.agencyQ || H.age >= 34); },
  scenes: [
   { bg: 'meeting', fx: 'fade', cast: [['hero', 'L'], ['@m', 'R']], who: '{m}',
     text: ['회원님 조건이면', '이번 달에', '세 분 소개돼요.'] },
   { bg: 'meeting', cast: [['hero', 'L'], ['@m', 'R']], who: '{m}',
     doc: { t: '회원 가입 계약서', rows: [['가입비', '등급별'], ['소개 횟수', '몇 회'], ['중도 해지', '환불 기준 ?'], ['업체', '신고 번호']], bad: [2] },
     text: ['오늘 가입하시면', '한 번 더', '소개해 드려요.'],
     choice: { opts: [
      { a: '환불 기준과 소개 횟수를 계약서에 적어 받고, 신고한 업체인지 본다', ok: 1, go: 'join',
        note: '국내 결혼중개업체는 시·군·구에 신고하고 계약서를 줘야 한다(결혼중개업법, 여성가족부). 중도 해지 환불은 공정거래위원회 표준약관을 보고, 다툼은 한국소비자원 1372에 묻는다(세부 기준 확인 필요).' },
      { a: '오늘만 혜택이라니 바로 가입한다', ok: 0, go: 'join',
        note: '"오늘만"은 조건이 아니라 재촉이다. 환불 조항을 못 본 채 서명했다.' },
      { a: '가입은 안 하고 상담만 받고 나온다', ok: null, go: 'noagency',
        note: '조건표를 들고 나왔다. 내가 뭘 바라는지 적어 본 것만은 남았다.' } ] } } ] },

 min2: { age: [33, 38], c: 'min', title: '예물과 청약', sub: '숫자에 밝은 사람',
  need: function (H) { return H.met('min') && !H.gone('min') && H.aff('min') >= 8 && (H.free || H.p === 'min') && !H.engaged && !H.married; },
  scenes: [
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['청약 가점', '계산해 봤어요.', '혼자면 낮아요.'] },
   { bg: 'phone', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     doc: { t: '{c}의 메모', rows: [['통장', '각자 + 공동 하나'], ['청약', '신혼 특공 검토'], ['예물', '어머니는 세트'], ['명의', '둘이 같이?']], bad: [] },
     text: ['우리 엄마가', '예물은 세트로', '하재요.'],
     choice: { opts: [
      { a: '예물은 둘이 정한 예산 안에서. 어머니께는 같이 말씀드리자', ok: null, aff: 10, fit: 2,
        note: '{c.은} "같이 가 주면 든든하죠" 했다. 둘의 예산표에 줄이 하나 늘었다.' },
      { a: '어머니 뜻대로 해 드리자', ok: null, aff: 6,
        note: '{c.은} 고마워하면서도 "그럼 집 예산에서 빠져요" 하고 숫자를 바로 고쳤다.' },
      { a: '예물은 없어도 된다고 본다', ok: null, aff: 8, fit: 1,
        note: '{c.은} "저도요. 엄마 설득이 문제죠" 하고 웃었다.' } ] } },
   { bg: 'night', need: 'free', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['조건표에 없는', '얘기만', '세 시간 했다.'],
     choice: { opts: [
      { a: '사귀자고 말한다', ok: null, go: 'confess' },
      { a: '한 번 더 만나 보고 정한다', ok: null, aff: 3, note: '{c.은} 다음 약속을 달력에 적었다.' } ] } } ] },

 reunion2: { age: [35, 39], c: function (H) { return H.goneOf(['ji', 'so', 'seo', 'han'], ['part', 'soft', 'friend']); }, title: '환승역', sub: '다시 만난 사람',
  need: function (H) { return H.free && !!H.goneOf(['ji', 'so', 'seo', 'han'], ['part', 'soft', 'friend']); },
  scenes: [
   { bg: 'station', fx: 'fade', cast: [['hero', 'C']],
     text: ['{ageKo}.', '환승역에서', '아는 얼굴을 봤다.'] },
   { bg: 'station', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     textBy: { ji: ['영끌했던 집,', '작년에 팔았어.', '이제 좀 가벼워.'], seo: ['지방 발령', '끝나고', '다시 왔어.'],
               han: ['가게 접고', '회사 다녀.', '그래도 괜찮아.'], so: ['병원 옮겼어.', '이제 낮 근무만 해.'] },
     text: ['오랜만이다.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['그때 우리', '왜 그렇게', '조급했을까.'],
     choice: { opts: [
      { a: '다시 만나 보자고 말한다', ok: null, aff: 12, go: 'confess' },
      { a: '연락하며 지내자고 한다', ok: null, go: 'friend',
        note: '단톡방 대신 둘만의 대화방이 하나 생겼다. 생일마다 커피 쿠폰이 오갔다.' } ] } } ] },

 /* ═══ 마흔 언저리 · 늦은 만남 ═══ */
 late1: { age: [40, 44], c: 'eun', title: '동네 러닝', sub: '마흔의 만남',
  need: function (H) { return (H.free || H.solo) && !H.met('eun'); },
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
     text: ['{ageKo}.', '검진 받은 뒤로', '아침마다 뛴다.'] },
   { bg: 'town', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['처음 오셨죠?', '천천히 뛰어요.', '저도 느려요.'] },
   { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['저 중학생', '아이가 하나 있어요.', '혼자 키워요.'],
     choice: { opts: [
      { a: '아이 얘기를 더 듣고 싶다고 한다', ok: null, aff: 12,
        note: '{c.은} 아이 학교 얘기를 한참 했다. 커피가 식는 줄 몰랐다.' },
      { a: '저는 혼자가 편한 사람이라고 먼저 말한다', ok: null, aff: 4,
        note: '{c.은} "저도 그래서 뛰어요" 했다. 좋은 러닝 친구가 생겼다.' },
      { a: '다음 주에 또 뛰자고 한다', ok: null, aff: 8,
        note: '토요일 아침 일곱 시. 둘 다 늦지 않았다.' } ] } } ] },

 late2: { age: [42, 47], c: 'eun', title: '두 집의 셈', sub: '같이 산다는 것',
  need: function (H) { return (H.free || H.solo) && H.met('eun') && !H.gone('eun') && H.aff('eun') >= 15; },
  scenes: [
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['우리가', '같이 살면', '뭐가 바뀔까?'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'R']], who: '나',
     doc: { t: '둘이 정할 것', rows: [['각자 재산', '어떻게 둘까'], ['아이 학비', '{c} 몫·같이'], ['혼인신고', '할까 말까'], ['보험·연금', '수익자 확인']], bad: [] },
     text: ['혼인신고를', '해야 할까?'],
     choice: { opts: [
      { a: '혼인신고를 하면 법률상 배우자가 된다. 아이와 같이 얘기하고 정하자', ok: 1, go: 'late2wed',
        note: '혼인신고를 해야 법률상 배우자로 상속과 세금 공제를 받는다. 신고 없이 함께 살면 보호가 일부에 그친다(민법, 찾기쉬운 생활법령정보, 확인 권장). {c.은} 아이에게 먼저 묻겠다고 했다.' },
      { a: '각자 집에 살며 지금처럼 만난다', ok: null, go: 'together',
        note: '열쇠는 두 개, 주말은 함께. 보험 수익자와 비상 연락처에는 서로의 이름을 적었다.' },
      { a: '좋은 친구로 남자고 한다', ok: null, go: 'friend',
        note: '토요일 러닝은 그대로 했다. 둘 다 그게 좋았다.' } ] } } ] },

 /* ═══ 서른둘 뒤의 결혼 (5장을 혼자 설계로 깬 뒤 약혼한 사람) ═══ */
 latewed: { age: [33, 47], c: '@p', extra: 1, title: '우리 식대로', sub: '작은 결혼식과 혼인신고', fin: 'wed',
  need: function (H) { return H.engaged && H.chDone('wedding') && H.age > H.L.engAt; },
  scenes: [
   { bg: 'weddinghall', fx: 'fade', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['{ageKo}.', '작은 식장을', '반나절 빌렸다.'] },
   { bg: 'weddinghall', cast: [['hero', 'L'], ['@c', 'C'], ['@m2', 'R']], who: '예식장 실장',
     doc: { t: '예식장 계약서', rows: [['보증인원', '50명'], ['취소 시', '계약금 환불 불가'], ['꽃 장식', '별도'], ['식대', '1인 기준']], bad: [1, 2] },
     text: ['오늘 계약하시면', '식대 할인돼요.'],
     choice: { opts: [
      { a: '취소 조항과 별도 항목 값을 먼저 묻는다', ok: 1,
        note: '예식업은 공정거래위원회 소비자분쟁해결기준이 있어 해제 시기에 따라 환급 기준이 다르다. 계약 전에 조항과 "별도" 값을 다 받아 적는다(한국소비자원).' },
      { a: '작은 식이니 바로 쓴다', ok: 0,
        note: '작은 식도 계약은 계약이다. 취소 조항은 식 크기와 상관없이 읽는다.' } ] } },
   { bg: 'bank', cast: [['hero', 'L'], ['@c', 'R']], who: '나',
     doc: { t: '혼인신고', rows: [['어디서', '시·구·읍·면 사무소'], ['서명', '둘 + 증인 두 명'], ['신고일 기준', '신혼 특공·대출'], ['결혼 세액공제', '대상 연도 확인']], bad: [] },
     text: ['혼인신고는', '언제 하지?'],
     choice: { opts: [
      { a: '제도마다 날짜 기준을 보고 날을 정한다', ok: 1,
        note: '혼인신고서에는 성년 증인 두 사람이 서명한다(민법). 신혼부부 특별공급과 신혼 대출은 혼인신고일부터 햇수를 센다. 결혼 세액공제는 대상 연도가 정해져 있으니 국세청에서 확인한다.' },
      { a: '식 끝나고 생각나면 한다', ok: 0,
        note: '신고일이 기준인 제도가 많다. 미루는 게 득인지 손해인지 먼저 따져 본다.' } ] } },
   { bg: 'weddinghall', fx: 'confetti', cast: [['hero', 'L'], ['@c', 'C'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 늦은 게', '아니라', '자네 때였네.'] } ] },

 /* ═══ 아이 ═══ */
 kidtalk: { age: [29, 42], c: '@p', title: '아이 이야기', sub: '낳을까, 언제',
  need: function (H) { return H.married && H.L.legal !== false && !H.L.plan && !H.L.stepkid && H.age > (H.L.married || 99) && H.age <= (H.L.married || 0) + 3; },
  scenes: [
   { bg: 'livingroom', fx: 'fade', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['{ageKo}.', '조카 돌잔치에서', '돌아오는 길.'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['우리는', '아이 어떻게', '할까?'] },
   { bg: 'phone', cast: [['hero', 'C']], who: '나',
     doc: { t: '아이가 오면 (요약)', rows: [['임신·출산', '국민행복카드 바우처'], ['출생 뒤', '첫만남이용권·부모급여'], ['일', '출산휴가·육아휴직'], ['금액·기간', '해마다 확인']], bad: [] },
     text: ['돈만으로', '정할 일은', '아니지만.'],
     choice: { opts: [
      { a: '곧 낳자. 육아휴직은 둘이 나눠 쓰자', ok: null, go: 'plan:soon',
        note: '둘이 휴직 순서를 달력에 적었다. 부모가 같이 쓰면 늘어나는 지원이 있다(고용노동부, 기준 확인 필요).' },
      { a: '몇 해 뒤에. 그 전에 집과 통장부터', ok: null, go: 'plan:later',
        note: '아이 통장 대신 우리 통장 이름을 "언젠가"로 바꿨다.' },
      { a: '아이 없이 둘이 살자', ok: null, go: 'plan:none',
        note: '둘이 사는 삶도 가족이다. 그날 둘의 노후 표를 처음 같이 썼다.' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 남의 시계', '말고 자네 둘', '시계를 보게.'] } ] },

 birth1: { age: [30, 45], c: '@p', title: '첫아이', sub: '서류도 같이 태어난다', fin: 'birth',
  need: function (H) { var L = H.L; return H.married && L.kids === 0 && ((L.plan === 'soon' && H.age > L.planAge) || (L.plan === 'later' && H.age >= L.planAge + 2 && H.age < 35)); },
  scenes: [
   { bg: 'night', fx: 'fade', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['{ageKo}, 새벽.', '작은 울음소리가', '방을 채웠다.'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     doc: { t: '출생 뒤 신청 (요약)', rows: [['출생신고', '한 달 안'], ['부모급여·아동수당', '주민센터·복지로'], ['첫만남이용권', '바우처'], ['금액', '복지로 확인']], bad: [] },
     text: ['출생신고 하면서', '같이 신청하는 게', '많대.'],
     choice: { opts: [
      { a: '출생신고 때 여러 지원을 한 번에 신청한다', ok: 1,
        note: '출생신고는 한 달 안에 한다(가족관계등록법). 이때 주민센터나 정부24에서 출산 지원 여러 가지를 한꺼번에 신청할 수 있다(행정안전부·보건복지부, 서비스 이름과 대상 확인 필요).' },
      { a: '정신없으니 나중에 하나씩', ok: 0,
        note: '신청해야 나오는 돈이 많다. 늦게 내면 지난 달 몫을 못 받는 것도 있다(복지로에서 확인).' } ] } },
   { bg: 'office', cast: [['hero', 'C']], who: '나',
     text: ['육아휴직,', '팀장님께', '언제 말하지?'],
     choice: { opts: [
      { a: '미리 말하고 신청서를 낸다. 휴직했다고 불이익을 주면 안 된다', ok: 1,
        note: '육아휴직은 법에 있는 권리이고, 이를 이유로 해고나 불리한 처우를 하면 안 된다(남녀고용평등법, 고용노동부). 급여는 고용24에서 신청한다. 기간과 금액은 해마다 확인한다.' },
      { a: '눈치 보여서 연차로 버틴다', ok: 0,
        note: '연차는 금방 바닥난다. 쓸 수 있는 제도를 안 쓰면 몸과 마음이 먼저 닳는다. 고용노동부 1350에 물을 수 있다.' } ] } },
   { bg: 'livingroom', fx: 'confetti', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['우리 집 서랍에', '종이가 한 장', '더 늘었다.'] } ] },

 ivf: { age: [35, 44], c: '@p', title: '기다림', sub: '둘이 정한 만큼',
  need: function (H) { var L = H.L; return H.married && L.kids === 0 && L.plan === 'later' && H.age >= L.planAge + 2 && H.age >= 35; },
  scenes: [
   { bg: 'night', fx: 'fade', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['{ageKo}.', '기다리는 소식이', '오지 않았다.'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['같이', '병원 가 볼래?', '둘 다.'] },
   { bg: 'phone', cast: [['hero', 'C']], who: '나',
     doc: { t: '알아본 것', rows: [['검사', '둘이 같이'], ['시술비 지원', '보건소·정부24'], ['난임치료휴가', '회사에 신청'], ['대상·횟수', '확인 필요']], bad: [] },
     text: ['누구 탓도', '아니래.'],
     choice: { opts: [
      { a: '둘이 정한 만큼만 해 보자. 지원은 보건소에서 알아본다', ok: null, go: 'ivf:try',
        note: '난임 시술비 지원은 보건소와 정부24에서 신청한다(보건복지부, 대상·횟수 확인 필요). 회사에는 난임치료휴가가 있다(고용노동부). 지칠 때 멈출 날도 같이 정했다.' },
      { a: '지금은 쉬어 가자', ok: null, go: 'ivf:rest',
        note: '달력에서 병원 일정을 지웠다. 그 주말엔 오랜만에 바다를 보러 갔다.' },
      { a: '둘이서 사는 삶을 고른다', ok: null, go: 'plan:none',
        note: '오래 이야기했다. 둘이 사는 삶도 가족이라는 데서 대화가 끝났다.' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']],
     text: ['할배는 말없이', '차를 한 잔', '따라 줬다.'] } ] },

 ivf2: { age: [37, 45], c: '@p', title: '다시 달력', sub: '한 번 더, 또는 둘이서',
  need: function (H) { var L = H.L; return H.married && L.kids === 0 && L.ivf === 'rest' && H.age >= (L.ivfAge || 0) + 2; },
  scenes: [
   { bg: 'livingroom', fx: 'fade', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     text: ['{ageKo}.', '달력을 다시', '꺼내 봤어.'],
     choice: { opts: [
      { a: '한 번 더 해 보자. 이번에도 멈출 날을 같이 정하고', ok: null, go: 'ivf:try',
        note: '둘이 정한 만큼만. 그 약속이 서로를 지켰다.' },
      { a: '이제 둘이서 살자', ok: null, go: 'plan:none',
        note: '그날 저녁, 둘이 가고 싶던 곳 목록을 다시 썼다.' } ] } } ] },

 kid2: { age: [33, 42], c: '@p', title: '둘째', sub: '하나, 둘',
  need: function (H) { var L = H.L; return H.married && L.kids === 1 && !L.kid2 && H.age >= L.kidAges[0] + 2; },
  scenes: [
   { bg: 'livingroom', fx: 'fade', cast: [['hero', 'L'], ['@c', 'C'], ['@k', 'R']],
     text: ['{ageKo}.', '아이가', '동생을 그렸다.'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}',
     doc: { t: '둘째가 오면 (요약)', rows: [['방', '하나 더'], ['육아휴직', '아이마다'], ['다자녀 혜택', '지자체마다'], ['우리 노후', '같이 줄어듦']], bad: [3] },
     text: ['둘째,', '어떻게 생각해?'],
     choice: { opts: [
      { a: '둘째를 낳자. 대신 노후 저축 금액은 지킨다', ok: null, go: 'kid2:yes',
        note: '아이 둘 몫의 표 아래에 노후 저축 줄을 먼저 적었다.' },
      { a: '우리는 하나로 충분하다', ok: null, go: 'kid2:no',
        note: '셋이 사는 집. 주말마다 셋이 같이 걸었다.' } ] } },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 몇 명이든', '아이 몫 말고', '자네 몫도 남기게.'] } ] },

 birth2: { age: [34, 44], c: '@p', title: '둘째', sub: '익숙해도 기한은 같다', fin: 'birth',
  need: function (H) { var L = H.L; return H.married && L.kids === 1 && L.kid2 === 'yes' && H.age > (L.kid2Age || 0); },
  scenes: [
   { bg: 'night', fx: 'fade', cast: [['hero', 'L'], ['@c', 'R']],
     text: ['{ageKo}, 봄.', '둘째가 왔다.'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['@c', 'C'], ['@k', 'R']], who: '첫째',
     text: ['내가 먼저', '안아 볼래.'] },
   { bg: 'phone', cast: [['hero', 'C']],
     doc: { t: '둘째 서류', rows: [['출생신고', '한 달 안'], ['육아휴직', '아이마다 따로'], ['다자녀', '지자체 확인'], ['연말정산', '자녀 공제 확인']], bad: [] },
     text: ['둘째 서류도', '첫째 때', '목록 그대로.'],
     choice: { opts: [
      { a: '첫째 때 쓴 목록대로 한 번에 신청한다', ok: 1,
        note: '출생 지원은 아이마다 따로 신청한다. 자녀 세액공제와 출산·입양 공제는 국세청 안내로 확인한다.' },
      { a: '둘째는 익숙하니 천천히', ok: 0,
        note: '익숙해도 기한은 같다. 출생신고는 한 달 안이다.' } ] } } ] }
};

/* 같은 해에 둘 이상 뜰 수 있으면 이 순서로. 앞일수록 먼저 */
var LOVE_ORDER = ['parents', 'newhome', 'latewed', 'birth2', 'birth1', 'ivf2', 'ivf', 'kid2', 'kidtalk',
  'propose2', 'propose', 'grad', 'solo', 'late2', 'late1', 'reunion2', 'agency', 'min2', 'yoon2', 'intro2',
  'reunion1', 'han3', 'so2', 'so1', 'ji2', 'peer', 'han2', 'team', 'alba', 'club', 'dtong', 'anniv'];

/* 고백·청혼 결과 장면. {c}는 그 상대 */
var LOVE_REPLY = {
 no:      [ { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}', text: ['고마워.', '근데 지금은', '아닌 것 같아.'] },
            { bg: 'night', cast: [['hero', 'C']], text: ['돌아오는 길이', '유난히 길었다.'] } ],
 engage:  [ { bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}', text: ['응.', '그 표, 내가', '코팅해 둘게.'] },
            { bg: 'night', cast: [['hero', 'C']], text: ['반지보다 먼저', '표 한 장이', '생겼다.'] } ],
 notyet:  [ { bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}', text: ['조금만 더', '생각하고 싶어.'] },
            { bg: 'night', cast: [['hero', 'C']], text: ['대답은', '다음 해로', '미뤄졌다.'] } ],
 breakup: [ { bg: 'station', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}', text: ['우리, 바라는 게', '너무 다른 것', '같아.'] },
            { bg: 'station', cast: [['hero', 'C']], text: ['마지막 버스는', '평소처럼', '제시간에 왔다.'] } ],
 late2wed: [ { bg: 'town', cast: [['hero', 'L'], ['@c', 'C'], ['@k2', 'R']], who: '{c}의 아이', text: ['{cpar}가 좋으면', '저도 좋아요.'] },
             { bg: 'livingroom', fx: 'confetti', cast: [['hero', 'L'], ['@c', 'R']], text: ['식은 없이,', '밥 한 끼와', '혼인신고서 한 장.'] } ]
};

/* ── 3. 5장 자리: 약혼하지 않았으면 「결혼 준비」 대신 이 장을 튼다 ──
   1009 forks.js의 MQ_SOLO를 옮겨 다듬었다(숫자는 그 문서의 확인 필요 표시를 따른다).
   장 id·보상은 wedding 그대로라 mqDone('wedding')이 참이 되고 6장이 열린다. 나중에 결혼해도 된다(latewed). */
var LOVE_SOLO_CH = {
 id: 'wedding', no: 5, title: '나 하나의 설계', sub: '연금 통장부터 비상 연락처까지', asof: '2026-10',
 src: [['국세청 연금계좌 세액공제', 'https://www.nts.go.kr'], ['금융감독원 파인', 'https://fine.fss.or.kr'], ['내보험 찾아줌', 'https://cont.insure.or.kr'],
       ['국민건강보험공단 간호·간병통합서비스', 'https://www.nhis.or.kr'], ['찾기쉬운 생활법령정보', 'https://www.easylaw.go.kr']],
 scenes: [
  { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
    text: ['허허, 둘이든', '하나든 내 이름', '종이는 내 몫이야.'] },
  { bg: 'bank', cast: [['hero', 'C']], who: '나',
    text: ['노후 준비는', '뭐부터 하지?'] },
  { bg: 'bank', cast: [['hero', 'L'], ['deskf', 'R']], who: '은행 창구 직원',
    doc: { t: '연금계좌 세액공제', rows: [['납입 한도', '합쳐서 연 900만 원'], ['연금저축만', '그중 600만 원'], ['공제율', '13.2~16.5%'], ['받는 나이', '55세부터']], bad: [] },
    text: ['다만 일찍 깨면', '돌려받은 세금을', '다시 내셔야 해요.'],
    choice: { opts: [
     { a: '한도와 해지 조건부터 본다', ok: 1,
       note: '연금저축과 IRP를 합쳐 연 900만 원까지 세액공제 대상이다. 연금으로 받기 전에 깨면 공제받은 몫에 기타소득세가 붙는다(국세청, 한도 확인 필요).' },
     { a: '공제 많이 받게 다 넣는다', ok: 0,
       note: '급한 돈까지 묶으면 중도 해지 때 세금을 다시 낸다. 비상금을 따로 남기고 넣는다.' } ] } },
  { bg: 'cafe', cast: [['hero', 'L'], ['officem', 'R']], who: '보험 설계사',
    text: ['실손 하나 더', '드시면 병원비를', '두 번 받으세요.'],
    choice: { opts: [
     { a: '실손은 겹쳐도 한 번만 나온다', ok: 1,
       note: '실손보험은 여러 개 들어도 실제 낸 병원비 안에서 나눠 보상한다. 내 가입 내역은 "내보험 찾아줌"에서 본다.' },
     { a: '두 번이라니 하나 더 든다', ok: 0,
       note: '보험료는 두 번 내고 보상은 병원비 안에서 나뉜다. 겹친 실손은 해지를 생각해 본다.' } ] } },
  { bg: 'night', cast: [['hero', 'C']],
    doc: { t: '혼자 입원할 때', rows: [['간호·간병통합', '보호자 없이 입원'], ['비용', '건강보험 적용'], ['병원', '병동 있는지 확인']], bad: [] },
    text: ['보호자 없이도', '입원할 수 있는', '병동이 있다.'] },
  { bg: 'town', cast: [['hero', 'L'], ['@f', 'R']], who: '동기 {f}',
    text: ['나 급한데', '300만 원만', '빌려줄 수 있어?'],
    choice: { opts: [
     { a: '차용증을 쓰고 계좌로 보낸다', ok: 1,
       note: '금액, 갚을 날, 이자, 두 사람 서명을 적는다. 돈은 계좌로 보내야 기록이 남는다(찾기쉬운 생활법령정보).' },
     { a: '친구 사이에 무슨 종이야', ok: 0,
       note: '말로 한 약속도 계약이지만 다투면 증명할 길이 없다. 종이 한 장이 친구를 지킨다.' } ] } },
  { bg: 'livingroom', cast: [['hero', 'C']],
    doc: { t: '나 하나의 서류함', rows: [['연금계좌', '납입 영수증'], ['보험', '실손 하나'], ['차용증', '원본 보관'], ['비상 연락', '한 사람 정하기']], bad: [] },
    text: ['서류함 하나에', '내 삶의 종이가', '다 들어갔다.'],
    choice: { opts: [
     { a: '아플 때 연락할 사람을 정해 둔다', ok: 1,
       note: '혼자 사는 사람일수록 비상 연락처 한 명을 정해 휴대폰 긴급 정보와 서류함에 적어 둔다.' },
     { a: '아직 젊으니 나중에', ok: 0,
       note: '응급실은 나이를 묻지 않는다. 연락할 사람이 없으면 병원이 가족을 찾느라 시간을 쓴다.' } ] } },
  { bg: 'night', fx: 'confetti', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
    text: ['허허, 혼자 서는', '법을 아는 사람이', '둘이서도 잘 서네.'] } ],
 ends: { good: ['연금, 보험, 차용증.', '내 종이를 다 챙겼다.'], ok: ['큰 탈은 없었다.', '몇 장은 내년에.'], bad: ['몰랐던 것들이', '나중에 한꺼번에 왔다.'] }
};
/* 5장 제목·알림·카드 문구(약혼 안 함) */
var LOVE_SOLO_COPY = {
 solo: { title: '혼자 사는 설계', ann: ['허허, 혼자 사는 길을 골랐다지. 좋은 길이야.', '대신 자네 이름 종이는 자네가 챙겨야 하네. 같이 보세.'],
         card: ['5장 클리어! 혼자 사는 설계', '내 이름 종이를 다 챙겼다.'] },
 other: { title: '나 하나의 설계', ann: ['허허, 친구들 청첩장이 쌓이는구먼.', '짝이 있든 없든 자네 이름 종이부터 챙기세.'],
          card: ['5장 클리어! 나 하나의 설계', '내 이름 종이를 다 챙겼다.'] } };

/* 세월 다리 서른둘(5장 앞). 약혼한 사람은 원래 y32(첫 줄만 {ageKo}) */
var LOVE_Y32 = {
 solo: { age: 32, before: 'wedding', title: '세월', sub: '서른둘',
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']], text: ['{ageKo}.', '친구 집들이에서', '혼자 일찍 나왔다.'] },
   { bg: 'night', cast: [['hero', 'C']], who: '나', text: ['혼자 아프면', '누가 알지?'] },
   { bg: 'bank', cast: [['hero', 'C']], text: ['노후 계산기를', '처음 두드려 봤다.'] },
   { bg: 'bank', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배', text: ['허허, 혼자 사는 건', '종이를 혼자', '챙긴다는 뜻이야.'] } ] },
 other: { age: 32, before: 'wedding', title: '세월', sub: '서른둘',
  scenes: [
   { bg: 'phone', fx: 'fade', cast: [['hero', 'C']], text: ['{ageKo}.', '[단톡] 동기방:', '"나 결혼해!"'] },
   { bg: 'night', cast: [['hero', 'C']], who: '나', text: ['나는 내 속도로', '가면 되지.'] },
   { bg: 'bank', cast: [['hero', 'C']], text: ['결혼 자금 대신', '내 이름 통장부터', '정리하기로 했다.'] },
   { bg: 'bank', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배', text: ['허허, 둘이든 하나든', '자기 종이는', '자기가 챙기네.'] } ] }
};

/* 배우자가 없을 때 바꿀 줄(첫 줄로 찾는다). MQ_HOME · y37. 배우자 그림은 loveDress가 뺀다(1009 LIFE_SOLO_HOME에서) */
var LOVE_SOLO_LINES = {
 '이번엔 이사 말고':    { who: '나', text: ['이번엔 이사 말고', '내 집 볼까?'] },
 '모델하우스 사람 봐.':  { who: '나', text: ['모델하우스 사람 봐.', '나도 넣을 수 있을까?'] },
 '두 분이면 신혼부부나': { text: ['혼자시면', '생애최초 특별공급', '조건부터 보세요.'],
                          rows: [['공통', '무주택 세대구성원'], ['청약통장', '순위 요건 확인'], ['1인 가구', '공고 조건 확인'], ['생애최초', '소득세 5년 납부']] },
 '열쇠 받았으니까':      { who: '나', text: ['열쇠 받았으니까', '이제 내 집', '맞겠지?'] },
 '등기 완료.':           { text: ['등기 완료.', '갑구 맨 아래에', '내 이름이 올랐다.'] },
 '관리비 고지서 왔어.':  { who: '나', text: ['관리비 고지서 왔다.', '장기수선충당금은', '이제 내 몫이다.'] }
};
/* 아이 나이에 맞춰 바꿀 줄(kidedu). 맏이 나이 → 줄 */
var LOVE_KID_LINES = {
 '중학교 가니까': function (k) { return k < 8 ? ['유치원 끝나니까', '학원 얘기가', '벌써 나와.'] : k < 13 ? ['고학년 되니까', '학원비가', '또 늘었어.'] : null; }
};
/* 비혼 갈래의 마흔셋(y43s)에 결혼했지만 아이 없는 부부(couple)판 */
var LOVE_MID_PATCH = {
 y43s: { couple: { 1: { cast: [['hero', 'L'], ['partner', 'R']], text: ['조카 졸업식에서', '둘이 사진을', '찍어 줬다.'] },
                   3: { text: ['허허, 둘이어도', '제일 큰 밑천은', '각자 자신이야.'] } } }
};
/* 결산 칭호 하나 더(1009 LIFE_TITLE_SOLO) */
var LOVE_TITLES = { solo: { name: '내 이름 한 줄', cond: '비혼 + 자가', lines: ['계약서마다', '이름이 하나였다.', '"혼자 골라도 안 틀리네."'] } };
/* 예순 생일(LIFE_END.part1) 첫 장면 */
var LOVE_END0 = {
 kids2: ['예순 번째 생일.', '아이들이 케이크를', '들고 왔다.'],
 kids1: ['예순 번째 생일.', '아이가 케이크를', '들고 왔다.'],
 solo:  ['예순 번째 생일.', '오랜 친구들이', '상을 차렸다.']
};

/* ══════════ 4. 상태 ══════════
   S.life.love = { v, pool, stage, partner:{id,name,since}, aff:{id:n}, fit:{id:n}, met:{id:age}, gone:{id:'part'|'soft'|'friend'},
                   seen:{사건:age}, ages:{age:횟수}, engAt, married, wedVia, legal, soloAt, open, agencyQ, agency,
                   propTry, propAge, ch5, plan, planAge, ivf, ivfAge, kid2, kid2Age, kids, kidAges:[], kidSex:[], stepkid, log:[[age,글]] }
   stage: single(혼자, 열려 있음) · solo(비혼을 고름) · dating · engaged · married · together(혼인신고 없이 함께) */
function loveOn() { return typeof lifeOn === 'function' && lifeOn() && !!(S && S.life && S.life.prof); }
function loveHash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }
function loveS() {
  var Lf = S.life, p = Lf.prof || {};
  if (!Lf.love) {
    Lf.love = { v: 1, pool: p.sex === 'F' ? 'M' : 'F', stage: 'single', partner: null, aff: {}, fit: {}, met: {}, gone: {}, seen: {}, ages: {},
                kids: 0, kidAges: [], kidSex: [], log: [] };
    /* 인연 트랙 전에 이미 5장(결혼 준비)을 깬 저장: 그때 대본대로 결혼했다고 본다 */
    if (typeof mqDone === 'function' && mqDone('wedding')) {
      var L0 = Lf.love, wa = (Lf.yrs && Lf.yrs.wedding > 1) ? Lf.yrs.wedding : 32;
      L0.stage = 'married'; L0.partner = { id: 'legacy', name: '배우자', since: wa - 2 }; L0.married = wa; L0.wedVia = 'mq'; L0.ch5 = 'wed';
      if (Lf.age >= wa + 2) { L0.kids = 1; L0.kidAges = [wa + 2]; L0.kidSex = ['girl']; L0.plan = 'soon'; }
    }
  }
  return Lf.love;
}
function loveName(id, pool) { var c = LOVE_CAST[id]; if (!c) return id === 'legacy' ? '배우자' : ''; return c.name[pool || loveS().pool]; }
function loveFull(id) { var i = Math.floor(loveHash((S.life.seed || '') + id) * LOVE_SUR.length); return LOVE_SUR[i] + loveName(id); }
function lovePartnerId() { var L = loveS(); return L.partner ? L.partner.id : null; }
function loveHasSpouse() { var st = loveS().stage; return st === 'married' || st === 'together'; }
function loveMarried() { return loveOn() && loveS().stage === 'married'; }
function loveSolo() { return loveOn() && !loveHasSpouse(); }
function loveKids() { return loveOn() ? loveS().kids : 0; }
/* lifeMidFlags가 부른다: 배우자 없음(solo), 아이 있음(kid), 아이 없는 부부(couple) */
/* kid는 맏이가 다섯 살이 넘었을 때만(마흔셋 교육비 사건이 갓난아이에게 학원비를 말하지 않게) */
function loveMidFlags() { if (!loveOn()) return null; var L = loveS(), sp = loveHasSpouse(), k = L.kids > 0 && S.life.age - L.kidAges[0] >= 5;
  return { solo: !sp, kid: k, couple: sp && !k }; }
function loveLog(t) { var L = loveS(); L.log.push([S.life.age, t]); }

/* 그림 열쇠: 새 시트를 넣었으면 그것, 아니면 대신 쓰는 그림 */
function loveHasArt(k) { try { return typeof castCv === 'function' && !!castCv('npc_' + k); } catch (e) { return false; } }
function loveArt(id) { var c = LOVE_CAST[id], sx = loveS().pool; if (!c) return 'partner';
  return loveHasArt(c.artNew[sx]) ? c.artNew[sx] : c.art[sx]; }
/* 결혼 뒤 다른 장면의 'partner' 그림: 새 그림이 있으면 그 사람, 없으면 지금처럼 partner */
function loveSpouseArt() { var id = lovePartnerId(), c = LOVE_CAST[id]; if (!c) return 'partner';
  var sx = loveS().pool, nk = c.artNew[sx], a = S.life.age, ak = a >= 53 ? nk + '60' : a >= 40 ? nk + '45' : null;   /* 나이 든 판(LV2·LV3 시트) */
  if (ak && loveHasArt(ak)) return ak; if (loveHasArt(nk)) return nk;
  var heroSex = (S.life.prof || {}).sex === 'F' ? 'F' : 'M'; return sx !== heroSex ? 'partner' : c.art[sx]; }
function loveFriend() { return LOVE_PEOPLE.friend[loveS().pool] || LOVE_PEOPLE.friend.F; }

/* ── 글자 채우기 ── */
var LOVE_JOSA = { '이': ['이', '가'], '은': ['은', '는'], '을': ['을', '를'], '과': ['과', '와'], '아': ['아', '야'], '랑': ['이랑', '랑'], '예': ['이에요', '예요'], '로': ['으로', '로'], '도': ['도', '도'] };
function loveJ(name, j) {
  var P = LOVE_JOSA[j]; if (!P || !name) return name + (j || '');
  var c = name.charCodeAt(name.length - 1) - 0xAC00, jong = (c >= 0 && c < 11172) ? c % 28 : 0;
  if (j === '로') return name + (jong === 0 || jong === 8 ? '로' : '으로');
  return name + (jong ? P[0] : P[1]);
}
function loveVals(cid) {
  var L = loveS(), pid = lovePartnerId(), f = loveFriend(), age = S.life.age, p = S.life.prof || {};
  var c = cid || pid, since = (L.partner && L.partner.id === c) ? L.partner.since : (L.met[c] || age);
  return { c: loveName(c), p: pid ? loveName(pid) : '', f: f.name, m: LOVE_PEOPLE.manager.name, s: LOVE_PEOPLE.senior.name,
           ageKo: (typeof lifeMidAgeKo === 'function') ? lifeMidAgeKo(age) : String(age), name: p.name || '', yrs: String(Math.max(1, age - since)),
           cpar: L.pool === 'F' ? '엄마' : '아빠' };
}
function loveRp(s, V) { return String(s).replace(/\{(\w+)(?:\.([^}]+))?\}/g, function (m, k, j) { var v = V[k]; if (v == null || v === '') return m; return j ? loveJ(v, j) : v; }); }
function loveCastKey(k, cid) {
  if (k === '@c' || k === '@p') { var who = k === '@c' ? cid : lovePartnerId();   /* 결혼 뒤에는 다른 장면과 같은 배우자 그림 */
    return (who && who === lovePartnerId() && loveHasSpouse()) ? loveSpouseArt() : loveArt(who); }
  if (k === '@f') return loveFriend().key; if (k === '@m') return LOVE_PEOPLE.manager.key; if (k === '@m2') return 'deskf';
  if (k === '@s') return LOVE_PEOPLE.senior.key;
  if (k === '@k') return loveS().kidSex[0] || 'girl'; if (k === '@k2') return loveHash((S.life.seed || '') + 'eunkid') < 0.5 ? 'boy' : 'girl';
  return k; }
/* 장면 목록을 지금 상태로 채운다. need가 안 맞는 장면은 뺀다 */
function loveBuild(list, cid) {
  var L = loveS(), V = loveVals(cid), out = [];
  (list || []).forEach(function (p) {
    if (p.need === 'free' && L.stage !== 'single' && L.stage !== 'solo') return;
    if (p.need === 'dating' && L.stage !== 'dating') return;
    var q = JSON.parse(JSON.stringify(p)); delete q.need;
    if (q.textBy) { if (q.textBy[cid]) q.text = q.textBy[cid]; delete q.textBy; }
    if (q.cast) q.cast = q.cast.map(function (c) { return [loveCastKey(c[0], cid), c[1]]; });
    if (q.who) q.who = loveRp(q.who, V);
    q.text = (q.text || ['']).map(function (t) { return loveRp(t, V); });
    if (q.doc) { q.doc.t = loveRp(q.doc.t, V); q.doc.rows = q.doc.rows.map(function (r) { return r.map(function (x) { return loveRp(x, V); }); }); }
    if (q.choice) q.choice.opts = q.choice.opts.map(function (o) { o.a = loveRp(o.a, V); if (o.note) o.note = loveRp(o.note, V); o._c = cid; return o; });
    out.push(q); });
  return out;
}

/* ══════════ 5. 언제 무엇을 트나 ══════════ */
function loveCtx() {
  var L = loveS(), age = S.life.age, p = S.life.prof || {}, pid = lovePartnerId();
  var H = { L: L, age: age, path: p.path, student: S.status === '대학생', worker: S.status === '직장인' || (typeof mqDone === 'function' && mqDone('job')),
    free: L.stage === 'single', solo: L.stage === 'solo', dating: L.stage === 'dating', engaged: L.stage === 'engaged',
    married: L.stage === 'married' || L.stage === 'together', p: pid, since: L.partner ? L.partner.since : 0 };
  H.aff = function (id) { return L.aff[id] || 0; }; H.fit = function (id) { return L.fit[id] || 0; };
  H.met = function (id) { return L.met[id] != null; }; H.gone = function (id) { return L.gone[id] || null; };
  H.seen = function (id) { return L.seen[id] != null; }; H.chDone = function (id) { return typeof mqDone === 'function' && mqDone(id); };
  H.goneOf = function (ids, kinds) { for (var i = 0; i < ids.length; i++) if (L.met[ids[i]] != null && kinds.indexOf(L.gone[ids[i]]) >= 0 && ids[i] !== pid) return ids[i]; return null; };
  return H;
}
function loveCid(e, H) { return typeof e.c === 'function' ? e.c(H) : e.c === '@p' ? H.p : e.c; }
/* 이 나이에 틀 사건 하나(없으면 null). 한 해 하나, extra는 하나 더 */
function loveDue(age) {
  if (!loveOn()) return null;
  var L = loveS(), H = loveCtx(); age = age || H.age; H.age = age;
  var n = L.ages[age] || 0;
  for (var i = 0; i < LOVE_ORDER.length; i++) {
    var id = LOVE_ORDER[i], e = LOVE_EVENTS[id];
    if (!e || L.seen[id] != null || age < e.age[0] || age > e.age[1]) continue;
    if (n >= (e.extra ? 3 : 1)) continue;
    var ok = false; try { ok = !!e.need(H); } catch (x) { ok = false; }
    if (ok) return { id: id, c: loveCid(e, H) };
  }
  return null;
}
/* 생일·홈에서 부른다(lifeStageCheck가 중간 장이 없을 때 부름). 창이 다 닫히면 튼다 */
function loveCheck() {
  if (!LOVE_AUTO || !loveOn() || !S.onboarded || S.life.over || loveCheck.t || (typeof MQP !== 'undefined' && MQP)) return false;
  loveSync();
  if (!loveDue()) return false;
  loveCheck.t = setTimeout(function () { loveCheck.t = 0;
    if (typeof mqIdle === 'function' && !mqIdle()) return;
    var d = loveDue(); if (d) lovePlay(d.id); }, 1400);
  return true;
}
/* 나이를 건너뛸 때 지나간 해의 사건을 한 번에 따라잡지 않는다(놓친 인연). loveTick(age)는 그 나이에 틀 것을 알려 준다 */
function loveTick(age) { var d = loveDue(age); return d ? d.id : null; }

/* ══════════ 6. 틀기와 고르기 ══════════ */
function lovePlay(id, opt) {
  var e = LOVE_EVENTS[id]; if (!e || !loveOn() || (typeof MQP !== 'undefined' && MQP)) return false;
  var L = loveS(), H = loveCtx(), age = H.age, cid = loveCid(e, H);
  L.seen[id] = age; L.ages[age] = (L.ages[age] || 0) + 1;
  if (cid && LOVE_CAST[cid] && L.met[cid] == null) L.met[cid] = age;
  var sc = loveBuild(e.scenes, cid), V = loveVals(cid);
  if (typeof save === 'function') save();
  if (typeof ev === 'function') ev('love_play', { id: id, age: age, c: cid || '' });
  playMQ({ kicker: 'LOVE', title: e.title, sub: lifeMidAgeKo(age) + ' · ' + loveRp(e.sub, V), scenes: sc,
    onPick: function (p, op) { loveApply(op, cid); },
    endScenes: function (ok, n) { return loveEnd(id, cid, ok, n); },
    onDone: function () { loveSync(); if (typeof hudRefresh === 'function') hudRefresh(); if (opt && opt.onDone) opt.onDone(); else if (typeof render === 'function') render('home'); } });
  return true;
}
/* 보기를 고른 순간(엔진 onPick). 마음·맞춤·돈을 더하고, go를 처리하고, 이어 틀 장면을 끼운다 */
function loveApply(op, cid) {
  var L = loveS(), t = cid || lovePartnerId();
  if (t && op.aff) L.aff[t] = Math.max(-20, Math.min(100, (L.aff[t] || 0) + op.aff));
  if (t && op.fit) L.fit[t] = (L.fit[t] || 0) + op.fit;
  if (op.coin) S.coin = Math.max(0, S.coin + op.coin);
  var add = op.go ? (loveGo(op.go, t) || []) : [];
  if (op.then) add = add.concat(loveBuild(op.then, t));
  if (add.length && typeof MQP !== 'undefined' && MQP && MQP.list) { var Ls = MQP.list(); Array.prototype.splice.apply(Ls, [MQP.cur() + 1, 0].concat(add)); }
  if (typeof save === 'function') save();
  return add;
}
/* 상태 바꾸기. 돌려주는 장면은 바로 이어 튼다 */
function loveGo(code, cid) {
  var L = loveS(), age = S.life.age, nm = loveName(cid), aff = L.aff[cid] || 0, fit = L.fit[cid] || 0, R = LOVE_REPLY;
  var yes = function () { L.stage = 'dating'; L.partner = { id: cid, name: nm, since: age }; delete L.gone[cid]; L.propTry = 0; loveLog(loveJ(nm, '과') + ' 만나기 시작');
    var c = LOVE_CAST[cid]; return loveBuild([{ bg: 'night', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}', text: c ? c.yes : ['좋아.'] },
      { bg: 'night', cast: [['hero', 'C']], text: ['그날 밤', '집에 오는 길이', '짧았다.'] }], cid); };
  switch (code) {
   case 'confess': if (aff >= LOVE_TH.confess) return yes(); L.gone[cid] = 'soft'; return loveBuild(R.no, cid);
   case 'date': return yes();
   case 'part': L.gone[cid] = 'part'; if (lovePartnerId() === cid) { L.partner = null; L.stage = 'single'; L.propTry = 0; } loveLog(loveJ(nm, '과') + ' 헤어짐'); return [];
   case 'soft': L.gone[cid] = 'soft'; return [];
   case 'friend': L.gone[cid] = 'friend'; return [];
   case 'wait': L.propTry = 1; L.propAge = age; return [];
   case 'engage':
    if (aff >= LOVE_TH.engage && fit >= LOVE_TH.engageFit) { L.stage = 'engaged'; L.engAt = age; loveLog(loveJ(nm, '과') + ' 약혼'); return loveBuild(R.engage, cid); }
    L.propTry = 1; L.propAge = age; return loveBuild(R.notyet, cid);
   case 'engage2':
    if (L.fit[cid] >= 1) { L.stage = 'engaged'; L.engAt = age; L.propTry = 2; loveLog(loveJ(nm, '과') + ' 약혼'); return loveBuild(R.engage, cid); }
    L.propTry = 2; var br = loveBuild(R.breakup, cid); loveGo('part', cid); return br;
   case 'solo': L.stage = 'solo'; L.soloAt = age; L.soloAsk = 1; loveLog('혼자 사는 삶을 설계'); return [];
   case 'open': L.open = 1; L.soloAsk = 1; return [];
   case 'agencyQ': L.agencyQ = 1; L.soloAsk = 1; return [];
   case 'join': L.agency = 1; L.met.min = age; L.aff.min = (L.aff.min || 0) + 15;
    return loveBuild([{ bg: 'cafe', cast: [['hero', 'L'], ['@c', 'R']], who: '{c}', text: ['세무 일 해요.', '조건표보다', '얘기가 궁금해서요.'] },
                      { bg: 'cafe', cast: [['hero', 'C']], text: ['조건표에 없는', '웃음소리가', '들렸다.'] }], 'min');
   case 'noagency': L.agency = 0; return [];
   case 'late2wed': var sc = loveBuild(R.late2wed, cid); L.stage = 'married'; L.partner = { id: cid, name: nm, since: L.met[cid] || age }; L.married = age; L.wedVia = 'late'; L.stepkid = 1; loveLog(loveJ(nm, '과') + ' 혼인신고'); return sc;
   case 'together': L.stage = 'together'; L.partner = { id: cid, name: nm, since: L.met[cid] || age }; L.together = age; L.legal = false; loveLog(loveJ(nm, '과') + ' 함께'); return [];
   case 'wed': L.stage = 'married'; L.married = age; L.wedVia = L.wedVia || 'late'; loveLog(loveJ(L.partner ? L.partner.name : '', '과') + ' 결혼'); return [];
   case 'plan:soon': case 'plan:later': case 'plan:none': L.plan = code.split(':')[1]; L.planAge = age; return [];
   case 'ivf:try': L.ivf = 'try'; L.plan = 'soon'; L.planAge = age; return [];
   case 'ivf:rest': L.ivf = 'rest'; L.ivfAge = age; return [];
   case 'kid2:yes': L.kid2 = 'yes'; L.kid2Age = age; return [];
   case 'kid2:no': L.kid2 = 'no'; return [];
   case 'birth': L.kids++; L.kidAges.push(age); L.kidSex.push(loveHash((S.life.seed || '') + 'kid' + L.kids) < 0.5 ? 'boy' : 'girl'); loveLog(L.kids === 1 ? '첫아이' : '둘째'); return [];
  }
  return [];
}
/* 끝: fin을 처리하고 작은 카드(마음 · 지금 상태 · 경험치) */
var LOVE_STAGE_KO = { single: '혼자 · 열려 있음', solo: '혼자 사는 설계', dating: '만나는 중', engaged: '결혼 약속', married: '결혼', together: '함께 삶' };
function loveEnd(id, cid, ok, n) {
  var e = LOVE_EVENTS[id], L = loveS(); if (e.fin) loveGo(e.fin, cid);
  var xp = 30 + (n && ok >= n ? 20 : 0); S.xp += xp; if (typeof need === 'function') while (S.xp >= need(S.lv)) { S.xp -= need(S.lv); S.lv++; }
  var rows = [];
  if (cid && LOVE_CAST[cid]) { var a = Math.max(0, Math.min(5, Math.round((L.aff[cid] || 0) / 20))); rows.push([loveName(cid) + ' 마음', new Array(a + 1).join('♥') + new Array(6 - a).join('♡')]); }
  rows.push(['지금', LOVE_STAGE_KO[L.stage] + (L.kids ? ' · 아이 ' + L.kids : '')]);
  if (n) rows.push(['돈 이야기', ok + ' / ' + n]);
  rows.push(['경험치', '+' + xp]);
  if (typeof save === 'function') save();
  return [{ type: 'reward', head: '인연', grade: 'none', card: ['', e.title + ' · ' + lifeMidAgeKo(S.life.age)], rows: rows }];
}

/* ══════════ 7. 다른 대본과 잇기 ══════════ */
var LOVE_BASE = null;
function loveBase() {
  if (LOVE_BASE || typeof LIFE_AGES === 'undefined') return LOVE_BASE;
  var c = (typeof mqById === 'function') ? mqById('wedding') : null;
  LOVE_BASE = { wedAge: LIFE_AGES.wedding, y32: LIFE_YEARS.y32,
    wed: c ? { title: c.title, ann: c.ann, q: c.q } : null,
    copy: (typeof MQ_COPY !== 'undefined' && MQ_COPY.wedding) ? JSON.parse(JSON.stringify(MQ_COPY.wedding)) : null };
  return LOVE_BASE;
}
/* 상태에 맞춰 5장 나이·제목·세월 다리를 고친다. 일반 모드면 되돌린다. lifeStageCheck(홈)와 loveDress(컷신)가 부른다 */
function loveSync() {
  var B = loveBase(); if (!B) return;
  var c = (typeof mqById === 'function') ? mqById('wedding') : null;
  if (!loveOn()) { LIFE_AGES.wedding = B.wedAge; LIFE_YEARS.y32 = B.y32; if (c && B.wed) { c.title = B.wed.title; c.ann = B.wed.ann; c.q = B.wed.q; } if (B.copy) MQ_COPY.wedding = JSON.parse(JSON.stringify(B.copy)); return; }
  var L = loveS(), done = typeof mqDone === 'function' && mqDone('wedding');
  if (done && L.ch5 === 'wed' && L.stage === 'engaged') { L.stage = 'married'; L.married = (S.life.yrs && S.life.yrs.wedding > 1) ? S.life.yrs.wedding : S.life.age; L.wedVia = 'mq'; loveLog(loveJ(L.partner ? L.partner.name : '', '과') + ' 결혼'); }
  var eng = L.stage === 'engaged', k = L.stage === 'solo' ? 'solo' : 'other';
  LIFE_AGES.wedding = (eng && !done) ? Math.min(32, Math.max(30, (L.engAt || 30) + 2)) : B.wedAge;
  LIFE_YEARS.y32 = (eng || done) ? B.y32 : LOVE_Y32[k];
  if (c && B.wed && !done) { if (eng) { c.title = B.wed.title; c.ann = B.wed.ann; c.q = B.wed.q; }
    else { c.title = LOVE_SOLO_COPY[k].title; c.ann = LOVE_SOLO_COPY[k].ann; c.q = '메인 5장 · ' + LOVE_SOLO_COPY[k].title + '.'; } }
  if (B.copy && !done) { MQ_COPY.wedding = JSON.parse(JSON.stringify(B.copy)); if (!eng) { MQ_COPY.wedding.card = LOVE_SOLO_COPY[k].card; MQ_COPY.wedding.sub = LOVE_SOLO_CH.sub; } if (c) c.sub = MQ_COPY.wedding.sub; }
}
/* mqData('wedding')가 부른다: 약혼했으면 null(MQ_WEDDING 그대로), 아니면 나 하나의 설계 */
function loveWedData() {
  if (!loveOn()) return null;
  var L = loveS(); if (typeof mqDone === 'function' && mqDone('wedding')) return null;
  if (L.stage === 'engaged') { L.ch5 = 'wed'; return null; }
  L.ch5 = 'solo';
  var d = JSON.parse(JSON.stringify(LOVE_SOLO_CH)), k = L.stage === 'solo' ? 'solo' : 'other';
  d.title = LOVE_SOLO_COPY[k].title; d.scenes = loveBuild(LOVE_SOLO_CH.scenes, null);
  return d;
}
/* playMQ 첫 줄에서 부른다. 인생 모드 컷신의 배우자 자리(partner, '배우자', '짝꿍', {partner})를 지금 상태로 바꾼다 */
function loveDress(o) {
  loveSync();
  if (!loveOn() || !o || !o.scenes || o.kicker === 'LOVE') return o;
  var L = loveS(), sp = L.stage === 'married' || L.stage === 'together' || L.stage === 'engaged' || L.stage === 'dating';
  var nm = sp && L.partner ? L.partner.name : '', key = sp ? loveSpouseArt() : null, V = { partner: nm, p: nm, ageKo: lifeMidAgeKo(S.life.age) };
  var kAge = L.kidAges.length ? S.life.age - L.kidAges[0] : 0;
  var r = {}; for (var x in o) r[x] = o[x];
  r.scenes = o.scenes.map(function (p) {
    var q = JSON.parse(JSON.stringify(p)), t0 = q.text && q.text[0], has = (q.cast || []).some(function (c) { return c[0] === 'partner'; });
    if (q.text) q.text = q.text.map(function (t) { return loveRp(t, V); });
    if (sp) {
      if (has && key !== 'partner') q.cast = q.cast.map(function (c) { return c[0] === 'partner' ? [key, c[1]] : c; });
      if (has && (q.who === '배우자' || q.who === '짝꿍') && nm && nm !== '배우자') q.who = nm;
      if (L.kids && LOVE_KID_LINES[t0]) { var kl = LOVE_KID_LINES[t0](kAge); if (kl) q.text = kl; }
    } else {
      var o2 = LOVE_SOLO_LINES[t0];
      if (o2) { if (o2.who) q.who = o2.who; if (o2.text) q.text = o2.text; if (o2.rows && q.doc) q.doc.rows = o2.rows; }
      if (has) { q.cast = q.cast.filter(function (c) { return c[0] !== 'partner'; }); if (q.cast.length === 1) q.cast = [[q.cast[0][0], 'C']];
        if (!o2 && (q.who === '배우자' || q.who === '짝꿍')) q.who = '나'; }
    }
    return q; });
  return r;
}
/* 예순 생일(lifeEnd의 part1). 서랍 속 종이 나이도 채운다(story-logic S7이 lifeEnd에 안 이어져 {a_job}이 그대로 나오던 것) */
function loveEndPart1(f, tid) {
  var sc = (typeof lifeEndScenes === 'function') ? lifeEndScenes('part1', f, tid) : lifeFill(LIFE_END.part1, f);
  if (!loveOn()) return sc;
  var L = loveS(), fr = loveFriend(), ko = lifeMidAgeKo;
  if (loveHasSpouse()) {
    if (L.kids) sc[0].text = L.kids > 1 ? LOVE_END0.kids2 : LOVE_END0.kids1;
    if (sc[2] && sc[2].doc) sc[2].doc.rows[2] = L.stage === 'married' ? [ko(L.married || 32), '혼인신고서'] : [ko(L.together || 40), '둘이 쓴 약속서'];
  } else {
    sc[0].cast = [['hero', 'L'], [fr.key, 'R']]; sc[0].text = LOVE_END0.solo;
    sc[1].cast = [['hero', 'L'], [fr.key, 'R']]; sc[1].who = '동기 ' + fr.name; sc[1].text = ['서랍 좀 열어 봐.', '종이가 한가득이네.'];
    if (sc[2] && sc[2].doc) sc[2].doc.rows[2] = [sc[2].doc.rows[2][0], '연금저축 통장'];
  }
  return sc;
}
/* 결산 카드 한 줄 */
function loveWith() {
  if (!loveOn()) return '';
  var L = loveS(), k = L.kids ? ' · 아이 ' + L.kids : '';
  if (L.stage === 'married') return '함께 · ' + (L.partner ? L.partner.name : '배우자') + k;
  if (L.stage === 'together') return '함께 · ' + (L.partner ? L.partner.name : '') + ' (혼인신고 없이)';
  if (L.stage === 'solo') return '혼자, 내 방식으로';
  return '혼자' + (L.partner ? ' · ' + loveJ(L.partner.name, '과') + ' 만나는 중' : '');
}
/* 붙일 때 한 번: 중간 사건의 갈래를 아이 기준으로 바꾸고, 부부판 patch와 칭호를 더한다 */
function loveInstall() {
  if (typeof LIFE_MID_FLAGS !== 'undefined') ['kid', 'couple'].forEach(function (k) { if (LIFE_MID_FLAGS.indexOf(k) < 0) LIFE_MID_FLAGS.push(k); });
  if (typeof LIFE_MID !== 'undefined') { if (LIFE_MID.kidedu) LIFE_MID.kidedu.need = { kid: true }; if (LIFE_MID.selfedu) LIFE_MID.selfedu.need = { kid: false }; }
  if (typeof LIFE_MID_YEARS !== 'undefined') {
    if (LIFE_MID_YEARS.y43) LIFE_MID_YEARS.y43.need = { kid: true };
    if (LIFE_MID_YEARS.y43s) { LIFE_MID_YEARS.y43s.need = { kid: false }; LIFE_MID_YEARS.y43s.patch = Object.assign({}, LIFE_MID_YEARS.y43s.patch || {}, LOVE_MID_PATCH.y43s); } }
  if (typeof LIFE_YEARS !== 'undefined') {
    if (LIFE_YEARS.y32) LIFE_YEARS.y32.scenes[0].text[0] = '{ageKo}.';
    if (LIFE_YEARS.y37) LIFE_YEARS.y37.scenes[0].text[0] = '{ageKo}.'; }
  if (typeof LIFE_TITLES !== 'undefined' && !LIFE_TITLES.solo) LIFE_TITLES.solo = LOVE_TITLES.solo;
}
loveInstall();
