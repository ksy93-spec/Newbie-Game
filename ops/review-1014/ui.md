# UI 겹침 점검 (뉴비 퀘스트, 2026-10-15)

대상은 `prototype/newbie-quest-demo.html`이다. 세이브 없이 시작해 오프닝 메뉴, 인생 모드 출생 카드, 출생 컷신, 첫 홈, 동네 지도와 십자키, 미니맵, 안내 칩, 퀘스트 화면, 결과 화면, 가방과 캐릭터 탭, 상점, 백과, 팝업, 토스트, 튜토리얼 말풍선, 컷신 선택지와 서류 상자, 예순 결산 카드를 360×640, 390×844, 375×667, 412×915에서 쟀다.

방법은 세 가지다. DOM 요소는 getBoundingClientRect로 겹침, 화면 밖, 글자 넘침(scrollWidth), 40px 미만 터치 칸을 계산했다. 캔버스에 그려진 간판, 창구, 문, NPC는 `MAPS[맵].signs/spots/warps`와 `camOf()`로 화면 좌표를 구해 DOM 칩과 교차시켰다. 컷신은 `playMQ`의 wrap, drawBox, drawChoices, drawDoc과 같은 식을 대본 전체(2196장면, 99개 출처)에 돌렸다. 숫자로 잡은 것은 모두 스크린샷으로 눈으로 확인했다.

스크립트는 `ops/review-1014/tools/ui-*.mjs`(공용 `ui-lib.mjs`)이고 저장소 루트에서 `node ops/review-1014/tools/ui-5-maps.mjs 360` 식으로 돌린다. 스크린샷은 `ops/review-1014/img/ui-*.png`다. 원자료 JSON은 `ops/review-1014/tmp/ui-*.json`이다.

## 결론

겹치거나 잘린 곳을 18건 찾았다(상 3, 중 10, 하 5). 알려진 두 건 중 십자키가 안내판을 덮는 것은 확인했고(U1), 안내 칩이 미니맵 "위에 올라탄" 것은 이 빌드에서는 상자가 실제로 겹치지는 않고 2px만 띄운 채 맞닿아 있다(U4). 그보다 더 큰 문제는 메인 칩(`#hmq`)이 지도 왼쪽 위를 모든 맵, 모든 크기에서 덮는 것(U2)과, 안내 칩과 십자키가 건물 안 출구 문을 덮는 것(U3)이다.

## 겹침 및 잘림 표

정도는 상(게임을 진행하는 데 필요한 것이 가려짐), 중(읽거나 누르기 불편), 하(미관, 드묾)다.

