# 리뷰 1008 · 개발 (스탯 배분·컷신 가능성, 남은 성능 일)

작성: 2026-10-08. 게임 파일(prototype/)과 tests/는 고치지 않았다. 아래 코드는 모두 붙여 넣을 수 있는 제안이다.
측정 스크립트: ops/review-1008/tools/dev-measure.mjs (저장소 루트에서 `node ops/review-1008/tools/dev-measure.mjs 4 s390`). 원자료: ops/review-1008/tools/out/dev-measure-*.json. 공통 도구와 "돌아온 사용자" 저장은 ops/review-1007/tools/perf-lib.mjs를 그대로 가져다 썼다.
줄 번호는 오늘 HEAD(f6aa195) 기준이다.

표기: [확인]은 코드를 읽었거나 재서 확인한 것, [추측]은 확인하지 않은 판단이다.

## 0. 요약

- 다섯 스탯 중 게임에 실제로 쓰이는 것은 집(ju)과 돈(geum) 둘뿐이다. 집은 거처와 전세 보스, 돈은 보스 둘을 연다. 밥·옷·일은 숫자만 오르고 아무것도 열지 않는다. 공격·방어(totals())는 스탯을 읽지 않는다. 그런데 THEMES.role은 "방어력·체력·매력"이라고 적어 둔다. [확인] 처음 보는 사람이 헷갈리는 직접 원인이다.
- 캐릭터 창에는 다섯 스탯이 아예 안 나온다. 숫자가 보이는 곳은 퀘스트 결과 화면, 공유 카드, 막혔을 때 뜨는 안내 글자뿐이다. [확인]
- 레벨업 때 점수를 찍게 하는 일은 작다. 레벨이 오르는 곳이 다섯 군데에 같은 while 줄로 흩어져 있어서, 이것을 addXp() 하나로 모으는 것이 일의 절반이다. 저장은 fresh()에 칸 두 개를 더하면 load()가 알아서 메운다. 핵심 0.5일, 화면 0.5일, 테스트 0.5일로 본다. [추측]
- 짧은 컷신은 playMQ를 그대로 쓸 수 있다. 제목 카드("MAIN QUEST · CHAPTER n")만 빼면 된다. playMQ에 한 줄(o.noTitle)을 더하고 playScene(scenes,onDone) 감싸개, ev()에 거는 트리거, 수집 노트 다시 보기, S.seen을 붙이는 코드를 3장에 적었다.
- 걷기는 지금 초당 14번 그린다(390×844, 4배 감속, 한 번 9.6ms, 그중 타일이 65%). 타일을 지도 한 장으로 미리 칠해 두면 타일 몫이 13.0ms→2.6ms(4배), 10.7→2.4ms(6배)로 준다. 걷기 루프를 rAF로 바꾸는 일은 이 타일 캐시가 먼저 들어가야 한다. 지금 그리기 비용 그대로 초당 60번이면 4배 감속에서 1초에 0.58초를 그리기에 쓴다.
- 오프닝 로고는 한 번 그리는 데 11.2ms(4배)·17.4ms(6배)인데, 캐시해서 옮겨 그리면 0.7·1.0ms다. CAST Image 149개를 부팅 때 만드는 반복문 자체는 20~27ms이고(따뜻한 페이지에서 다시 돌린 값), 리뷰 1007 실험의 DCL 이득은 4배 -144ms, 6배 -344ms였다.

## 1. 측정 (dev-measure.mjs)

환경은 리뷰 1007과 같다(Playwright Chromium 헤드리스, SwiftShader, CDP CPU 감속). 실기기 값이 아니다. 상대 비교로만 본다.

| 항목 | 390×844·4배 | 360×640·6배 |
|---|---|---|
| 걷는 동안 drawScene 횟수 | 초당 14 | 초당 14 |
| drawScene 한 번 | 9.6ms | 13.4ms |
| 그중 drawTile 몫 | 66% | 65% |
| 가만히 있을 때 횟수 | 초당 4.7 (0.22초마다) | (측정 구간에 아직 걷는 중이었다) |
| 동네 지도 보이는 칸 칠하기 | 13.0ms | 10.7ms |
| 미리 칠한 지도 한 장 drawImage | 2.6ms | 2.4ms |
| 지도 한 장 미리 칠하기(지도마다 한 번) | 22.8ms | 39.3ms |
| 오프닝 로고 그대로(fillText 70번) | 11.2ms | 17.4ms |
| 로고 캐시 만들기(한 번) | 3.1ms | 3.1ms |
| 로고 캐시 drawImage | 0.7ms | 1.0ms |
| CAST Image 149개 다시 만들기 | 26.9ms | 20.1ms |

- 걷기 14번: setInterval 55ms(초당 18틱)에서 한 칸(4틱) 중 3틱만 그리고, 감속 때문에 틱이 조금 밀린다. [확인]
- 동네 지도(22×20, 물 8칸)에서 잰 값이다. 큰 지도일수록 "미리 칠하기"가 길어지지만 지도 들어갈 때 한 번뿐이다.

## 2. 스탯 배분 (대표 요청 a)

### 2.1 S.stats를 읽고 쓰는 모든 곳 [확인]

