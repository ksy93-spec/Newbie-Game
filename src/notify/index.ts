import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { dailyCoin } from '@/core/daily';
import type { GameState } from '@/core/state';

/* ══════════ 알림 ══════════
   웹 프로토타입에서는 앱이 열려 있는 동안만 띄울 수 있었다. 여기서는 OS에 예약을 걸어
   앱이 꺼져 있어도 뜬다. 하루 한 번, 정한 시각에, 아직 출석하지 않았을 때만 부른다.
   "아직 안 했다"는 판단은 예약 시점에 못 하므로, 출석하면 그날 알림을 취소하는 쪽으로 푼다. */

export const CHANNEL_ID = 'daily';
const TAG = 'daily-streak';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: '출석 알림',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 120],
    lightColor: '#FFC53C',
  });
}

export async function requestPermission(): Promise<boolean> {
  await ensureChannel();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

function body(s: GameState): string {
  const next = s.streak + 1;
  const tail =
    next === 3 ? ' 오늘 오면 보너스 2배가 시작됩니다.' : next === 7 ? ' 오늘 오면 보너스 3배가 시작됩니다.' : '';
  return `연속 ${s.streak}일. 오늘 출석하면 ${dailyCoin(s)}원입니다.${tail}`;
}

/** 매일 같은 시각에 반복 알림을 건다. 이미 걸려 있으면 갈아 끼운다. */
export async function scheduleDaily(s: GameState): Promise<void> {
  await cancelDaily();
  if (!s.notif.on) return;
  const ok = await requestPermission();
  if (!ok) return;
  await Notifications.scheduleNotificationAsync({
    identifier: TAG,
    content: {
      title: '뉴비 퀘스트',
      body: body(s),
      data: { kind: 'daily' },
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: s.notif.hour,
      minute: 0,
    },
  });
}

export async function cancelDaily(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(TAG);
  } catch {
    /* 걸려 있지 않으면 그냥 넘어간다 */
  }
}

/** 출석을 마쳤으면 오늘 몫 알림을 지운다. 내일 다시 걸린다. */
export async function afterClaim(s: GameState): Promise<void> {
  if (!s.notif.on) return;
  await scheduleDaily(s);
}

export async function sendTest(s: GameState): Promise<boolean> {
  const ok = await requestPermission();
  if (!ok) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '뉴비 퀘스트',
      body: body(s),
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
  });
  return true;
}
