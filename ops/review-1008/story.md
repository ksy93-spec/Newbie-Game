# 리뷰 1008 · 스토리: 짧은 이야기 컷신 11편 (스토리·첫인상 리드)

대표 요청 중 "메인 챕터처럼 영상(컷신)을 중간중간 더"를 맡았다. 지금 컷신 엔진을 읽고 1장을 직접 틀어 본 뒤, 플레이어가 이미 지나가는 순간 11곳에 20~30초짜리 짧은 컷신을 붙이는 안을 냈다. 대본 11편은 지금 엔진(playMQ)에 그대로 넣어 틀어 봤고, 줄 넘침 없이 돌았다.

- 대본 원본(붙여 넣을 파일): ops/review-1008/tools/story-scenes.js (아래 5절에 같은 내용)
- 확인 스크립트: tools/story-look.mjs(1장 캡처, 배경 15장 모음), tools/story-try.mjs(제안 대본 재생, 줄 접힘·길이 계산)
- 그림: img/story-mq-*.png(지금 1장), img/story-bg-sheet.png(배경 15장), img/story-try-*.png(제안 대본을 지금 엔진에 넣은 화면)

## 1. 지금 컷신 엔진 (확인한 것)

- playMQ(o) (10786줄). o = {no, title, sub, scenes, from, ok, n, resume, save, endScenes, onDone}. 맨 앞에 제목 카드({type:'title'})를 붙이고, 마지막 대본 장면을 지나면 endScenes(ok,n)이 돌려준 결말·보상 카드를 붙인다.
- 장면 한 개: {bg, cast:[[열쇠,'L'|'C'|'R']], who, text:[..], doc:{t,rows(4줄까지),bad}, choice:{opts:[{a,ok,note}]}, fx, amt, sfx}. fx는 flash, fade, shake, stamp(amt), money+, money-, confetti, rain.
- 배경: mqBg가 castCv('bg_'+이름)을 먼저 찾고, 없으면 MQ_BG 그림 함수, 그것도 없으면 어두운 단색. 지금 bg_ 그림은 15장: apartment, bank, cafe, carlot, hometown, livingroom, meeting, modelhouse, night, office, phone(밤의 작은 방), road, station, town, weddinghall.
- 인물: scenePortrait가 castCv('npc_'+열쇠) 그림을 세우고, 없으면 NPC_TOP 도트 인물. 쓸 수 있는 열쇠: hero, halbae, partner(배우자/짝꿍), officem, peerf, peerm, deskf, boss, mlmf, fp, gpa, gma, boy, girl. 펫 그림(pet_bird, pet_dog, pet_turtle)은 CAST에 있지만 컷신에서는 못 꺼낸다.
- 글자: 초당 18자, 상자 폭이 한글 약 14자. 기존 대본은 한 장면 2~3줄, 줄마다 8~13자.
- '빠르게'는 다음 선택지나 결말·보상 카드까지 건너뛴다. 선택지가 없는 대본이면 곧장 보상 카드로 간다.
- 제목 카드는 'MAIN QUEST · CHAPTER '+o.no, 보상 카드는 'CHAPTER CLEAR'와 별 3개, '선택 n / m'이 박혀 있다. 짧은 컷신에 그대로 쓰면 "MAIN QUEST · CHAPTER"가 빈 번호로 뜬다(img/story-try-title.png).
- 문서 상자(drawDoc, y=8)가 오른쪽 위 '빠르게' 단추에 첫 줄 오른쪽이 가린다. 지금 1장에도 있는 문제다(img/story-mq-choice.png, img/story-try-firstq-doc.png).
- playCinema(9724줄)는 프롤로그·엔딩용으로, 장면마다 draw 함수를 직접 쓰는 다른 형식이다. 새 컷신은 playMQ 형식이 맞다(배경 그림, 인물, 문서 상자, 보상 카드를 다 쓴다).
- 다시 보기: 도감(수집 노트)의 mqCodex(11162줄)가 메인 6장을 늘어놓고, 끝낸 장은 "다시 보기"로 다시 튼다. 프롤로그는 시작 메뉴에서 다시 본다.

## 2. 할배 말투 (기존 대본에서 뽑은 규칙)

- 첫마디 "허허,". 끝말 ~구먼, ~게(권유), ~세(같이 하자), ~네, ~일세, ~야. 주인공을 "자네"라 부른다.
- 한 장면에 교훈 하나. 숫자는 문서 상자로 빼고 할배는 원칙만 말한다("돈은 소유자 계좌로", "종이는 한곳에").
- 할배의 정체(마흔 해 뒤의 주인공, 엔딩)는 숨기되 흘린다. 새 대본 네 곳에 복선을 넣었다: "...나도 그랬거든"(고시원), "...아주 옛날 일이야"(첫 실패), "...한 번 당해 봤거든. 아주 크게"(첫 보스, 엔딩의 "참 많이 잃었거든"과 맞춤), 그리고 프롤로그 문장 "산 너머 버스가 하루 네 번 서는 마을"을 할배가 그대로 말하는 "하루 네 번 버스".
- 튜토리얼 안내(반말 친구 말투)와 겹치지 않게 했다. 레벨 2 안내는 이미 튜토리얼(lv2)에 있어서 별도 컷신을 만들지 않고 스탯 설명을 "첫 단추"에 합쳤다.