쓰는 곳(오르는 곳). 모두 Math.min(100, …)으로 막는다.

| 줄 | 함수 | 내용 |
|---|---|---|
| 3426 | fresh() | 처음 값 다섯 개 모두 5 |
| 8310 | 사건 끝(ep 결말) | S.stats[e.stat] += 최고 결말 차액 (사건 4개: 집·일·돈·일) |
| 9195 | finish() 퀘스트 끝 | q.stat 각 칸 × 정답 비율, 실패면 없음 |
| 9359 | 보스 첫 승리 | S.stats[B.stat] += 15 |
| 11048 | mqPay() 메인 장 보상 | MQ_REWARD.stat × 등급(good 1, ok 0.6, bad 0.3), 더 좋은 등급일 때 차액만 |
| 12120 | leaseEnd() 전세 계약 | S.stats.ju += 결말 차액 |
| 9440 | 시연 모드 | 스탯은 안 건드리고 S.lv만 5로 올린다 |

읽는 곳.

| 줄 | 함수 | 쓰임 |
|---|---|---|
| 2362 | tierGrow() | tierFor(S.stats.ju) > S.peak 이고 오늘 몫(upLeft)이 남고 tierCap() 아래면 거처 한 칸을 연다 |
| 2433 | tierFor(ju) | TIERS.need(0,6,12…78)로 몇 번째 거처까지 되는지 |
| 3170 | bossReady(b) | S.stats[b.stat] >= b.need. 전세 먹튀(집 30), 다단계(돈 20), 재무설계사(돈 40) |
| 7096, 7593, 8377 | 보스 안내 글자 | "집 스탯 30부터 · 지금 n" |
| 7791 | renderHome 다음 거처 안내 | TIERS[peak+1].need - ju |
| 8646 | 수집 노트 거처 칸 | "집 스탯 n 필요" |
| 9231 | 퀘스트 결과 화면 | 이번 퀘스트 주제 스탯의 지금 값 |
| 10971 | 메인 2장 대기 문구 | 원룸 전세까지 집 스탯 몇 더 |
| 1787 | 공유 카드 | 다섯 막대 |
| 9354 | ev('boss_win') | 기록용 ju |

관련 함수.
- fits(q)(3831)는 스탯을 읽지 않는다. 신분·나이·지역으로만 퀘스트를 거른다. score(q)도 q.theme만 본다.
- totals()(3702)는 스탯을 읽지 않는다. 공격·방어는 장비·거처·세간에서만 나온다.
- 밥·옷·일 스탯을 읽어서 무엇을 여는 코드는 없다.

### 2.2 지금 공급량 [확인, 측정]

퀘스트 47개를 전부 만점으로, 사건·보스·메인·전세를 모두 최고로 깼을 때 더해지는 양(처음 값 5 포함).

| 스탯 | 퀘스트 | 사건 | 보스 | 메인 | 전세 | 합계 | 쓰는 곳 |
|---|---|---|---|---|---|---|---|
| 집 | 91 | 12 | 15 | 16 | 10 | 149 (상한 100) | 거처 최고 78, 보스 30 |
| 밥 | 50 | 0 | 0 | 8 | 0 | 63 | 없음 |
| 옷 | 47 | 0 | 0 | 16 | 0 | 68 | 없음 |
| 돈 | 188 | 12 | 30 | 34 | 0 | 269 (상한 100) | 보스 20·40 |
| 일 | 156 | 24 | 0 | 10 | 0 | 195 (상한 100) | 없음 |

- 퀘스트 경험치 합 3,510으로 Lv.10까지 간다(need(lv)=100+60(lv-1)). 리뷰 1007 경제 모의에서 22일 놀이가 Lv.18이었다. 레벨업은 한 판에 대략 17번이다.
- 거처를 여는 속도는 스탯보다 tierGrow의 "하루 한 칸"(upLeft, 첫날 2칸)과 tierCap(메인 장)이 먼저 묶는다. 그래서 집 스탯을 점수로 빨리 올려도 거처가 하루에 몰려 열리지는 않는다.

### 2.3 "레벨업 때 점수" 바꾸는 범위

안은 "퀘스트로 그 주제 스탯이 오르는 것은 그대로 두고, 레벨이 오를 때마다 2점을 더 받아 원하는 칸에 찍는다"로 잡았다. 퀘스트 주제와 스탯이 묶여 있는 것이 이 게임의 배움 장치라서 없애지 않는다.

