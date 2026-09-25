import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { GameState } from '@/core/state';

/* ══════════ 소리 · 진동 ══════════
   프로토타입(prototype/)은 웹오디오로 사각파를 그 자리에서 만든다. 네이티브에는 그런 게 없으니
   같은 악보를 tools/make-sfx.py로 미리 구워 두고 그 파일을 튼다. 소리가 서로 달라지면
   "웹에서 듣던 그 앱"이 아니게 된다.

   플레이어는 한 소리에 하나씩 미리 만들어 둔다. 정답을 연달아 맞히면 소리가 겹치는데,
   매번 새로 만들면 첫 재생이 늦어 손가락과 소리가 어긋난다. 대신 처음으로 되감고 다시 튼다. */

export type Cue = 'tap' | 'pick' | 'good' | 'bad' | 'coin' | 'level' | 'open' | 'hit' | 'win';

export const SFX: Record<Cue, number> = {
  tap: require('../../assets/sfx/tap.wav'),
  pick: require('../../assets/sfx/pick.wav'),
  good: require('../../assets/sfx/good.wav'),
  bad: require('../../assets/sfx/bad.wav'),
  coin: require('../../assets/sfx/coin.wav'),
  level: require('../../assets/sfx/level.wav'),
  open: require('../../assets/sfx/open.wav'),
  hit: require('../../assets/sfx/hit.wav'),
  win: require('../../assets/sfx/win.wav'),
};

const HAPTIC: Record<Cue, () => Promise<void>> = {
  tap: () => Haptics.selectionAsync(),
  pick: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  good: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  bad: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  coin: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  level: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  open: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  hit: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  win: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};

let prefs: Pick<GameState, 'snd' | 'vib'> = { snd: true, vib: true };
const players: Partial<Record<Cue, AudioPlayer>> = {};
let audioReady = false;

/** 무음 스위치를 켜 둔 아이폰에서도 효과음이 나야 한다. 게임 소리는 알림이 아니다. */
export function primeAudio(): void {
  if (audioReady) return;
  audioReady = true;
  setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
}

function playerFor(name: Cue): AudioPlayer | null {
  const hit = players[name];
  if (hit) return hit;
  try {
    const p = createAudioPlayer(SFX[name]);
    players[name] = p;
    return p;
  } catch {
    return null; // 소리가 안 나는 건 게임을 멈출 이유가 아니다
  }
}

export function setFeedbackPrefs(p: Pick<GameState, 'snd' | 'vib'>): void {
  prefs = p;
}

export function cue(name: Cue): void {
  if (prefs.vib && Platform.OS !== 'web') {
    HAPTIC[name]().catch(() => {});
  }
  if (prefs.snd) {
    const p = playerFor(name);
    if (p) {
      try {
        p.seekTo(0).catch(() => {});
        p.play();
      } catch {
        /* 재생 실패는 무시한다 */
      }
    }
  }
}

/** 앱을 닫을 때 플레이어를 놓아준다 */
export function releaseAudio(): void {
  (Object.keys(players) as Cue[]).forEach((k) => {
    try {
      players[k]?.remove();
    } catch {
      /* 이미 정리됐으면 그만이다 */
    }
    delete players[k];
  });
}
