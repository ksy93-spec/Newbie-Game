# 인수인계 (2026-09-30, CTO)

다음 세션이 이 파일부터 읽으면 된다.

## 지금 상태

- main `5e4ff59`까지 로컬에 커밋되어 있다. GitHub에는 `ae95edb`(스프린트 A·B)까지만 올라가 있다.
- 스프린트 C 번들은 `nq-sprintc.bundle`로 만들어 두었다. PC가 오프라인이라 아직 옮기지 못했다.
- 게임 데모 아티팩트는 v41에 스프린트 C까지 반영했다.
- 안드로이드 테스트 APK는 GitHub Actions와 EAS로 빌드된다. 태그 `android-preview-N`을 올리면 돈다.
- 아이폰 빌드 설정과 TestFlight 워크플로는 넣어 두었지만, 애플 개발자 계정이 아직 없어 한 번도 돌려 보지 못했다.

## 푸시 방법 (샌드박스에는 GitHub 권한이 없다)

1. 번들을 `C:\Users\userpc\Newbie-Game\inbox\`에 넣는다(device_commit_files).
2. Git CMD에서 `cd /d C:\Users\userpc\Documents\GitHub\Newbie-Game && git -c gc.auto=0 pull --ff-only <번들> main && git push origin main`을 실행한다.
3. `.github/workflows` 파일이 바뀐 커밋은 Git CMD 토큰에 workflow 권한이 없어 푸시가 거절된다. 이 경우만 GitHub Desktop으로 푸시한다.

## 끝난 스프린트

- A·B: 실제 경제로 시작, 콘텐츠 정정, 딥링크, 퀘스트 개방량 조절, 복습 퀴즈, 연속 출석, 광고 3곳, 보증금.
- C: 생활 이벤트 37개, 첫 3분 안내와 첫 이사, 시즌 칩, 공유 링크, 보스·고속도로 QA, 첫 월급 계산기.
- 테스트는 84개다. `sprintC3`의 "이사 정리 도중 새로고침" 테스트가 가끔 타이밍 때문에 실패한다(단독 실행하면 통과).

## 남은 일

- 사람 확인 필요
  - C1 생활 이벤트: 정부 1차 자료가 프록시에 막혀 2차 자료로만 확인했다(c1-sources.md "확인" 칸).
  - C4 소득세: 간이세액표 추정이다. 9건 중 2건이 오차 1%를 넘었으니, 출시 전에 홈택스 값으로 대조한다(c4-salary.md).
- 기획 결정 필요: 보스전에서 지면 거처가 내려가는데, 다음 퀘스트나 다음 날 스탯만으로 바로 다시 올라가서 패배 페널티가 사실상 없다.
- 대표가 할 일: 애플 개발자 가입, Play 개발자 계정, AdMob 계정, 테스터 모집(ROADMAP 참고).
- 다음 후보
  - 성향 카드
  - flaky 테스트 안정화
  - 아이콘 정식 도안
  - 실제 기기 테스트(저장 유지, 광고, 동의창)
