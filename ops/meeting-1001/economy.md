# 메인 퀘스트 경제 설계 (광고·경제 리드, 2026-09-30)

브리프(`brief.md`)의 여섯 장에 보상, 잠금, 새 상점 물건, 옛 저장 처리, 광고 두 배를 정한다. 숫자는 지금 `prototype/newbie-quest-demo.html`을 읽고 맞췄다. 본체 파일은 고치지 않았고, 아래 코드는 CTO가 통합할 때 쓰는 제안이다. 줄 번호는 작업 중에도 조금씩 밀려서 함수 이름으로 적는다.

## 1. 지금 경제 요약

### 들어오는 돈

| 출처 | 코드 | 금액 |
|---|---|---|
| 시작 코인 | `fresh()` | 150 |
| 퀘스트 | `Q(...)` 47개, 코인 40~80(합 3,020), XP 50~100(합 3,510) | `finish()`에서 코인×(0.5+0.5×정답률)×(1+코인 perk)×(청결<30이면 0.8) |
| 출석 | `dailyCoin()` | 30×배수(연속 3일 2배, 7일 3배)×(1+daily perk). 참새 펫이 +50% |
| 오늘 완주 보너스 | `finish()` | 80×배수(80/160/240), 오늘 퀘스트 3개를 다 풀었을 때 |
| 복습 퀴즈 | `quizBuild()` | 코인 30, XP 20, 하루 한 번 |
| 연속 출석 마일스톤 | `MILESTONES` | 3일 100, 7일 200, 14일 400 (한 번씩) |
| 사건(EPISODES) 4개 | `epEnd()` | 최고 결말 200~250, 차액만 지급 |
| 전세 계약(LEASE) | `LEASE_ENDS` | 200/100/30, 차액만 지급 |
| 보스 3개 | `bossEnd()` | 이길 때마다 200 + 스탯 15 (다시 이겨도 준다) |
| 도장 찍기 미니게임 | 난이도별 하루 한 번 | 하 15, 중 30, 상 60, 지옥 120 |
| 준비 체크리스트 | 다 채우면 | 80 |
| 강아지 펫 | `dogcoin` | 방에 들어갈 때 하루 15 |
| 광고 | `AD_CAP=8`, `AD_LIM={unl:2,dbl:3,life:2,att:1,rst:1}` | 결과 두 배(dbl)는 이번 코인만큼 더, 하루 3회. 출석 광고는 출석 코인의 50% |

### 나가는 돈

| 쓰는 곳 | 금액 |
|---|---|
| 거처 보증금 `TIER_DEP` | 누적 0, 20, 50, 90, 140, 200, 280, 380, 500(투룸 전세), 650, 830, 1040, 1280, 1550, 1850 |
| 무기·옷 `ITEMS` | 110~700 (마우스 120 ... 법인카드 700) |
| 펫 `PETS` | 300~520 |
| 탈것 `MOUNTS` | 킥보드 320, 따릉이 420, 전기자전거 760, 중고 경차 900, 중형 세단 1800 |
| 세간 `FURNI` | need 1~8 단계는 90~980(합 3,790), 9~14 단계는 1,200~3,000(합 11,500) |
| 음식 `FOODS` | 15~60. 퀘스트 한 번에 포만감 15, 사건 25, 보스 30이 든다 |
| 기름값 | 전국 지도에서 도착할 때 20~25, `car1`을 풀면 30% 할인 |
| 생활 이벤트 | 잘못 고르면 -14 ~ -150 |

거처는 주 스탯이 `TIERS[i].need`를 넘고 하루 한 칸(`upLeft`, 첫날만 두 칸)씩 열린다. 신축(14단계)은 주 78이 필요하고, 엔딩은 `endingReady()`가 peak 14와 보스 셋을 본다.

### 보통 플레이어의 코인 추정

가정: 매일 한 번 접속, 새 퀘스트는 첫날 5개 뒤 하루 3개(`DRIP_FIRST=5`, `DRIP_DAILY=3`), 정답률 85%(코인 약 0.93배), 결과 두 배 광고는 하루 1번, 도장 찍기 하·중, 음식값 하루 약 50. 퀘스트 풀은 신분에 따라 여행 퀘스트를 빼고 30~38개라서 10~11일째에 새 퀘스트가 바닥난다. 그 뒤로는 출석, 복습, 미니게임, 광고만 남아 하루 수입이 크게 준다.

| 구간 | 하루 순수입(추정) | 누적 번 돈(추정) |
|---|---|---|
| 1일 | 약 490 (+시작 150) | 약 640 |
| 2일 | 약 370 | 약 1,000 |
| 3~6일 (출석 2배) | 약 480, 3일째 +100 | 약 3,000 |
| 7~10일 (출석 3배) | 약 590, 7일째 +200 | 약 5,600 |
| 사건·전세·보스 (1~12일에 흩어짐) | 한 번씩 | +1,600 안팎 |
| 11일 이후 (새 퀘스트 없음) | 약 180~250, 14일째 +400 | 하루 200 안팎씩 |