| # | 화면 | 크기 | 요소 | 정도 | 스크린샷 |
|---|---|---|---|---|---|
| U1 | 홈, 동네 첫 화면 | 360×640 (375×667도) | 십자키(`#hdpad`)가 캔버스 안내판 "← 고속도로 입구"를 48% 덮음(375×667은 70%). 390×844에서는 같은 자리의 `rest` 문 83%. 첫 화면에서 십자키·미니맵 밑에 깔리는 것이 360에서 8개, 375에서 15개(시장 "장 보는 대학생" 100%, 전주 "기념품 좌판" 85%, 전국 지도 전주 문 100%와 경주 간판 100%) | 상 | ui-s3-home-360.png, ui-s5-market-360.png, ui-s5-korea-360.png |
| U2 | 홈, 모든 맵 | 전 크기 | 메인 칩(`#hmq` "다음 메인 1장…", 8,163~130,203)이 동네의 "우리 집" 간판을 92~100%, 내 집 문을 26% 덮음. 건물 안은 좌상단 줄의 사람과 창구를 45~87% 덮음(ATM, 번호표 기계, 카페 알바 창구, 바리스타, 칼국숫집 사장, 휴게소 식당). 바로 옆에 서도 안 보인다(360에서 20건, 375에서 24건) | 상 | ui-s4-done1-360.png, ui-s5-bank_branch-360.png, ui-s5-gangneung-360.png |
| U3 | 홈, 작은 건물 안 | 375×667 (360×640은 2곳) | 안내 칩(`#hguide`)이 아래 가운데 출구 문(→town 등)을 82% 덮고, 문 바로 옆에 서도 칩 50% + 십자키 28%가 가림(편의점, 주민센터, 카페, 건보공단, 은행 지점, 신축 빌라, 칼국숫집 7곳). 칩 때문에 캔버스가 그린 "문 쪽 화살표"가 칩 밑에 숨는다. 390×844는 캠퍼스 "게임 동아리 부장" 100%를 칩이 덮음 | 상 | ui-s5-town_mart-375.png, ui-s5-bank_branch-375.png |
| U4 | 홈 | 전 크기 | 안내 칩 오른쪽(274)과 미니맵 왼쪽(276) 사이가 2px. 상자는 안 겹치지만 칩 아래 그림자(0 4px 0)와 둥근 모서리가 붙어서 "올라탄 것"처럼 보임. 390에서는 칩이 172px, 412에서는 194px로 길어지고 간격은 그대로 2px | 중 | ui-s4-done1-360.png |
| U5 | 홈, 토스트 | 전 크기 | `toast()`가 지도 맨 아래(스테이지 바닥 + 8px)에 띄워 안내 칩 글자 138×58을 덮고 십자키 ▶ 끝도 건드림. "출석 1일째" 같은 토스트가 켜질 때마다 일어남 | 중 | ui-s7-toast-home-360.png, ui-s5-bank_branch-360.png |
| U6 | 홈, 체크 칩 | 360×640 | `#hchk`(right:60px, max-width:60%)가 긴 문구에서 존 태그(8~108)와 5px 겹침. 전국 지도는 존 태그가 216px까지 자라서 71px 겹침 | 중 | ui-s12-chk-360.png |
| U7 | 홈, 근처 줄 | 전 크기 | `#hnear`(left:0, right:0, top:0)가 ☰(`#hmenu`)와 44×15 겹침. 강릉, 대구 첫 화면에서 줄 끝 "포만감 15"가 ☰ 밑에 깔림 | 중 | ui-s5-gangneung-360.png |
| U8 | 홈, 작은 터치 칸 | 전 크기 | 십자키 버튼 4개가 30×30(틀은 120×120인데 격자 칸이 30px이라 아래 26px는 빈 채 탭만 먹음). 건물 안 미니맵 버튼 37~52×31~37. 튜토리얼 퀴즈 보기 높이가 360에서 26px, 390에서 34px | 중 | ui-s3-home-360.png, ui-s7-tutor-choice-390.png |
| U9 | 홈, 튜토리얼 말풍선(`#htutor`) | 전 크기 | 높이 700 미만(360×640, 375×667)은 위쪽에 떠서 존 태그, ☰, 메인 칩, 내 집 간판과 문 느낌표를 덮는데, 정작 첫 대사가 "건물마다 간판… 문 위에 느낌표"를 설명한다. 높이 700 이상(390×844, 412×915)은 아래쪽에 떠서 십자키와 미니맵(118×116, 76×70)을 통째로 덮는다. 'travel', 'lv2' 대사는 `hl:'#hmini'`로 미니맵을 가리키는데 말풍선이 그 미니맵을 덮는다 | 중 | ui-s14-firsthome-360.png, ui-s15-travel-tutor-390.png |
| U10 | 컷신 선택지 | 360×640, 375×667, 390×844, 412×915 | 선택지 맨 아래 상자가 말한 이 이름표를 5px 덮어 글자 아랫부분이 잘림. 선택지가 있고 who가 있는 57장면(177건, 3개 높이 합). 예: job 4·5·13, card 5, car 3·5·9·13, wedding 4·7·10·14, home 3·5·7·11, mid 중 jobhop, kidedu, refi, renew, pension, rent 1·2·4 | 중 | ui-s9-cine-choice-360.png, ui-s9-cine-choicemax-360.png |
| U11 | 캐릭터 탭 장비 칸(`.dslot`) | 전 크기 | 아이템 이름(`.dn`)이 11px 중 5px만 남아 윗반만 보임(네이비 재킷, 베이지 슬랙스, 3색 볼펜). 칸 높이 84에서 캔버스 52px가 자리를 먹음 | 중 | ui-s7-tab-char-360.png |
| U12 | 백과 탭 "첫 월급 계산기" 카드(`.paytool`) | 전 크기 | 높이가 56px로 줄어 내용 68px 중 7px가 잘림. 설명 둘째 줄 "· 추정"이 카드 밖으로 잘림 | 중 | ui-s7-tab-wiki-360.png |
| U13 | 홈, 방, 가구 놓기 | 전 크기 | `#hplace`가 위 61px를 덮어 ☰를 가리고, 방 위쪽 두 줄(책상, 책장 자리)에 놓을 때 미리보기가 줄 밑에 깔림 | 중 | ui-s11-place-360.png |
| U14 | 오프닝 메뉴 | 360×640, 390×844 | 메뉴 맨 아래 "소리 켜짐" 버튼(`#opening .omenu`, bottom:14%)이 캔버스에 걷는 두 주인공을 덮음. 360에서는 몸통까지, 390에서는 머리를 덮음 | 하 | ui-s1-open-360.png, ui-s1-open-390.png |
| U15 | 컷신 선택지 × 인물 | 360×640, 375×667 | 캔버스 높이가 284라 선택지 셋이면 두 인물의 가슴 아래를 모두 덮음(머리만 보임) | 하 | ui-s9-cine-choicemax-360.png |
| U16 | 홈 아래 줄 | 전 크기 | "오늘 할 일" 버튼 글자가 4px 넘침(scrollWidth 86 / 82), `.sceneinfo`가 2px 넘침. 눈에 띄게 잘리지는 않음 | 하 | ui-s3-home-360.png |
| U17 | 컷신 제목 카드 | 전 크기 | `mid:phish` 부제 "30대 후반 · 기관은 돈을 옮기라고 하지 않는다"가 172px로 폭 160을 넘어 양끝이 잘림 | 하 | ui-13-titles 출력 |
| U18 | 팝업이 떠 있을 때 토스트 | 전 크기 | `toast()`가 팝업이 열리면 화면 맨 위에 띄워 HUD 이름, 상태를 덮음("졸업했어요 · 이제 취준생"이 레벨 글자 위) | 하 | ui-s10-settle-360.png |

