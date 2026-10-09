# 리뷰 1009: 인생 모드 전방위 개선 (2026-10-09)

대표 요청: "에이전트들 켜서 또 전방위 개선시켜라." 직전에 대표가 직접 해 보고 찾은 것: 처음 켜면 다음 버튼이 안 눌림(고침), 카드 골라 놓고 일러스트 8개에서 또 고르기(고침), 본가인데 노숙에서 시작(고침). 대표는 직접 해 보고 "모순이 많다"고 느꼈다. 이번 리뷰의 목표는 대표가 다시 해 볼 때 어색한 곳이 없게 하는 것.

## 지금 인생 모드
- 기획: ops/life-1009/design.md, 대본: ops/life-1009/story.md·life-scenes.js, 지난 QA: ops/life-1009/qa.md(18건, 높음·중간 대부분 고침, 커밋 1dde2fd).
- 코드(prototype/newbie-quest-demo.html): "인생 모드" 블록(lifeGen, lifeFx, birthRoll, birthApply, birthRender, applyLifeTiers, lifeTick, lifeBeforeCh, lifeEnd, lifeNew, switchSlot), 시작 메뉴 menuItems/pick, 온보딩 obSteps/obRender, LIFE_YEARS·LIFE_END·LIFE_TITLES.
- 흐름: 시작 메뉴 인생 모드 → 태어남 카드(삼세판) → 이 인생으로 살기 → 태어남 컷신 → 홈(20살) → 퀘스트 세 개마다 한 살 → 메인 장마다 세월 컷신과 그 장의 나이 → 6장 뒤 예순 엔딩·결산 카드 → 앨범·다시 태어나기. 저장 칸 nq.life.v1(일반 nq.v8과 따로).
- 일반 모드는 그대로 남아 있다. 바꾸면 안 된다(tests/*.test.mjs가 지킨다).

## 실행·규칙
- 스크립트는 ops/review-1009/tools/*.mjs, 저장소 루트에서 node로. 맨 위 `process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';`. 인생 모드 시작 예시: tests/sprintH.test.mjs.
- 처음 켠 사람 흐름은 반드시 저장 없이(#nointro 없이) 오프닝 메뉴부터 실제로 눌러 본다. 360×640, 390×844.
- prototype/, tests/, docs/는 고치지 않는다. 커밋하지 않는다. 결과 ops/review-1009/<역할>.md(한국어, 평이한 문장), 그림 ops/review-1009/img/<역할>-*.png.
- 도구 호출 40번 안쪽. 문서 끝에 "바로 고칠 것"을 우선순위 순으로, 각각 함수·문구·수치까지.