바꿀 곳.
1. 레벨이 오르는 다섯 곳을 addXp() 하나로 모은다: grant()(6328), 사건 끝(8308~8309), finish()(9193~9194), mqPay()(11049), leaseEnd()(12119). 지금은 같은 while 줄이 다섯 번 복사돼 있다.
2. fresh()에 statPts:0, statAlloc:{} 두 칸.
3. load()에서 옛 저장에 그동안 오른 레벨만큼 점수를 한 번 준다.
4. 점수 쓰기 spendStat(k). 집에 찍으면 tierGrow()를 불러야 거처가 열린다.
5. 화면: 캐릭터 창에 다섯 칸(이름은 THEMES.full, 막대, +버튼, 남은 점수). 지금 캐릭터 창에는 스탯이 없다. 레벨업 토스트(6332)에 "스탯 2점" 한 마디.
6. 문구: THEMES.role의 "방어력·체력·매력·자금·경험"은 실제 효과가 없다. 효과를 붙이기 전까지는 "무엇을 여는지"로 바꾼다(집: 거처·전세 보스, 돈: 사기꾼 보스, 나머지: 아직 칭호만).
7. 테스트: tests/에서 stats.ju 등을 직접 단언하는 곳이 11군데, S.lv·need()를 다루는 파일이 10개다. addXp가 같은 결과를 내면 기존 테스트는 그대로 통과해야 한다. 새 테스트 하나(점수 지급·사용·옛 저장 이전)를 더한다. [추측: 기존 테스트 통과 여부는 돌려 보지 않았다]

추정 크기: 게임 코드 60~90줄, 반나절~하루. 균형(몇 점, 밥·옷·일에 무슨 효과)은 경제 역할과 따로 정해야 한다.

```js
/* 레벨업 한 곳으로 모으기. 오른 레벨 수를 돌려준다 */
var PTS_PER_LV=2;
function addXp(n){
  var lv0=S.lv; S.xp+=n||0;
  while(S.xp>=need(S.lv)){ S.xp-=need(S.lv); S.lv++; }
  var up=S.lv-lv0;
  if(up>0){ S.statPts=(S.statPts||0)+up*PTS_PER_LV; ev('lv_up',{lv:S.lv,pts:S.statPts}); }
  return up; }
/* 점수 쓰기. 집에 찍어서 거처가 열리면 {grew} */
function spendStat(k){
  if(!THEMES[k]||!(S.statPts>0)||S.stats[k]>=100) return null;
  S.statPts--; S.stats[k]++; S.statAlloc[k]=(S.statAlloc[k]||0)+1;
  var g=(k==='ju')?tierGrow():null;
  save(); ev('stat_spend',{k:k,v:S.stats[k]}); return {grew:g}; }
```

다섯 곳의 바꿈 예: `S.xp+=xp; while(S.xp>=need(S.lv)){ … }` → `addXp(xp);` (finish()의 before 비교와 grant()의 lv0 비교는 그대로 둔다).

### 2.4 안전한 저장 이전

- 저장 키 'nq.v8'은 바꾸지 않는다. 키를 바꾸면 이전 코드가 없을 때 옛 저장을 잃는다.
- load()는 fresh()의 칸 가운데 저장에 없는 것을 이미 채운다(3443줄). 그러니 fresh()에 칸을 더하는 것만으로 새 칸은 생긴다.
- 옛 저장에 그동안 오른 레벨만큼의 점수를 줄지는 메우기 전에 판단해야 한다(legacy 판단과 같은 자리).

```js
/* load() 안, Object.keys(f).forEach(...) 줄 바로 위 */
var noPts=(o.statPts===undefined)&&!!o.onboarded;
/* 메우기 뒤 */
if(noPts) o.statPts=PTS_PER_LV*Math.max(0,(o.lv||1)-1);
if(!(o.statPts>=0)) o.statPts=0;
if(!o.statAlloc||typeof o.statAlloc!=='object') o.statAlloc={};
/* fresh()에: statPts:0,statAlloc:{}, */
```

- 한 번만 일어난다(statPts가 생긴 뒤에는 noPts가 거짓). 앱의 네이티브 백업(AsyncStorage)은 같은 JSON이라 따로 할 일이 없다. 옛 버전 코드가 새 저장을 읽어도 모르는 칸은 무시하므로 되돌리기도 안전하다. [확인: load가 모르는 칸을 지우지 않음]
- statAlloc을 따로 두는 이유: 나중에 균형을 바꾸거나 "다시 찍기"를 줄 때 퀘스트로 오른 몫과 찍은 몫을 나눌 수 있다.

## 3. 짧은 컷신 늘리기 (대표 요청 b)

### 3.1 지금 엔진 [확인]

- playMQ(o)(10786)는 장면 배열을 받아 배경(mqBg: bg_ 그림 또는 MQ_BG 함수), 인물(cast: [[이름,'L'|'R'|'C']]), 대사 상자, 고르기(choice), 효과(fx: flash, fade, stamp, money+/-, confetti, rain, shake), 문서(doc)를 그린다. 컷신 하나를 MQP에 두고, 다른 컷신이 돌면 시작하지 않는다.
- 다만 맨 앞에 늘 {type:'title'} 카드("MAIN QUEST · CHAPTER "+o.no)를 붙이고 sfx('win')을 울린다. 메인 장이 아닌 짧은 장면에는 이것이 맞지 않는다.
- 진행 저장은 o.save가 있을 때만 한다. 넘기지 않으면 S.mq를 건드리지 않는다. 보상도 o.endScenes를 넘길 때만 붙는다.
- 수집 노트(codex)는 메인 장을 "render('home') 뒤 120ms에 다시 시작"하는 방식으로 다시 보여 준다(11163~).
- 홈에서 한가한지는 mqIdle()이 이미 판단한다(홈 화면, 튜토리얼·컷신·배치·이동·운전·오프닝·말풍선 없음).

