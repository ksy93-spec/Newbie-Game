# 리뷰 1007: 최적화와 업데이트를 위한 전수 점검 (2026-10-07)

대표 요청: "에이전트 여섯 명 다 굴려서 게임 최적화랑 업데이트를 최대한 해 보자. 플레이 환경에서 뭐가 문제인지, UI는 인기 도트 게임과 비교해 뭐가 문제인지 아주 깊게 고민해서 개선하자."

## 게임

- "뉴비 퀘스트": 한국 20대(대학생, 취준생, 직장인)가 주거·식비·의복·금융·직장(주식의금직) 상식을 퀘스트로 배우는 도트 생활 RPG. 모바일 세로 화면.
- 파일 하나: prototype/newbie-quest-demo.html (약 12,000줄, 2.6MB, 그중 그림 데이터 약 1.5MB). 배포본은 docs/index.html, 앱은 Expo WebView로 감싼다(App.tsx, tools/native/).
- 화면: onboard(시작·신분 고르기), home(동네 지도, 상태창, 하단 탭), quests, quest, result, boss, bossend, ep(사건), epend, char(캐릭터·장비·주인공 8명), shop, wiki(백과), check, codex.
- 그림: 지도의 사람은 코드로 그린 도트(personTopCv), 캐릭터 화면은 30×64 겹 아바타, NPC·아이템·가구·배경·아이콘·주인공 초상은 ChatGPT 그림(ART, castCv). 글꼴은 Galmuri.
- 최근 기록: ops/HANDOFF.md, ops/ROADMAP.md, ops/meeting-1003/decisions.md(주인공 그림 결정). 대표가 싫어한 것: 고딕체, 일부러 화질 낮춘 도트, 지도 위 일러스트 주인공.

## 실행 방법

- 브라우저: Playwright가 설치돼 있다. 스크립트는 반드시 ops/review-1007/tools/ 안에 .mjs로 두고 저장소 루트에서 `node ops/review-1007/tools/x.mjs`로 실행한다(저장소 node_modules에서 playwright를 찾는다). 맨 위에 `process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';`. 기기는 360×640, 390×844, 412×915(deviceScaleFactor 2~3)를 쓴다.
- 게임 열기: `prototype/newbie-quest-demo.html`을 file:// 로 연다. `#nointro`를 붙이면 오프닝을 건너뛴다. 전역 S(저장 상태), fresh(), save(), render('home') 등을 page.evaluate로 쓸 수 있다. 테스트 tests/*.test.mjs에 상태를 만드는 예시가 많다(sprintF.test.mjs가 최신).
- 스크린샷과 그림은 ops/review-1007/img/<역할>-*.png 로 저장한다.

## 규칙

- prototype/, tests/, docs/, assets/, tools/는 고치지 않는다. git commit도 하지 않는다(정리는 대표 비서가 한다). 만드는 파일은 ops/review-1007/ 안에만.
- 결과 문서는 ops/review-1007/<역할>.md, 한국어, 평이한 문장(굵은 글씨·이모지·과장 없이).
- 각 문제마다: 무엇이 문제인지, 근거(스크린샷 파일·측정값·코드 위치 줄 번호), 어떻게 고칠지(가능하면 바꿀 함수와 구체 수치), 크기(작음/중간/큼), 우선순위(P0 깨짐·막힘, P1 이탈·불편, P2 다듬기).
- 맨 끝에 "먼저 고칠 10개"를 순서대로 적는다. 추측과 확인한 것을 구분한다.
