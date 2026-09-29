# 뉴비 퀘스트 안드로이드 출시 계획 (제품개발 리드)

작성 2026-09-29. 전제: 안드로이드 먼저, 보상형 광고 위주(AdMob), 전면 광고 최소(v1.0은 0개), 무료.
근거: 저장소 직접 확인 + 웹 확인 6회. "확인"은 이번에 공식 페이지를 읽은 것, "미확인"은 지식 기반이라 Play Console에서 재확인할 것.

## 저장소에서 확인한 사실

- 최신 게임은 `prototype/newbie-quest-demo.html` 한 파일(약 750KB). 스프라이트가 base64로 들어 있어 **외부 자원 없이 오프라인 실행**된다.
- 저장은 `localStorage['nq.v8']`. 광고 진입점은 `showAd(cb)` 1개(`a.ad` 플래그 4곳)라 브릿지 지점이 좁다.
- 분석 훅 `window.__sink(name, props)`, 콘텐츠 갱신 훅 `PACK_URL`(현재 null)이 이미 있다.
- 웹 전용 API 사용: `Notification`(알림), `navigator.share/clipboard`(카드 공유), `<input type=file>`(사진, 993행), `target="_blank"` 외부 링크(정부 사이트). 안드로이드 웹뷰에서 일부는 동작하지 않을 수 있어 **네이티브 갭**으로 따로 처리한다.
- Expo 쪽은 예전 버전: Skia, 이미지 피커, 알림, expo-updates(projectId 비어 있음)가 남아 있고 어댑티브 아이콘 전경 이미지·스플래시 이미지가 없다.

## 1. 출시 방식 비교

| 기준 | (a) Expo + WebView + 네이티브 AdMob | (b) Capacitor로 감싸기 | (c) Expo 네이티브 재작성 |
|---|---|---|---|
| 개발 기간(에이전트 기준) | 약 40시간, 2주 이내 | 약 40시간 | 수개월. 750KB 캔버스 게임 전체를 다시 작성 |
| 광고 연동 | react-native-google-mobile-ads(Invertase). Expo 설정 플러그인·UMP 지원. 개발 빌드 필요(Expo Go 불가) | @capacitor-community/admob 커뮤니티 플러그인. 보상형·UMP 지원, 버전 추종 지연 위험 | 같은 라이브러리, 게임 로직 이식 필요 |
| 스토어 심사 위험 | 낮음(앱 내장 콘텐츠 + 네이티브 광고·뒤로가기·링크 처리) | 낮음. 같은 웹뷰 | 가장 낮음 |
| 오프라인 | 내장 HTML이라 완전 오프라인 | 완전 오프라인 | 완전 오프라인 |
| 저장 이전 | origin 주의. 첫날 검증 필요, 네이티브 미러 백업으로 보강 | `https://localhost` 고정 origin이라 가장 안정 | 저장 형식 변환 필요 |
| 빌드 | EAS 클라우드로 AAB. 기존 `eas.json` 재사용 | Android Studio·Gradle을 로컬에 설치해야 함 | EAS |
| 최신 기능 유지 | HTML 수정이 곧 앱 수정. `tools/pages/build.mjs`와 소스 하나 공유 | 동일 | 웹과 소스 이원화 |

**결론: (a) 채택.** 이유는 세 가지다. 광고 라이브러리가 가장 성숙하고, 클라우드 빌드라 로컬 Android 환경이 필요 없고, 이후 알림·공유를 TypeScript로 네이티브 브릿지에 붙이기 쉽다. **전환 조건: 2일차 저장 유지 검증에서 앱 강제종료 후 저장이 사라지면 (b)로 전환한다.** (c)는 채택하지 않는다.

**웹뷰 앱 거절 사유와 대응.** Google Play의 최소 기능·스팸 정책은 웹사이트를 그대로 포장한 앱, 내용이 빈약하거나 오류가 잦은 앱, 자기 소유가 아닌 사이트를 감싼 앱을 문제 삼는다. 광고에서는 사용자가 의도하지 않은 노출과 오클릭 유도가 위반이다.

| 위험(정책 내용은 지식 기반, 미확인) | 대응 |
|---|---|
| 웹사이트 포장으로 오인 | 게임을 앱에 내장하고 원격 URL을 열지 않는다. 광고·뒤로가기·공유·외부 링크는 네이티브 처리 |
| 광고 정책 | 보상형은 "광고 보고 받기" 버튼을 누를 때만 노출. 게임 진행 중 자동 노출 없음. 현재의 "광고 자리" 가짜 화면은 제거 |
| 외부 링크 실패 | `onShouldStartLoadWithRequest`로 가로채 Custom Tabs로 연다 |
| 엣지 투 엣지 | API 36에서는 화면 끝까지 그려진다. 안전 영역 값을 네이티브에서 CSS 변수로 주입 |

