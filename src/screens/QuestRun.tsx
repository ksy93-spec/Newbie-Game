import React, { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import type { Quest } from '@/data/pack';
import { THEMES } from '@/data/themes';
import { TIERS } from '@/data/tiers';
import { allItems } from '@/data/items';
import { finishQuest, type FinishResult } from '@/core/progress';
import type { ReviewQuest } from '@/core/review';
import type { GameState } from '@/core/state';
import { Avatar } from '@/sprite/Avatar';
import { NpcSprite } from '@/sprite/Cast';
import { npcLook } from '@/sprite/cast';
import { useGame } from '@/store';
import { P } from '@/theme/palette';
import { COLORS, U } from '@/theme/tokens';
import { Shadow, Stage } from '@/ui/BattleFx';
import { ChoiceBox, MessageBox } from '@/ui/MessageBox';
import { Card, PixelButton, T } from '@/ui/Pixel';
import { cue } from '@/ui/feedback';

/* 보스전과 같은 문법으로 맞춘다. 대사는 한 글자씩 찍히고, 선택지는 같은 상자에서 고른다.
   차이는 체력 대신 하트 셋이라는 것뿐이다. */

type Phase =
  | { kind: 'intro' }
  | { kind: 'ask'; i: number }
  | { kind: 'explain'; i: number; ok: boolean }
  | { kind: 'done'; r: FinishResult };

export function QuestRun({ quest, onExit }: { quest: Quest | ReviewQuest; onExit: () => void }) {
  const { s, set, ev, pack, quests } = useGame();
  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });
  const [marks, setMarks] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  const total = quest.qs.length;
  const idx = phase.kind === 'ask' || phase.kind === 'explain' ? phase.i : 0;
  const item = quest.qs[idx];
  const hearts = 3 - marks.filter((m) => m === false).length;

  function answer(choice: number) {
    const ok = choice === item.ok;
    cue(ok ? 'good' : 'bad');
    const next = [...marks];
    next[idx] = ok;
    setMarks(next);
    setPicked(choice);
    ev('quest_answer', { id: quest.id, i: idx, ok });
    setPhase({ kind: 'explain', i: idx, ok });
  }

  function advance() {
    if (idx + 1 < total) {
      setPicked(null);
      setPhase({ kind: 'ask', i: idx + 1 });
      return;
    }
    let result!: FinishResult;
    set((st) => {
      result = finishQuest(st, quest, marks, quests());
    });
    cue(result.leveledUp ? 'level' : result.unlockedTier != null ? 'open' : 'win');
    setPhase({ kind: 'done', r: result });
  }

  if (phase.kind === 'done') {
    const r = phase.r;
    return (
      <ScrollView contentContainerStyle={{ padding: U[4], gap: U[3], backgroundColor: COLORS.bg }}>
        <T size="display" style={{ textAlign: 'center' }} color={r.leveledUp ? P.y2 : COLORS.ink}>
          {r.leveledUp ? 'LEVEL UP' : 'QUEST CLEAR'}
        </T>
        <View style={{ alignItems: 'center' }}>
          <Avatar state={s} pose="cheer" scale={3} />
        </View>
        <T size="body" style={{ textAlign: 'center' }} color={P.y3}>
          +{r.xp} XP · ￦{r.coin}
        </T>
        <Card>
          <Row k="정답" v={`${r.correct} / ${r.total}`} />
          {(Object.keys(quest.stat) as (keyof typeof THEMES)[]).map((k) => (
            <Row key={k} k={`${THEMES[k].full} · ${THEMES[k].role}`} v={String(s.stats[k])} />
          ))}
          {r.queuedForReview ? <Row k="복습 예약" v={`${r.queuedForReview}문항 · 내일`} /> : null}
          {r.gotItemId ? <Row k="획득" v={allItems(r.gotItemId)?.name ?? ''} /> : null}
          {r.dailyBonus ? <Row k="오늘 완주 보너스" v={`￦${r.dailyBonus}`} /> : null}
        </Card>
        {r.unlockedTier != null ? (
          <Card tone="surface">
            <T size="uiBold">새 거처 해금</T>
            <T size="body">
              {TIERS[r.unlockedTier].name} · 방어 {TIERS[r.unlockedTier].def}
            </T>
          </Card>
        ) : null}
        <PixelButton label="돌아가기" onPress={onExit} />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: U[3],
          paddingVertical: U[2],
          backgroundColor: COLORS.card,
          borderBottomWidth: 3,
          borderBottomColor: COLORS.line,
        }}
      >
        <PixelButton
          tone="plain"
          label="‹ 나가기"
          onPress={onExit}
          style={{ paddingHorizontal: U[2], minHeight: 40, borderBottomWidth: 4 }}
        />
        <T size="micro" color={COLORS.inkSoft}>
          {idx + 1} / {total}
        </T>
        <T size="ui" color={P.r1}>
          {'♥'.repeat(Math.max(0, hearts))}
          <T size="ui" color={P.s1}>
            {'♥'.repeat(Math.max(0, 3 - hearts))}
          </T>
        </T>
      </View>

      {/* NPC 무대 */}
      <Stage>
        <QuestNpc name={quest.npc} state={s} />
        <Shadow width={72} />
      </Stage>

      {phase.kind === 'intro' ? (
        <>
          <MessageBox text={quest.intro} speaker={quest.npc} onAdvance={() => setPhase({ kind: 'ask', i: 0 })} />
        </>
      ) : (
        <>
          <MessageBox text={item.q} speaker={quest.npc} minHeight={84} />
          <ChoiceBox
            options={item.a}
            onPick={answer}
            revealed={phase.kind === 'explain'}
            correct={item.ok}
            picked={picked}
            disabled={phase.kind === 'explain'}
          />
        </>
      )}

      {phase.kind === 'explain' ? (
        <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ padding: U[3], paddingTop: 0, gap: U[2] }}>
          <Card tone="surface" style={{ borderLeftWidth: 8, borderLeftColor: phase.ok ? P.g2 : P.r1 }}>
            <T size="body">
              <T size="uiBold">{phase.ok ? '정답' : '오답'}</T> · {item.why}
            </T>
            <T size="micro" color={COLORS.inkSoft}>
              기준일 {pack.asOf} · 확인처{' '}
              <T
                size="micro"
                color={P.k4}
                style={{ textDecorationLine: 'underline' }}
                onPress={() => quest.src[1] && Linking.openURL(quest.src[1])}
              >
                {quest.src[0]}
              </T>
            </T>
            <T size="micro" color={COLORS.inkSoft}>
              제도는 바뀝니다. 실제 결정 전에 원문을 확인하세요.
            </T>
          </Card>
          <PixelButton label={idx + 1 < total ? '다음 문제' : '결과 보기'} onPress={advance} />
        </ScrollView>
      ) : null}
    </View>
  );
}

/* 손그림 얼굴이 있으면 그걸 쓰고, 없으면 레이어 아바타를 다시 칠해 세운다.
   또래와 직장인 그림이 들어오면 이 갈래는 사라진다. */
function QuestNpc({ name, state }: { name: string; state: GameState }) {
  const look = npcLook(name);
  if (!look) return <NpcSprite name={name} scale={3} />;
  return (
    <Avatar
      state={{
        ...state,
        avatar: look.avatar,
        haircol: look.haircol,
        equip: { ...state.equip, top: look.top, bottom: look.bottom, head: 'hnone', weapon: 'pen' },
      }}
      pose="idle"
      scale={3}
    />
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: U[2] }}>
      <T size="ui" color={COLORS.inkSoft}>
        {k}
      </T>
      <T size="uiBold" style={{ flexShrink: 1, textAlign: 'right' }}>
        {v}
      </T>
    </View>
  );
}