쓰는 쪽은 투룸 전세까지 보증금 500, 옷·무기 몇 개 1,500~2,500, 8단계까지 세간 일부 1,500~3,000이다. 그래서 보통 플레이어의 잔고는 늘 몇백에서 2천 사이를 오간다. 장이 열릴 무렵 잔고(메인 퀘스트 보상은 뺀 값)는 아래처럼 본다.

| 시점 | 예상 날짜 | 예상 잔고 | 메모 |
|---|---|---|---|
| 1장 열림 (튜토리얼 + 퀘스트 3개) | 1일 | 300~450 | 첫 이사 보증금 20~50을 막 낸 때 |
| 2장 열림 (원룸 전세 해금, 주 42) | 5~7일 | 800~1,200 | 원룸 전세 보증금 누적 380 |
| 3장 열림 | 7~8일 | 1,000~1,500 | |
| 4장 열림 | 9~10일 | 1,200~1,800 | 4장 보상 500을 더하면 중고 경차 900을 바로 산다 |
| 5장 열림 | 11~12일 | 800~1,500 | 차를 샀다면 적다 |
| 6장 열림 (투룸 전세 입주) | 13~15일 | 1,000~2,000 | 투룸 보증금 누적 500 |
| 엔딩 (84㎡ 신축) | 19~21일 | 자가 보증금 1,350이 드는 구간 | 6장 보상 800 + 하루 200 안팎으로 맞는다 |

날짜는 장 사이에 하루씩 쉬게 하는 CX 안을 가정한 값이다. 장을 연달아 열 수 있게 하면 앞당겨진다.

## 2. 장별 보상

기준은 사건 최고 결말(200~250)과 보스(200)보다 크게, 그 장이 여는 물건값의 절반에서 대부분을 덮는 정도로 잡았다. 4장은 차값(900)의 절반 남짓, 6장은 자가 보증금(누적 1,350)의 절반 남짓이다.

| 장 | id | XP | 코인 | 스탯 | 특별 보상 |
|---|---|---|---|---|---|
| 1 | job | 250 | 250 | 직 +10, 의 +4 | `ITEMS.mq_badge` 정규직 사원증 |
| 2 | lease | 300 | 300 | 주 +6, 금 +4 | `ITEMS.mq_lease` 확정일자 받은 계약서 |
| 3 | card | 320 | 350 | 금 +10, 식 +4 | `ITEMS.mq_card` 한도 낮춘 첫 카드 |
| 4 | car | 380 | 500 | 금 +6, 의 +6 | `ITEMS.mq_shades` 초보운전 선글라스 |
| 5 | wedding | 420 | 600 | 의 +6, 금 +6, 식 +4 | `ITEMS.mq_suit` 상견례 정장 |
| 6 | home | 550 | 800 | 주 +10, 금 +8 | `ITEMS.mq_homepants` 집들이 실내복 |
| 합 | | 2,220 | 2,800 | 주 16, 식 8, 의 16, 금 34, 직 10 | |

스탯 열쇠는 `THEMES`의 `ju sik ui geum jik`이다. 주 스탯은 2장과 6장에서만 준다. 지금 신축 need 78은 "가장 불리한 신분의 만점 합이 91"이라는 계산으로 잡혀 있는데, 메인 퀘스트가 주를 최대 16 더하므로 정답률이 조금 낮은 사람도 78에 닿는다. 6장 잠금 때문에 엔딩까지 길이 길어지는 만큼 스탯 쪽은 조금 풀어 주는 편이 맞다. 2장은 전세 계약 사건(`LEASE_ENDS`)의 주 +10, 코인 200을 그대로 받고 장 보상이 따로 붙는다.

XP 2,220은 `need(lv)=100+(lv-1)*60` 기준으로 중반에 레벨 두세 개다. 레벨은 지도(`MAP_LV`, 최대 Lv.4)만 막으니 문제 없다.

### 등급 배율

브리프대로 전부 맞히면 good, 절반 이상이면 ok, 그 아래는 bad다.

| 등급 | XP·코인 | 스탯 | 특별 보상 |
|---|---|---|---|
| good | 100% | 100% | 준다 |
| ok | 60% (10원 단위 반올림) | 60% (반올림, 최소 1) | 준다 |
| bad | 30% (10원 단위 반올림) | 30% (반올림, 최소 1) | 준다 |

예: 6장 코인 800 / 480 / 240, 1장 코인 250 / 150 / 80. 특별 보상은 등급과 관계없이 첫 클리어에 준다. 기념품이라 못 받으면 막힌 느낌만 남는다.

