# 리뷰 1009 · 개발(시니어) 리뷰: 인생 모드 코드의 버그와 약한 곳

대상: `prototype/newbie-quest-demo.html` 인생 모드 블록(약 3496~3780행)과 이어지는 곳, 앱 브릿지 `src/bridge/`, `src/GameShell.tsx`.
확인 도구: `ops/review-1009/tools/dev-probe.mjs`(Playwright, 저장소 루트에서 `node ops/review-1009/tools/dev-probe.mjs`). 실행 중 페이지 오류는 0건이었다.
그림: `img/dev-menu-tiername.png`(메뉴의 일반 저장 줄), `img/dev-toast-over-cine.png`(세월 컷신 위의 나이 토스트), `img/dev-first-360x640.png`, `img/dev-first-390x844.png`.

아래의 "확인"은 프로브로 실제로 재현했다는 뜻이다. 패치는 제안만 한다(prototype/, tests/는 고치지 않았다). 패치는 모두 `tests/*.test.mjs`의 기존 기대값을 깨지 않도록 골랐다.

---

## 1. 앱 재설치·웹뷰 데이터 삭제 때 인생 저장과 앨범이 사라진다 (확인, 높음)

- `src/bridge/injected.mjs`는 `SAVE_KEY='nq.v8'` 하나만 본다. 미러 전송(`flushSave`)도 복원도 `nq.v8`만 한다. `GameShell.tsx`도 `nq.v8.mirror` 하나만 AsyncStorage에 쓴다.
- `nq.life.v1`, `nq.album.v1`, `nq.slot`은 네이티브로 가지 않는다.
- 프로브: 브릿지를 붙이고 인생 모드(코인 777)로 저장 → 미러만 남기고 새 웹뷰를 열면 `SLOT:'normal'`, `onboarded:false`, 인생 저장 없음. 인생만 하던 사람은 처음부터 다시 시작하고, 앨범도 빈다.
- 처음 켠 사람이 인생 모드로 시작하면 `nq.v8`에는 빈 일반 저장만 생긴다(두 화면 크기 모두 확인). 미러는 이 빈 저장만 지킨다.

패치(테스트 `bridge.test.mjs`가 `save` 메시지의 `data`를 `nq.v8` 원문으로 보므로, 형식은 그대로 두고 메시지를 하나 더 둔다):

```js
// injected.mjs 앞
export const AUX_KEYS = ['nq.life.v1', 'nq.album.v1', 'nq.slot'];
export const AUX_MIRROR_KEY = 'nq.aux.mirror';

// BEFORE_BODY 1번 복원 뒤에 추가
try {
  if (CFG.aux) { var ax = JSON.parse(CFG.aux);
    Object.keys(ax).forEach(function (k) { if (localStorage.getItem(k) == null) localStorage.setItem(k, ax[k]); }); }
} catch (e) {}

// flushSave: before
  if (raw == null || raw === lastSent) return;
  lastSent = raw; lastAt = Date.now();
  post({ type: 'save', data: raw });
// after
  var aux = {}; ['nq.life.v1','nq.album.v1','nq.slot'].forEach(function (k) { try { var v = localStorage.getItem(k); if (v != null) aux[k] = v; } catch (e) {} });
  var auxRaw = JSON.stringify(aux);
  if (auxRaw !== lastAux) { lastAux = auxRaw; post({ type: 'saveAux', data: auxRaw }); }
  if (raw == null || raw === lastSent) return;
  lastSent = raw; lastAt = Date.now();
  post({ type: 'save', data: raw });
```

`buildBeforeScript({ insets, mirror, aux })`에 `aux`를 받아 CFG에 넣고, `mirror.ts`에 `readAux/writeAux`(키 `nq.aux.mirror`), `GameShell.tsx`의 메시지 처리에 `case 'saveAux'`를 더한다. `save` 메시지 수는 그대로라 `bridge.test.mjs` 248행(저장 한 번에 `save` 한 통)도 안 깨진다.

테스트 생각: 브릿지 붙여 인생 모드 시작 → `saveAux` 마지막 데이터를 `aux`로 새 컨텍스트에 넘김 → `SLOT==='life'`, `S.life.prof.seed`가 같고 `albumLoad().length`가 같은지. 이미 `nq.life.v1`이 있으면 덮지 않는지도.

