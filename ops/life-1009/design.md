# 인생 모드 1단계 설계 (게임 기획, 2026-10-09)

대상 코드: prototype/newbie-quest-demo.html. 이 문서는 개발자가 그대로 옮겨 쓸 수 있게 데이터 표를 JS 객체로 적었다.
코드에서 확인한 것과 추측(검증 필요)을 나눠 적는다. 통계 숫자는 모두 "검증 필요"다. 기억에 기댄 대략값이고, 출처 이름과 연도만 믿을 만하다.

## 0. 코드에서 확인한 것 (설계의 바닥)

- 상태 S는 fresh()가 만들고 load()/save()가 localStorage 키 KEY='nq.v8' 하나에 통째로 넣는다.
- 신분 정보: S.status('대학생'·'취준생'·'직장인'), S.living('기숙사'·'자취'·'본가'), S.region('수도권'·'광역시'·'그 외'), S.age(24·29·34·40 구간값), S.prep, S.years. 퀘스트 고르기(fits, score)와 whyLine이 이 값을 쓴다.
- 스탯 시작값은 다섯 개 모두 5. 코인 시작 150. 거처 S.tier/S.peak 0(노숙). paidBase()=max(S.paid,S.tier).
- 하루 제한이 메인 장 말고도 셋 더 있다. 인생 모드에서 2~3시간에 끝내려면 넷 다 풀어야 한다.
  1. mqDay(id): 앞 장을 깬 날이 오늘이면 다음 장이 안 열린다(3~6장 open).
  2. upLeft(): 거처 해금이 하루 1칸(첫날 2칸). 2장은 원룸 전세(7칸)가 열려야 해서 이것만으로 최소 6일이 걸린다.
  3. dripEnsure(): 새 퀘스트가 첫날 5개, 그 뒤 하루 3개씩 열린다(DRIP_FIRST, DRIP_DAILY).
  4. mqAnnounce(): 할배 알림 MQ_SAID가 하루 한 번.
- 엔딩: endingReady()는 거처 맨 위(14) + 6장 + 보스 셋을 모두 요구한다. 할배 정체 대사 "나는... 마흔 해 뒤의 자네라네."(ENDING). 20살에 시작하면 할배는 60살의 나다. 그래서 결산을 60살에 둔다.
- 6장 끝(mqAfter, c.id==='home')에서 checkEnding()을 부른다. 생활 이벤트 선택은 maybeLifeEvent 안 talkTo의 choose(k)에서 처리한다.
- 공유 카드 shareCard()는 320×420 논리 크기에 2배(CARDW, CARDH, CARDS).

## 1. 태어남 카드

### 1-1. 칸 다섯 개

출신 지역, 집안 형편, 다니는 학교, 스무 살 거처, 타고난 성향. 앞의 넷은 통계 비율로 뽑고, 성향은 통계가 아니라 게임용 균등 추첨이다(카드에도 "성향은 운"이라고 적는다).
네 번째 칸(거처)은 출신 지역에 따라 확률이 달라진다(조건부).

