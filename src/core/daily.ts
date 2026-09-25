import type { Quest } from '@/data/pack';
import { curated } from './curate';
import { dayGap, dayKey } from './day';
import type { GameState } from './state';

export const DAILY_N = 3;

/** 연속 3일이면 2배, 7일이면 3배. 끊기면 1일로 돌아간다. */
export function dailyMult(s: GameState): number {
  return s.streak >= 7 ? 3 : s.streak >= 3 ? 2 : 1;
}

export function dailyCoin(s: GameState): number {
  return 30 * dailyMult(s);
}

export function completeBonus(s: GameState): number {
  return 80 * dailyMult(s);
}

/** 날짜로 시드를 만들어 같은 날은 항상 같은 셋이 나오게 한다. */
function seedRand(str: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h ^= h >>> 13;
    return ((h >>> 0) % 100000) / 100000;
  };
}

export function pickDaily(quests: Quest[], s: GameState): string[] {
  const pool = curated(quests, s)
    .filter((q) => s.done.indexOf(q.id) < 0)
    .slice(0, 8);
  const rand = seedRand(dayKey() + '|' + (s.status ?? ''));
  const out: string[] = [];
  while (out.length < DAILY_N && pool.length) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0].id);
  }
  return out;
}

export interface RollResult {
  rolled: boolean;
  gap: number | null;
  streak: number;
}

/** 앱을 켤 때마다 부른다. 날짜가 바뀌었으면 하루를 넘긴다. */
export function rollDay(s: GameState, quests: Quest[]): RollResult {
  const today = dayKey();
  if (!s.first) s.first = today;
  if (s.day === today) return { rolled: false, gap: 0, streak: s.streak };

  const gap = s.day ? dayGap(s.day, today) : null;
  s.streak = gap === 1 ? s.streak + 1 : 1;
  if (s.streak > s.best) s.best = s.streak;
  s.day = today;
  s.todayDone = [];
  s.claimed = null;
  s.bonus = false;
  s.notified = null;
  s.todayQ = s.onboarded ? pickDaily(quests, s) : [];
  return { rolled: true, gap, streak: s.streak };
}

export function todayList(quests: Quest[], s: GameState): Quest[] {
  const byId = new Map(quests.map((q) => [q.id, q]));
  return s.todayQ.map((id) => byId.get(id)).filter((q): q is Quest => !!q);
}

export function todayLeft(quests: Quest[], s: GameState): number {
  return todayList(quests, s).filter((q) => s.todayDone.indexOf(q.id) < 0).length;
}

export function canClaim(s: GameState): boolean {
  return s.claimed !== dayKey();
}