### 3.2 붙여 넣을 코드

playMQ 안 한 줄(10788줄 부근, list를 만드는 줄)과 시작 소리 한 줄만 바꾼다.

```js
/* 전 */
var list=[{type:'title'}].concat(o.scenes.slice(o.from||0).map(function(p,k){ var q={}; for(var x in p) q[x]=p[x]; q._si=(o.from||0)+k; return q; }));
/* 후 */
var list=(o.noTitle?[]:[{type:'title'}]).concat(o.scenes.slice(o.from||0).map(function(p,k){ var q={}; for(var x in p) q[x]=p[x]; q._si=(o.from||0)+k; return q; }));

/* 전 (함수 끝 부분) */
sfx('win');
/* 후 */
if(!o.noTitle) sfx('win'); else if(list[0]&&list[0].sfx) sfx(list[0].sfx);
```

감싸개와 트리거, 다시 보기(메인 퀘스트 블록 뒤, mqAnnounce 근처에 붙인다).

```js
/* ══════════ 짧은 장면 ══════════
   메인 장이 아닌 30초 안쪽 컷신. 장면 형식은 playMQ와 같다(bg, cast, who, text, fx, choice).
   본 것은 S.seen[id]=처음 본 날. 수집 노트에서 다시 볼 수 있다. */
var SCENES={
  /* 예: 첫 이사. on은 ev() 이름, if는 그 이벤트의 값을 보고 띄울지 */
  first_move:{title:'첫 내 방',on:'tier_deposit',if:function(p){ return p&&p.i>=1; },
    scenes:[
      {bg:'room',cast:[['hero','C']],fx:'fade',text:['짐은 상자 세 개. 그래도 오늘부터 여기가 내 방이다.']},
      {bg:'room',cast:[['hero','L'],['halbae','R']],who:'귀인 할배',text:['전입신고는 14일 안에. 확정일자도 같이 받게.']}
    ]}
};
function sceneSeen(id){ return !!(S.seen&&S.seen[id]); }
/* 감싸개: 제목 카드 없이 장면만 틀고, 끝나면 onDone */
function playScene(scenes,onDone,opt){
  opt=opt||{};
  if(MQP||!scenes||!scenes.length){ if(onDone) onDone(null); return null; }
  (scenes||[]).forEach(function(p){ if(p.bg) castCv('bg_'+p.bg); });          /* 그림을 미리 깨운다(4장 CAST 지연 생성 뒤에도 안전) */
  var st=playMQ({no:0,title:opt.title||'',sub:'',scenes:scenes,noTitle:true,
    onDone:function(r){ if(onDone) onDone(r); }});
  if(st&&st.list&&st.list()[0]&&st.list()[0].type==='title') st.list().shift();  /* playMQ 한 줄을 아직 안 바꿨을 때의 대비 */
  return st; }
/* 트리거: 조건이 맞으면 줄에 넣고, 홈에서 한가할 때 하나씩 튼다 */
var SCENE_Q=[];
function sceneTrigger(id){
  if(!SCENES[id]||sceneSeen(id)||SCENE_Q.indexOf(id)>=0) return;
  SCENE_Q.push(id); setTimeout(sceneFlush,700); }
function sceneFlush(){
  if(!SCENE_Q.length||!mqIdle()) return false;
  var id=SCENE_Q.shift(),d=SCENES[id];
  if(!S.seen) S.seen={};
  S.seen[id]=dayKey(); save(); ev('scene_play',{id:id});        /* 먼저 적는다: 도중에 앱이 꺼져도 또 뜨지 않게 */
  playScene(d.scenes,function(){ ev('scene_done',{id:id}); setTimeout(sceneFlush,600); },{title:d.title});
  return true; }
/* ev()에서 부른다: 모든 사건 기록이 지나가는 한 곳 */
function sceneOnEv(n,p){
  for(var id in SCENES){ var d=SCENES[id];
    if(d.on===n&&!sceneSeen(id)&&(!d.if||d.if(p))) sceneTrigger(id); } }
/* 수집 노트: 본 장면 다시 보기 */
function renderSceneCodex(){
  var host=document.getElementById('cmq'); if(!host) return;
  var el=document.getElementById('cscenes');
  if(!el){ var lab=document.createElement('div'); lab.className='sectlab'; lab.textContent='장면 · 본 것은 다시 볼 수 있어요';
    el=document.createElement('div'); el.id='cscenes'; el.style.cssText='display:flex;flex-direction:column;gap:var(--u2)';
    host.after(lab,el); }
  el.innerHTML='';
  Object.keys(SCENES).forEach(function(id){ var d=SCENES[id],seen=sceneSeen(id),b=document.createElement('button');
    b.className='item pix'+(seen?'':' locked'); b.style.gridTemplateColumns='1fr auto';
    b.innerHTML='<span><span class="inm">'+esc(seen?d.title:'???')+'</span></span><span class="ist"><span class="idesc">'+(seen?'다시 보기':'아직')+'</span></span>';
    if(seen) b.onclick=function(){ sfx('pick'); render('home'); setTimeout(function(){ playScene(d.scenes,null,{title:d.title}); },120); };
    else b.disabled=true;
    el.appendChild(b); }); }
```