2장은 대본 선택과 전세 계약 결과를 합쳐 등급을 낸다. 전세 결과(`leaseEnd`의 tier)가 0이면 good, 1이면 ok, 2(A 매물)면 bad로 보고, 앞뒤 컷신 선택과 합쳐 더 낮은 쪽을 쓴다.

### 다시 하기

장은 다시 볼 수 있다. 보상은 `epEnd()`와 같은 방식으로 최고 등급 기록(`S.mq.best[id]`)만 남기고, 더 나은 등급을 내면 차액만 준다. 특별 보상과 잠금 해제는 첫 클리어에 한 번만.

```js
function mqPay(ch,grade){                 /* grade 0 good, 1 ok, 2 bad */
  var R=MQ_REWARD[ch.id],K=[1,0.6,0.3],was=S.mq.best[ch.id];
  function amt(v,k,r10){ var x=v*K[k]; return r10?Math.round(x/10)*10:Math.max(1,Math.round(x)); }
  if(was!=null&&grade>=was) return {xp:0,coin:0,first:false};
  var p=(was==null)?{xp:0,coin:0}:{xp:amt(R.xp,was,1),coin:amt(R.coin,was,1)};
  var g={xp:amt(R.xp,grade,1)-p.xp,coin:amt(R.coin,grade,1)-p.coin,first:was==null};
  Object.keys(R.stat).forEach(function(k){
    var d=amt(R.stat[k],grade)-(was==null?0:amt(R.stat[k],was)); S.stats[k]=Math.min(100,S.stats[k]+Math.max(0,d)); });
  S.mq.best[ch.id]=grade; grant({xp:g.xp,coin:g.coin});
  if(g.first){ S.mq.done[ch.id]=dayKey(); if(R.item&&S.owned.indexOf(R.item)<0) S.owned.push(R.item); }
  return g; }
var MQ_REWARD={
 job:    {xp:250,coin:250,stat:{jik:10,ui:4},         item:'mq_badge'},
 lease:  {xp:300,coin:300,stat:{ju:6,geum:4},         item:'mq_lease'},
 card:   {xp:320,coin:350,stat:{geum:10,sik:4},       item:'mq_card'},
 car:    {xp:380,coin:500,stat:{geum:6,ui:6},         item:'mq_shades'},
 wedding:{xp:420,coin:600,stat:{ui:6,geum:6,sik:4},   item:'mq_suit'},
 home:   {xp:550,coin:800,stat:{ju:10,geum:8},        item:'mq_homepants'}};
```

`grant()`가 코인, XP, 레벨 업, 저장까지 처리한다.

### 광고로 장 코인 두 배

한다. 장마다 한 번, 첫 클리어 결과 화면에서만, 그 등급으로 받은 코인만큼 더 준다. XP·스탯·특별 보상은 두 배가 아니다. 다시 하기로 받는 차액에는 붙이지 않는다.

광고 종류를 새로 둔다: `AD_LIM.mq=1`. 하루 공동 상한 `AD_CAP=8` 안에서 센다. 퀘스트 결과 두 배(`dbl`, 하루 3회)와 따로 세서, 메인 퀘스트를 깬 날 퀘스트 두 배를 못 받는 일이 없게 한다. 장은 여섯 개뿐이라 하루 1회면 남용할 틈이 없다.

상한에 걸렸을 때 기회를 날리지 않는다. 오늘 광고 8회를 다 썼거나 `mq`를 이미 썼으면 버튼 자리에 `AD_DONE` 대신 "내일 할배 메시지 창에서 받을 수 있어요"를 띄우고 `S.mq.adPend={id,coin}`로 남긴다. 다음 날 할배 메시지 창 맨 위에 "광고 보고 ￦coin 받기"를 한 번 띄운다. 받거나 새 장을 깨면(새 대기로 바뀌면) 사라진다. 대기는 하나만 둔다.

```js
function mqAdOffer(ch,coin){
  if(coin<30) return;                               /* 결과 두 배와 같은 하한 */
  if(adLeft('mq')>0) return {t:'광고 보고 ￦'+coin+' 더 받기',f:function(){ adGo('mq',function(){ S.coin+=coin; S.mq.adPend=null; save(); }); }};
  S.mq.adPend={id:ch.id,coin:coin}; save(); return null; }
```

6장이면 광고 한 번에 800이 더 들어온다. 크지만 평생 한 번이고, 그 돈은 자가 보증금(1,350)으로 바로 빠진다. 보상은 앱 안 코인뿐이라 `ops/ads.md`의 보상형 정책(자발 시청, 현금성 보상 금지)에 맞는다.

## 3. 특별 보상 물건

