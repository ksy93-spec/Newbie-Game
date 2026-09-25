import type { Quest } from '@/data/pack';
import { allItems } from '@/data/items';
import { TIERS, tierFor } from '@/data/tiers';
import { completeBonus, todayLeft } from './daily';
import { record } from './events';
import { applyReview, reviewAdd, type ReviewQuest } from './review';
import { needXp, type GameState } from './state';

export interface FinishResult {
  xp: number;
  coin: number;
  ratio: number;
  correct: number;
  total: number;
  leveledUp: boolean;
  unlockedTier: number | null;
  gotItemId: string | null;
  queuedForReview: number;
  dailyBonus: number;
  /** 목숨을 다 잃어 실패로 끝났는지 */
  failed: boolean;
}

/** 퀘스트(또는 복습) 하나를 끝내고 상태를 갱신한다. */
/* 목숨. 문항 셋에 둘이면 하나는 틀려도 되지만 둘을 틀리면 끝난다.
   셋이던 시절에는 다 틀려도 통과라 퀘스트가 시험이 아니라 페이지 넘기기였다. */
export const HEARTS = 2;

/** 목숨을 다 잃었는지 */
export function isFailed(marks: boolean[]): boolean {
  return marks.filter((m) => m === false).length >= HEARTS;
}

export function finishQuest(
  s: GameState,
  quest: Quest | ReviewQuest,
  marks: boolean[],
  allQuests: Quest[],
): FinishResult {
  const total = quest.qs.length;
  const correct = marks.filter(Boolean).length;
  const ratio = total ? correct / total : 0;
  /* 실패하면 보상이 없다. 틀린 문항은 그대로 복습 큐로 넘어가고 완료로 찍히지 않는다.
     다시 도전할 수 있어야 배우는 장치가 되지, 한 번 막히고 끝나면 그냥 벽이다. */
  const failed = isFailed(marks);

  const xp = failed ? 0 : Math.round(quest.xp * (0.5 + 0.5 * ratio));
  const coin = failed ? 0 : Math.round(quest.coin * (0.5 + 0.5 * ratio));
  const beforeLv = s.lv;
  const beforePeak = s.peak;

  s.xp += xp;
  s.coin += coin;
  while (s.xp >= needXp(s.lv)) {
    s.xp -= needXp(s.lv);
    s.lv++;
  }

  if (!failed) {
    (Object.keys(quest.stat) as (keyof typeof s.stats)[]).forEach((k) => {
      const gain = quest.stat[k] ?? 0;
      s.stats[k] = Math.min(100, s.stats[k] + Math.round(gain * ratio));
    });
  }

  let gotItemId: string | null = null;
  let queuedForReview = 0;
  let dailyBonus = 0;

  const keys = (quest as ReviewQuest).keys;
  if (keys) {
    applyReview(s, keys, marks);
    record(s, 'review_finish', { n: keys.length, ok: correct });
  } else {
    marks.forEach((ok, i) => {
      if (!ok) {
        reviewAdd(s, quest.id, i);
        queuedForReview++;
      }
    });
    if (!failed && s.done.indexOf(quest.id) < 0) {
      s.done.push(quest.id);
      if (quest.reward && s.owned.indexOf(quest.reward) < 0 && allItems(quest.reward)) {
        s.owned.push(quest.reward);
        gotItemId = quest.reward;
      }
    }
    if (!failed && s.todayQ.indexOf(quest.id) >= 0 && s.todayDone.indexOf(quest.id) < 0) {
      s.todayDone.push(quest.id);
    }
    if (!failed && !s.bonus && s.todayQ.length && todayLeft(allQuests, s) === 0) {
      s.bonus = true;
      dailyBonus = completeBonus(s);
      s.coin += dailyBonus;
      record(s, 'daily_complete', { streak: s.streak, bonus: dailyBonus });
    }
  }

  if (!failed && tierFor(s.stats.ju) > s.peak) {
    const wasTop = s.tier === s.peak;
    s.peak = Math.min(s.peak + 1, TIERS.length - 1);
    if (wasTop) s.tier = s.peak;
  }

  record(s, 'quest_finish', { id: quest.id, correct, n: total, xp, coin, failed });

  return {
    xp,
    coin,
    ratio,
    correct,
    total,
    leveledUp: s.lv > beforeLv,
    unlockedTier: s.peak > beforePeak ? s.peak : null,
    gotItemId,
    queuedForReview,
    dailyBonus,
    failed,
  };
}

/** 보스전 결과. 지면 거처 해금이 한 단계 내려간다. */
export function finishBoss(s: GameState, win: boolean): { unlocked: boolean; lost: boolean } {
  const beforePeak = s.peak;
  if (win) {
    s.bossCleared = true;
    s.coin += 200;
    s.stats.ju = Math.min(100, s.stats.ju + 15);
    if (tierFor(s.stats.ju) > s.peak) {
      const wasTop = s.tier === s.peak;
      s.peak = Math.min(s.peak + 1, TIERS.length - 1);
      if (wasTop) s.tier = s.peak;
    }
  } else {
    s.peak = Math.max(0, s.peak - 1);
    if (s.tier > s.peak) s.tier = s.peak;
  }
  record(s, win ? 'boss_win' : 'boss_lose', { lv: s.lv, ju: s.stats.ju });
  return { unlocked: s.peak > beforePeak, lost: s.peak < beforePeak };
}