거는 곳 세 줄.
- ev(n,p) 끝(S.log.push 다음 줄 부근): `if(typeof sceneOnEv==='function') sceneOnEv(n,p);`
- startWalk() 끝(drawScene() 다음): `setTimeout(function(){ if(typeof sceneFlush==='function') sceneFlush(); },700);` 퀘스트 결과나 보스 화면에서 생긴 장면은 홈으로 돌아와 한가해질 때 뜬다.
- renderCodex() 끝: `renderSceneCodex();`
- 저장: fresh()에 `seen:{},`. load()는 2.4와 같은 원리로 알아서 메운다. 옛 저장은 빈 칸에서 시작하므로 이미 지난 일(첫 이사 등)의 장면은 다음 조건 때 뜬다. 원하지 않으면 load()에서 `if(o.seen===undefined&&o.onboarded) o.seen={first_move:'old'}`처럼 지난 것을 본 것으로 찍는다.

주의할 점.
- 트리거로 쓸 이름은 이미 있는 ev 이름을 쓴다(tier_deposit, boss_win, ep_end, lease_end 등). 레벨업 장면을 원하면 2.3의 addXp가 내는 'lv_up'을 쓴다. [확인: 앞 넷은 코드에 있다] 다만 tier_deposit은 보증금이 0보다 클 때만 남는다(tierMove의 `if(c)`). 공짜 이사까지 잡으려면 tierMove에 ev('tier_move',{i:i})를 하나 더한다.
- mqAnnounce(할배 알림)와 같은 때 겹치면 먼저 시작한 쪽이 mqIdle을 거짓으로 만들어 다른 쪽이 기다린다. [추측: 두 개가 같은 틱에 시작하는 경우는 시험 필요]
- 짧은 장면에는 choice를 쓰지 않는 것을 권한다. 쓰면 노트 장면(좋은 판단/대가)이 끼어든다.
- 그림: bg_ 그림 15장을 다시 쓰면 용량이 늘지 않는다. 새 배경이 필요하면 MQ_BG에 함수로 그리면 된다.
- 확인 방법: tests/sprintG처럼 상태를 만든 뒤 `ev('tier_deposit',{i:1,cost:0}); render('home');` 1초 뒤 `MQP&&MQP.list()[0].bg==='room'`, 끝까지 넘긴 뒤 `S.seen.first_move`가 있고, 같은 ev를 다시 불러도 MQP가 null인지 본다.

## 4. 남은 성능 일 (리뷰 1007 D3·D4·D9)

권하는 순서: 4.2 타일 캐시 → 4.1 rAF 걷기 → 4.3 로고 → 4.4 CAST 지연.

### 4.1 걷기 루프를 rAF와 보간으로 (startWalk, stopWalk, mePx, visibilitychange)

지금: setInterval 55ms 한 틱마다 MOVE.t++, 한 칸 4틱(타면 3틱). 그리는 것도 틱에 묶여 초당 14번이다. 바꾼 뒤: 걷는 속도·물결·깜빡임은 지금처럼 55ms 틱으로 세고, 그리기만 화면 프레임마다 하며 칸 사이 위치를 틱 사이 비율로 보간한다. 펫은 이미 Date.now() 기준이라 그대로 된다. [확인: petTick]

```js
/* 전 (7601~7615) */
function startWalk(){
  stopWalk(); fitScene();
  ...
  drawScene();
  MAPT=setInterval(function(){
    TICK++;
    if(!MOVE){ if(HOLD.dir!==null) return stepDir(HOLD.dir);
      if(TICK%180===0) checkTutor();
      if(TICK%4===0||(PETW&&(PETW.mv||PETW.heart))) drawScene(); return; }
    MOVE.t++;
    if(MOVE.t>=MOVE.dur){ ME.step=(ME.step+1)%2; nextStep(); }
    else drawScene();
  },55);
}
function stopWalk(){ if(MAPT){ clearInterval(MAPT); MAPT=null; } MOVE=null; savePosNow(); }

/* 후 */
var TICKMS=55,MAPRAF=0,MAPLAST=0,MAPACC=0,MAPIDLE=0,MOVEK=0,MAP_MIN_MS=0;  /* MAP_MIN_MS=33이면 초당 30번으로 묶는다 */
function mapTick(){
  TICK++;
  if(!MOVE){ if(HOLD.dir!==null){ stepDir(HOLD.dir); return; }
    if(TICK%180===0) checkTutor(); return; }
  MOVE.t++;
  if(MOVE.t>=MOVE.dur){ ME.step=(ME.step+1)%2; nextStep(); } }
function mapFrame(now){
  if(!MAPT) return;
  var dt=Math.min(250,now-MAPLAST);
  if(dt<MAP_MIN_MS){ MAPRAF=requestAnimationFrame(mapFrame); return; }
  MAPLAST=now; MAPACC+=dt;
  while(MAPACC>=TICKMS){ MAPACC-=TICKMS; mapTick(); if(!MAPT) return; }     /* 틱 안에서 컷신·이동으로 루프가 꺼질 수 있다 */
  MOVEK=MOVE&&MOVE.dur?MAPACC/TICKMS:0;
  if(MOVE||(PETW&&(PETW.mv||PETW.heart))||now-MAPIDLE>=220){ MAPIDLE=now; drawScene(); }
  MAPRAF=requestAnimationFrame(mapFrame); }
function startWalk(){
  stopWalk(); fitScene();
  if(S.pos&&mapById(S.pos.map)){ ME.map=S.pos.map; ME.tx=S.pos.tx; ME.ty=S.pos.ty; ME.dir=S.pos.dir||0; }
  if(!walkable(curMap(),ME.tx,ME.ty)) enterMap(ME.map,ME.tx,ME.ty);
  drawScene();
  MAPT=1; MAPLAST=MAPIDLE=performance.now(); MAPACC=0; MAPRAF=requestAnimationFrame(mapFrame); }
function stopWalk(){ if(MAPT){ cancelAnimationFrame(MAPRAF); MAPT=null; } MOVE=null; MOVEK=0; savePosNow(); }

/* mePx 안: 전 */
if(MOVE){ var k=MOVE.t/MOVE.dur;
/* 후 */
if(MOVE){ var k=Math.min(1,(MOVE.t+MOVEK)/MOVE.dur);

/* visibilitychange 안: 전 */
if(MAPT){ clearInterval(MAPT); MAPT=null; MOVE=null; }
/* 후 */
if(MAPT){ cancelAnimationFrame(MAPRAF); MAPT=null; MOVE=null; MOVEK=0; }
```