## 2. 작업 목록(순서, 에이전트 시간)

| # | 작업 | 시간 | 완료 기준 |
|---|---|---|---|
| 0 | 스파이크: 최소 WebView 셸, localStorage 유지 검증(`html`+`baseUrl` 방식 대 `file://` 에셋 방식), 라이브러리 호환(`expo-doctor`) | 4h | 강제종료·재부팅 후 저장 유지. 실패 시 (b) |
| 1 | 셸 정리: Skia·이미지 피커·알림 등 미사용 의존성 제거, 안드로이드 전용, 예전 `App.tsx`는 태그 보존 | 3h | 빈 셸 빌드 통과 |
| 2 | 웹뷰 로딩: `tools/native/build.mjs`가 HTML을 에셋으로 복사(서비스 워커·매니페스트 제외), 안전 영역 주입 | 3h | 비행기 모드에서 실행 |
| 3 | 저장 유지 보강: `save()`마다 postMessage로 AsyncStorage 미러, 시작 시 비어 있으면 복원 | 4h | 웹뷰 데이터 삭제 후 복원 |
| 4 | 뒤로가기: HTML에 `nqBack()`(모달·화면 닫기, 처리 시 true), 네이티브 `BackHandler`가 호출, 미처리면 "한 번 더 누르면 종료" | 3h | 모든 화면에서 종료되지 않음 |
| 5 | 네이티브 갭: 외부 링크 Custom Tabs, 알림 토글 v1.0에서 숨김, 공유·클립보드 검증(안 되면 expo-sharing 브릿지), 사진 입력 검증 | 5h | 4종 실기기 확인 |
| 6 | 광고 브릿지(아래 상세) | 6h | 테스트 광고로 보상 지급 |
| 7 | UMP 동의: 시작 시 `gatherConsent`, `canRequestAds`가 참일 때만 광고 초기화, 설정에 "광고 개인정보 옵션" 항목 | 3h | 디버그 지역 EEA로 동의창 확인 |
| 8 | 아이콘·스플래시: 어댑티브 전경 1024px(안전 영역 66%), 스플래시 이미지 | 2h | 사람이 시안 승인 |
| 9 | 버전: 앱 버전 1.0.0, `versionCode`는 EAS `autoIncrement`, 게임 `CONTENT.ver`는 별도 관리, expo-updates는 v1.0에서 끔 | 1h | 빌드마다 코드 증가 |
| 10 | EAS: `eas init`, 미리보기 APK, 프로덕션 AAB, 키는 EAS 관리 | 3h | AAB 생성 |
| 11 | 실기기 QA: 저사양·중간 기종 2대 이상 | 6h(사람 2h) | 체크리스트 통과 |
| 12 | 선택(v1.1): `__sink`를 Firebase Analytics로 연결(약 4h). 크래시·ANR은 Play Console vitals가 무료로 제공 | 0~4h | 데이터 보안 양식에 반영 |

**광고 브릿지 상세.** HTML은 `showAd(cb)`를 `postMessage({type:'ad_request',id})` 요청으로 바꾸고, 네이티브가 `{type:'ad_result',id,rewarded}`로 답한다. `cb()`는 `rewarded===true`일 때만 호출한다. 네이티브는 앱 시작과 광고 종료 직후에 다음 광고를 미리 받아 둔다. 로드 실패나 8초 초과 시 "지금은 광고가 없어요"를 띄우고 **보상도 쿨다운 소모도 없이** 취소한다. 개발 중에는 테스트 광고 ID만 쓰고 본인 광고는 누르지 않는다.

## 3. 구글 플레이 출시 체크리스트

