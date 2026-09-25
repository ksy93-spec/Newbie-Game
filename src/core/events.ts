import { dayKey, nowMs } from './day';
import type { GameEvent, GameState } from './state';

/* ══════════ 계측 ══════════
   어디서 이탈하는지 모르면 무엇을 고칠지도 모른다. 이름과 속성을 여기서 확정해 두면
   나중에 Amplitude·GA4·PostHog 중 무엇을 붙이든 바꿀 게 sink 한 줄뿐이다. */

export const EV_MAX = 400;

export type EventName =
  | 'app_open'
  | 'day_start'
  | 'onboard_step'
  | 'onboard_pick'
  | 'onboard_done'
  | 'profile_fill'
  | 'daily_claim'
  | 'daily_complete'
  | 'quest_start'
  | 'quest_answer'
  | 'quest_finish'
  | 'review_finish'
  | 'boss_start'
  | 'boss_win'
  | 'boss_lose'
  | 'equip'
  | 'buy'
  | 'tab_view'
  | 'share_card'
  | 'wiki_open'
  | 'notif_perm'
  | 'notif_fire'
  | 'notif_open'
  | 'pack_load';

type Sink = (name: EventName, props?: Record<string, unknown> | null) => void;

let sink: Sink | null = null;

/** 실제 분석 SDK를 여기에 꽂는다. 호출 지점은 이미 전부 박혀 있다. */
export function setSink(fn: Sink | null): void {
  sink = fn;
}

export function record(s: GameState, name: EventName, props?: Record<string, unknown> | null): void {
  const e: GameEvent = { t: nowMs(), d: dayKey(), n: name, p: props ?? null };
  s.log.push(e);
  if (s.log.length > EV_MAX) s.log.splice(0, s.log.length - EV_MAX);
  if (sink) {
    try {
      sink(name, props);
    } catch {
      /* 계측 실패가 게임을 막지 않게 한다 */
    }
  }
}

export interface Funnel {
  dayN: number;
  visitedDays: number;
  counts: Record<string, number>;
}

export function funnel(s: GameState, gapFromFirst: number): Funnel {
  const counts: Record<string, number> = {};
  const days = new Set<string>();
  s.log.forEach((e) => {
    counts[e.n] = (counts[e.n] ?? 0) + 1;
    days.add(e.d);
  });
  return { dayN: gapFromFirst + 1, visitedDays: days.size, counts };
}
