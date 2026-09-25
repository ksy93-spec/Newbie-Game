import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { TIERS } from '@/data/tiers';
import { bossPlan } from '@/core/combat';
import { 이가 } from '@/core/korean';
import { finishBoss } from '@/core/progress';
import { Avatar } from '@/sprite/Avatar';
import { useGame } from '@/store';
import { P } from '@/theme/palette';
import { COLORS, U } from '@/theme/tokens';
import { BattleWipe, DamagePop, HpPlate, Platform, useBlink, useShake } from '@/ui/BattleFx';
import { ChoiceBox, MessageBox } from '@/ui/MessageBox';
import { PixelButton, T } from '@/ui/Pixel';
import { cue } from '@/ui/feedback';

/* ══════════ 보스전 ══════════
   턴제 JRPG의 문법을 그대로 쓴다. 띠 전환으로 들어가고, 대사는 한 글자씩 찍히고,
   선택지는 기술 고르기처럼 생긴 상자에서 고르고, 맞으면 상대가 깜빡이고 체력이 흐른다.
   대사는 이 게임의 세계(전세 계약)에 맞춰 새로 썼다. */

type Mode = 'wipe' | 'talk' | 'menu' | 'over';
/** 대사 한 줄. who가 없으면 나레이션이다. */
type Line = { t: string; who?: string };