## 3. 11편 한눈에

길이는 글자 수/18초 + 장면당 1.4초 + 문서 상자 1.5초 + 제목·보상 카드로 셈한 추정이다(실측 아님).

| id | 제목 | 계기(함수와 조건) | 배경 · 인물 | 길이 | 보상 |
|---|---|---|---|---|---|
| firstq | 첫 단추 | finish(): 실패 아님, 복습 아님, S.done.push 뒤 S.done.length===1 | town · hero, halbae | 29초 | 없음(퀘스트 보상과 겹침) |
| firstfail | 틀려도 괜찮네 | finish(true): 복습(q.keys)이 아닌 퀘스트를 처음 실패 | night(비) · hero, halbae | 22초 | 없음 |
| home4 | 문 달린 방 | tierMove(4)가 ok이고 이전 S.paid<4 | 새 bg_gosiwon, night · hero, halbae | 26초 | ￦50 |
| home6 | 첫 월세 방 | tierMove(6) ok, 이전 S.paid<6 | town, phone(작은 방) · hero, halbae | 27초 | ￦100 |
| home8 | 방이 둘 | tierMove(8) ok, 이전 S.paid<8 | apartment, livingroom · hero, halbae | 27초 | ￦150 |
| home12 | 불 켜진 창 | tierMove(12) ok, 이전 S.paid<12 (자가는 6장 뒤라 배우자가 있다) | apartment, livingroom, night · hero, partner, halbae | 25초 | ￦200 |
| boss1 | 처음 이긴 날 | bossEnd(true)에서 first이고 push 뒤 S.bossDone.length===1 | 보스별 apartment/cafe/bank, night · hero, boss/mlmf/fp, halbae | 26초 | 없음(보스 ￦200·스탯 15와 겹침) |
| streak7 | 이레째 아침 | msCheck()에서 m.d===7 보상을 줄 때(출근 참새를 받는 날) | phone, station · hero, pet_bird, halbae | 23초 | 없음(이미 ￦200·참새) |
| tax | 13월의 월급 | rollDay(): 1월 15일~2월 말, S.status==='직장인', 그해 처음 | office, phone · hero, peerf, halbae | 26초 | ￦130, 해마다 1번 |
| back | 돌아온 날 | rollDay(): gap>=3 (이미 계산하는 S.day와의 차이) | town · hero, halbae | 25초 | ￦100, 14일에 1번 |
| memory | 하루 네 번 버스 | mqDone('card') && mqDay('card') (3장을 깬 다음 날), 4장 알림보다 먼저 | night, hometown · hero, halbae | 26초 | 없음 |

빠진 후보와 이유: 첫 차는 메인 4장이 이미 다룬다. 첫 전세(원룸 전세, 7)와 첫 자가(9)도 메인 2장·6장이 다룬다. 첫 월급은 메인 1장 안에 있다. 레벨 마일스톤은 튜토리얼과 메인 장 잠금(6·8·10)이 이미 알려서, 따로 두면 같은 날 말이 겹친다. 첫 펫은 대부분 7일 출석 참새라 streak7에 합쳤다(상점에서 강아지를 먼저 산 사람에게도 참새 대신 그 펫을 세우면 된다. 아래 csFill 참고).

## 4. 엔진에 더할 것 (제안 코드, 적용 안 함)

prototype/는 이번 리뷰에서 고치지 않는다. 개발 리드가 붙일 모양만 적는다.

가. 제목·보상 카드 문구를 열어 둔다 (drawTitle, drawReward)

```js
// drawTitle
ctext(ctx,o.kicker||('MAIN QUEST · CHAPTER '+o.no),W/2,y-18,8,'#9B93A8','c');
// drawReward
var s=p.head||'CHAPTER CLEAR';
// 별과 '선택 n / m'은 p.grade가 있을 때만 그린다
if(p.grade){ /* 기존 별 3개, 선택 줄 */ }
```

나. 펫을 컷신 인물로 (portraitSrc 맨 앞 세 줄). story-try.mjs에서 이렇게 덮어 틀어 봤고 참새가 바닥선에 맞게 선다(img/story-try-bird.png).

```js
if(/^pet_/.test(k)){ var pc=castCv(k); return pc?{cv:pc,key:k,right:false,k:pc.width/(pc.lw||pc.width)}:null; }
```