```js
/* 태어남 카드. p는 백분율(합 100). 모든 p는 검증 필요 */
var BIRTH={
 region:{label:'출신 지역',
  src:'행정안전부 주민등록인구통계 2024년 12월(KOSIS). 수도권 약 50.7%, 비수도권 5개 광역시(부산·대구·광주·대전·울산) 약 18.7%. 검증 필요',
  o:[
   {v:'수도권', p:51, coin:-10, stat:{jik:3}, line:'서울 언저리에서 컸지. 일자리는 많고 방값은 비싼 동네.'},
   {v:'광역시', p:19, coin:0,   stat:{sik:3}, line:'광역시 토박이로구먼. 바다든 분지든 밥 하나는 맛있는 동네.'},
   {v:'그 외', p:30, coin:20,  stat:{ju:4},  line:'시·군에서 컸지. 집값 무서운 줄은 늦게 알게 될 걸세.'}]},
 family:{label:'집안 형편',
  src:'통계청·한국은행·금융감독원 가계금융복지조사 2024(소득 5분위는 정의상 20%씩, 상대적 빈곤율 약 15%). 빠듯=1분위, 보통=2~4분위, 넉넉=5분위로 묶음. 검증 필요',
  o:[
   {v:'빠듯',  p:20, coin:80,  stat:{geum:4}, hint:{theme:'geum'}, line:'넉넉하진 않았지. 그래도 자네는 돈 무서운 줄 일찍 알았어.'},
   {v:'보통',  p:60, coin:150, stat:{sik:2},  hint:null,           line:'모자라지도 남지도 않는 집. 대부분이 그렇게 시작하네.'},
   {v:'넉넉',  p:20, coin:240, stat:{ui:2},   hint:null,           line:'집에서 밀어 줄 힘이 있었지. 그 힘을 어디 쓰느냐가 문제야.'}]},
 school:{label:'다니는 학교',
  src:'교육부·한국교육개발원 교육기본통계 2024. 고교 졸업자 대학 진학률 약 73~75%. 진학자 중 일반대 약 2/3, 전문대 약 1/3로 어림(75×0.68≈51, 75×0.32≈24). 검증 필요',
  o:[
   {v:'4년제', p:51, stat:{ui:2,geum:1}, jobAge:26, gradAge:24, status:'대학생', line:'4년 공부하고 나면 스물여섯쯤 첫 직장이겠구먼.'},
   {v:'전문대',p:24, stat:{jik:4},       jobAge:23, gradAge:22, status:'대학생', line:'2년이면 바로 현장이지. 남들보다 월급을 일찍 받겠어.'},
   {v:'고졸',  p:25, stat:{jik:3}, coin:30, jobAge:21, gradAge:19, status:'취준생', line:'학교 대신 일부터 찾는구먼. 남들보다 몇 해 먼저 어른이 되는 거야.'}]},
 living:{label:'스무 살 거처',
  src:'대학알리미 기숙사 수용률(2023, 전국 약 22%, 수도권은 더 낮음)과 국토교통부 주거실태조사 청년가구(2023)에서 어림한 추정치. 통계표가 지역별로 바로 나오지 않아 근거가 가장 약하다. 검증 필요',
  byRegion:{'수도권':{'본가':60,'기숙사':15,'자취':25},'광역시':{'본가':45,'기숙사':20,'자취':35},'그 외':{'본가':30,'기숙사':25,'자취':45}},
  o:[
   {v:'본가',  tier:0, coin:60,  line:'아직 부모님 집이지. 방값 안 드는 대신 내 공간은 없어.'},
   {v:'기숙사',tier:3, coin:0,   line:'기숙사 2인실. 씻는 데도 줄을 서야 하네.'},
   {v:'자취',  tier:4, coin:-40, line:'벌써 자취라. 계약서랑 공과금이 자네 몫이 됐구먼.'}]},
 trait:{label:'타고난 성향',
  src:'통계 아님. 게임용 균등 추첨',
  o:[
   {v:'알뜰',  p:20, stat:{geum:5}, heroes:['alttle','wolse']},
   {v:'살림',  p:20, stat:{ju:5},   heroes:['jachwi','wolse']},
   {v:'미식',  p:20, stat:{sik:5},  heroes:['mukbang','newbie']},
   {v:'꾸밈',  p:20, stat:{ui:5},   heroes:['kaltoe','jachwi']},
   {v:'성실',  p:20, stat:{jik:5},  heroes:['spec','yageun']}]}
};
var BIRTH_BASE={coin:0,stat:5,coinMin:50};   /* 코인은 family.coin이 바탕값(fresh의 150을 대신함) */
```

### 1-2. 칸마다 효과 정리 (게임 수치)

| 칸 | 시작 코인 | 시작 거처 | 신분 힌트(S에 넣는 값) | 스탯 | 주인공 | 할배 첫 대사 |
|---|---|---|---|---|---|---|
| 출신 지역 | -10 / 0 / +20 | - | S.region | jik+3 / sik+3 / ju+4 | - | 줄 1 |
| 집안 형편 | 80 / 150 / 240(바탕값) | - | 빠듯이면 S.life.hint='geum'(score에 geum +8) | geum+4 / sik+2 / ui+2 | - | 줄 2 |
| 다니는 학교 | - / - / +30 | - | S.life.card.school, 졸업·취업 나이, 고졸이면 S.status='취준생'·S.prep=0 | ui+2 geum+1 / jik+4 / jik+3 | - | 줄 3 |
| 스무 살 거처 | +60 / 0 / -40 | 0 노숙 / 3 찜질방 / 4 고시원 | S.living | - | 자취면 jachwi·wolse 추천 하나 더 | 줄 4 |
| 타고난 성향 | - | - | - | 한 스탯 +5 | 추천 2명 | 없음(카드에만) |

공통으로 넣는 값: S.status=school.status(대학생 또는 취준생), S.age=24(만 24세 이하 구간), S.mode='life'.