전부 `special:1, cost:0`이라 `fresh()`의 기본 지급 필터에 걸리지 않고, 상점에도 나오지 않는다. 모양은 기존 그림(`gear`, `ts`, `bs`)을 쓰고 색과 능력만 다르다. 새 그림이 필요 없다.

```js
ITEMS.mq_badge    ={slot:'top',perk:{coin:10,xp:5},name:'정규직 사원증',def:12,color:'#EDE2CC',accent:'#2C3A5E',ts:'badge',cost:0,special:1,
  from:'메인 퀘스트 1장 · 첫 취업',desc:'수습이 끝난 날 새로 받은 목걸이. 근로계약서는 서랍에 한 부 있다.'};
ITEMS.mq_lease    ={slot:'weapon',perk:{kan:1,mak:1},name:'확정일자 받은 계약서',atk:21,def:3,gear:'board',cost:0,special:1,
  from:'메인 퀘스트 2장 · 첫 전세 계약',desc:'도장 옆에 확정일자 도장이 하나 더 있다. 이게 보증금 순서를 정한다.'};
ITEMS.mq_card     ={slot:'weapon',perk:{foodDisc:15},name:'한도 낮춘 첫 카드',atk:24,def:2,gear:'card',cost:0,special:1,
  from:'메인 퀘스트 3장 · 첫 신용카드',desc:'한도는 내가 정했다. 결제일 전날 알림도 켜 뒀다.'};
ITEMS.mq_shades   ={slot:'head',perk:{mak:1,fullSave:2},name:'초보운전 선글라스',def:8,atk:6,gear:'glass',dark:1,cost:0,special:1,
  from:'메인 퀘스트 4장 · 첫 차',desc:'역광에도 앞차 브레이크등이 보인다. 뒷유리엔 초보운전 스티커.'};
ITEMS.mq_suit     ={slot:'top',perk:{kan:1,mak:1,coin:5},name:'상견례 정장',def:21,atk:3,color:'#4A3B5E',accent:'#E8D9B0',ts:'sharp',cost:0,special:1,
  from:'메인 퀘스트 5장 · 결혼 준비',desc:'양가 어른 앞에서 한 번 입었다. 예산표는 안주머니에.'};
ITEMS.mq_homepants={slot:'bottom',perk:{fullMax:10,fullSave:3},name:'집들이 실내복',def:16,atk:2,color:'#7C9A6E',accent:'#FFF8EC',bs:'stripe',cost:0,special:1,
  from:'메인 퀘스트 6장 · 첫 내 집 마련',desc:'등기부 갑구에 내 이름이 오른 날 처음 입었다.'};
```

능력치는 같은 칸 상점 물건 중 중상급에 둔다(사원증 목걸이 def 9·coin 10 → 12·coin 10·xp 5, 필살기 정장 def 17 → 상견례 정장 def 21, 법인카드 atk 32보다 약한 atk 24). 한 칸에 몰리지 않게 상의 둘, 무기 둘, 머리 하나, 하의 하나로 나눴다.

`gearTip()`은 `special`이면서 없는 물건을 "???"와 "어딘가에 숨어 있다"로 보여 준다. 메인 퀘스트 물건은 숨은 물건이 아니므로 `from`이 "메인 퀘스트"로 시작하면 이름과 "메인 퀘스트 N장 보상"을 보여 주도록 한 줄 분기를 넣는다.

## 4. 장별 잠금과 새 상점 물건

잠금은 세 가지 틀로 통일한다.

1. 상점 물건에 `mq:'<장 id>'` 필드를 달면, 그 장을 깨기 전에는 살 수 없다. 이미 가진 물건, 퀘스트 보상으로 받는 물건은 막지 않는다. `itemRow()`, `gearTip()`, `buyFurni()`, 세간 상세의 사기 버튼에서 확인한다.
2. 지도 이동은 `mapOpen()`과 `checkWarp()`에서 막는다.
3. 거처는 `tierGrow()`의 상한으로 막는다.

```js
function mqOk(id){ return !!(S.mq&&(S.mq.done[id]||S.mq.gf[id])); }
var MQ_NO={job:1,lease:2,card:3,car:4,wedding:5,home:6};
function mqLockText(id){ return MQ_NO[id]+'장을 마치면 열립니다'; }
function buyLocked(it,have){ return !have&&it.mq&&!mqOk(it.mq); }      /* itemRow, gearTip, buyFurni 공통 */
```

잠긴 물건은 목록에 그대로 보이고, 값 자리에 "N장 뒤"를, 상세에 `mqLockText()`를 띄운다. 무엇이 열릴지 보여야 장을 깰 이유가 생긴다.

### 1장 첫 취업

잠금: 역 앞(`station`)과 역 대합실. 지금은 Lv.3이면 열린다(`MAP_LV.station=3`). 레벨 조건은 두고 1장 조건을 더한다.

