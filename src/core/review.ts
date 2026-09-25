import type { Quest, Question } from '@/data/pack';
import { addDays, dayGap, dayKey } from './day';
import type { GameState, ReviewItem } from './state';

/* ══════════ 복습 큐 ══════════
   퀴즈는 한 번 풀면 재미가 0이다. 틀린 문항만 간격을 두고 되돌려 주면
   같은 콘텐츠로 하루 루프를 채울 수 있다. 맞히면 간격이 늘고 틀리면 처음으로. */

export const BOX_DUE = [1, 3, 7, 14, 30];
export const REVIEW_MAX = 4;

export function reviewAdd(s: GameState, questId: string, i: number): void {
  const found = s.review.find((r) => r.q === questId && r.i === i);
  if (found) {
    found.box = 0;
    found.due = addDays(dayKey(), 1);
    return;
  }
  s.review.push({ q: questId, i, box: 0, due: addDays(dayKey(), 1) });
}

export function reviewDue(s: GameState): ReviewItem[] {
  const today = dayKey();
  return s.review.filter((r) => dayGap(r.due, today) >= 0);
}

export interface ReviewQuest extends Quest {
  keys: ReviewItem[];
}

/** 오늘 풀 복습 문항을 한 퀘스트로 묶는다. */
export function reviewQuest(s: GameState, quests: Quest[], asOf: string): ReviewQuest | null {
  const byId = new Map(quests.map((q) => [q.id, q]));
  const due = reviewDue(s).slice(0, REVIEW_MAX);
  const qs: Question[] = [];
  const keys: ReviewItem[] = [];
  due.forEach((r) => {
    const q = byId.get(r.q);
    const item = q?.qs[r.i];
    if (q && item) {
      qs.push(item);
      keys.push(r);
    }
  });
  if (!qs.length) return null;
  return {
    id: 'review',
    theme: 'jik',
    title: `복습 · 지난번 틀린 ${qs.length}문항`,
    xp: 20 + 10 * qs.length,
    coin: 15 + 10 * qs.length,
    fit: {},
    npc: '복습 노트',
    reward: null,
    intro: '전에 틀렸던 문항이야. 이번엔 맞힐 수 있겠지?',
    qs,
    stat: {},
    src: ['복습 노트', ''],
    keys,
  };
}

/** 복습 결과 반영. marks[i]가 true면 다음 간격으로, false면 처음으로. */
export function applyReview(s: GameState, keys: ReviewItem[], marks: boolean[]): void {
  const today = dayKey();
  const graduated = new Set<ReviewItem>();
  keys.forEach((r, i) => {
    if (marks[i]) {
      if (r.box >= BOX_DUE.length - 1) {
        graduated.add(r); // 마지막 상자까지 통과했으면 큐에서 뺀다
        return;
      }
      r.box += 1;
      r.due = addDays(today, BOX_DUE[r.box]);
    } else {
      r.box = 0;
      r.due = addDays(today, 1);
    }
  });
  if (graduated.size) s.review = s.review.filter((r) => !graduated.has(r));
}
