import type { Quest } from '@/data/pack';
import type { GameState } from './state';

/** 프로필에 맞지 않는 퀘스트는 아예 숨긴다. */
export function fits(q: Quest, s: GameState): boolean {
  const f = q.fit ?? {};
  if (f.status && s.status && f.status.indexOf(s.status) < 0) return false;
  if (f.ageMax != null && s.age != null && s.age > f.ageMax) return false;
  if (f.regions && s.region && f.regions.indexOf(s.region) < 0) return false;
  return true;
}

/** 급한 것부터 위로. 이미 끝낸 것은 뒤로 민다. */
export function score(q: Quest, s: GameState): number {
  let n = 0;
  if (q.theme === 'ju') n += 20;
  if (s.status === '대학생' && (q.theme === 'geum' || q.theme === 'jik')) n += 18;
  if (s.status === '취준생' && (q.theme === 'jik' || q.theme === 'geum')) n += 20;
  if (s.status === '직장인' && s.years === 0 && q.theme === 'ju') n += 14;
  if (s.status === '직장인' && (s.years ?? 0) >= 5 && q.theme === 'geum') n += 10;
  if (s.living === '자취' && q.theme === 'ju') n += 14;
  if (s.region === '수도권' && q.theme === 'ju') n += 6;
  if (s.company === '스타트업' && q.theme === 'jik') n += 10;
  if (s.done.indexOf(q.id) >= 0) n -= 100;
  return n;
}

export function curated(quests: Quest[], s: GameState): Quest[] {
  return quests.filter((q) => fits(q, s)).sort((a, b) => score(b, s) - score(a, s));
}

export function whyLine(s: GameState): string {
  const mid =
    s.status === '대학생'
      ? s.living
      : s.status === '취준생'
        ? ['준비 6개월 미만', '준비 6개월~1년', '준비 1년 이상'][s.prep ?? 0]
        : s.years === 0
          ? '1년 미만'
          : s.years === 2
            ? '1~3년차'
            : s.years == null
              ? null
              : '4년차 이상';
  return [s.status, mid, s.region].filter(Boolean).join(' · ');
}