```js
function mapOpen(id){ if(id==='station'&&!mqOk('job')) return false; return id==='room'||S.lv>=(MAP_LV[id]||1); }
```

`checkWarp()`의 가장자리 이동 토스트가 "Lv.3부터"만 말하므로, 레벨은 되는데 장이 안 된 경우에 `mqLockText('job')`를 띄우도록 나눈다. 빠른 이동(`openTravel`)도 `mapOpen`을 보니 같이 막힌다. 역 앞에는 퀘스트 책상이 없고(말 걸기와 숨은 물건뿐) 1장은 첫날 열리니 막혀서 멈추는 일은 없다. 숨은 물건 수집(`EGG_AREAS`)에 역 앞이 있어도 1장 뒤에 채우면 된다.

새 상점 물건 (출근복 칸):

```js
ITEMS.oxford  ={slot:'top',perk:{xp:5},name:'옥스퍼드 셔츠',def:11,color:'#DCE6F2',cost:240,mq:'job',
  desc:'다림질 없이 입어도 구김이 덜하다. 월요일 아침의 친구.'};
ITEMS.cardigan={slot:'top',perk:{coin:5},name:'사무실 가디건',def:14,color:'#8A6E5A',cost:300,mq:'job',
  desc:'에어컨 바람 아래 자리에 앉았다면 필수.'};
ITEMS.wideslk ={slot:'bottom',perk:{fullSave:2},name:'와이드 슬랙스',def:13,color:'#4A4756',bs:'seam',cost:220,mq:'job',
  desc:'앉아 있는 여덟 시간이 편하다.'};
```

값은 기존 상의 110~520, 하의 110~230 사이에 둔다.

### 2장 첫 전세 계약

잠금: 없음. 2장 자체가 전세 계약 사건이고, 원룸 전세 거처는 지금처럼 주 42와 계약(`leaseGate`)으로 열린다.

여는 조건: 1장 완료, 그리고 `S.peak>=7`(원룸 전세 해금) 또는 이미 전세 계약을 마친 기록(`S.leaseDone[7]||S.leaseDone[8]`). 1장보다 전세 계약을 먼저 끝낸 사람(주 스탯을 몰아 올린 경우, 옛 저장)은 2장을 열면 앞뒤 컷신만 보고, 등급은 `S.leaseBest.any`로 매긴다. 계약을 두 번 시키지 않는다.

새 상점 물건 (대형 가전, 원룸 전세부터 놓음):

```js
FURNI.fridge2 ={name:'양문형 냉장고',perk:{fullMax:30},cost:820,need:7,def:12,w:2,h:2,mq:'lease',desc:'장 본 걸 한 번에 넣는다. 배달 앱을 덜 연다.'};
FURNI.purifier={name:'공기청정기',perk:{xp:5},cost:620,need:7,def:8,w:1,h:1,mq:'lease',desc:'미세먼지 많은 날에도 창문 대신 이걸 켠다.'};
```

need 7 세간(TV 560)과 need 8(옷 관리기 760, 소파 980) 사이 값이다. 두 가지 모두 `drawObj()`에 그림 case가 새로 필요하다(개발 리드). `FURNI_ORDER`에 `fridge2`는 `fridge` 뒤, `purifier`는 `tv` 뒤에 넣고, `FURNI_ACT.fridge2`는 `fridge`의 행동을 그대로 쓴다.

### 3장 첫 신용카드

잠금: `ITEMS.card`(법인카드, 700) 상점 구매. `ITEMS.card.mq='card'`. `jik3` 퀘스트 보상으로 받는 길은 그대로 둔다.

은행 골목 혜택: 3장을 깨면 은행 창구 직원(`bank_branch`)에게 말을 걸 때 하루 한 번 "체크카드 캐시백 ￦20"을 준다. 강아지 펫의 `dogcoin`과 같은 틀이다(`S.cbDay`). 대사는 "캐시백은 전월 실적 조건부터 확인하세요"로, 카드를 더 쓰라는 말이 아니라 조건을 보라는 말로 쓴다.

```js
if(mqOk('card')&&S.cbDay!==dayKey()){ S.cbDay=dayKey(); grant({coin:20}); toast('캐시백 ￦20 · 실적 조건은 매달 확인'); }
```

새 상점 물건:

```js
ITEMS.wallet={slot:'weapon',perk:{foodDisc:10},name:'카드지갑',atk:18,gear:'card',cost:360,mq:'card',
  desc:'카드는 두 장만. 쓰는 카드를 줄이면 명세서가 읽힌다.'};
```

값은 OTP 카드 300과 결재판 340 근처다.

### 4장 첫 차

잠금 셋.

