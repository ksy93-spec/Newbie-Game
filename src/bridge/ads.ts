// react-native-google-mobile-ads 연결부: UMP 동의 -> SDK 초기화 -> 보상형 광고
import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentPrivacyOptionsRequirementStatus,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { AD_LOAD_TIMEOUT_MS, REWARDED_UNIT_ID, UMP_DEBUG_EEA, UMP_TEST_DEVICE_IDS } from '../config/ads';
import { createRewardedController, type AdEvent, type AdHandle } from './adController';

function createHandle(): AdHandle {
  const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID);
  const map: Record<AdEvent, string> = {
    loaded: RewardedAdEventType.LOADED,
    earned: RewardedAdEventType.EARNED_REWARD,
    error: AdEventType.ERROR,
    opened: AdEventType.OPENED,
    closed: AdEventType.CLOSED,
  };
  return {
    load: () => ad.load(),
    show: () => ad.show(),
    on: (event, cb) => ad.addAdEventListener(map[event] as never, cb as never) as () => void,
  };
}

export const rewarded = createRewardedController({
  create: createHandle,
  timeoutMs: AD_LOAD_TIMEOUT_MS,
  log: (m) => { if (__DEV__) console.log('[ads]', m); },
});

let started = false;

/** 앱 시작 때 한 번. 동의를 받고, 광고를 요청해도 될 때만 SDK를 초기화한다. */
export async function startAds(): Promise<void> {
  if (started) return;
  started = true;
  let canRequestAds = false;
  try {
    const info = await AdsConsent.gatherConsent(
      UMP_DEBUG_EEA
        ? { debugGeography: AdsConsentDebugGeography.EEA, testDeviceIdentifiers: UMP_TEST_DEVICE_IDS }
        : undefined,
    );
    canRequestAds = info.canRequestAds;
  } catch (e) {
    // 동의 정보를 못 받았어도 예전에 받아 둔 동의가 있으면 그 결과를 쓴다
    try { canRequestAds = (await AdsConsent.getConsentInfo()).canRequestAds; } catch { /* 광고 없이 진행 */ }
  }
  if (!canRequestAds) return;
  // 아이폰: 광고 추적 허용 여부를 한 번 묻는다. 거절해도 광고와 보상은 그대로다(맞춤 광고만 빠진다)
  if (Platform.OS === 'ios') {
    try {
      const cur = await getTrackingPermissionsAsync();
      if (cur.status === 'undetermined') await requestTrackingPermissionsAsync();
    } catch { /* 무시 */ }
  }
  try {
    await mobileAds().initialize();
    rewarded.setEnabled(true);
  } catch (e) {
    if (__DEV__) console.warn('[ads] initialize 실패', e);
  }
}

/** 개인정보 옵션 양식이 필요한 지역이면 띄운다(설정 화면 항목용, 지금은 게임 쪽에 자리가 없다) */
export async function showPrivacyOptions(): Promise<void> {
  try {
    const info = await AdsConsent.getConsentInfo();
    if (info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED) {
      await AdsConsent.showPrivacyOptionsForm();
    }
  } catch { /* 무시 */ }
}
