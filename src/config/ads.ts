// 광고 설정은 이 파일 한 곳에서만 바꾼다.
// USE_TEST_ADS = true 인 동안은 구글 공개 테스트 ID만 쓴다. 개발 중에는 내 광고를 누르지 않는다.
import { TestIds } from 'react-native-google-mobile-ads';

export const USE_TEST_ADS = true;

// TODO(출시 전): AdMob 콘솔에서 앱과 보상형 광고 단위를 만든 뒤 아래 값을 채운다.
//   1) 아래 REAL_REWARDED_UNIT_ID 에 광고 단위 ID(ca-app-pub-XXXX/YYYY)
//   2) app.json 두 곳을 실제 앱 ID(ca-app-pub-XXXX~ZZZZ)로: expo.plugins 의 androidAppId, 맨 위 "react-native-google-mobile-ads".android_app_id
//   3) USE_TEST_ADS 를 false 로
//   자세한 절차는 README "Android 앱 빌드" 참고.
const REAL_REWARDED_UNIT_ID = '';

export const REWARDED_UNIT_ID: string = USE_TEST_ADS ? TestIds.REWARDED : REAL_REWARDED_UNIT_ID;

// 광고 요청 뒤 이 시간 안에 화면에 뜨지 못하면 "광고 없음"으로 처리한다(보상·쿨다운 소모 없음).
export const AD_LOAD_TIMEOUT_MS = 8000;

// UMP 동의창을 EEA 지역인 것처럼 띄워 보는 디버그 스위치. 출시 빌드에서는 false.
export const UMP_DEBUG_EEA = false;
// UMP_DEBUG_EEA 를 켤 때 로그캣에 찍히는 테스트 기기 해시를 넣는다.
export const UMP_TEST_DEVICE_IDS: string[] = [];