참고. 출생 카드(`#onboard`) 맨 위 상태에서는 아래 고정된 "이 인생으로 살기"(sticky)가 카드 한 줄을 덮지만 스크롤하면 풀리고 "다시 태어나기"는 맨 아래에서 가려지지 않는다(ui-s10-birth-bottom-360.png). 의도된 고정 버튼이라 표에는 넣지 않았다.

문제 없음으로 확인한 것은 퀘스트 화면(도입, 문제, 해설), 결과 화면, 상점 탭, 수집 노트 탭, 거처 팝업(houseTip), 오늘 할 일 시트, 예순 결산 카드(4개 크기에서 버튼 포함 화면 안), 이동 목록(`#htravel`, 닫기 단추는 스크롤 맨 아래), 컷신 서류 상자와 선택지의 겹침(서류-선택지, 서류-대화 상자, 선택지의 SKIP 단추 칸, 4줄 넘는 서류 줄 모두 0건)이다.

## 고칠 방법

### U1 십자키가 안내판을 덮음

원인은 세계에 박힌 안내판이 첫 화면 왼쪽 아래 십자키 자리에 놓이는 것이다. 스테이지가 360에서 408px뿐이라 십자키 120px가 3.7줄을 먹는다. 가장 값싼 고침은 `drawHighwaySigns(ctx,m)`에서 왼쪽 안내판을 두 줄 올리는 것이다.

```js
var sx=left?w.x*TS+2:(w.x+1)*TS-tw-2, sy=(w.y-6)*TS+2;      // -4 → -6
rcx(ctx,'#3F3A55',left?sx+4:sx+tw-6,sy+12,2,4*TS+6);          // 기둥을 두 줄 늘림
```

더 근본은 십자키를 작게 하는 것이다(U8의 40px 칸이면 틀이 같은 120이라 점유는 그대로이므로, 틀을 108로 줄이려면 칸을 36px로 하거나 `.dpad button{background:rgba(14,16,34,.45)}`로 투명도를 올려 밑이 읽히게 한다). U15 등 첫 화면 십자키 밑 NPC(`market`의 "장 보는 대학생", `jeonju`의 "기념품 좌판")는 맵 데이터에서 스폰 기준 왼쪽 아래 3×3칸을 비우거나, 스폰 `spawn`을 한두 줄 위로 옮기는 것으로 해결한다.

### U2 메인 칩이 지도 왼쪽 위를 덮음

`#hmq`는 `top:34px; left:8px`에 두 줄(118×40)이라 존 태그 밑 지도를 늘 덮는다. 한 줄로 줄이고, 존 태그와 같은 줄의 빈 칸(108~308)으로 올린다.

```css
.mqchip{top:8px;left:116px;right:60px;min-height:26px;padding:4px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mqchip span{display:none}                 /* 둘째 줄은 눌렀을 때 토스트나 시트로 */
.chkchip{top:40px;right:8px}               /* 체크 칩과 같은 칸을 쓰지 않게 아래로 */
```

