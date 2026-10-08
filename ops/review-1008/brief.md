# 리뷰 1008: 편의성, 스탯 이해, 컷신 늘리기 (2026-10-08)

대표 요청: "다시 한번 에이전트들과 개선해 보자. 유저 편의성을 높여 주고, 의식주직 같은 스탯은 처음 본 사람이 이해하기 힘들다. 레벨이 오르면 스탯을 찍는 게 나으려나. 그리고 중간중간 메인 챕터처럼 영상(컷신) 있는 게 좋았으니 그것도 더 고려해 봐."

## 지금 구조 (코드에서 확인할 것)

- 스탯 다섯: S.stats.ju/sik/ui/geum/jik. THEMES에 k(주·식·의·금·직), full(집·밥·옷·돈·일), role(방어력 등)이 있다. 퀘스트를 풀면 그 주제 스탯이 오른다(q.stat). 주(집) 스탯이 거처(TIERS.need)를 연다. 보스는 b.stat이 b.need 이상이어야 붙는다. 사건(ep)도 스탯을 준다. 리뷰 1007에서 화면 글자를 "주 스탯" → "집 스탯"으로만 바꿨다.
- 레벨: S.lv, S.xp. 레벨은 지도·기능 잠금에 쓰인다. 공격·방어(totals())는 장비·거처·세간에서 나온다.
- 컷신: 메인 퀘스트 6장(MQ_LIST, playMQ, 장면 배열과 fx), 프롤로그·엔딩(playCinema), 운전 로딩(driveLoading). 장면은 배경 그림(bg_ 그림 15장, castCv) + 도트 인물(sceneP/scenePortrait) + 대사.
- 지난 리뷰 결과와 남은 일: ops/review-1007/summary.md, 각 역할 문서 ops/review-1007/*.md.

## 실행 방법과 규칙 (지난번과 같다)

- 스크립트는 ops/review-1008/tools/*.mjs, 저장소 루트에서 node로 실행. 맨 위에 `process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';`. 게임은 prototype/newbie-quest-demo.html#nointro를 file://로 연다. 상태 만들기 예시는 tests/sprintG.test.mjs, tests/sprintF.test.mjs.
- prototype/, tests/, docs/, assets/, tools/는 고치지 않는다. 커밋하지 않는다. 결과는 ops/review-1008/<역할>.md(한국어, 평이한 문장, 굵은 글씨·이모지 없이), 그림은 ops/review-1008/img/<역할>-*.png.
- 사용량 한도가 있으니 도구 호출은 40번 안쪽으로, 문서는 핵심 위주로. 확인한 것과 추측을 나눠 적는다.
- 문서 끝에 "대표에게 권하는 안 하나"와 "바로 고칠 것 5개(구체적 함수·문구·수치)"를 적는다.