균형 확인(계산값):
- 코인은 30~320 사이에서 나온다. 가장 낮은 조합(빠듯·수도권·자취 = 30)은 coinMin 50으로 올린다.
- 거처 세 갈래의 값어치를 맞췄다. 본가 +60코인, 기숙사는 찜질방 칸(보증금표 TIER_DEP[3]=50), 자취는 고시원 칸(TIER_DEP[4]=90)에 코인 -40이라 순이득 약 50. 세 갈래 모두 약 50~60 어치다.
- 스탯 머리 출발은 가장 많아야 합계 +16(예: 그 외 ju+4, 빠듯 geum+4, 전문대 jik+4, 성향 +5 가운데 겹침). 한 스탯 최대는 5+4+5=14 정도. 지금 신축 need 78, 보스 need 20~40에 견주면 몇 퀘스트 앞선 정도다.
- 시작 거처를 올릴 때 집 스탯(ju)은 올리지 않는다. S.tier=S.peak=S.paid=그 칸으로만 둔다. 다음 칸은 여전히 TIERS.need로 열린다(고시원에서 시작해도 반지하는 ju 30에서). 이 상태(ju < 지금 칸 need)에서 깨지는 화면이 없는지 개발이 확인해야 한다(추측: 문제없음, 집 스탯 줄 안내 statHint의 ju 분기는 S.peak 기준이라 괜찮아 보인다).
- 지방 출신 ju+4는 기존 주석(비수도권이 집 퀘스트를 덜 받는다)의 불리함을 메우는 뜻도 있다.

할배 첫 대사는 줄 1~4를 이어 붙이고, 마지막 줄로 "스무 살 자네, 이제 시작이네."를 단다. 화면에서는 두 줄씩 talkTo로 띄운다.

주인공 엮기: 주인공 8명은 겉모습만 다르다(코드 주석 그대로). 카드가 주인공을 정하지 않는다. 성향의 heroes 두 명(자취면 한 명 더, 겹치면 생략)에 "어울림" 표시를 달고 첫 칸을 그 가운데 첫째로 미리 골라 둔다. 플레이어는 8명 중 아무나 고를 수 있다.

### 1-3. 뽑기 규칙과 삼세판 UI

```js
var BIRTH_ROLLS=3;          /* 처음 뽑기 1 + 다시 뽑기 2 */
/* S.life.rolls: 지금까지 뽑은 횟수. 뽑을 때마다 save() 해서 새로고침으로 다시 뽑기를 늘리지 못하게 한다 */
```

뽑는 순서: 지역 → 형편 → 학교 → 거처(지역 조건부) → 성향. 각 칸은 Math.random()으로 p 가중 추첨. 시드는 쓰지 않아도 되지만, 뽑은 결과를 S.life.card에 바로 저장한다.

화면(온보딩 obbody 안, 새 단계 'birth'):
1. 제목 "어디서 태어날까요?" 아래 빈 카드. 칸 다섯 줄이 슬롯처럼 0.3초 간격으로 위에서부터 멈춘다(sfx 'pick' 다섯 번, 마지막에 'coin').
2. 칸마다 왼쪽 라벨, 가운데 값, 오른쪽 작은 글씨로 효과("코인 -10 · 일 +3"). 값 아래 아주 작은 글씨로 "열 명 중 다섯"처럼 확률을 쉬운 말로 적는다(p를 10으로 나눠 반올림, 0이면 "백 명 중 몇").
3. 카드 아래 합계 한 줄: "시작 코인 ￦170 · 첫 거처 찜질방 · 스탯 합 +9".
4. 버튼 둘: "이 인생으로 살기"(주 버튼) / "다시 태어나기 (남은 2번)". 세 번째 카드에서는 둘째 버튼이 사라지고 "마지막 카드예요"라고 적는다.
5. 앞에서 뽑은 카드는 아래에 작은 회색 띠로 남긴다(돌아가 고를 수는 없다. 운이라는 느낌을 지킨다).
6. 출처 보기: 카드 오른쪽 아래 "통계 출처" 글자를 누르면 BIRTH[*].src를 openTip으로 보여 준다.

## 2. 나이

### 2-1. 장마다 나이

```js
/* 나이는 만 나이. 장을 "시작할 때" 그 장의 나이가 된다. 모든 기준값 검증 필요 */
var LIFE_AGE={
 start:20,
 job:    {u4:26, col:23, hs:21,  src:'통계청 경제활동인구조사 청년층 부가조사 2024: 4년제 졸업 소요 약 4년 3~4개월, 첫 취업까지 약 11개월. 검증 필요'},
 lease:  {plus:2,         src:'첫 취업 뒤 2년. 근거 통계 없음, 흐름상 값'},
 card:   {plus:3,         src:'게임 순서상 값'},
 car:    {plus:4,         src:'게임 순서상 값'},
 wedding:{M:34, F:31,     src:'통계청 혼인통계 2024: 평균 초혼 연령 남 약 33.9세, 여 약 31.6세. 검증 필요'},
 home:   {age:39,         src:'국토교통부 주거실태조사 2023: 생애최초 주택 마련 가구주 평균 연령 약 39~40세(추정). 검증 필요'},
 end:60                    /* 할배 = 마흔 해 뒤의 나 */
};
/* 계산: job=card.school이 '4년제'면 26, 전문대면 23, 고졸이면 21. lease=job+2, card=job+3, car=job+4.
   wedding=성별(S.avatar==='stuF'?31:34), 다만 car+1보다 작으면 car+1. home=max(39, wedding+2). */
```

