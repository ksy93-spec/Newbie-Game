import * as Updates from 'expo-updates';
import { BUILTIN_PACK, srcOf, type Pack, type Quest } from '@/data/pack';

/* ══════════ 문항 묶음 갱신 ══════════
   두 갈래로 받는다.

   1) EAS Update — 앱 번들 안의 JS/에셋을 통째로 교체한다. 스토어 심사 없이 문항을 고칠 수 있고
      코드 수정도 같이 나간다. 제도 개정처럼 문구가 바뀌는 건 대부분 이걸로 충분하다.
   2) PACK_URL — 순수 데이터만 받아 오는 경로. 하루에 한 번 확인하며, 실패하면 내장 묶음을 쓴다.
      기자재 없이 문항만 빠르게 바꿔야 할 때 쓴다.

   어느 쪽이든 내려받은 묶음은 검증을 통과해야 적용한다. 검증에 실패하면 조용히 내장으로 돌아간다. */

export const PACK_URL: string | null = null; // 예: 'https://cdn.example.com/newbie/pack.json'

function validQuestion(x: unknown): boolean {
  const q = x as { q?: unknown; a?: unknown; ok?: unknown; why?: unknown };
  return (
    typeof q?.q === 'string' &&
    Array.isArray(q.a) &&
    q.a.length >= 2 &&
    q.a.every((s) => typeof s === 'string') &&
    typeof q.ok === 'number' &&
    q.ok >= 0 &&
    q.ok < q.a.length &&
    typeof q.why === 'string'
  );
}

export function validatePack(x: unknown): Pack | null {
  const p = x as Partial<Pack>;
  if (!p || typeof p.ver !== 'string' || typeof p.asOf !== 'string') return null;
  if (!Array.isArray(p.quests) || !p.quests.length) return null;
  for (const q of p.quests) {
    if (typeof q.id !== 'string' || typeof q.title !== 'string') return null;
    if (!Array.isArray(q.qs) || !q.qs.length || !q.qs.every(validQuestion)) return null;
  }
  if (!Array.isArray(p.bosses) || !p.bosses.length) return null;
  for (const b of p.bosses) {
    if (typeof b.id !== 'string' || !Array.isArray(b.qs) || !b.qs.every(validQuestion)) return null;
  }
  return p as Pack;
}

function withSources(p: Pack): Pack {
  p.quests.forEach((q: Quest) => {
    if (!q.src) q.src = srcOf(q.id, q.theme);
  });
  return p;
}

export interface PackLoad {
  pack: Pack;
  origin: '내장' | '원격' | 'EAS Update';
}

export async function loadPack(signal?: AbortSignal): Promise<PackLoad> {
  // EAS Update로 들어온 번들이면 내장 묶음 자체가 최신이다
  const viaUpdate = !Updates.isEmbeddedLaunch;

  if (PACK_URL) {
    try {
      const res = await fetch(PACK_URL, { cache: 'no-store', signal });
      const json = await res.json();
      const ok = validatePack(json);
      if (ok) return { pack: withSources(ok), origin: '원격' };
    } catch {
      /* 네트워크가 없거나 형식이 깨졌으면 내장으로 간다 */
    }
  }
  return { pack: withSources(BUILTIN_PACK), origin: viaUpdate ? 'EAS Update' : '내장' };
}

/** 앱이 떠 있는 동안 새 업데이트가 올라왔는지 확인한다. */
export async function checkForUpdate(): Promise<boolean> {
  if (__DEV__) return false;
  try {
    const r = await Updates.checkForUpdateAsync();
    if (!r.isAvailable) return false;
    await Updates.fetchUpdateAsync();
    return true;
  } catch {
    return false;
  }
}