export function Boss({ onExit }: { onExit: () => void }) {
  const { s, set, ev, pack } = useGame();
  const boss = pack.boss;
  const plan = useRef(bossPlan(s, boss)).current;

  const [mode, setMode] = useState<Mode>('wipe');
  const [queue, setQueue] = useState<Line[]>([]);
  const afterRef = useRef<(() => void) | null>(null);

  const [i, setI] = useState(0);
  const [bossHp, setBossHp] = useState(boss.hp);
  const [myHp, setMyHp] = useState(plan.hp);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [won, setWon] = useState(false);

  const [bossHitAt, setBossHitAt] = useState(0);
  const [myHitAt, setMyHitAt] = useState(0);
  const [pop, setPop] = useState<{ v: number; at: number; tone: string; side: 'boss' | 'me' } | null>(null);

  const bossBlink = useBlink(bossHitAt);
  const myBlink = useBlink(myHitAt);
  const shake = useShake(myHitAt);

  const item = boss.qs[i];

  /** 대사를 줄 단위로 밀어 넣고, 다 넘기면 then을 부른다. */
  const say = useCallback((lines: (string | Line)[], then: () => void, who?: string) => {
    setQueue(lines.map((l) => (typeof l === 'string' ? { t: l, who } : l)));
    afterRef.current = then;
    setMode('talk');
  }, []);

  const ask = useCallback(
    (n: number) => {
      setPicked(null);
      setRevealed(false);
      say([boss.qs[n].q], () => setMode('menu'), boss.name);
    },
    [boss, say],
  );

  useEffect(() => {
    ev('boss_start', { atk: plan.atk, def: plan.def, cleared: s.bossCleared });
    // 전환이 끝나면 등장 대사부터
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function advance() {
    if (queue.length > 1) {
      setQueue(queue.slice(1));
      return;
    }
    const then = afterRef.current;
    afterRef.current = null;
    setQueue([]);
    then?.();
  }

  function pick(choice: number) {
    if (revealed) return;
    const ok = choice === item.ok;
    setPicked(choice);
    setRevealed(true);
    cue(ok ? 'good' : 'hit');
    ev('quest_answer', { id: 'boss', i, ok });

    const nextBoss = ok ? Math.max(0, bossHp - plan.dmg) : bossHp;
    const nextMy = ok ? myHp : Math.max(0, myHp - plan.take);
    const now = Date.now();

    if (ok) {
      setBossHp(nextBoss);
      setBossHitAt(now);
      setPop({ v: plan.dmg, at: now, tone: P.y1, side: 'boss' });
    } else {
      setMyHp(nextMy);
      setMyHitAt(now);
      setPop({ v: plan.take, at: now, tone: P.r1, side: 'me' });
    }

    const lines = ok
      ? ['정확히 짚었다!', `집주인에게 ${plan.dmg}의 피해. 말문이 막혔다.`, item.why]
      : ['집주인이 말을 돌린다!', `${plan.take}의 피해를 입었다.`, item.why];

    say(lines, () => {
      if (nextBoss <= 0) return end(true);
      if (nextMy <= 0) return end(false);
      const n = i + 1;
      if (n >= boss.qs.length) return end(false); // 문항이 떨어지면 설득에 실패한 것
      setI(n);
      ask(n);
    });
  }

  function end(win: boolean) {
    setWon(win);
    cue(win ? 'win' : 'hit');
    let result!: ReturnType<typeof finishBoss>;
    set((st) => {
      result = finishBoss(st, win);
    });
    const lines = win
      ? [boss.win, '보증금을 지켜냈다.', `￦200과 주 스탯 15를 얻었다.`]
      : [boss.lose, '거처 해금이 한 단계 내려갔다.', `지금 사는 곳은 ${TIERS[Math.max(0, s.peak - 1)].name}.`];
    say(lines, () => setMode('over'));
  }

  const showSprites = mode !== 'wipe';

  return (
    <Animated.View
      style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'flex-start', transform: [{ translateX: shake }] }}
    >
      {mode === 'wipe' ? (
        <BattleWipe
          onDone={() =>
            say(
              [{ t: `${이가(boss.name)} 나타났다!` }, { t: boss.intro, who: boss.name }],
              () => ask(0),
            )
          }
        />
      ) : null}

      {/* 전장 */}
      <View
        style={{
          flex: 1,
          minHeight: 260,
          backgroundColor: COLORS.sky,
          padding: U[3],
          justifyContent: 'space-around',
          borderBottomWidth: 3,
          borderBottomColor: COLORS.line,
        }}
      >
        {/* 상대 */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <HpPlate name={boss.name} hp={bossHp} max={boss.hp} sub={`공격 ${boss.atk}`} />
          <View style={{ alignItems: 'center' }}>
            {showSprites ? (
              <Animated.View style={{ opacity: bossBlink }}>
                <Avatar
                  state={{
                    ...s,
                    avatar: 'imgM',
                    haircol: 4,
                    equip: { ...s.equip, top: 'suitg', bottom: 'slack', head: 'glass', weapon: 'card' },
                  }}
                  pose="idle"
                  scale={2}
                />
              </Animated.View>
            ) : null}
            <Platform width={116} />
            {pop?.side === 'boss' ? <DamagePop value={pop.v} trigger={pop.at} tone={pop.tone} /> : null}
          </View>
        </View>

        {/* 나 */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center' }}>
            {showSprites ? (
              <Animated.View style={{ opacity: myBlink }}>
                <Avatar state={s} pose="idle" scale={2} flip />
              </Animated.View>
            ) : null}
            <Platform width={132} />
            {pop?.side === 'me' ? <DamagePop value={pop.v} trigger={pop.at} tone={pop.tone} /> : null}
          </View>
          <HpPlate
            name={`${s.status} Lv.${s.lv}`}
            hp={myHp}
            max={plan.hp}
            align="right"
            sub={`방어 ${plan.def} · 한 방 ${plan.dmg}`}
          />
        </View>
      </View>

      {/* 대사 · 선택지 */}
      {mode === 'talk' && queue.length ? (
        <MessageBox text={queue[0].t} speaker={queue[0].who} onAdvance={advance} />
      ) : null}

      {mode === 'menu' ? (
        <>
          <MessageBox text={item.q} speaker={boss.name} minHeight={88} />
          <ChoiceBox
            options={item.a}
            onPick={pick}
            revealed={revealed}
            correct={item.ok}
            picked={picked}
            disabled={revealed}
          />
        </>
      ) : null}

      {mode === 'over' ? (
        <View style={{ padding: U[3], gap: U[2] }}>
          <T size="display" style={{ textAlign: 'center' }} color={bossHp <= 0 ? P.y2 : P.r2}>
            {won ? '보스 격파' : '보증금을 잃었다'}
          </T>
          <PixelButton label="돌아가기" onPress={onExit} />
        </View>
      ) : null}
    </Animated.View>
  );
}