예: 4년제 남 26 → 28 → 29 → 30 → 34 → 39 → 60. 전문대 여 23 → 25 → 26 → 27 → 31 → 39 → 60.

장 사이 나이 흐름: 다음 장 나이 바로 앞까지 퀘스트 3개마다 한 살씩 오른다.
```js
var LIFE_QPY=3;   /* 퀘스트 몇 개에 한 살 */
/* lifeAge() = min(nextAge-1, anchorAge + floor((S.done.length-anchorDone)/LIFE_QPY))
   anchorAge, anchorDone은 직전 장을 시작한 때(처음엔 20살, 0개)의 값. 마지막 장 뒤 nextAge는 60이지만 결산 전엔 home+5에서 멈춘다 */
```

나이에 따라 신분이 바뀐다(퀘스트 고르기에 바로 반영된다).
- 나이가 gradAge가 되면 S.status='취준생', S.prep=0. 할배 한 줄 "졸업 축하하네. 이제 진짜 시작이야."
- 1장(첫 취업)을 마치면 S.status='직장인', S.years=0, S.company는 그대로(null이면 홈에서 묻던 흐름을 쓴다).
- S.years는 나이-job 나이로 0(1년 미만) / 2(1~3년) / 5(4년 이상) 구간에 맞춘다.
- S.age 구간값: 24 이하 24, 29 이하 29, 34 이하 34, 그 위 40.

### 2-2. HUD

- hudRefresh의 hnm 글자를 인생 모드에서만 바꾼다: "대학생 · 20살 · Lv.3". 일반 모드는 지금 그대로 "대학생 Lv.3".
- 나이가 오르면 toast "21살이 됐어요" 한 번, 장 시작으로 몇 살을 건너뛰면 "26살 · 3년이 흘렀어요".
- 인생 진행 띠(선택): 메인 칩(mqChip) 아래 1px 막대, 20~60을 채운 비율. 1단계에서 빠듯하면 빼도 된다.

### 2-3. 하루 제한 풀기

S.mode==='life'일 때만 푼다. 일반 모드는 한 글자도 안 바뀌어야 한다.

```js
function lifeOn(){ return !!(S&&S.mode==='life'); }
function mqDay(id){ return lifeOn()||!(S.mq&&S.mq.at&&S.mq.at[id]===dayKey()); }      /* 인생 모드: 하루 한 장 없음 */
function upLeft(){ if(lifeOn()) return 99; /* 기존 본문 그대로 */ }                    /* 거처 해금 하루 1칸 없음. 스탯(TIERS.need)이 막는다 */
/* dripEnsure: 인생 모드면 날짜 대신 "열린 채 안 푼 퀘스트가 5개 밑이면 5개 더 연다"(lifeDripTop) */
/* mqAnnounce: 인생 모드면 MQ_SAID를 dayKey() 대신 'L'+장id로 비교해 장마다 한 번 알린다 */
```

남는 잠금(레벨 6·8·10, 집 스탯 42·48, 은행 골목)은 그대로 둔다. 이것이 한 인생의 길이를 정한다. 2~3시간에 들어오는지는 추측이라 플레이 시험이 필요하다. 넘치면 인생 모드 경험치 1.5배(grant에서 lifeOn()이면 xp 곱하기)를 첫 손잡이로 쓴다.
광고 하루 횟수, 연속 출석, 일일 퀘스트(pickDaily)는 1단계에서 건드리지 않는다.

## 3. 60살 인생 결산 카드

### 3-1. 끝나는 조건과 흐름

- 인생 모드의 엔딩 조건은 lifeEndReady(): !S.life.over && mqDone('home'). 거처 맨 위와 보스 전부는 요구하지 않는다(카드에 기록만).
- 6장을 마치면 mqAfter의 checkEnding 대신 할배가 묻는다: "이제 남은 세월을 넘겨 볼 텐가?" [60살로 넘어가기] [조금 더 살아 보기]. 더 살면 HUD 메인 칩 자리에 "60살로 넘어가기" 버튼이 남는다(보스를 마저 잡을 시간).
- 넘어가면: 짧은 컷 한 장 "그 뒤로 스물한 해가 흘렀다"(39→60, 숫자는 60-현재 나이) → 기존 ENDING 그대로 playCinema(할배 정체 공개) → lifeSettle() → 결산 카드.