`mqChip()`의 `tap`은 이미 토스트를 띄우므로 둘째 줄("퀘스트 2개 더", "내일 열려요")은 `title` 속성이나 토스트에 넣으면 된다. 대안은 `#hmq`를 지도 밖 `.sceneinfo` 줄로 옮기는 것이다.

### U3 안내 칩이 출구를 덮음

건물 안에서는 캔버스가 이미 문과 창구에 맥박 테두리와 화살표를 그린다(`guideDraw`). 칩은 중복이므로 건물 안에서는 숨기거나 작게 한다.

```js
// guideSync() 안, var t=... 바로 다음 줄. 건물 안에서는 칩을 숨긴다(캔버스 화살표가 대신 안내)
if(t&&curMap().interior) t=null;
```

숨기기 싫으면 한 줄짜리로 만들고(`.guidechip{min-height:32px;padding:4px 8px}`, `b`와 본문을 한 줄로) 위치를 `bottom:10px`에서 `top:44px`(존 태그 밑, U2의 메인 칩을 한 줄로 만든 뒤 칸이 남음)로 올린다. 어느 쪽이든 "아래 가운데는 문 자리"로 비워 두는 것이 핵심이다.

### U4 안내 칩과 미니맵이 맞닿음

미니맵 폭은 맵마다 다르다(37~76px). 칩 오른쪽을 미니맵 폭에 맞춰 8px 이상 띄운다.

```css
.guidechip{right:94px}      /* 76 + 8 + 10 */
```

```js
// drawMini() 안 캔버스 크기를 정한 뒤
var gc=document.getElementById('hguide'),mm=document.getElementById('hmini');
if(gc&&mm) gc.style.right=(mm.offsetWidth+8+10)+'px';
```

### U5 토스트가 안내 칩과 십자키를 덮음

`toast()`의 홈 분기에서 안내 칩이 떠 있으면 그 위로 올린다.

```js
var g=document.getElementById('hguide');
if(g&&!g.hidden&&d>0&&d<400) d+=g.offsetHeight+14;   // 안내 칩 위로
el.style.bottom=Math.round(d)+'px';
el.style.maxWidth='calc(100% - 24px)';
```

십자키를 피하려면 `left:50%`에 `margin-left:20px`로 살짝 오른쪽으로 민다.

### U6 체크 칩과 존 태그

```css
.chkchip{left:116px;right:60px;max-width:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zonetag{max-width:calc(100% - 128px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
```

### U7 근처 줄과 ☰

```css
.nearbar{padding-right:60px}      /* ☰ 44 + 8 + 여유 */
```

### U8 작은 터치 칸

십자키 격자 칸을 틀(120)에 맞춰 40px로 한다. 화면을 더 먹지 않는다.

```css
.dpad{grid-template-columns:repeat(3,40px);grid-template-rows:repeat(3,40px);gap:0}
.dpad button{min-width:40px;min-height:40px}
.minimap{min-width:44px;min-height:44px}                 /* 건물 안 미니맵 */
.tutor .topt{min-height:40px}                            /* 360에서는 padding:4px 8px → 10px 12px */
```

### U9 튜토리얼 말풍선

말풍선이 가리키는 대상과 겹치지 않는 쪽에 띄운다. `showTutor()`에서 `TUT.hl`을 보고 위치 클래스를 정한다.

```js
// showTutor() 안, el.hidden=false 뒤
var low=!(TUT.hl&&/hmini|hdpad/.test(TUT.hl));          // 미니맵·십자키를 가리키면 위로, 그 밖에는 아래
el.classList.toggle('up',!low);
```

```css
.tutor.up{top:44px;bottom:auto}                          /* 존 태그 줄 밑 */
@media(max-height:700px){ .tutor:not(.up){top:calc(50% - 40px);bottom:auto} }   /* 낮은 화면은 가운데 띠에 */
```

인트로("간판… 느낌표")는 말풍선이 간판을 덮지 않도록 낮은 화면에서도 가운데 띠에 둔다.

### U10 선택지가 이름표를 덮음

`playMQ` 안 `drawChoices(p,top)`에서 이름표 높이만큼 더 띄운다.

```js
var opts=p.choice.opts,rects=[],y=top-(p.who?16:6);       // 이름표가 있으면 16px
```

### U11 장비 칸 이름 잘림