1. `MOUNTS.car`, `MOUNTS.sedan` 상점 구매: `mq:'car'`.
2. 고속도로: `checkWarp()`에서 `needCar`이거나 `to==='korea'`인 출구. 동네 서쪽 휴게소 입구(`town`의 `needCar:1` 두 칸)가 여기에 걸린다. 차를 안 가진 사람은 원래도 못 가니, 실제로 막히는 사람은 옛 저장에서 차를 가진 사람뿐이고 이 사람은 아래 5절대로 풀어 준다. 그래도 조건을 코드에 두는 이유는 나중에 차를 선물로 주는 길(이벤트·쿠폰)이 생겨도 순서가 깨지지 않게 하려는 것이다.
3. 여행 퀘스트(`car1 car2 trip1~5`)는 따로 막지 않는다. 휴게소와 여행지에 있어서 길이 막히면 자연히 4장 뒤로 밀린다.

```js
if((w.needCar||w.to==='korea')&&!mqOk('car')){ toast('고속도로는 '+mqLockText('car')); /* 한 칸 물러서기 */ return true; }
```

이 확인은 `checkWarp()`의 기름값(`w.fuel`) 차감보다 앞에 둔다. 지금 코드 순서는 기름값을 먼저 빼고 차 여부를 나중에 본다.

새 상점 물건:

```js
MOUNTS.evcar={slot:'mount',perk:{speed:1,road:1,fullSave:3},name:'소형 전기차',def:20,atk:9,kind:'car',cost:1300,mq:'car',
  pal:{r1:'g1',r2:'g2',r3:'g3'},top:{car:'#2F8C39',carL:'#5DBB63',carD:'#1F5E27'},desc:'충전소 위치부터 외웠다. 기름값 대신 충전비.'};
```

경차 900과 세단 1800 사이. 그림은 세단처럼 색만 바꾼다(`g1~g3`는 팔레트 `P`에 있는 초록 열쇠).

### 5장 결혼 준비

잠금: 전국 지도(`MAPS.korea`)의 경주·대구 출구. 두 warp 객체에 `mq:'wedding'`을 단다.

```js
{x:12,y:19,to:'daegu',tx:1,ty:5,fuel:20,mq:'wedding'},{x:19,y:22,to:'gyeongju',tx:1,ty:5,fuel:25,mq:'wedding'}
/* checkWarp 맨 앞 */ if(w.mq&&!mqOk(w.mq)){ toast(MAPS[w.to].name+' · '+mqLockText(w.mq)); /* 물러서기 */ return true; }
```

역시 기름값 차감보다 앞에 둔다. 표지판(`signs`)은 그대로 보여 준다. 경주·대구에는 퀘스트 책상(`QPLACE`)이 없어서 막아도 퀘스트가 갇히지 않는다. 경주·대구에서 나가는 출구(→ 전국 지도)는 막지 않는다. 업데이트 순간 거기 서 있던 사람도 빠져나온다.

새 상점 물건 (신혼 세간, 투룸 전세부터 놓음):

```js
FURNI.bed2  ={name:'퀸 침대',perk:{fullMax:15},cost:1100,need:8,def:16,w:2,h:2,mq:'wedding',desc:'둘이 누워도 팔이 안 부딪힌다.'};
FURNI.table2={name:'2인 식탁',perk:{foodBoost:15},cost:720,need:8,def:8,w:2,h:1,mq:'wedding',desc:'밥을 식탁에서 먹으니 배달이 줄었다.'};
```

need 8 세간 760~980 근처. 그림 case 둘이 필요하다. `FURNI_ACT.bed2`는 `bed`의 잠자기(광고 행동 포함)를 그대로 쓴다.

### 6장 첫 내 집 마련

여는 조건: 5장 완료, 그리고 투룸 전세에 한 번이라도 입주(`S.paid>=8` 또는 `S.leaseDone[8]`).

잠금: 자가 거처 9~14단계. `tierGrow()`에 상한을 넣는다.

```js
function tierCap(){ return (mqOk('home'))?TIERS.length-1:Math.max(8,(S.mq&&S.mq.gfPeak)||0); }
function tierGrow(){
  if(S.peak>=tierCap()||tierFor(S.stats.ju)<=S.peak||upLeft()<=0) return null;
  /* 이하 그대로 */ }
```

거처 목록(`houseTip`, 캐릭터 창 거처 칸)의 잠금 문구는 `i>8&&!mqOk('home')`이면 "주 54"보다 "6장을 마치면 열립니다"를 먼저 보여 준다. 주 스탯이 이미 넘었는데 왜 안 열리는지 알려 줘야 한다.

6장을 깨는 순간에는 오늘 몫(`upLeft`)과 상관없이 한 칸을 바로 연다. 주가 54 이상이면 도시형생활주택(자가 1단계)이 열리고 보증금 150(누적 650-500)을 내고 옮긴다. 장 보상 800이 먼저 들어오므로 코인이 모자라 못 옮기는 일은 거의 없다. 그 뒤로는 원래대로 하루 한 칸이다.