- MAPT는 "루프가 도는 중" 표시로 계속 쓴다(값은 1). MAPT를 읽는 곳은 7605·7615·7618·7619 넷뿐이다. [확인]
- nextStep()이 새 칸으로 넘어갈 때 MOVE.t=0이 되고 MOVEK는 다음 프레임에 다시 계산되므로 한 프레임 튀는 일은 없다. [추측: 눈으로 확인 필요]
- 비용: 타일 캐시 없이 지금 9.6ms × 60번이면 4배 감속에서 CPU의 58%다. 반드시 4.2 뒤에 넣고, 저사양 판정(예: devicePixelRatio·hardwareConcurrency)에서 MAP_MIN_MS=33을 둔다.
- 확인: dev-measure.mjs의 walk 항목에서 초당 그리기 횟수가 55~60(또는 30)으로, 경로 30칸을 걷는 시간이 지금과 같은지(한 칸 220ms, 타면 165ms). 가만히 있을 때는 지금처럼 초당 약 4.5번. 숨김→복귀 뒤 다시 도는지(visibilitychange). 기존 테스트 전부.

### 4.2 정적 타일 캐시 (drawScene, 새 함수 tileCache)

타일 그림 안에서 시간에 따라 바뀌는 것은 물(waterB의 TICK)뿐이다. [확인: 6300~7110줄의 타일 코드에서 TICK을 읽는 곳은 6580 한 곳] 방(roomMap)은 세간이 바뀌면 새 지도 객체를 만든다(ROOMC 키). 실내 타일 색은 m.tint가 없으면 roomTint()(S.tier)를 따른다. 그래서 키는 "지도 객체 + (tint 없으면 S.tier)"로 충분하다. 메모리는 한 장만 둔다(동네 352×320, 약 0.45MB).

```js
/* 새 함수 (drawScene 위) */
var TCACHE=null;
function tileCache(m){
  var k=m.tint?'-':S.tier;
  if(TCACHE&&TCACHE.m===m&&TCACHE.k===k) return TCACHE;
  var cv=mkcv(m.w*TS,m.h*TS),c=cv.getContext('2d'),anim=[],x,y,ch;
  c.imageSmoothingEnabled=false;
  for(y=0;y<m.h;y++) for(x=0;x<m.w;x++){ ch=tileAt(m,x,y);
    drawTile(c,m,ch,x*TS,y*TS,x,y); if(ch==='w') anim.push(x,y); }
  return (TCACHE={m:m,k:k,cv:cv,anim:anim}); }

/* drawScene 안: 전 */
for(y=y0;y<=y1;y++) for(x=x0;x<=x1;x++) drawTile(ctx,m,tileAt(m,x,y),x*TS,y*TS,x,y);
/* 후 */
if(cam.z>=1){ var tc=tileCache(m),sx0=x0*TS,sy0=y0*TS,sw0=(x1-x0+1)*TS,sh0=(y1-y0+1)*TS;
  ctx.drawImage(tc.cv,sx0,sy0,sw0,sh0,sx0,sy0,sw0,sh0);
  for(var ai=0;ai<tc.anim.length;ai+=2){ x=tc.anim[ai]; y=tc.anim[ai+1];
    if(x>=x0&&x<=x1&&y>=y0&&y<=y1) drawTile(ctx,m,'w',x*TS,y*TS,x,y); } }
else for(y=y0;y<=y1;y++) for(x=x0;x<=x1;x++) drawTile(ctx,m,tileAt(m,x,y),x*TS,y*TS,x,y);   /* 전국 지도(0.5배)는 축소 보간 차이가 있어 그대로 */
```