다. 이야기 큐 (메인 퀘스트 블록 아래)

```js
/* 짧은 이야기 컷신. 계기에서 큐에 넣고, 홈이 한가할 때 하나씩 튼다. 하루 두 편까지 */
function csS(){ if(!S.cs) S.cs={seen:{},q:[],pay:{},day:'',n:0}; return S.cs; }
function csKey(id){ return id==='tax'?'tax'+dayKey().slice(0,4):id; }
function csWant(id,arg){
  var C=csS(),k=csKey(id); if(!CS_STORY[id]) return;
  if(id!=='back'&&C.seen[k]) return;
  if(C.q.some(function(e){ return e.id===id; })) return;
  C.q.push({id:id,arg:arg==null?null:arg}); save(); }
function csFill(id,arg){
  var c=CS_STORY[id],sc=c.scenes.slice(),f={};
  if(id==='boss1'){ var bf=BOSS_FIRST[arg]||BOSS_FIRST.jeonse; sc=[bf.scene].concat(sc); f.bg=bf.bg; }
  if(id==='back'){ var nx=mqNext(); f={n:arg||3,rev:(S.review||[]).length,tier:TIERS[S.tier].name,lv:S.lv,mq:nx?nx.no+'장 '+nx.title:'모두 마침'}; }
  if(id==='streak7'&&S.equip.pet&&S.equip.pet!=='bird'&&PETS[S.equip.pet]&&PETS[S.equip.pet].kind) f.pet='pet_'+PETS[S.equip.pet].kind;
  var rp=function(s){ return String(s).replace(/\{(\w+)\}/g,function(m,k){ return f[k]!=null?f[k]:m; }); };
  return sc.map(function(p){ var q=JSON.parse(JSON.stringify(p));
    if(q.alt&&id==='back'&&!f.rev) q.text=q.alt.rev0;
    q.bg=rp(q.bg); q.text=q.text.map(rp); if(q.doc) q.doc.rows=q.doc.rows.map(function(r){ return r.map(rp); });
    if(f.pet&&q.cast) q.cast=q.cast.map(function(c){ return c[0]==='pet_bird'?[f.pet,c[1]]:c; });
    return q; }); }
function csPay(id,replay){
  var R=CS_STORY[id].reward,C=csS(),k=csKey(id),rows=[]; if(!R||replay) return rows;
  if(C.pay[k]&&!(R.every&&dayGap(C.pay[k],dayKey())>=R.every)) return rows;
  C.pay[k]=dayKey(); if(R.coin){ S.coin+=R.coin; rows.push(['코인','￦'+R.coin]); }
  save(); ev('cs_reward',{id:id,coin:R.coin||0}); return rows; }
function csPlay(id,arg,replay){
  var c=CS_STORY[id],C=csS(); if(!c||MQP) return false;
  if(!replay){ C.seen[csKey(id)]=dayKey(); if(C.day!==dayKey()){ C.day=dayKey(); C.n=0; } C.n++; save(); }
  ev('cs_play',{id:id,replay:replay?1:0});
  playMQ({kicker:'STORY',title:c.title,sub:replay?'다시 보기':c.sub,scenes:csFill(id,arg),
    endScenes:function(){ var rows=csPay(id,replay); return rows.length?[{type:'reward',head:'STORY',card:[c.title,c.sub],rows:rows,end:1}]:[]; },
    onDone:function(){ render('home'); hudRefresh(); }});
  return true; }
function csTick(){
  var C=csS(); if(!C.q.length||!mqIdle()) return false;
  if(C.day===dayKey()&&C.n>=2) return false;
  if(S.first===dayKey()&&C.n>=1&&C.q[0].id!=='firstfail') return false;   /* 첫날은 한 편(실패 위로는 예외) */
  var e=C.q.shift(); return csPlay(e.id,e.arg,false); }
```

라. 계기 걸기 (모두 한 줄씩)

- finish(): S.done.push(q.id) 바로 뒤 `if(S.done.length===1) csWant('firstq');`, 함수 끝쪽 `if(failed&&!q.keys) csWant('firstfail');`
- tierMove(i): 성공 줄 앞에 `var pp=S.paid||0;`, 성공 뒤 `if(i>pp&&CS_STORY['home'+i]) csWant('home'+i);`. grep으로 S.tier를 바꾸는 곳은 tierMove(와 개발용 9440줄)뿐인 것을 확인했다. 전세 계약 완료도 tierMove를 거치는지는 확인하지 못했다(추측: 거친다).
- bossEnd(): `if(first){ S.bossDone.push(B.id); ... if(S.bossDone.length===1) csWant('boss1',B.id); }`
- msCheck(): 보상을 줄 때 `if(m.d===7) csWant('streak7');`
- rollDay(): ev('day_start') 앞에 `if(S.onboarded&&gap>=3) csWant('back',gap);` 그리고 `var mm=+t.slice(5,7),dd=+t.slice(8,10); if(S.onboarded&&S.status==='직장인'&&((mm===1&&dd>=15)||mm===2)) csWant('tax');` 그리고 `if(mqDone('card')&&mqDay('card')) csWant('memory');`
- 틀기: mqRetry()와 9692줄(시작 뒤 2.6초)에서 mqAnnounce() 앞에 `if(typeof csTick==='function'&&csTick()) return;`. 이야기를 튼 그 차례에는 할배 메인 알림을 미룬다(창이 닫히면 mqRetry가 다시 부른다).