```js
S.upN=Math.max(0,(S.upN||0)-1); var gr=tierGrow(); if(gr&&gr.wasTop) LASTMOVE=tierMove(S.peak);
```

엔딩은 손대지 않는다. `endingReady()`는 peak 14와 보스 셋을 보고, 새 플레이어는 6장을 깨야 peak 9 이상이 되므로 순서가 저절로 맞는다. 6장 뒤 하루 한 칸이면 엔딩은 6장으로부터 빨라야 5~6일 뒤다(주 78이 되어 있을 때). 보스에게 지면 peak가 한 칸 내려가는(`bossEnd`) 규칙도 상한과 부딪히지 않는다.

새 상점 물건 (자가부터 놓음):

```js
FURNI.shelf={name:'거실 책장',perk:{xp:5},cost:1300,need:9,atk:6,def:10,w:2,h:1,mq:'home',desc:'이사 걱정 없이 책을 꽂는다. 벽에 못도 박을 수 있다.'};
FURNI.plant={name:'큰 화분',perk:{fullSave:2},cost:500,need:9,def:4,w:1,h:1,mq:'home',desc:'2년마다 옮길 일이 없으니 큰 걸 들였다.'};
```

책장은 need 9 에어컨 1,200 근처, 화분은 장식이라 싸게 둔다. 둘 다 그림 case가 필요하다.

### 잠금 한눈에

| 장 | 막는 것 | 새로 파는 것 |
|---|---|---|
| 1 | 역 앞 지도 | 옥스퍼드 셔츠 240, 사무실 가디건 300, 와이드 슬랙스 220 |
| 2 | (없음, 전세 계약은 원래 규칙) | 양문형 냉장고 820, 공기청정기 620 |
| 3 | 법인카드 구매 | 카드지갑 360, 은행 창구 캐시백 하루 20 |
| 4 | 중고 경차·중형 세단 구매, 고속도로 입구 | 소형 전기차 1,300 |
| 5 | 경주·대구 출구 | 퀸 침대 1,100, 2인 식탁 720 |
| 6 | 자가 거처 9~14단계 | 거실 책장 1,300, 큰 화분 500 |

새 물건 합은 7,480이다. 11일 이후 새 퀘스트가 바닥나 하루 200 안팎으로 수입이 줄 때 쓸 곳이 생긴다.

## 5. 옛 저장 처리 (기득권)

`load()`는 `fresh()`에 있는 새 필드를 빈 값으로 메운다. 그래서 `S.mq`를 `fresh()`에 넣으면 옛 저장과 새 저장을 구분할 수 없게 된다. 메우기 전에 먼저 옛 저장인지 적어 둔다.

```js
/* load() 안, Object.keys(f).forEach(...) 메우기보다 앞 */
var legacy=(o.mq===undefined)&&!!o.onboarded;
/* 메운 뒤 */
if(legacy) o.mq.gf=mqGrandfather(o);

function mqGrandfather(o){
  var own=function(id){ return (o.owned||[]).indexOf(id)>=0; },
      trip=['car1','car2','trip1','trip2','trip3','trip4','trip5'].some(function(id){ return (o.done||[]).indexOf(id)>=0; }),
      away=!!(o.pos&&(PARK_MAPS[o.pos.map]||o.pos.map==='korea')),
      road=own('car')||own('sedan')||trip||away;
  var gf={};
  if((o.lv||1)>=MAP_LV.station) gf.job=1;            /* 역 앞을 이미 다니던 사람 */
  if(own('card')) gf.card=1;                          /* 법인카드를 이미 산 사람. 은행 캐시백은 3장을 깨야 */
  if(road){ gf.car=1; gf.wedding=1; }                 /* 고속도로·경주·대구를 이미 쓰던 사람 */
  if((o.peak||0)>=9) gf.home=1;                       /* 자가에 이미 닿은 사람은 상한 없음 */
  return gf; }
```

`fresh()`에는 `mq:{done:{},best:{},gf:{},adPend:null}`를 넣는다.

규칙을 풀어 쓰면 이렇다.

