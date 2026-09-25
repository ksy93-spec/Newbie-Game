import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { BUILTIN_PACK, type Pack, type Quest } from '@/data/pack';
import { rollDay } from '@/core/daily';
import { dayGap, dayKey } from '@/core/day';
import { record, type EventName } from '@/core/events';
import { loadPack } from '@/core/pack-loader';
import { freshState, migrate, SAVE_KEY, type GameState } from '@/core/state';

interface Store {
  s: GameState;
  pack: Pack;
  packOrigin: string;
  ready: boolean;
  /** 상태를 바꾸고 저장한다. 화면은 이 한 곳만 거친다. */
  set(fn: (s: GameState) => void): void;
  ev(name: EventName, props?: Record<string, unknown> | null): void;
  boot(): Promise<void>;
  reset(): void;
  quests(): Quest[];
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persist(s: GameState) {
  if (saveTimer) clearTimeout(saveTimer);
  // 답 하나 고를 때마다 디스크를 때리지 않게 살짝 모은다
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(SAVE_KEY, JSON.stringify(s)).catch(() => {});
  }, 120);
}

export const useGame = create<Store>((setState, get) => ({
  s: freshState(),
  pack: BUILTIN_PACK,
  packOrigin: '내장',
  ready: false,

  set(fn) {
    const next = { ...get().s };
    fn(next);
    persist(next);
    setState({ s: next });
  },

  ev(name, props) {
    get().set((s) => record(s, name, props));
  },

  quests() {
    return get().pack.quests;
  },

  async boot() {
    let saved: unknown = null;
    try {
      const raw = await AsyncStorage.getItem(SAVE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {
      /* 저장이 깨졌으면 새로 시작한다 */
    }
    const s = migrate(saved);
    const { pack, origin } = await loadPack();

    rollDay(s, pack.quests);
    s.packVer = pack.ver;
    record(s, 'app_open', {
      ver: pack.ver,
      streak: s.streak,
      dayN: s.first ? dayGap(s.first, dayKey()) + 1 : 1,
    });
    persist(s);
    setState({ s, pack, packOrigin: origin, ready: true });
  },

  reset() {
    const s = freshState();
    persist(s);
    setState({ s });
  },
}));