## 2. 6장을 깬 뒤 결산 전에 앱이 닫히면 예순 결산이 영영 안 온다 (확인, 높음)

- `lifeEnd()`를 부르는 곳은 `mqAfter`의 `setTimeout` 안 한 곳뿐이다(약 11764행). 그것도 `if(!mqIdle()){ toast(...); return; }` 뒤에 있어서, 그 순간 창이 하나라도 열려 있으면 건너뛴다.
- 프로브: 6장을 모두 `done`으로 저장하고 새로고침 → 4초 기다려도 `S.life.over:false`, `mqNext():null`. 시작 메뉴에는 "이어하기 · 인생 · 메인 6/6"이 계속 남고, 할 일이 없는 상태로 멈춘다.

패치(홈을 그릴 때마다 살펴 본다. `lifeEnd`는 `over`로 한 번만 돈다):

```js
// before (약 10172행)
var _renderHomeB=renderHome; renderHome=function(){ _renderHomeB.apply(this,arguments); todayBtn(); todayAuto(); upNoteShow(); };
// after
var _renderHomeB=renderHome; renderHome=function(){ _renderHomeB.apply(this,arguments); todayBtn(); todayAuto(); upNoteShow();
  if(lifeOn()&&S.life&&!S.life.over&&mqDone('home')&&!MQP) setTimeout(function(){ if(lifeOn()&&!S.life.over&&mqIdle()) lifeEnd(); },1800); };
```

테스트 생각: 6장 모두 `done` 저장 → 새로고침 → `playCine` 후 `.lcard`가 뜨는지.

## 3. 결산 컷신 도중 앱이 닫히면 결산 카드를 다시 볼 길이 없다 (확인, 중간)

- `lifeEnd`는 컷신 전에 `S.life.over=true`를 저장하고 앨범에 넣는다(앨범 중복을 막는 데는 맞다). 그런데 카드는 컷신 뒤에만 뜬다.
- 프로브: `lifeEnd()` 컷신 중 새로고침 → `over:true`, 앨범 1건, 카드 없음. 시작 메뉴에는 `life`(새로 태어나기), `new`, `pro`, `snd`만 있고 이 인생으로 돌아가는 줄이 없다. 앨범 목록은 글자 한 줄이라 카드를 다시 못 연다. 공유 버튼도 다시 못 누른다.

패치: 카드를 본 것을 따로 적고, 못 봤으면 홈에서 다시 띄운다.

```js
// lifeAfter 첫 줄에
S.life.cardSeen=1; save();
// 2번 패치의 renderHome 덧붙임에 이어서
if(lifeOn()&&S.life&&S.life.over&&!S.life.cardSeen&&!MQP) setTimeout(function(){
  var sm=albumLoad().filter(function(a){ return !a.stopped&&a.seed===(S.life.prof||{}).seed; })[0];
  if(sm&&mqIdle()) lifeAfter(sm); },1200);
```

테스트 생각: `lifeEnd()` → `MQP` 뜨면 새로고침 → 홈에서 `#itipbox` 안에 `.lcard`와 "다시 태어나기"가 있는지.

## 4. 인생 모드에서 건너뛴 거처(움막·텐트·찜질방, 기숙사의 노숙)로 옮길 수 있다 (확인, 높음)

- `tierGrow`는 인생 모드에서 `peak`를 0에서 4로 바로 올린다. 그런데 거처 목록(`renderBag` 집 탭)과 `houseTip`, `tierMove`는 `i<=S.peak`면 다 열린 것으로 본다.
- 프로브(집 스탯 30, 코인 500):
  - 본가: `peak:4`, 움막 ￦20·텐트 ￦50·찜질방 ￦90. `houseTip(1)` 버튼 "￦20 내고 여기서 살기", 누르면 움막으로 옮겨진다.
  - 기숙사: `paidBase=3`이라 노숙·움막·텐트가 모두 ￦0. "여기서 살기"로 노숙에 들어간다.