- 지도 아래 풀밭을 잇는 칸(m.pad 줄)은 몇 줄뿐이라 그대로 둔다.
- 무효화는 따로 부를 것이 없다. 이사·세간 놓기는 roomMap이 새 객체를 주고, enterMap은 다른 지도 객체다. MAPS의 rows를 실행 중에 바꾸는 코드가 생기면 그때 `TCACHE=null`을 부른다. [추측: 지금은 rows를 고치는 곳을 못 찾았다. 확인은 아래 픽셀 비교로]
- 효과(측정): 타일 몫 13.0→2.6ms(4배), drawScene 한 번 9.6ms → 약 4ms로 본다(타일 65%를 뺀 값, 추측). 지도에 처음 들어갈 때 한 번 23~39ms.
- 확인: 모든 지도에서 캐시 켬·끔 그림이 같은지 비교한다. 페이지에서 `['town','villa',…,'room'].forEach(id=>{ enterMap(id,…); TICK=0; TCACHE=null; drawScene(); a=getImageData; (캐시 끈 drawScene); b=getImageData; 같은지 })`. 물 칸은 같은 TICK에서 같아야 한다. 실내(1.5배)도 RES 2·4 둘 다 본다.

### 4.3 오프닝 로고 캐시 (openingStart 안 logo, 걷는 두 사람)

```js
/* 전 (9567~9572) */
function logo(y){
  ctx.font='bold 26px Galmuri14,Galmuri11,monospace'; ctx.textBaseline='top';
  var s='뉴비 퀘스트',w=ctx.measureText(s).width,x=Math.round(W/2-w/2),d,e;
  ctx.fillStyle='#1B1826'; for(d=-3;d<=3;d++) for(e=-2;e<=3;e++) ctx.fillText(s,x+d,y+e);
  ... (외곽 두 겹 + 두 톤 글자)
}

/* 후: 몸통은 그대로 c와 y만 받게 하고, 한 번 그린 것을 옮긴다 */
function logoInto(c,y){
  c.font='bold 26px Galmuri14,Galmuri11,monospace'; c.textBaseline='top';
  var s='뉴비 퀘스트',w=c.measureText(s).width,x=Math.round(W/2-w/2),d,e;
  c.fillStyle='#1B1826'; for(d=-3;d<=3;d++) for(e=-2;e<=3;e++) c.fillText(s,x+d,y+e);
  c.fillStyle='#F4705A'; for(d=-2;d<=2;d++) for(e=-1;e<=2;e++) c.fillText(s,x+d,y+e);
  c.save(); c.beginPath(); c.rect(0,y,W,14); c.clip(); c.fillStyle='#FFE79B'; c.fillText(s,x,y); c.fillText(s,x+1,y); c.restore();
  c.save(); c.beginPath(); c.rect(0,y+14,W,20); c.clip(); c.fillStyle='#FFC53C'; c.fillText(s,x,y); c.fillText(s,x+1,y); c.restore(); }
var LOGOC=null;
function logo(y){
  var fk=(document.fonts&&document.fonts.status)||'x';           /* 글꼴이 늦게 오면 한 번 더 만든다 */
  if(!LOGOC||LOGOC.fk!==fk){ var lc=mkcv(W*R,40*R),lx=lc.getContext('2d');
    lx.setTransform(R,0,0,R,0,0); logoInto(lx,3); lc.fk=fk; LOGOC=lc; }
  ctx.drawImage(LOGOC,0,y-3,W,40); }

/* 걷는 두 사람: 전 (frame 안) */
var hc=personTopCv(heroDesc(),2,wf),gc=personTopCv(NPC_TOP.halbae,2,[1,2,3,2][Math.floor(t*4+1)%4]);
/* 후 */
var E=S.equip,L=S.look||{},hk='OPH'+wf+'|'+L.haircol+(L.skin||0)+E.top+E.bottom+E.weapon+E.head+S.avatar+S.hero;
var hc=TOPC[hk]||(TOPC[hk]=personTopCv(heroDesc(),2,wf)),gc=npcTop('halbae',2,[1,2,3,2][Math.floor(t*4+1)%4]);
```

- 로고가 떨어지며 흔들리는 연출은 y만 바뀌므로 그대로다. 40칸 높이는 외곽(-2~+3)과 글자 26px을 담는다. [추측: Galmuri14의 실제 높이로 잘리는지 그림으로 확인]
- 주인공 키는 heroTop의 키에서 탈것을 뺀 것이다. heroDesc()가 이 밖의 값을 읽으면 키에 더한다. [추측]
- 효과(측정): 로고 한 번 11.2→0.7ms(4배), 17.4→1.0ms(6배). 리뷰 1007의 "fillText를 없애면 6.7→21.7fps"의 절반쯤이 로고 몫이다(fillText 147번 중 70번).
- 확인: performance.now를 고정한 오프닝을 전·후로 찍어 픽셀 비교(로고 영역 ±1px 허용), perf-frames 방식으로 오프닝 fps.

### 4.4 CAST Image 지연 생성 (2119~2123, castCv, 펫 그림 2167)