| 항목 | 요구 | 상태·출처 |
|---|---|---|
| 개발자 계정 | 등록비 $25 1회, 본인 확인 | 미확인. 첫날 시작(승인에 며칠 소요 가능) |
| 신규 개인 계정 테스트 | 2023-11-13 이후 만든 개인 계정은 **테스터 12명 이상이 14일 연속 옵트인**한 비공개 테스트 후 프로덕션 신청, 심사 보통 7일 이내 | **확인** ([Play 도움말](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)). 그 이전에 만든 계정이면 면제 |
| 타깃 API | 2026-08-31부터 신규 앱·업데이트는 **Android 16(API 36) 이상**. 연장은 2026-11-01까지 | **확인** ([Play 도움말](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)). Expo SDK 57 기본값을 `expo-doctor`로 확인하고 미달 시 `expo-build-properties`로 36 지정 |
| 패키지 형식 | AAB(APK 불가) | 미확인, 통상 요건. EAS 프로덕션 프로필이 AAB 생성 |
| 데이터 보안 양식 | 광고 ID·진단 정보 등 수집 항목 선언. AdMob 공개 안내를 따른다 | 미확인. [AdMob 안내](https://developers.google.com/admob/android/privacy/play-data-disclosure)는 미열람 |
| 광고 ID 선언 | AdMob SDK가 `AD_ID` 권한을 추가하므로 "광고에 사용"으로 선언 | 미확인 |
| 개인정보처리방침 URL | 공개 URL 필수. `docs/privacy.html`을 GitHub Pages에 게시, 앱 설정에도 링크 | 미확인. 내용: 저장은 기기 내부, 계정 없음, AdMob·광고 ID, 문의처 |
| 콘텐츠 등급 | IARC 설문. 대상 연령은 성인 중심(만 18세 이상 사회초년생)으로 선택, 아동 대상 아님 | 미확인. 게임 카테고리 등록 시 한국 등급 표시 요건은 별도 확인 |
| 광고 포함 | "광고 포함" 체크 | 미확인 |
| 앱 액세스 | 로그인 없음이므로 "제한 없음" | 미확인 |
| 배포 국가 | 처음에는 한국만 선택하면 EU 사업자 정보 공개 이슈와 UMP 의무를 줄인다 | 미확인 |
| 스토어 자료 | 아이콘 512, 그래픽 1024x500, 폰 스크린샷 2장 이상, 한국어 설명 | 미확인. `docs/icon-512.png` 재사용 |
| 선택 | AdMob `app-ads.txt`를 개발자 웹사이트 도메인 루트에 게시 | 미확인 |

## 4. 6주 일정표

임계 경로는 **비공개 테스트 14일 + 프로덕션 신청 심사 최대 7일 + 최초 프로덕션 심사**다. 2주차 말까지 AAB를 올려야 6주차 출시가 가능하다.

| 주 | 사람(김성영) | 에이전트 |
|---|---|---|
| 1 | Play 계정 결제·본인 확인 시작, AdMob 가입(세금 정보), Expo 계정, **테스터 20명 모집 시작**(12명 확보용 여유) | 작업 0~3, 스파이크 결과 보고(2일차 게이트) |
| 2 | Play Console 앱 생성, 개인정보처리방침 URL 확인 | 작업 4~10, 방침 페이지, 스토어 문구·스크린샷. **주말 전 AAB를 비공개 테스트에 업로드** |
| 3 | 테스터 옵트인 확인(이탈자 보충), 피드백 수집 | 실기기 QA 결과 반영, 버그 수정 빌드(같은 트랙에 versionCode 올려 재업로드) |
| 4 | 테스트 14일째 유지 확인, 데이터 보안·콘텐츠 등급·광고 ID 양식 작성 | 양식 답안 초안, 실제 광고 단위 ID로 프로덕션 후보 빌드 |
| 5 | **프로덕션 액세스 신청**(설문 3부분), 그래픽 자료 승인 | 신청 답변 초안, 안정화. 심사 대기 |
| 6 | 프로덕션 출시(단계적 20%에서 100%), 광고 수익 확인 | vitals·ANR·광고 노출률 모니터링, 1.0.1 핫픽스 대기 |

**위험 관리.** 테스터가 중간에 빠지면 14일 조건이 깨지므로 20명을 모은다. 심사 지연이나 반려 시 출시는 7주차로 밀린다. 실제 광고 단위는 스토어 게시 전에는 노출이 적을 수 있다(미확인).

## 결정 요청 3건

1. 개발자 계정을 2023-11-13 이전에 만든 적이 있는가(테스트 면제 여부).
2. v1.0에서 알림·사진 입력을 뺄 것인가(권장: 뺀다).
3. 스토어 카테고리를 게임과 교육 중 어느 쪽으로 할 것인가(한국 등급 요건 확인 후 결정).

## 출처

- [새 개인 계정 테스트 요건](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)(열람)
- [타깃 API 요건](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)(열람)
- [최소 기능 정책 학습 자료](https://playacademy.exceedlms.com/student/path/65190-comply-with-google-play-s-spam-and-minimum-functionality-policies), [웹뷰 반려 사례](https://www.testerscommunity.com/guides/twa-app-rejected-switch-to-webview)(검색 결과만, 미열람)
- [react-native-google-mobile-ads 문서](https://github.com/invertase/react-native-google-mobile-ads/blob/main/docs/index.mdx)(검색 결과만, 미열람)