### 3-2. 필드 (모두 S에서 계산)

```js
/* lifeSummary(): 결산 카드와 앨범이 같이 쓰는 한 장짜리 기록 */
var LIFE_SUMMARY_FIELDS={
 v:1, at:'dayKey()', mins:'(Date.now()-S.life.t0)/60000 반올림',
 card:'S.life.card 그대로(region,family,school,living,trait)',
 hero:'S.hero', name:'heroOf().name',
 tier:'S.tier', tierName:'TIERS[S.tier].name', own:'!!TIERS[S.tier].own',
 coin:'S.coin',
 assets:'S.coin + TIER_DEP[paidBase()] * 10',          /* 거처 값을 코인 단위로 어림(보증금표×10). 실제 원화 아님 */
 stats:'{ju,sik,ui,geum,jik} = S.stats 복사',
 statTop:'가장 높은 스탯 키(같으면 THEME_ORDER 앞쪽)',
 lv:'S.lv',
 chapters:'MQ_LIST.map(c => ({id:c.id, grade:S.mq.done[c.id]||null, age:S.life.ch[c.id]&&S.life.ch[c.id].age}))',
 chDone:'6장 중 깬 수', chGood:'good 등급 수',
 bosses:'BOSSES.map(b => ({id:b.id, name:b.name, win:bossCleared(b.id)}))',
 picks:'S.life.picks 마지막 5개 [{age, what, choice, good}]',   /* 큰 결정 기록 */
 quests:'S.done.length',
 title:'lifeTitle() 결과 {id, text}'
};
```

큰 결정 기록(picks) 쌓는 곳(1단계):
- 메인 장을 마칠 때(mqFinish 뒤): {age, what:'1장 첫 취업', choice:등급 말('꼼꼼히'·'그럭저럭'·'아쉽게'), good:g==='good'}.
- 생활 이벤트 choose(k): {age, what:e.who 또는 e.id, choice:c.t, good:(c.d.xp>0)}.
- 보스 이김·짐(bossEnd): {age, what:b.name, choice:win?'이겼다':'물러섰다', good:win}.
- 이사(첫 자가 들어간 날): {age, what:'첫 내 집', choice:TIERS[i].name, good:true}.
카드에는 good인 것 우선으로 다섯 줄. 2단계 갈림길이 생기면 그 선택이 여기에 먼저 들어간다.

### 3-3. 인생 칭호 (위에서부터 처음 맞는 것 하나)

```js
var LIFE_TITLES=[
 {id:'guin',   t:'누군가의 귀인이 된 사람',   if:'chGood===6 && 보스 3 모두 이김'},
 {id:'shin',   t:'84㎡ 신축의 주인',          if:'S.tier===14'},
 {id:'self',   t:'맨손으로 일군 내 집',       if:'card.family==="빠듯" && own'},
 {id:'early',  t:'남보다 먼저 시작한 사람',   if:'card.school==="전문대" && own'},
 {id:'hunter', t:'사기꾼 사냥꾼',             if:'보스 3 모두 이김'},
 {id:'own',    t:'내 이름 올린 집 한 채',     if:'own'},
 {id:'geum',   t:'통장이 든든한 사람',        if:'statTop==="geum"'},
 {id:'ju',     t:'집 보는 눈이 밝은 사람',    if:'statTop==="ju"'},
 {id:'sik',    t:'밥심으로 버틴 사람',        if:'statTop==="sik"'},
 {id:'ui',     t:'단정하게 살아온 사람',      if:'statTop==="ui"'},
 {id:'jik',    t:'일로 증명한 사람',          if:'statTop==="jik"'},
 {id:'plain',  t:'평범하게, 잘 살아온 사람',  if:'true'}
];
/* 6장을 깨야 결산에 오므로 own은 보통 참이다. 그래서 own 앞쪽 줄이 실제로 갈리는 자리다 */
```

### 3-4. 공유 이미지 1080×1350

논리 캔버스 360×450, 3배(CARDS 대신 LIFE_S=3)로 그린다. 픽셀 그림 imageSmoothingEnabled=false. 기존 shareCard의 색(P.*), 글꼴(Galmuri14/11), houseCv, heroCv를 그대로 쓴다.