마. 옛 저장 처리: S.cs가 없을 때 한 번, 이미 지난 것을 seen으로 찍는다(자동으로 틀지 않고 도감에서 다시 보기만, 보상 없음). firstq는 S.done.length>0, firstfail은 S.done.length>3, homeN은 S.paid>=N, boss1은 bossDone이 있으면, streak7은 S.ms에 7이 있으면. memory는 찍지 않는다(이야기라 늦게 봐도 된다).

## 5. 대본 전문 (붙여 넣는 데이터)

MQ_DATA 블록은 tools/mq-import.mjs가 붙여 넣는 구역이라 그 밖, 메인 퀘스트 블록 바로 아래에 둔다. 내용은 tools/story-scenes.js와 같다.

```js
/* 짧은 이야기 컷신 11편 (스토리 리드, 리뷰 1008 제안)
   장면 모양은 MQ_JOB.scenes와 같다: {bg, cast:[[열쇠,'L'|'C'|'R']], who, text:[..], doc:{t,rows,bad}, fx, amt, sfx}
   선택지(choice)는 넣지 않았다. 짧은 컷신은 보는 것이지 시험이 아니다.
   {n} {rev} {tier} {lv} {mq} {bg} {face} {name}은 csPlay가 재생 직전에 채운다.
   cast의 'pet_bird'는 portraitSrc에 pet_ 그림을 꺼내는 세 줄을 더해야 보인다(story.md 4절). */
var CS_STORY = {
 firstq: { title: '첫 단추', sub: '퀘스트 하나를 끝낸 날', reward: null,
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
     text: ['첫 퀘스트를 끝냈다.', '머리가 조금', '덜 복잡해졌다.'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 첫 단추를', '뀄구먼.'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '나',
     text: ['이거 하나 안다고', '뭐가 달라질까요?'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['하나를 알면 다음', '서류가 덜 무섭네.', '그게 쌓이는 거야.'] },
   { bg: 'town',
     doc: { t: '살림 다섯 가지', rows: [['집', '거처 · 방어력'], ['밥', '체력'], ['옷', '매력'], ['돈 · 일', '자금 · 경험']], bad: [] },
     who: '귀인 할배', text: ['사는 게 결국', '집, 밥, 옷, 돈, 일', '다섯 가지야.'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['집 퀘스트를 풀면', '집 스탯이 올라서', '더 나은 방이 열리네.'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '나',
     text: ['어느 것부터', '올려야 해요?'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['급한 것부터 하게.', '지금 자네는...', '잘 곳부터 아닌가?'] } ] },

 firstfail: { title: '틀려도 괜찮네', sub: '처음 퀘스트를 놓친 날', reward: null,
  scenes: [
   { bg: 'night', fx: 'rain', cast: [['hero', 'C']],
     text: ['반도 못 맞혔다.', '보상은 없었다.'] },
   { bg: 'night', fx: 'rain', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 표정이 영', '안 좋구먼.'] },
   { bg: 'night', fx: 'rain', cast: [['hero', 'L'], ['halbae', 'R']], who: '나',
     text: ['다 아는 줄 알았는데', '하나도 모르겠어요.'] },
   { bg: 'night', fx: 'rain', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['여기서 틀리면', '돈이 안 드네.', '밖에서 틀리면 들지.'] },
   { bg: 'night',
     doc: { t: '복습 상자', rows: [['틀린 문항', '내일 다시'], ['또 맞히면', '3일 · 7일 뒤'], ['계속 맞히면', '상자에서 졸업'], ['보상', '복습도 코인']], bad: [] },
     text: ['틀린 문항은', '복습 상자에 담겼다.'] },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['나도 처음엔 다 틀렸네.', '...아주 옛날 일이야.', '다시 해 보세.'] } ] },

 home4: { title: '문 달린 방', sub: '고시원 첫날', reward: { coin: 50 },
  scenes: [
   { bg: 'gosiwon', fx: 'fade', cast: [['hero', 'C']],
     text: ['고시원 방 한 칸.', '팔을 벌리면', '양쪽 벽이 닿는다.'] },
   { bg: 'gosiwon', cast: [['hero', 'C']], who: '나',
     text: ['그래도 문이 있다.', '잠글 수 있는 문.'] },
   { bg: 'gosiwon', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 좁아도 내 방이구먼.', '첫날 밤이 제일', '길 걸세.'] },
   { bg: 'gosiwon',
     doc: { t: '고시원 들어가면', rows: [['창문', '있는 방이 더 비싸다'], ['공용', '주방·화장실·세탁'], ['입실료', '이체 기록 남기기'], ['전입신고', '할 수 있다']], bad: [] },
     text: ['고시원도 전입신고를', '할 수 있다.', '주소가 생긴다.'] },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['벽이 얇으니', '이어폰 하나 챙기게.', '...나도 그랬거든.'] },
   { bg: 'night', fx: 'confetti', cast: [['hero', 'C']],
     text: ['다음 방은', '집 스탯을 올리면', '열린다.'] } ] },

 home6: { title: '첫 월세 방', sub: '원룸 월세 첫날', reward: { coin: 100 },
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 드디어 원룸이구먼.', '화장실이 방 안에', '있는 집이야.'] },
   { bg: 'town',
     doc: { t: '월세 계약서', rows: [['보증금', '500만 원'], ['월세', '45만 원'], ['관리비', '7만 원 별도'], ['특약', '도배는 세입자 부담']], bad: [3] },
     who: '귀인 할배', text: ['빨간 줄 보이나?', '특약은 소리 내서', '읽어 보게.'] },
   { bg: 'phone', fx: 'fade', cast: [['hero', 'C']],
     text: ['짐을 다 풀고 나니', '밤 열한 시.', '라면 물을 올렸다.'] },
   { bg: 'phone', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['월세는 매달 나가는', '돈이야. 월급날', '바로 빠지게 해 두게.'] },
   { bg: 'phone', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['월세 낸 기록은', '버리지 말게. 연말정산', '때 쓸 수도 있네.'] },
   { bg: 'phone', fx: 'confetti', cast: [['hero', 'C']],
     text: ['창밖에 불빛이 많다.', '오늘부터 여기가', '우리 동네다.'] } ] },

 home8: { title: '방이 둘', sub: '투룸 전세로 옮긴 날', reward: { coin: 150 },
  scenes: [
   { bg: 'apartment', fx: 'fade', cast: [['hero', 'C']],
     text: ['두 번째 전세 계약.', '이번엔 도장 찍는', '손이 덜 떨렸다.'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 방이 둘이구먼.', '하나는 자고, 하나는', '뭘 할 텐가?'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['halbae', 'R']], who: '나',
     text: ['책상 놓고 공부요.', '자격증 하나 따려고요.'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['좋지. 그리고 하나 더.', '전 집 보증금은', '다 돌려받았나?'] },
   { bg: 'livingroom',
     doc: { t: '이사 날 체크', rows: [['전 집', '보증금 돌려받기'], ['새 집', '전입신고·확정일자'], ['보증보험', '가입 확인'], ['전 집 열쇠', '반납']], bad: [] },
     text: ['나가는 날과', '들어가는 날이 겹치면', '순서가 중요하다.'] },
   { bg: 'livingroom', fx: 'confetti', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['이제 집 얘기는', '반쯤 끝났네.', '남은 반은 내 집이야.'] } ] },

 home12: { title: '불 켜진 창', sub: '첫 아파트 59㎡', reward: { coin: 200 },
  scenes: [
   { bg: 'apartment', fx: 'fade', cast: [['hero', 'L'], ['partner', 'R']],
     text: ['아파트 단지 정문.', '경비실 아저씨가', '고개를 끄덕였다.'] },
   { bg: 'apartment', cast: [['hero', 'L'], ['partner', 'R']], who: '배우자',
     text: ['여기가 우리 동이야?', '몇 층이랬지?'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['partner', 'C'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 방이 셋이구먼.', '고시원 벽', '기억하나?'] },
   { bg: 'livingroom', cast: [['hero', 'L'], ['partner', 'C'], ['halbae', 'R']], who: '나',
     text: ['팔 벌리면 닿던 벽이요.', '어떻게 잊어요.'] },
   { bg: 'livingroom',
     doc: { t: '내 집이면 오는 것', rows: [['관리비', '매달 · 겨울엔 더'], ['장기수선충당금', '소유자 몫'], ['재산세', '7월 · 9월'], ['고장', '내 집은 내가']], bad: [] },
     who: '귀인 할배', text: ['내 집이 되면', '고지서도 내 이름으로', '오네.'] },
   { bg: 'night', fx: 'confetti', cast: [['hero', 'L'], ['partner', 'C'], ['halbae', 'R']], who: '귀인 할배',
     text: ['불 켜진 창 하나가', '자네 집이라니.', '...좋구먼, 참.'] } ] },

 boss1: { title: '처음 이긴 날', sub: '첫 보스를 이겼다', reward: null,
  /* 첫 장면만 보스마다 다르다. csPlay가 BOSS_FIRST[b.id]를 앞에 붙이고 {bg}{face}를 채운다 */
  scenes: [
   { bg: '{bg}', cast: [['hero', 'C']],
     text: ['상대가 먼저', '자리를 떴다.', '손이 아직 떨린다.'] },
   { bg: 'night', fx: 'fade', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 봤나?', '목소리 큰 쪽이', '이기는 게 아니야.'] },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['종이 한 장, 숫자 하나.', '그걸 아는 쪽이', '이기는 거지.'] },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '나',
     text: ['할아버지는 이런 사람', '어떻게 알아봐요?'] },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['...한 번 당해 봤거든.', '아주 크게.', '자네는 안 당하면 되네.'] },
   { bg: 'night', fx: 'confetti', cast: [['hero', 'C']],
     text: ['다른 고약한 사람들도', '어딘가에서', '기다리고 있다.'] } ] },

 streak7: { title: '이레째 아침', sub: '7일 연속 출석', reward: null,
  scenes: [
   { bg: 'phone', cast: [['hero', 'C']],
     text: ['아침 여섯 시 오십 분.', '알람보다 먼저', '창문이 울렸다.'] },
   { bg: 'phone', sfx: 'good', cast: [['hero', 'L'], ['pet_bird', 'R']],
     text: ['참새 한 마리가', '창틀에 앉아 있다.', '짹.'] },
   { bg: 'station', fx: 'fade', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 이레를 내리', '왔구먼. 참새가', '먼저 알아봤나 보네.'] },
   { bg: 'station', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['돈 모으는 것도', '공부도, 결국은', '매일 조금씩이야.'] },
   { bg: 'station',
     doc: { t: '연속 출석', rows: [['3일부터', '출석 코인 2배'], ['7일부터', '출석 코인 3배'], ['14일', '전기자전거'], ['30일', '￦500']], bad: [] },
     text: ['내일도 오면', '출석 코인이 3배다.'] },
   { bg: 'station', fx: 'confetti', cast: [['hero', 'L'], ['pet_bird', 'C'], ['halbae', 'R']], who: '귀인 할배',
     text: ['출근길 동무가', '생겼구먼.', '같이 가 보세.'] } ] },

 tax: { title: '13월의 월급', sub: '연말정산 철', reward: { coin: 130, yearly: 1 },
  scenes: [
   { bg: 'office', fx: 'fade', cast: [['hero', 'L'], ['peerf', 'R']], who: '입사 동기',
     text: ['연말정산 메일 왔어요?', '작년에 토해 냈다는', '사람도 있대요.'] },
   { bg: 'office', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 1월이구먼.', '1년 치 영수증을', '맞춰 보는 달이야.'] },
   { bg: 'phone',
     doc: { t: '연말정산 순서', rows: [['1월 중순', '간소화 자료 열림'], ['회사 일정', '서류 내기'], ['빠진 것', '직접 챙기기'], ['2~3월', '월급에 정산']], bad: [] },
     text: ['간소화 자료에', '안 잡히는 것도 있다.'] },
   { bg: 'phone', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['월세 사는 사람은', '월세 공제 조건을', '꼭 따져 보게.'] },
   { bg: 'phone', cast: [['hero', 'L'], ['halbae', 'R']], who: '나',
     text: ['안경값 영수증도', '따로 챙기래요.'] },
   { bg: 'phone', fx: 'confetti', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['돌려받는 돈은', '원래 자네 돈이야.', '공짜가 아니고.'] } ] },

 back: { title: '돌아온 날', sub: '사흘 넘게 쉬고 온 날', reward: { coin: 100, every: 14 },
  scenes: [
   { bg: 'town', fx: 'fade', cast: [['hero', 'C']],
     text: ['{n}일 만의 동네.', '편의점 간판이', '바뀌어 있다.'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 왔구먼.', '바빴던 모양이야.', '밥은 먹고 다녔나?'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '나',
     text: ['정신이 없어서요.', '다 까먹었을 것', '같아요.'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['까먹는 게 정상이야.', '복습 상자에 {rev}개가', '기다리고 있네.'], alt: { rev0: ['까먹는 게 정상이야.', '그래도 복습 상자는', '비어 있구먼. 장하네.'] } },
   { bg: 'town',
     doc: { t: '지금 내 자리', rows: [['거처', '{tier}'], ['레벨', 'Lv.{lv}'], ['다음 메인', '{mq}'], ['연속 출석', '오늘부터 1일']], bad: [] },
     text: ['연속 기록은', '오늘부터 다시 센다.'] },
   { bg: 'town', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['오늘은 하나만 하세.', '하나면 충분해.'] } ] },

 memory: { title: '하루 네 번 버스', sub: '할배의 옛날 얘기', reward: null,
  scenes: [
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['오늘은 공부 말고', '옛날 얘기나', '하나 하세.'] },
   { bg: 'hometown', fx: 'fade', who: '귀인 할배',
     text: ['산 너머 버스가', '하루 네 번 서는', '마을이 있었네.'] },
   { bg: 'hometown', who: '귀인 할배',
     text: ['스무 몇 살에', '그 버스를 타고', '마을을 떠났지.'] },
   { bg: 'hometown', cast: [['hero', 'C']], who: '나',
     text: ['...어? 우리 동네도', '버스가 하루', '네 번인데.'] },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['허허, 시골 버스는', '다 그렇다네.', '...다 그래.'] },
   { bg: 'night', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배',
     text: ['그때 누가 서류 보는 법', '하나만 알려 줬으면', '했지.'] },
   { bg: 'night', fx: 'fade', cast: [['hero', 'C']],
     text: ['할배는 그 뒤로', '말이 없었다.', '별이 많은 밤이었다.'] } ] }
};
/* 첫 보스 승리: 보스마다 첫 장면과 배경 */
var BOSS_FIRST = {
 jeonse: { bg: 'apartment', scene: { bg: 'apartment', fx: 'shake', cast: [['hero', 'L'], ['boss', 'R']], who: '전세 먹튀 집주인',
   text: ['...알았어, 알았다고.', '만기 날짜 맞춰서', '돌려줄게.'] } },
 mlm: { bg: 'cafe', scene: { bg: 'cafe', fx: 'shake', cast: [['hero', 'L'], ['mlmf', 'R']], who: '다단계 선배',
   text: ['...너 좀 변했다?', '예전엔 내 말이면', '다 들었잖아.'] } },
 fp: { bg: 'bank', scene: { bg: 'bank', fx: 'shake', cast: [['hero', 'L'], ['fp', 'R']], who: '자칭 재무설계사',
   text: ['...수수료 얘기는', '다음에 하시죠.', '오늘은 이만.'] } }
};
```

