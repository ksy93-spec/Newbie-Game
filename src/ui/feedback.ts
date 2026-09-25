import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { GameState } from '@/core/state';

/* ══════════ 소리 · 진동 ══════════
   웹 프로토타입에서는 웹오디오로 사각파를 직접 만들었다. 네이티브에서는 expo-audio가
   짧은 효과음 파일을 재생한다. 파일이 아직 없으므로 지금은 진동만 실제로 동작하고,
   소리는 assets/sfx/*.wav 가 들어오면 SFX 표만 채우면 된다. */

export type Cue = 'tap' | 'pick' | 'good' | 'bad' | 'coin' | 'level' | 'open' | 'hit' | 'win';

/** 채워 넣을 자리. require('../../assets/sfx/good.wav') 형태로 넣는다. */
export const SFX: Partial<Record<Cue, number>> = {};

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

export function setFeedbackPrefs(p: Pick<GameState, 'snd' | 'vib'>): void {
  prefs = p;
}

export function cue(name: Cue): void {
  if (prefs.vib && Platform.OS !== 'web') {
    HAPTIC[name]().catch(() => {});
  }
  // 소리: SFX[name]이 채워지면 expo-audio 플레이어로 재생한다
}
