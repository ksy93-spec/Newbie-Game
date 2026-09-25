import type { Boss } from '@/data/pack';
import type { GameState } from './state';
import { totals } from './state';

/* 만점이면 장비와 상관없이 항상 이긴다(피해 하한 25 × 5문항 > HP 100).
   장비는 "몇 번까지 틀려도 되는가"만 바꾼다. 공부가 이기고 과금이 보조하는 구조. */

export const BOSS_READY_JU = 30;

export interface BossPlan {
  atk: number;
  def: number;
  /** 한 방 피해 */
  dmg: number;
  /** 오답 한 번당 받는 피해 */
  take: number;
  /** 내 체력 */
  hp: number;
  /** 이기는 데 필요한 정답 수 */
  need: number;
  /** 버틸 수 있는 오답 수 */
  survive: number;
}

export function bossPlan(s: GameState, boss: Boss): BossPlan {
  const t = totals(s);
  const dmg = Math.max(25, Math.round(t.atk * 1.5));
  const take = Math.max(8, boss.atk - Math.floor(t.def / 4));
  const hp = 30 + Math.floor(t.def / 2);
  return {
    atk: t.atk,
    def: t.def,
    dmg,
    take,
    hp,
    need: Math.ceil(boss.hp / dmg),
    survive: Math.max(0, Math.ceil(hp / take) - 1),
  };
}

export function bossReady(s: GameState): boolean {
  return s.stats.ju >= BOSS_READY_JU;
}
