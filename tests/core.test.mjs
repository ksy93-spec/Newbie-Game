import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const B = (p) => require('../.test-build/' + p);

const day = B('core/day');
const stateM = B('core/state');
const dailyM = B('core/daily');
const reviewM = B('core/review');
const progressM = B('core/progress');
const combatM = B('core/combat');
const curateM = B('core/curate');
const pack = B('data/pack').BUILTIN_PACK;

function newGame() {
  day.resetTestShift();
  const s = stateM.freshState();
  s.onboarded = true;
  s.status = '대학생';
  s.region = '수도권';
  s.living = '자취';
  return s;
}

test('날짜 계산은 KST 달력일을 따른다', () => {
  const k = day.dayKey();
  assert.match(k, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(day.addDays(k, 1), day.keyOf(day.dayNum(k) + 1));
  assert.equal(day.dayGap(k, day.addDays(k, 3)), 3);
  assert.equal(day.dayGap(day.addDays(k, 3), k), -3);
});

test('연속 출석은 하루씩 붙고 건너뛰면 1로 돌아간다', () => {
  const s = newGame();
  dailyM.rollDay(s, pack.quests);
  assert.equal(s.streak, 1);
  assert.equal(s.todayQ.length, dailyM.DAILY_N);

  day.shiftForTest(1);
  dailyM.rollDay(s, pack.quests);
  assert.equal(s.streak, 2);
  assert.equal(s.claimed, null, '새 날에는 출석이 다시 열린다');

  day.shiftForTest(3);
  dailyM.rollDay(s, pack.quests);
  assert.equal(s.streak, 1, '사흘 건너뛰면 끊긴다');
  assert.equal(s.best, 2, '최고 기록은 남는다');
});

test('같은 날 두 번 켜도 하루가 넘어가지 않는다', () => {
  const s = newGame();
  dailyM.rollDay(s, pack.quests);
  const first = [...s.todayQ];
  const r = dailyM.rollDay(s, pack.quests);
  assert.equal(r.rolled, false);
  assert.deepEqual(s.todayQ, first, '오늘의 퀘스트는 하루 동안 고정이다');
});

test('출석 보너스는 3일에 2배, 7일에 3배', () => {
  const s = newGame();
  s.streak = 1;
  assert.equal(dailyM.dailyCoin(s), 30);
  s.streak = 3;
  assert.equal(dailyM.dailyCoin(s), 60);
  s.streak = 7;
  assert.equal(dailyM.dailyCoin(s), 90);
});

test('틀린 문항은 복습 큐에 들어가고 맞히면 간격이 늘어난다', () => {
  const s = newGame();
  dailyM.rollDay(s, pack.quests);
  const q = pack.quests[0];

  progressM.finishQuest(s, q, q.qs.map(() => false), pack.quests);
  assert.equal(s.review.length, q.qs.length, '틀린 만큼 예약된다');
  assert.equal(reviewM.reviewDue(s).length, 0, '오늘은 아직 안 나온다');

  day.shiftForTest(1);
  assert.equal(reviewM.reviewDue(s).length, q.qs.length, '다음 날 나온다');

  const rq = reviewM.reviewQuest(s, pack.quests, pack.asOf);
  assert.ok(rq, '복습 퀘스트가 만들어진다');
  assert.equal(rq.id, 'review');

  progressM.finishQuest(s, rq, rq.qs.map(() => true), pack.quests);
  assert.equal(s.review[0].box, 1);
  assert.equal(s.review[0].due, day.addDays(day.dayKey(), reviewM.BOX_DUE[1]));
});

test('복습에서 또 틀리면 상자가 0으로 돌아간다', () => {
  const s = newGame();
  reviewM.reviewAdd(s, pack.quests[0].id, 0);
  s.review[0].box = 3;
  day.shiftForTest(1);
  const rq = reviewM.reviewQuest(s, pack.quests, pack.asOf);
  progressM.finishQuest(s, rq, [false], pack.quests);
  assert.equal(s.review[0].box, 0);
  assert.equal(s.review[0].due, day.addDays(day.dayKey(), 1));
});

test('오늘 셋을 다 끝내면 완주 보너스가 붙는다', () => {
  const s = newGame();
  dailyM.rollDay(s, pack.quests);
  s.streak = 7; // 3배
  const byId = new Map(pack.quests.map((q) => [q.id, q]));
  let bonus = 0;
  s.todayQ.forEach((id) => {
    const q = byId.get(id);
    const r = progressM.finishQuest(s, q, q.qs.map(() => true), pack.quests);
    bonus += r.dailyBonus;
  });
  assert.equal(dailyM.todayLeft(pack.quests, s), 0);
  assert.equal(bonus, 240, '80 × 3배');
});

test('만점이면 장비와 상관없이 보스를 이긴다', () => {
  const s = newGame();
  const plan = combatM.bossPlan(s, pack.boss);
  assert.ok(plan.need <= pack.boss.qs.length, '문항 수 안에서 잡을 수 있어야 한다');
  s.equip.weapon = 'card'; // 공격 32
  const strong = combatM.bossPlan(s, pack.boss);
  assert.ok(strong.need <= plan.need, '장비는 필요한 정답 수를 줄인다');
  assert.ok(strong.survive >= plan.survive - 1, '장비는 버티는 횟수를 늘린다');
});

test('보스에게 지면 거처 해금이 한 단계 내려간다', () => {
  const s = newGame();
  s.peak = 3;
  s.tier = 3;
  progressM.finishBoss(s, false);
  assert.equal(s.peak, 2);
  assert.equal(s.tier, 2, '살던 집도 같이 내려온다');
});

test('큐레이션은 프로필에 맞지 않는 퀘스트를 숨긴다', () => {
  const s = newGame();
  const all = curateM.curated(pack.quests, s);
  assert.ok(all.length > 0);
  assert.ok(all.length <= pack.quests.length);
  const worker = { ...s, status: '직장인', years: 5 };
  const forWorker = curateM.curated(pack.quests, worker);
  assert.notDeepEqual(
    all.map((q) => q.id),
    forWorker.map((q) => q.id),
    '신분이 다르면 목록이 달라진다',
  );
});

test('저장 마이그레이션은 빠진 필드를 메우고 없는 아이템을 되돌린다', () => {
  const old = { lv: 5, coin: 999, equip: { top: '없어진아이템' }, stats: { ju: 40 } };
  const s = stateM.migrate(old);
  assert.equal(s.lv, 5);
  assert.equal(s.coin, 999);
  assert.equal(s.stats.ju, 40);
  assert.equal(s.stats.sik, 5, '빠진 스탯은 기본값으로 채운다');
  assert.equal(s.equip.top, 'shirt', '없는 아이템은 기본 장비로 되돌린다');
  assert.ok(Array.isArray(s.review));
  assert.ok(s.notif && typeof s.notif.hour === 'number');
});

test('레벨업과 경험치는 넘치는 만큼 이월된다', () => {
  const s = newGame();
  s.xp = stateM.needXp(1) - 1;
  const q = pack.quests[0];
  progressM.finishQuest(s, q, q.qs.map(() => true), pack.quests);
  assert.ok(s.lv >= 2);
  assert.ok(s.xp >= 0 && s.xp < stateM.needXp(s.lv));
});