- 대표가 말한 "본가인데 노숙" 모순이 다른 길로 그대로 남아 있다. 보증금 표(`TIER_DEP`)도 건너뛴 칸을 낸 것으로 친다(`paid`가 1~3으로 올라감).

패치:

```js
// 인생 블록 lifeHouseArt 아래에 추가
function lifeSkip(i){ if(!lifeOn()||i>=4) return false; var lv=lifeLiving();
  return !((lv==='본가'&&i===0)||(lv==='기숙사'&&i===3)); }
// tierMove 첫 줄 before
  var c=tierCost(i);
// after
  if(lifeSkip(i)) return {ok:0,i:i,cost:0,skip:1};
  var c=tierCost(i);
// renderBag 집 탭 TIERS.forEach 안 첫 줄
  if(lifeSkip(i)) return;
```

목록 제목 "해금 (peak+1)/15"도 인생 모드에서는 건너뛴 칸을 빼고 세야 한다(`TIERS.filter((t,i)=>!lifeSkip(i)).length`).

테스트 생각: 본가·기숙사·자취 카드마다 `S.stats.ju=30; tierGrow()` 뒤 `[0,1,2,3].filter(lifeSkip)`인 칸에 대해 `tierMove(i).ok===0`, 집 탭 칸 수가 `15-건너뛴 수`인지. 일반 모드에서는 `lifeSkip`이 모두 false.

## 5. 2장(전세)을 이사부터 열면 스물여섯 세월 컷신·나이·형편 보너스가 빠진다 (확인, 중간)

- 세월 컷신은 `mqStart` 안의 `lifeBeforeCh`에서만 튼다. 그런데 2장은 `houseTip`의 "전세 계약하러 가기" → `leaseGate` → 부동산 → `leaseShow`로도 시작되고, 이 길은 `mqStart`를 지나지 않는다.
- 프로브: 1장 완료, `peak:8`에서 `leaseGate(7); leaseShow()` → 바로 일반 2장 앞 컷신, `S.life.yrs.lease:false`. 나이 기준(anch)이 24에 머물고 y26 장면은 끝내 안 나온다. 인생 모드는 `upLeft()`가 9라 2장보다 먼저 전세 칸이 열리는 일이 흔하다.

패치(`lifeBeforeCh`는 한 번만 돌고, 끝나면 `leaseShow`를 다시 부른다):

```js
// leaseShow 안, 메인 2장 앞 컷신 줄 바로 위
if(L.ch===0&&L.b===0&&mqDone('job')&&!mqDone('lease')&&lifeBeforeCh('lease',leaseShow)) return;
```

테스트 생각: 위 프로브 그대로, 첫 `MQP.o.kicker==='LIFE'`, 다 넘긴 뒤 `S.life.yrs.lease===1`, `S.life.age>=26`, 다음 컷신 제목 "첫 전세 계약".

## 6. `hudName`이 나이를 바꾸고 저장하고 토스트를 띄운다 (확인, 중간)

- `hudName()`은 HUD 글자를 만드는 함수인데 `lifeTick()`으로 `S.life.age`, `S.status`, `S.years`, `S.age`를 고치고 `save()`까지 한다. 프로브: 퀘스트 3개를 `done`에 넣고 `hudName()`만 불러도 20→21살, 저장이 바뀐다. 렌더(`render` 8425행)가 상태를 바꾸는 것은 순서를 바꿀 때마다 버그가 된다.
- 그 결과 세월 컷신 위로 나이 토스트가 뜬다. 프로브: `lifeBeforeCh('job')` 0.9초 뒤 `MQP` 재생 중에 "24살 · 3년이 흘렀어요" 토스트(`img/dev-toast-over-cine.png`). 컷신이 이미 그 이야기를 하는데 같은 말이 겹친다.

패치(`sprintH` 테스트 2가 `hudRefresh()` 뒤 나이를 보므로 `hudRefresh`에 남긴다):

```js
// before
function hudName(){ lifeTick(); return lifeOn()&&S.life?...
// after
function hudName(){ return lifeOn()&&S.life?...
// hudRefresh 첫 줄(6953행)에
  if(typeof lifeTick==='function') lifeTick();
// lifeTick 안 두 토스트
  setTimeout(function(){ if(!MQP) toast(...); },700);   // 졸업 토스트(1400)도 같은 식
```

