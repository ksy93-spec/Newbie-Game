// 게임 저장의 네이티브 백업. 웹뷰 데이터가 지워져도 시작할 때 되살린다(비어 있을 때만).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MIRROR_KEY } from './injected.mjs';

export async function readMirror(): Promise<string | null> {
  try {
    return await Promise.race([
      AsyncStorage.getItem(MIRROR_KEY),
      new Promise<null>((r) => setTimeout(() => r(null), 1500)),
    ]);
  } catch {
    return null;
  }
}

export async function writeMirror(data: string): Promise<void> {
  try { await AsyncStorage.setItem(MIRROR_KEY, data); } catch { /* 다음 저장 때 다시 */ }
}