| 영역 | 논리 좌표(x,y,w,h) | 내용 |
|---|---|---|
| 머리 | 0,0,360,44 | "뉴비 퀘스트 · 인생 결산"(16px), 오른쪽 "20 → 60살" |
| 칭호 | 12,48,336,40 | 인생 칭호 한 줄(20px, 노란색 #FFE79B), 아래 이름 "김뉴비의 마흔 해" |
| 그림 | 12,92,336,128 | 하늘 띠 + 바닥, 왼쪽 주인공 heroCv 2배, 오른쪽 houseCv(S.tier) 2배, 가운데 할배(sceneGpa) 작게 |
| 태어남 | 12,224,336,30 | "수도권 · 보통 · 4년제 · 본가 · 알뜰" 한 줄, 칸 경계 점선 |
| 숫자 | 12,258,336,44 | 셋으로 나눔: 거처 이름 / 모은 코인 ￦ / 자산 어림 ￦ |
| 스탯 | 12,306,164,70 | 집·밥·옷·돈·일 막대 다섯(shareCard의 막대 그대로, 폭만 줄임) |
| 장·보스 | 184,306,164,70 | 1~6장 칸 여섯(good 금색·ok 은색·bad 회색·안 깸 빈칸) 아래 보스 셋 얼굴 점(이김 컬러·짐 흑백) |
| 큰 결정 | 12,380,336,48 | "26살 첫 취업 · 꼼꼼히" 형식 세 줄(picks 앞 3개) |
| 꼬리 | 0,430,360,20 | "나도 미리 살아 보기 · " + SHARE_BASE, 플레이 시간 |

공유 글: '뉴비 퀘스트 인생 모드 · 60살 결산 · "'+칭호+'" · '+거처+'\n'+SHARE_PITCH+'\n'+SHARE_BASE. 내보내기는 shareCardOut과 같은 길(이미지 저장/공유 시트)을 쓴다.

## 4. 모드 사이 흐름

### 4-1. 시작 메뉴 (menuItems 고침)

```js
/* 위에서부터. has*는 각 저장 칸에 onboarded 저장이 있는지 */
[
 hasLife   ? {k:'lcont', t:'이어하기 · 인생', s:age+'살 · '+status+' · 메인 '+n+'/6'}          : null,
 hasNormal ? {k:'cont',  t:'이어하기 · 일반', s:'Lv.'+lv+' · '+tierName}                       : null,
 {k:'life',   t:'인생 모드 (추천)', s:hasLife?'새 인생 뽑기 · 지금 인생은 앨범으로':'스무 살부터 예순까지, 2~3시간'},
 {k:'normal', t:'일반 모드',        s:hasNormal?'처음부터 다시':'하루 한 장, 천천히'},
 albumN    ? {k:'album', t:'인생 앨범', s:albumN+'번의 인생'}                                  : null,
 /* 기존: 프롤로그 다시 보기, 소리 */
]
```
- 'life'를 누르고 진행 중인 인생이 있으면 확인: "지금 인생(27살)을 여기서 끝낼까요? 결산 없이 앨범에 '중간에 멈춘 인생'으로 남아요." [새로 태어나기][돌아가기].
- 'normal'을 누르고 일반 저장이 있으면 지금의 "처음부터 할까요?" 확인을 그대로 쓴다(일반 칸만 지운다).
- 처음 켠 사람(저장 둘 다 없음)에게는 '인생 모드 (추천)'를 main 버튼으로 둔다.

### 4-2. 저장 나누기: 키를 따로 쓴다

결론: 인생 모드는 저장 키를 따로 쓰고, 상태 안에도 S.mode='life'를 둔다. 둘 다 필요하다.
- 키를 따로 쓰는 까닭: 한 키에 S.mode만 두면 인생 모드를 시작하는 순간 일반 모드 진행(몇 주 쌓은 출석·거처)이 지워진다. 대표가 일반 모드를 남긴다고 했으니 두 진행이 함께 있어야 한다.
- S.mode를 두는 까닭: 게임 코드 곳곳(mqDay, upLeft, hudRefresh 등)이 "지금 어느 모드인가"를 S만 보고 알아야 한다.

```js
var KEY='nq.v8';                 /* 일반. 이름 그대로 둬서 기존 저장을 그대로 읽는다 */
var KEY_LIFE='nq.life.v1';       /* 인생 */
var KEY_ALBUM='nq.album.v1';     /* 인생 앨범, 최대 30장. 넘치면 가장 오래된 것부터 버림 */
var KEY_PREF='nq.pref.v1';       /* 소리·진동·알림·프롤로그 봄. 두 모드가 같이 쓴다 */
var SLOT='normal';               /* 지금 열린 칸. 'normal' | 'life' */
function slotKey(){ return SLOT==='life'?KEY_LIFE:KEY; }
function save(){ try{ localStorage.setItem(slotKey(),JSON.stringify(S)); }catch(e){} }
function load(slot){ SLOT=slot||'normal'; /* 기존 본문에서 KEY 대신 slotKey() */ }
/* 처음 켤 때: 마지막에 쓴 칸을 KEY_PREF.last에 적어 두고 그 칸을 읽어 시작 메뉴를 그린다.
   메뉴는 두 칸 다 훑어야 하니 peekSlot(key)로 JSON만 읽어 요약을 만든다(S를 바꾸지 않음). */
```

S.life (인생 칸에만 있음):
```js
S.mode='life';
S.life={v:1, rolls:0, card:null,            /* {region,family,school,living,trait} */
  t0:Date.now(), age:20, anchor:{age:20,done:0},
  ages:{job:26,lease:28,card:29,car:30,wedding:34,home:39},   /* 카드와 주인공 성별로 처음에 계산해 고정 */
  ch:{},                                    /* ch[id]={age, grade} */
  picks:[], over:false, title:null};
```
주의: 주인공을 바꾸면 결혼 나이 성별이 바뀌지 않게 ages는 "이 인생으로 살기"를 누를 때 한 번 계산해 고정한다. 주인공은 그 다음 화면에서 고르므로, 결혼 나이 계산은 주인공 고르기 다음(온보딩 끝, obnext 마지막)에서 한다.
분석 이벤트 ev()에는 mode를 붙인다(일반·인생 수치를 섞지 않게).

### 4-3. 인생 모드 시작 순서

시작 메뉴 '인생 모드' → (프롤로그를 안 봤으면) playPrologue → 온보딩 obSteps()=['birth','avatar'] → 할배 첫 대사(카드 줄 1~4) → 홈. 일반 온보딩의 신분·거처·권역 질문은 카드가 채우므로 건너뛴다.

### 4-4. 엔딩 뒤

결산 카드 아래 버튼 셋:
- "이미지 저장 · 공유" (lifeShareOut)
- "다시 태어나기": 확인 없이 바로. 이 인생은 이미 앨범에 들어갔다. KEY_LIFE를 새 fresh()+S.mode='life'로 덮고 'birth' 단계로 간다(프롤로그는 건너뜀).
- "이 동네 더 둘러보기": S.life.over=true인 채 홈으로. 나이는 60살에 멈추고 메인 칩 자리에 "결산 다시 보기". 퀘스트·보스는 계속 되지만 결산 기록은 바뀌지 않는다.

인생 앨범: lifeSettle()에서 lifeSummary()를 KEY_ALBUM 배열 앞에 넣는다(이미지가 아니라 요약 객체를 저장하고, 볼 때 다시 그린다. 1장당 약 1KB). 시작 메뉴 '인생 앨범'은 카드 목록(칭호, 태어남 한 줄, 거처, 날짜)이고, 누르면 그 1080×1350 카드를 다시 그려 보여 주고 공유할 수 있다. 중간에 멈춘 인생은 over:false, title '중간에 멈춘 인생'으로 흐리게 넣는다.

고졸 카드의 거처는 지역 표 대신 {본가:70, 자취:30}(기숙사 없음, 추정). 첫 장(첫 취업)이 21살이라 대학생 구간이 없고 바로 취준생으로 시작한다.

## 5. 2단계 갈림길 자리 (대본 없음, 자리만)

| id | 나이(대략) | 붙일 곳 | 갈래 |
|---|---|---|---|
| f_school | 20 | 고졸 시작 | 일 먼저 / 늦게 진학(만학) |
| f_army | 21~22, 남 | 나이 흐름(lifeAge) | 입대 시기, 군 적금(장병내일준비적금) |
| f_major | 20 | 'birth' 뒤 | 전공 계열(취업 나이·첫 회사 확률) |
| f_loan | 20~23 | 대학생 구간 | 학자금 대출 받기 / 알바로 버티기 |
| f_firstjob | job | MQ 1장 끝 | 회사 종류(S.company 4갈래) 고르기 또는 추첨 |
| f_rent | lease | MQ 2장 앞 | 전세 / 월세 유지 / 본가 머물기 |
| f_card | card | MQ 3장 | 신용카드 / 체크카드만 |
| f_car | car | MQ 4장 앞 | 차 사기 / 안 사기(대중교통) |
| f_change | 31~33 | 장 사이 | 이직 / 버티기 / 창업 |
| f_marry | wedding | MQ 5장 앞 | 결혼 / 비혼 / 늦게 |
| f_child | wedding+2 | 장 사이 | 아이 / 안 가짐 |
| f_home | home | MQ 6장 앞 | 청약 / 매매 / 계속 전세 |
| f_invest | 35~45 | 생활 이벤트 | 코인·주식 몰빵 / 적립 / 안 함 |
| f_parents | 45~55 | 39→60 넘어가기 사이 | 부모 부양·간병 |
| f_retire | 55~60 | 결산 직전 | 은퇴 시기, 연금 받는 나이 |

39살 뒤 60살까지는 1단계에서 컷 한 장으로 건너뛴다. 2단계에서는 f_invest, f_parents, f_retire 세 장면이 이 빈칸을 채운다. 각 갈림길 결과는 S.life.picks에 {age, what, choice, good}으로 들어가 결산 카드에 그대로 뜬다.

## 6. 더하거나 고칠 함수

새로 더함
- lifeOn() — S.mode==='life'.
- birthRoll() — BIRTH에서 다섯 칸 뽑아 S.life.card에 넣고 rolls+1, save().
- birthApply() — 카드 값을 S에 반영: coin, stats, tier/peak/paid, status/living/region/age, hint.
- birthRender() — 'birth' 단계 화면(슬롯 멈춤, 효과 줄, 버튼 둘, 앞 카드 띠, 통계 출처 tip).
- birthLines() — 할배 첫 대사 배열.
- lifeAgesFix() — 카드·주인공 성별로 S.life.ages 계산(온보딩 끝에서 한 번).
- lifeAge() / lifeTick() — 나이 계산, 오르면 toast·신분 바꿈(졸업→취준생, S.years, S.age 구간). 퀘스트 완료 뒤와 장 시작(mqStart)에서 부름.
- lifePick(o) — S.life.picks에 한 줄 더함(최대 40개 유지).
- lifeDripTop() — 인생 모드 퀘스트 열기.
- lifeEndReady() / lifeEndAsk() / lifeSkip() — 6장 뒤 묻기, "60살로 넘어가기", 시간 건너뛰기 컷.
- lifeSummary() / lifeTitle() — 결산 기록과 칭호.
- lifeSettle() — S.life.over=true, title 저장, 앨범에 넣기, 결산 화면 열기.
- lifeCard(sum) — 1080×1350 캔버스 그리기(앨범에서도 씀). lifeShareOut(sum) — 저장·공유.
- albumLoad() / albumAdd(sum) / albumRender() — 인생 앨범.
- slotKey() / peekSlot(key) / prefLoad() / prefSave() — 저장 칸 나누기.

고침
- fresh() — mode, life 칸 기본값(일반 모드에서는 mode:'normal', life:null).
- load(slot) / save() — slotKey() 사용. 소리·진동·알림·prologue는 KEY_PREF로 옮기되 옛 저장에서 한 번 옮겨 담기.
- menuItems() / pick(k) — 4-1의 메뉴와 확인 창. 'life', 'lcont', 'normal', 'album' 갈래.
- obSteps() — 인생 모드면 ['birth','avatar']. obRender()에 'birth' 분기, 'avatar'에서 어울림 표시와 미리 고르기. obnext 마지막 단계에서 lifeAgesFix()와 할배 첫 대사.
- heroCard() — 어울림 표시 하나 더(인자 추가).
- hudRefresh() — hnm에 나이.
- mqDay(), upLeft(), dripEnsure(), mqAnnounce() — 2-3절대로 인생 모드에서만 풂.
- mqStart() — 장 시작 때 나이를 그 장 나이로, S.life.anchor 갱신.
- mqFinish() 또는 mqAfter() — lifePick, S.life.ch[id], 1장이면 직장인으로. home이면 checkEnding 대신 lifeEndAsk().
- checkEnding() / endingReady() — 인생 모드면 lifeEndReady()를 보고, ENDING 뒤에 endingShareSheet 대신 lifeSettle().
- maybeLifeEvent의 choose(k), bossEnd(win) — lifePick 한 줄씩.
- ev() — 이벤트에 mode 붙임.
- grant() — (필요할 때만) 인생 모드 경험치 배율 LIFE_XP=1.0으로 시작, 시험 뒤 조정.

## 7. 확인과 추측

확인함(코드): 위 0절 전부, 하루 제한 네 곳, 저장 키 하나, 할배 "마흔 해" 대사, 6장 뒤 checkEnding 호출 위치.
추측(검증 필요): 모든 통계 숫자와 출처 연도, 스무 살 거처 지역별 비율(근거 가장 약함), 한 인생이 2~3시간에 들어온다는 것, 시작 거처를 ju 없이 올려도 화면이 안 깨진다는 것.
대표에게 권하는 안 하나: 통계 숫자는 출시 전에 KOSIS에서 한 번에 확인하고, 카드의 "통계 출처" 창에 표 이름과 연도를 그대로 적는다. 숫자보다 출처를 보여 주는 것이 "실제 통계로 살아 보는 인생"이라는 약속을 지킨다.
