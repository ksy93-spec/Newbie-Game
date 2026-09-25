/* ══════════ 날짜 ══════════
   어제와 오늘을 구분하지 못하면 출석도 연속도 복습도 알림도 만들 수 없다.
   기준은 KST 달력일. shiftForTest로 날짜를 밀어 QA할 수 있다. */

export const DAY_MS = 86_400_000;
const KST_OFFSET = 9 * 3_600_000;

let testShift = 0;

export function nowMs(): number {
  return Date.now() + testShift;
}

/** QA 전용. 하루 단위로 시계를 민다. */
export function shiftForTest(days: number): string {
  testShift += days * DAY_MS;
  return dayKey();
}

export function resetTestShift(): void {
  testShift = 0;
}

/** 'YYYY-MM-DD' (KST 달력일) */
export function dayKey(ms?: number): string {
  return new Date((ms ?? nowMs()) + KST_OFFSET).toISOString().slice(0, 10);
}

/** 1970-01-01부터 센 날짜 번호 */
export function dayNum(key: string): number {
  return Math.round(Date.parse(key + 'T00:00:00Z') / DAY_MS);
}

export function keyOf(num: number): string {
  return new Date(num * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(key: string, n: number): string {
  return keyOf(dayNum(key) + n);
}

/** b - a (일). 음수면 b가 과거다. */
export function dayGap(a: string, b: string): number {
  return dayNum(b) - dayNum(a);
}

/** KST 기준 현재 시(0~23) */
export function kstHour(): number {
  return new Date(nowMs() + KST_OFFSET).getUTCHours();
}