사실 확인 메모: 고시원 전입신고 가능, 월세 세액공제(무주택 세대주·총급여 등 조건), 연말정산 간소화 자료는 해마다 1월 15일 무렵 열림(국세청 홈택스), 주택 재산세 7월·9월 반씩, 장기수선충당금은 소유자 부담. 모두 내가 아는 일반 상식이고 이번에 정부 사이트에서 다시 대조하지는 못했다. 기존 MQ처럼 src와 asof를 붙이려면 내용 리드의 대조가 필요하다. 월세 계약서 숫자(500/45/7만 원)는 예시다.

## 6. 건너뛰기 · 다시 보기 규칙

- 자동 재생: 계기가 생기면 큐에 넣고, 홈에서 아무 창도 없을 때(mqIdle) 튼다. 퀘스트 결과 화면이나 보스 결과 위로는 절대 끼어들지 않는다. 하루 두 편, 첫날은 한 편(첫 실패 위로만 예외). 메인 장을 마친 그 차례에는 틀지 않는다(MQP가 끝난 뒤 다음 기회).
- 건너뛰기: 지금 '빠르게' 단추 그대로. 선택지가 없으니 한 번 누르면 보상 카드로 간다. 보상은 건너뛰어도 받는다(보상 카드에서 멈추므로 받은 걸 보게 된다). 두 번 누르면 끝.
- 끄기(제안): 설정에 "이야기 자동으로 보기" 켬/끔. 끄면 큐에 쌓인 이야기를 지도 왼쪽 위 메인 표시 아래에 "이야기 1편" 작은 표시로 보여 주고, 누르면 튼다. 보상은 그때 준다.
- 다시 보기: 도감(수집 노트)의 메인 퀘스트 목록(mqCodex, #cmq) 바로 아래 "이야기 조각 n/11" 칸을 새로 둔다. 본 것은 제목과 처음 본 날, 누르면 csPlay(id,null,true)로 다시 보기(보상 없음, 제목 카드에 '다시 보기'). 못 본 것은 "???"와 실마리 한 줄("처음 이사를 하면", "첫 보스를 이기면", "1월 중순, 직장인이라면" 등). boss1은 다시 볼 때 처음 이긴 보스(S.bossDone[0])로 튼다. back은 처음 본 뒤로 언제든 다시 볼 수 있고 숫자는 그때 값으로 채운다.
- 기록: ev('cs_play',{id,replay}), ev('cs_reward'), 그리고 끝까지 봤는지 '빠르게'를 눌렀는지(cs_skip). 다음 묶음을 고를 때 볼 지표다.

## 7. 새 그림 (ChatGPT에 한 장으로)

꼭 필요한 것은 bg_gosiwon 하나다. home4가 이 그림 없이 돌면 어두운 단색 바닥만 나온다(img/story-try-gosiwon-missing.png). 나머지 둘은 다음 묶음(반지하 이사, 고시원 복도 장면)을 위한 덤이다. 시트를 자르는 tools/art/slice.py의 칸 규칙은 확인하지 못했으니 개발 리드가 칸 크기를 맞춰 줄 것.

프롬프트:

"Pixel art background sheet for a Korean mobile life-sim RPG, same style as the existing cutscene backgrounds: detailed 16-bit pixel art, soft indoor lighting, slightly desaturated, no people, no text, no UI. Three wide side-view panels stacked vertically, each panel 2.7:1 (about 1500x555), separated by a plain 20px black gap. The bottom 15% of every panel is a flat, clear floor area where characters will stand.
Panel 1 (bg_gosiwon, required): inside a tiny Seoul gosiwon room at night. A narrow single bed along one wall, a small built-in desk with a desk lamp and a laptop, a tiny wall-mounted shelf, a small window with blinds showing city lights, a mini fridge, a coat hook with a backpack, thin walls. Cramped but warm, the room is barely wider than the bed.
Panel 2 (bg_gosiwon_hall, optional): the gosiwon corridor, a long narrow hallway with many identical numbered doors close together, shoe racks, a shared kitchen corner with a rice cooker and a ramen shelf at the far end, fluorescent ceiling lights.
Panel 3 (bg_banji, optional): a Korean semi-basement studio (banjiha), a high small window at ceiling level showing passing feet and street light, a dehumidifier, a folding table, a single mattress, slightly damp wallpaper, cozy lamp light."

## 8. 대표에게 권하는 안 하나

11편을 한 번에 넣지 말고 4편으로 먼저 내자: 첫 단추(firstq, 첫날 첫 인상과 스탯 설명), 문 달린 방(home4, 첫 진짜 방), 처음 이긴 날(boss1), 하루 네 번 버스(memory, 엔딩 복선). 엔진 고침은 4절 가·나·다(제목·보상 카드 문구, 펫 인물, 이야기 큐)와 bg_gosiwon 한 장이면 된다. 일주일 동안 cs_play 대비 끝까지 본 비율과 '빠르게' 비율을 보고, 70% 넘게 끝까지 보면 나머지 7편을 넣는다. 첫날에 컷신이 몰리면(첫 단추, 메인 1장 알림) 오히려 이탈할 수 있어서 첫날 한 편 제한은 꼭 지킨다.

## 9. 바로 고칠 것 5개

1. drawTitle(playMQ 안): 'MAIN QUEST · CHAPTER '+o.no 를 `o.kicker||('MAIN QUEST · CHAPTER '+o.no)`로. 지금은 짧은 컷신에 빈 장 번호가 뜬다.
2. drawReward(playMQ 안): 'CHAPTER CLEAR'를 `p.head||'CHAPTER CLEAR'`로, 별 3개와 '선택 n / m' 줄은 `if(p.grade)`일 때만. 선택 없는 컷신에 "선택 0 / 0"과 별 1개가 뜨는 것을 막는다.
3. drawDoc(playMQ 안): 문서 상자 y=8을 y=28로. '빠르게' 단추가 문서 첫 줄 오른쪽 값(1장 "월 250만 원", 새 대본 "거처 · 방어력")을 가린다. 지금 1장에서도 보인다.
4. portraitSrc: 맨 앞에 pet_ 열쇠 세 줄(4절 나). 참새·강아지·거북이를 컷신에 세울 수 있다.
5. mqCodex: #cmq 아래에 "이야기 조각 n/11" 목록과 csPlay(id,null,true) 다시 보기. 못 본 편은 "???"와 실마리 한 줄.

## 10. 확인한 것과 추측

- 확인: 엔진 형식, 배경 15장의 그림 내용, 인물 열쇠, '빠르게'가 보상 카드에서 멈추는 것, 제목 카드의 빈 장 번호, 문서 상자와 '빠르게' 겹침, 11편 모두 지금 엔진에서 오류 없이 돌고 줄이 상자 폭(14자 안팎)을 넘지 않는 것, pet_ 세 줄로 참새가 서는 것, S.tier를 바꾸는 곳이 tierMove뿐인 것(grep).
- 추측: 각 편 길이(읽는 시간 1.4초/장면을 가정), 보상 금액이 경제에 주는 영향(합계 첫 회 ￦500, 그 뒤 연 ￦130 + 14일마다 ￦100 상한. 경제 리드 확인 필요), 전세 계약 완료가 tierMove를 거치는지, slice.py 칸 규칙, 5절 사실 메모의 최신 여부.
