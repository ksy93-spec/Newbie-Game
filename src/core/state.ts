import type { ThemeKey } from '@/data/themes';
import { ITEMS, MOUNTS, PETS, SLOTS, allItems } from '@/data/items';
import { TIERS } from '@/data/tiers';
import { dayKey } from './day';

export const SAVE_KEY = 'nq.state.v1';

export interface ReviewItem {
  /** 퀘스트 id */
  q: string;
  /** 그 퀘스트 안의 문항 번호 */
  i: number;
  /** 간격 상자. 맞히면 올라가고 틀리면 0으로 돌아간다. */
  box: number;
  /** 다시 물어볼 날 */
  due: string;
}

export interface GameEvent {
  t: number;
  d: string;
  n: string;
  p?: Record<string, unknown> | null;
}

export interface Equip {
  weapon: string;
  top: string;
  head: string;
  bottom: string;
  pet: string;
  mount: string;
}

export interface NotifPref {
  on: boolean;
  /** KST 기준 시각 */
  hour: number;
}

export interface GameState {
  /* 프로필 */
  onboarded: boolean;
  status: string | null;
  age: number | null;
  years: number | null;
  company: string | null;
  living: string | null;
  prep: number | null;
  region: string | null;

  /* 진행 */
  lv: number;
  xp: number;
  coin: number;
  tier: number;
  peak: number;
  done: string[];
  bossCleared: boolean;
  /** 물리친 보스 id 목록. 보스가 하나이던 시절에는 bossCleared 하나로 됐다 */
  bossDone: string[];
  stats: Record<ThemeKey, number>;

  /* 겉모습 */
  avatar: 'imgM' | 'imgF' | 'stuM' | 'stuF';
  haircol: number;
  owned: string[];
  equip: Equip;

  /* 하루 루프 */
  first: string | null;
  day: string | null;
  streak: number;
  best: number;
  todayQ: string[];
  todayDone: string[];
  claimed: string | null;
  bonus: boolean;

  /* 복습 · 계측 */
  review: ReviewItem[];
  log: GameEvent[];

  /* 설정 */
  snd: boolean;
  vib: boolean;
  notif: NotifPref;
  notified: string | null;

  /** 마지막으로 적용한 문항 묶음 버전 */
  packVer: string | null;
  /** 시연 모드: 상점 전 품목 해금 */
  demo: boolean;
}

export function freshState(demo = true): GameState {
  const owned = demo
    ? [...Object.keys(ITEMS), ...Object.keys(PETS), ...Object.keys(MOUNTS)]
    : ['pen', 'shirt', 'hnone', 'beige', 'pnone', 'mnone'];
  return {
    onboarded: false,
    status: null,
    age: null,
    years: null,
    company: null,
    living: null,
    prep: null,
    region: null,

    lv: 1,
    xp: 0,
    coin: 150,
    tier: 0,
    peak: 0,
    done: [],
    bossCleared: false,
    bossDone: [],
    stats: { ju: 5, sik: 5, ui: 5, geum: 5, jik: 5 },

    avatar: 'stuM',
    haircol: -1,
    owned,
    equip: { weapon: 'pen', top: 'shirt', head: 'hnone', bottom: 'beige', pet: 'pnone', mount: 'mnone' },

    first: dayKey(),
    day: null,
    streak: 0,
    best: 0,
    todayQ: [],
    todayDone: [],
    claimed: null,
    bonus: false,

    review: [],
    log: [],

    snd: true,
    vib: true,
    notif: { on: false, hour: 20 },
    notified: null,

    packVer: null,
    demo,
  };
}

/** 새 필드가 생겨도 예전 저장이 깨지지 않게 메운다. */
export function migrate(raw: unknown): GameState {
  const fresh = freshState();
  if (!raw || typeof raw !== 'object') return fresh;
  const old = raw as Partial<GameState>;
  const out = { ...fresh, ...old } as GameState;
  out.stats = { ...fresh.stats, ...(old.stats ?? {}) };
  out.equip = { ...fresh.equip, ...(old.equip ?? {}) };
  out.notif = { ...fresh.notif, ...(old.notif ?? {}) };
  // 사라진 아이템 id를 참조하고 있으면 기본값으로 되돌린다
  (Object.keys(out.equip) as (keyof Equip)[]).forEach((k) => {
    if (!allItems(out.equip[k])) out.equip[k] = fresh.equip[k];
  });
  out.owned = out.owned.filter((id) => !!allItems(id));
  if (!Array.isArray(out.bossDone)) out.bossDone = out.bossCleared ? ['jeonse'] : [];
  // 그림체가 달라 물러난 옛 아바타는 같은 성별로 옮긴다.
  // (avatars.ts를 import하면 PNG require가 테스트 빌드로 끌려와 깨진다)
  if (out.avatar === 'imgM') out.avatar = 'stuM';
  if (out.avatar === 'imgF') out.avatar = 'stuF';
  out.tier = Math.max(0, Math.min(out.tier, TIERS.length - 1));
  out.peak = Math.max(0, Math.min(out.peak, TIERS.length - 1));
  if (out.tier > out.peak) out.tier = out.peak;
  return out;
}

export function needXp(lv: number): number {
  return 100 + (lv - 1) * 60;
}

export interface Totals {
  atk: number;
  gear: number;
  def: number;
}

export function totals(s: GameState): Totals {
  let atk = 0;
  let gear = 0;
  SLOTS.forEach(([slot]) => {
    const it = allItems(s.equip[slot]);
    if (it) {
      atk += it.atk ?? 0;
      gear += it.def ?? 0;
    }
  });
  return { atk, gear, def: TIERS[s.tier].def + gear };
}