테스트 생각: 퀘스트 3개 push 후 `hudName()` 전후 `localStorage['nq.life.v1']`가 같은지. `lifeBeforeCh('job')` 뒤 `MQP`가 있는 동안 `#htoast`가 숨어 있는지.

## 7. 전역 `TIERS`·`ROOMSPEC`을 덮어써서 다른 칸의 이름이 섞인다 (확인, 중간)

캐시는 괜찮다: `applyLifeTiers`가 `HCACHE`(houseCv), `ROOMC`, `TCACHE`를 비운다. 거처 그림 캐시는 이 셋뿐이고(`RCACHE`·`CVCACHE`·`TOPC`는 거처와 상관없는 키), 공유 카드 `shareCard`도 그릴 때마다 `houseCv(S.tier)`를 새로 읽는다. 문제는 "지금 칸이 아닌 저장"을 지금 칸의 `TIERS`로 읽는 두 곳이다.

- 시작 메뉴: 인생(본가) 칸이 켜진 채 앱을 열면 일반 저장 줄이 "이어하기 · 일반 · Lv.3 · **본가 방**"(일반 거처 0칸은 노숙). 프로브 `menuNormalLine`, `img/dev-menu-tiername.png`.
- 앨범: 일반 칸에서 인생 모드 → 새로 태어나기를 하면 `lifeNew`가 멈춘 인생의 요약을 일반 `TIERS`로 만든다. 본가 인생이 앨범에 "**노숙**"으로 남는다(프로브 `albumStopped.tier`).

패치(저장을 받아 이름을 돌려주는 작은 함수):

```js
function tierNameOf(st,i){ var lv=st&&st.mode==='life'&&st.life&&st.life.prof?st.life.prof.living:null;
  if(lv==='본가'&&i===0) return '본가 방'; if(lv==='기숙사'&&i===3) return '기숙사';
  return (TIERS_ORIG||TIERS)[i].name; }
// menuItems: TIERS[sl.n.tier].name  →  tierNameOf(sl.n,sl.n.tier)
// lifeSummary: tier:TIERS[S.tier].name  →  tier:tierNameOf(S,S.tier)
```

테스트 생각: 일반 저장(0칸) + 본가 인생 칸, `nq.slot=life`로 오프닝 → `.omb[data-k=cont]`에 "노숙". 일반 칸에서 `lifeNew()` → `albumLoad()[0].tier==='본가 방'`.

## 8. 옛 인생 저장의 빈 칸을 못 메운다 (코드 확인, 낮음·미리 막기)

`load()`는 맨 위 키만 `fresh()`로 메운다. `S.life` 안(`yrs`, `anch`, `prev`, `t0`)은 안 메운다. 다음에 `lifeFresh()`에 칸이 늘면 `S.life.yrs[id]` 같은 곳에서 바로 오류가 난다.

```js
// load(), return o; 바로 위
if(o.mode==='life') o.life=Object.assign(lifeFresh(),o.life||{});
```

## 9. 결산 카드의 "N분"이 실제 시간(벽시계)이다 (코드 확인, 낮음)

`lifeSummary`의 `mins`는 `Date.now()-S.life.t0`다. 3주에 걸쳐 하면 "30000분"이 찍힌다. 카드에 "플레이 시간"처럼 보이니 모순으로 읽힌다. 세션 시간을 더해 가거나(`S.life.ms+=` 화면을 숨길 때), 표시를 "N일"로 바꾼다.

---

## 확인했지만 문제 없는 곳