```js
/* 전 */
var CASTIMG={},CASTLEFT=0;
Object.keys(CAST).forEach(function(k){
  var im=new Image(); CASTLEFT++;
  im.onload=im.onerror=function(){ if(--CASTLEFT===0) castReady(); };
  im.src='data:'+(CAST[k].m||'image/png')+';base64,'+CAST[k].d; CASTIMG[k]=im; });
...
  var c=CAST[k],im=CASTIMG[k];                 /* castCv 안 */
...
  var c=CAST['pet_'+k],im=CASTIMG['pet_'+k];   /* 2167 */

/* 후 */
var CASTIMG={},CASTRAF=0;
function castImg(k){
  if(CASTIMG[k]) return CASTIMG[k];
  var c=CAST[k]; if(!c) return null;
  var im=new Image();
  im.onload=function(){ if(!CASTRAF) CASTRAF=requestAnimationFrame(function(){ CASTRAF=0; castReady(); }); };  /* 여러 장이 한꺼번에 와도 다시 그리기는 프레임당 한 번 */
  im.src='data:'+(c.m||'image/png')+';base64,'+c.d;
  return (CASTIMG[k]=im); }
...
  var c=CAST[k],im=castImg(k);                 /* castCv 안 */
...
  var c=CAST['pet_'+k],im=castImg('pet_'+k);   /* 2167 */
```

- CASTIMG·CASTLEFT를 읽는 곳은 위 네 줄뿐이다. [확인] castCv가 null을 돌려주면 지금도 부른 쪽이 대신 그림을 그리고 castReady가 다시 그린다. 그 흐름 그대로다.
- 처음 쓰이는 화면(대화 얼굴, 상점, 컷신 배경)에서 한 박자 늦게 뜬다. 컷신은 3.2의 playScene처럼 시작 때 bg_ 이름으로 castCv를 한 번 불러 미리 깨운다. playMQ에도 같은 한 줄을 넣는 것을 권한다.
- 효과: 리뷰 1007 실험에서 DCL 4배 -144ms, 6배 -344ms. 오늘 따뜻한 페이지에서 Image 149개를 다시 만드는 반복문만 20~27ms였다(첫 부팅에는 1.5MB 문자열 이어 붙이기와 디코드 예약이 더해진다).
- 확인: ops/review-1007/tools/perf-startup-exp.mjs로 DCL 전·후. 첫날 흐름(온보딩 얼굴, 상점, 첫 대화, 프롤로그)을 찍어 빈 그림이 한 프레임 넘게 남지 않는지. tests 전부.

## 5. 대표에게 권하는 안 하나

"스탯은 다섯 개를 다 키우는 숫자가 아니라 무엇을 여는 열쇠로 보이게 하자." 레벨업마다 2점을 받아 찍게 하되, 캐릭터 창에 다섯 칸을 처음으로 보여 주고 각 칸 옆에 그 스탯이 여는 것(집: 다음 거처까지 n, 돈: 재무설계사 보스까지 n)을 적는다. 밥·옷·일은 지금 아무것도 열지 않으니, 점수를 받기 전에 각각 하나씩 쓰임(예: 밥=포만감 최대치, 옷=면접 사건 보너스, 일=퀘스트 경험치 %)을 경제 역할과 정한다. 쓰임이 없는 칸에 점수를 찍게 하면 처음 보는 사람이 더 헷갈린다. 컷신은 3장의 playScene으로 "첫 이사", "첫 보스 승리", "Lv.10" 세 장면부터 붙이면 엔진 변경은 한 줄이다.

## 6. 바로 고칠 것 5개

1. drawScene 위에 tileCache(m)를 넣고 타일 반복을 drawImage + 물 칸만 다시 그리기로 바꾼다(4.2). 걷기 한 번 그리기 9.6ms → 약 4ms(4배, 추측). 픽셀 비교 확인 후 넣는다.
2. openingStart의 logo(y)를 logoInto + LOGOC 캐시로, 걷는 두 사람을 TOPC 'OPH' 키와 npcTop('halbae',…)로 바꾼다(4.3). 로고 11.2→0.7ms(4배).
3. 2119~2123의 CAST Image 일괄 생성을 castImg(k) 지연 생성으로, castCv와 2167줄을 castImg로 바꾼다(4.4). DCL 4배 -144ms·6배 -344ms(리뷰 1007 실험).
4. 레벨업 while 줄 다섯 곳(6328, 8309, 9194, 11049, 12119)을 addXp(n) 하나로 모은다(2.3). 기능 변화 없이 먼저 넣어 두면 점수 배분과 'lv_up' 장면 트리거를 그 위에 얹을 수 있다.
5. THEMES.role 문구 "방어력·체력·매력·자금·경험"을 실제 쓰임으로 바꾼다(2754~2759): 집 "거처·전세 보스를 연다", 돈 "사기꾼 보스를 연다", 밥·옷·일 "지금은 칭호용". 결과 화면(9231)은 '집 · 방어력 42' 대신 '집 42 · 다음 거처까지 6'으로.

그다음: 4.1 rAF 걷기(1번 뒤, MAP_MIN_MS로 저사양 30번 묶기), playMQ noTitle 한 줄과 playScene, portraitSrc의 JSON.stringify(S.equip) 키를 heroKey()로(리뷰 1007 D12, 아직 남음).
