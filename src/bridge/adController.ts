// 보상형 광고 상태 기계. 광고 SDK를 직접 부르지 않고 어댑터(AdHandle)만 쓰기 때문에
// react-native 없이 node 에서 테스트할 수 있다(tests/adController.test.mjs).
//
// 규칙: 보상은 광고를 끝까지 보고 EARNED 가 온 뒤 닫혔을 때만 true.
//       로드 실패·시간 초과·표시 실패는 전부 false(보상도 쿨다운도 소모 없음).
//       광고가 닫히면 바로 다음 광고를 미리 받아 둔다.

export type AdEvent = 'loaded' | 'error' | 'opened' | 'earned' | 'closed';

export interface AdHandle {
  load(): void;
  show(): Promise<void>;
  on(event: AdEvent, cb: () => void): () => void;
}

export interface RequestCallbacks {
  /** 광고를 화면에 띄우기 시작했을 때(이후 시간 초과 없음) */
  onShown(): void;
  /** 끝났을 때 딱 한 번. rewarded 가 true 일 때만 보상 지급 */
  onDone(rewarded: boolean): void;
}

export interface Timers {
  set(fn: () => void, ms: number): unknown;
  clear(t: unknown): void;
}

const realTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (t) => clearTimeout(t as ReturnType<typeof setTimeout>),
};

export function createRewardedController(deps: {
  create: () => AdHandle;
  timeoutMs: number;
  timers?: Timers;
  log?: (msg: string) => void;
}) {
  const timers = deps.timers ?? realTimers;
  const log = deps.log ?? (() => {});
  let enabled = false;
  let handle: AdHandle | null = null;
  let loaded = false;
  let loading = false;
  let busy = false;
  let waiter: null | ((ok: boolean) => void) = null;

  function preload() {
    if (!enabled || loading || loaded) return;
    loading = true;
    const h = deps.create();
    handle = h;
    h.on('loaded', () => {
      if (handle !== h) return;
      loading = false; loaded = true; log('rewarded loaded');
      const w = waiter; waiter = null; if (w) w(true);
    });
    h.on('error', () => {
      if (handle !== h) return;
      loading = false; loaded = false; handle = null; log('rewarded load error');
      const w = waiter; waiter = null; if (w) w(false);
    });
    h.load();
  }

  function setEnabled(v: boolean) {
    enabled = v;
    if (v) preload();
  }

  function request(cb: RequestCallbacks) {
    if (busy) { cb.onDone(false); return; }
    busy = true;
    let settled = false;
    let timer: unknown = null;
    const finish = (rewarded: boolean) => {
      if (settled) return;
      settled = true;
      if (timer != null) timers.clear(timer);
      waiter = null;
      busy = false;
      cb.onDone(rewarded);
    };
    if (!enabled) { finish(false); return; }

    const show = () => {
      if (settled) return;
      const h = handle;
      if (!h || !loaded) { finish(false); return; }
      if (timer != null) { timers.clear(timer); timer = null; }
      // 이 광고는 한 번 쓰면 끝이다. 닫히면 다음 것을 받는다.
      loaded = false; handle = null;
      let earned = false;
      h.on('earned', () => { earned = true; });
      h.on('closed', () => { finish(earned); preload(); });
      h.on('error', () => { finish(false); preload(); });
      cb.onShown();
      h.show().catch(() => { finish(false); preload(); });
    };

    timer = timers.set(() => {
      timer = null;
      log('rewarded request timeout');
      finish(false);
      preload();
    }, deps.timeoutMs);

    if (loaded) show();
    else {
      waiter = (ok) => { if (ok) show(); else finish(false); };
      preload();
      if (!loading && !loaded) finish(false);    // preload 가 시작조차 못 한 경우
    }
  }

  return { setEnabled, preload, request, get busy() { return busy; } };
}