1. 가진 물건은 그대로 가진다. 잠금은 "사기"만 막으므로 차를 가진 사람은 차를 계속 탄다.
2. 차가 있거나, 여행 퀘스트를 하나라도 풀었거나, 업데이트 순간 휴게소·여행지·전국 지도에 있었던 사람은 `gf.car`, `gf.wedding`을 받아 고속도로와 경주·대구가 그대로 열린다. 원래 되던 길을 막으면 차를 산 돈이 무의미해진다.
3. peak가 이미 9 이상이면 `gf.home`을 받아 자가 상한이 없다. 엔딩 직전인 사람을 6장까지 되돌리지 않는다. 이 사람도 메인 퀘스트는 전부 할 수 있고 보상도 받는다.
4. `gf`는 잠금만 풀 뿐 장을 깬 것으로 치지 않는다. 장 보상과 특별 보상은 직접 깨야 받는다. 다음 장이 여는 조건도 `S.mq.done`만 본다.
5. 이미 전세 계약을 한 사람의 2장은 앞 절대로 계약을 다시 시키지 않는다.
6. 이미 엔딩을 본 저장(`S.ending`)은 아무것도 바뀌지 않는다. `gf.home`이 반드시 붙는다(peak 14).

`gfPeak`는 쓰지 않아도 된다. 위 `tierCap()`의 `gfPeak`는 "peak 9 이상은 전부 풀기"(`gf.home`) 대신 "그때 peak까지만 인정"을 고를 때를 위한 자리다. 경제 쪽 추천은 전부 풀기다.

## 6. 막다른 길 점검

| 경우 | 결과 |
|---|---|
| 새 플레이어, 주 스탯이 빨리 올라 6장 전에 주 54 이상 | peak 8에서 멈춘다. 6장을 깨면 바로 한 칸, 그 뒤 하루 한 칸. 거처 칸에 "6장을 마치면 열립니다" |
| 새 플레이어, 1장 전에 전세 계약까지 끝냄 | 2장은 컷신만 보고 기록된 계약 결과로 등급 |
| 새 플레이어, 투룸 전세 보증금이 모자라 6장이 안 열림 | 보증금 누적 500은 5일 안팎의 수입. 할배 메시지가 "투룸 전세로 옮기기"를 다음 할 일로 알려 준다 |
| 4장을 깼는데 차 살 돈이 없음 | 4장 보상 500 + 잔고 1,200~1,800이면 산다. 못 사도 5·6장은 차 없이 열린다(5장은 4장 완료만 본다) |
| 옛 저장, 차 보유, 4장 안 깸 | `gf.car`로 고속도로 그대로 |
| 옛 저장, peak 11, 6장 안 깸 | `gf.home`으로 상한 없음, 엔딩 그대로 |
| 옛 저장, 경주에 서 있음 | 나가는 출구는 막지 않음. 차가 있으니 `gf.wedding`으로 다시 들어갈 수도 있음 |
| 보스에게 져서 peak가 내려감 | 상한과 무관. 다시 오를 때 상한만 지킴 |
| 광고 상한을 다 쓴 날 장을 깸 | 두 배 기회를 `adPend`로 다음 날까지 보관 |
| 엔딩 조건 | `endingReady()` 그대로. 새 플레이어는 1→6장을 거쳐야 peak 14에 닿는다 |

## 7. 남은 결정 (CTO·CX)

1. 장 사이 쉬는 날. 위 날짜 추정은 "장을 깬 다음 날 다음 장이 열린다"를 가정했다. CX가 연달아 열기로 하면 1~3장이 첫 주에 몰리고, 4장 보상(500)이 차값을 덮는 시점이 당겨진다. 경제상 문제는 없다.
2. 새 세간 여섯 개(`fridge2 purifier bed2 table2 shelf plant`)의 그림. 그림이 늦으면 `drawObj()`에서 기존 case로 잠시 대신 그리는 `look` 필드(`look:'fridge'`)를 쓰고 `switch(it.look||o.id)`로 바꾸는 방법이 있다.
3. 보스는 이길 때마다 200을 준다. 메인 퀘스트와는 무관하지만, 11일 이후 수입이 줄면 보스 반복이 가장 쉬운 돈벌이가 된다(포만감 30과 음식값이 드는 정도). 첫 승리만 200, 이후 50으로 줄이는 안을 따로 올린다.
4. 할배 메시지 창의 "다음 할 일" 문구에 잠금 이유를 같이 적는다. 예: "주 스탯은 충분하네. 이제 6장, 내 집 마련을 해 보세."

## 8. 6장 대본

`ch-home.js`에 있다. 17장면, 선택 4개(특별공급 고르기, 분양대금 일정, 대출 LTV·DSR, 소유권이전등기), 배경은 `livingroom modelhouse phone bank apartment`. 금액은 전부 예시로 표시했다. 정부 사이트 본문은 이 환경의 네트워크가 막아 직접 열지 못했고, 공식 도메인만 걸러 낸 웹 검색 결과로 확인했다. 파일 맨 위 주석에 출처와 확인일을 적었다. 통합 전에 원문을 한 번 더 열어 볼 것. 규제 비율(LTV 상한, DSR 한도)과 디딤돌 한도·소득 기준은 자주 바뀌어 숫자를 넣지 않고 "확인하자"로 썼다.
