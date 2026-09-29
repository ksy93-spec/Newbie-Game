// 보상형 광고 상태 기계 테스트(광고 SDK 없이 가짜 어댑터로). Node 의 타입 제거 기능으로 .ts 를 바로 읽는다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRewardedController } from '../src/bridge/adController.ts';

/** 가짜 타이머: 시간을 손으로 흘린다 */
function fakeTimers() {
  let now = 0, id = 0; const q = new Map();
  return {
    set: (fn, ms) => { q.set(++id, { at: now + ms, fn }); return id; },
    clear: (t) => q.delete(t),
    advance(ms) {
      now += ms;
      for (const [k, v] of [...q]) if (v.at <= now) { q.delete(k); v.fn(); }
    },
  };
}

/** 가짜 광고. 테스트가 loaded/earned/closed 를 직접 일으킨다 */
function fakeAds() {
  const created = [];
  const create = () => {
    const l = { loaded: [], error: [], opened: [], earned: [], closed: [] };
    const h = {
      loadCalls: 0, showCalls: 0, showFails: false,
      load() { h.loadCalls++; },
      show() { h.showCalls++; return h.showFails ? Promise.reject(new Error('x')) : Promise.resolve(); },
      on(ev, cb) { l[ev].push(cb); return () => {}; },
      emit(ev) { l[ev].forEach((f) => f()); },
    };
    created.push(h);
    return h;
  };
  return { create, created };
}

function setup(timeoutMs = 8000) {
  const timers = fakeTimers(); const ads = fakeAds();
  const c = createRewardedController({ create: ads.create, timeoutMs, timers });
  const log = { shown: 0, done: [] };
  const req = () => c.request({ onShown: () => log.shown++, onDone: (r) => log.done.push(r) });
  return { c, timers, ads, log, req };
}

test('동의 전(비활성)에는 광고를 만들지 않고 바로 실패', () => {
  const { c, ads, log, req } = setup();
  c.preload();
  assert.equal(ads.created.length, 0);
  req();
  assert.deepEqual(log.done, [false]);
});

test('활성화하면 미리 받고, 로드된 광고는 요청 즉시 보여 주며 보상은 earned 뒤 closed 에서만', () => {
  const { c, ads, log, req } = setup();
  c.setEnabled(true);
  assert.equal(ads.created.length, 1);
  ads.created[0].emit('loaded');
  req();
  assert.equal(ads.created[0].showCalls, 1);
  assert.equal(log.shown, 1);
  assert.deepEqual(log.done, []);
  ads.created[0].emit('earned');
  ads.created[0].emit('closed');
  assert.deepEqual(log.done, [true]);
  assert.equal(ads.created.length, 2, '닫힌 뒤 다음 광고를 미리 받는다');
  assert.equal(ads.created[1].loadCalls, 1);
});

test('보상 없이 닫으면 false', () => {
  const { c, ads, log, req } = setup();
  c.setEnabled(true); ads.created[0].emit('loaded'); req();
  ads.created[0].emit('closed');
  assert.deepEqual(log.done, [false]);
});

test('아직 로딩 중이면 기다렸다가 로드되면 보여 준다', () => {
  const { c, ads, log, req, timers } = setup();
  c.setEnabled(true);
  req();
  timers.advance(3000);
  assert.equal(ads.created[0].showCalls, 0);
  ads.created[0].emit('loaded');
  assert.equal(ads.created[0].showCalls, 1);
  timers.advance(60000);                       // 광고를 보는 중에는 시간 초과 없음
  assert.deepEqual(log.done, []);
  ads.created[0].emit('earned'); ads.created[0].emit('closed');
  assert.deepEqual(log.done, [true]);
});

test('8초 안에 안 뜨면 false, 나중에 로드돼도 보여 주지 않는다', () => {
  const { c, ads, log, req, timers } = setup();
  c.setEnabled(true);
  req();
  timers.advance(8000);
  assert.deepEqual(log.done, [false]);
  ads.created[0].emit('loaded');
  assert.equal(ads.created[0].showCalls, 0);
  assert.equal(log.shown, 0);
  // 그 광고는 다음 요청에 쓴다
  req();
  assert.equal(ads.created[0].showCalls, 1);
});

test('로드 실패는 바로 false 이고 다음 요청 때 다시 시도한다', () => {
  const { c, ads, log, req } = setup();
  c.setEnabled(true);
  req();
  ads.created[0].emit('error');
  assert.deepEqual(log.done, [false]);
  req();
  assert.equal(ads.created.length, 2, '새 광고를 다시 요청');
});

test('show() 가 실패하면 false', async () => {
  const { c, ads, log, req } = setup();
  c.setEnabled(true); ads.created[0].showFails = true; ads.created[0].emit('loaded');
  req();
  await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(log.done, [false]);
});

test('요청 중 중복 요청은 false 로 거절하고 첫 요청은 영향 없음', () => {
  const { c, ads, log, req } = setup();
  c.setEnabled(true); ads.created[0].emit('loaded');
  req(); req();
  assert.deepEqual(log.done, [false]);
  ads.created[0].emit('earned'); ads.created[0].emit('closed');
  assert.deepEqual(log.done, [false, true]);
});