```css
.dslot canvas{width:40px!important;height:40px!important}   /* JS가 52px를 박아서 규칙이 안 먹음 */
.dslot{padding:16px 2px 4px}
```

### U12 계산기 카드 잘림

`.scroll`이 flex 열이라 버튼이 `min-height:56px`로 줄어든다. 줄어들지 않게 한다.

```css
.scroll>*{flex-shrink:0}
.paytool{height:auto}
```

### U13 가구 놓기 줄

줄을 한 줄로 줄이고(라벨과 버튼 한 줄), 카메라를 줄 높이만큼 내려 방 위쪽도 보이게 한다.

```css
.placebar{flex-wrap:nowrap;padding:4px 8px;top:auto;bottom:0}      /* 하단, 십자키 오른쪽 */
.placebar .pl{flex:1 1 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
```

또는 `camOf(m)`에서 `if(PLACE) cy-=Math.round(barH/z)`로 줄 높이만큼 위를 비운다.

### U14 오프닝 메뉴가 주인공을 덮음

주인공이 서는 길(캔버스 높이의 약 0.78)보다 위에 메뉴가 오게 한다.

```js
// 오프닝 fit() 뒤
var om=wrap.querySelector('.omenu'); if(om){ var r=cv.getBoundingClientRect(); om.style.bottom=Math.round(innerHeight-(r.top+r.height*0.76))+'px'; }
```

CSS만으로는 `#opening .omenu{bottom:calc(max(22%,150px) + env(safe-area-inset-bottom))}`이다.

### U15 선택지와 인물

선택지가 뜰 때는 인물을 선택지 위로 올리거나 작게 그린다. `drawCast`의 기준 `gy`에서 선택지 합계 높이만큼 뺀다(`gy-Math.min(st.opts.length?50:0,...)`). 우선순위는 낮다.

### U16 오늘 할 일 버튼

```css
.todaybtn{white-space:nowrap;padding:6px 12px}
.sceneinfo{min-height:46px}
```

### U17 컷신 부제

`drawTitle`에서 부제가 폭을 넘으면 `sub`를 줄여 그린다(`ctext` 앞에서 `while(ctx.measureText(sub).width>W-8) sub=sub.slice(0,-1)`). 또는 `LIFE_MID.phish.sub`를 한 줄 길이(15자 안팎)로 줄인다.

### U18 팝업 위 토스트

팝업이 열려 있을 때 토스트를 HUD 위가 아니라 팝업 위 가장자리(`top:calc(팝업 상단 - 토스트 높이)`)에 둔다. 간단히는 `toast()`에서 `el.style.top='calc(12px + env(safe-area-inset-top))'`를 팝업 상단이 HUD보다 아래일 때만 쓴다.

## 바로 고칠 것

우선순위 순서다. 1~4는 한두 줄 CSS나 JS라서 같은 날 끝낼 수 있다.

1. U2 메인 칩을 한 줄로 줄여 존 태그 줄로 올린다(`.mqchip`). 모든 맵의 좌상단 NPC, 창구, 간판, 내 집 문이 풀린다.
2. U3 건물 안에서는 안내 칩을 숨기거나 한 줄로 줄이고 아래 가운데를 비운다(`guideSync`). 출구 문이 칩에 가려지는 것이 가장 불친절하다.
3. U8 십자키 격자를 40px로(`.dpad`). 화면을 더 먹지 않고 터치 칸이 풀린다. U1의 안내판은 `drawHighwaySigns`의 `sy`를 두 줄 올린다.
4. U10 `drawChoices`의 `y=top-6`을 이름표가 있을 때 `top-16`으로. 57장면이 한 번에 고쳐진다.
5. U11 `.dslot canvas`를 40px로, U12 `.scroll>*{flex-shrink:0}`. 둘 다 잘린 글자를 바로 살린다.
6. U9 튜토리얼 말풍선이 가리키는 대상(`hl`)을 덮지 않도록 위치를 `hl`에 따라 바꾼다(`showTutor`). 첫 인상과 이동 안내에 걸린다.
7. U5 토스트를 안내 칩 위로(`toast`), U4 안내 칩 `right`를 미니맵 폭에 연동(`drawMini`), U7 `.nearbar{padding-right:60px}`.
8. U13 가구 놓기 줄을 한 줄로, U6 체크 칩 `left`, U14 오프닝 메뉴 위치.
9. U15~U18은 여유가 날 때.