- **불러오는 순서**: `var SLOT` 선언·`nq.slot` 읽기(3499행)가 `S=load(); applyLifeTiers();`(10179행)보다 먼저다. `fresh()`가 `SLOT`을 부르는 때에 값이 있다. 그 사이 맨 위 코드가 `S`를 쓰는 곳은 없다. 처음 켠 흐름(360×640, 390×844, 저장 없이 메뉴부터)에서 오류 0건, `SLOT:'life'`.
- **`lifeBeforeCh` 재진입**: `yrs[id]=1`을 먼저 적고 컷신이 끝나면 `mqStart(id)`를 다시 부르며, 그때는 `false`로 지나간다. `playMQ.finish`가 `MQP=null`을 한 뒤 500ms+300ms 뒤에 부르므로 `if(MQP) return`에 걸리지 않는다. 프로브: 1장은 세월 → "첫 취업"(24살), 2장은 세월 → `mqLeaseStart` → "첫 전세 계약"(26살). 다만 세월 컷신 도중 앱이 닫히면 `yrs`가 이미 1이라 그 장의 세월 컷신은 다시 안 나온다(나이는 맞게 남는다). 낮은 위험.
- **`mqSaidKey`**: 인생 모드는 "장마다 한 번"이고 `M.ann[c.id]`가 같은 날 되풀이를 막는다. `switchSlot` 뒤에도 키 모양이 달라(`'Ljob'` 대 날짜) 꼬이지 않는다.
- **`dripEnsure` 인생 분기 성능**: 퀘스트 47개에서 `openLeft()+dripLocked()` 20번이 `dripEnsure` 1120번을 부르고 6ms(일반 모드 4ms). 매번 `QUESTS.filter`를 돌아 O(N²)이지만 지금 규모에서는 문제 아니다. 퀘스트가 수백 개로 늘면 `openLeft` 안에서 한 번만 부르도록 바꾼다.
- **`tierGrow`와 `tierCost`·`paidBase`**: 본가(0칸)에서 고시원(4칸) 보증금은 `TIER_DEP[4]-TIER_DEP[0]`=140, 기숙사(3칸)는 50으로 계산 자체는 맞다. 문제는 위 4번(건너뛴 칸이 열린 것으로 보이는 것)이다.
- **앨범 순서**: `lifeEnd`가 컷신 전에 `albumAdd`를 하고 `over`로 막아서, 컷신 중에 닫혀도 두 번 들어가지 않는다. `lifeNew(skipAlbum)`도 끝난 인생을 "멈춘 인생"으로 다시 넣지 않는다.

---

## 바로 고칠 것 (우선순위 순)

1. **브릿지에 인생 저장 백업 추가**: `src/bridge/injected.mjs` `flushSave`에서 `nq.life.v1`·`nq.album.v1`·`nq.slot`을 `type:'saveAux'`로 보내고, `buildBeforeScript({aux})`로 빈 키만 되살린다. `mirror.ts`에 키 `nq.aux.mirror`, `GameShell.tsx`에 `case 'saveAux'`. (1번)
2. **건너뛴 거처 막기**: `lifeSkip(i)`를 만들어 `tierMove` 첫 줄에서 `{ok:0,skip:1}`, `renderBag` 집 탭에서 그 칸을 숨긴다. 대상은 인생 모드 0~3칸 중 본가 0칸·기숙사 3칸을 뺀 나머지. (4번)
3. **결산이 빠지지 않게**: `renderHome` 덧붙임에 `lifeOn()&&!S.life.over&&mqDone('home')`이면 1800ms 뒤 `lifeEnd()`. (2번)
4. **결산 카드 다시 띄우기**: `lifeAfter`에서 `S.life.cardSeen=1`, 홈에서 `over&&!cardSeen`이면 앨범의 같은 `seed` 요약으로 `lifeAfter`. (3번)
5. **2장 이사 길에도 세월 컷신**: `leaseShow`의 2장 앞 컷신 줄 위에 `if(...&&lifeBeforeCh('lease',leaseShow)) return;`. (5번)
6. **`hudName`을 읽기 전용으로**: `lifeTick()`을 `hudRefresh` 첫 줄로 옮기고, 나이·졸업 토스트는 `if(!MQP)`일 때만. (6번)
7. **다른 칸의 거처 이름**: `tierNameOf(st,i)`로 `menuItems`의 "이어하기 · 일반" 줄과 `lifeSummary.tier`를 고친다("본가 방"↔"노숙" 뒤섞임). (7번)
8. **`load()`에서 `S.life` 메우기**: `if(o.mode==='life') o.life=Object.assign(lifeFresh(),o.life||{});`. (8번)
9. **결산 카드 "N분"**: 벽시계 대신 쌓은 플레이 시간, 또는 "N일"로. (9번)
