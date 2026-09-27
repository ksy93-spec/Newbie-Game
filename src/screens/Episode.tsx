import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, Linking, ScrollView, View } from 'react-native';
import type { EpOption, Episode as Ep } from '@/data/episodes';
import { THEMES } from '@/data/themes';
import { finishEpisode, type EpisodeResult } from '@/core/progress';
import { Avatar } from '@/sprite/Avatar';
import { NpcSprite } from '@/sprite/Cast';
import { useGame } from '@/store';
import { P } from '@/theme/palette';
import { COLORS, U } from '@/theme/tokens';
import { Shadow, StageBack } from '@/ui/BattleFx';
import { ChoiceBox, MessageBox } from '@/ui/MessageBox';
import { Card, Chip, PixelButton, T } from '@/ui/Pixel';
import { cue } from '@/ui/feedback';

/* ══════════ 사건 ══════════
   퀘스트는 "아는가"를 묻고 보스는 "안 넘어가는가"를 묻는다. 둘 다 한 문항에서 끝난다.
   실제로 손해가 나는 자리는 판단이 쌓이는 자리라, 계약 하루·알바 한 달·첫 월급 세 달을
   순서대로 걷게 하고 고른 것들이 합쳐져 결말이 갈리게 했다. */

const SCREEN_H = Dimensions.get('window').height;
const STAGE_H = Math.round(SCREEN_H * 0.24);

export function Episode({ ep, onExit }: { ep: Ep; onExit: () => void }) {
  const { s, set, ev } = useGame();
  const [i, setI] = useState(0);
  const [risk, setRisk] = useState(0);
  const [day, setDay] = useState(0);
  const [spent, setSpent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState<EpisodeResult | null>(null);
  const started = useRef(false);

  if (!started.current) {
    started.current = true;
    ev('ep_start', { id: ep.id });
  }

  const beat = ep.beats[i];

  const pick = useCallback(
    (n: number) => {
      if (picked !== null) return;
      const o: EpOption = beat.opts[n];
      setPicked(n);
      cue(o.risk ? 'hit' : 'good');
      ev('ep_pick', { id: ep.id, i, risk: o.risk });
      setRisk((r) => r + o.risk);
      if (o.days) setDay((d) => d + o.days!);
      if (o.cost) setSpent((c) => c + o.cost!);
    },
    [beat, picked, i, ep.id, ev],
  );

  function next() {
    const n = i + 1;
    setPicked(null);
    if (n < ep.beats.length) {
      setI(n);
      return;
    }
    let out!: EpisodeResult;
    set((st) => {
      out = finishEpisode(st, ep, risk);
    });
    cue(out.tier === 0 ? 'win' : 'hit');
    setDone(out);
  }

  if (done) return <Ending ep={ep} out={done} risk={risk} day={day} spent={spent} onExit={onExit} />;

  const o = picked === null ? null : beat.opts[picked];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* 머리말 — 지금까지 지른 것들 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: U[2],
          paddingHorizontal: U[3],
          paddingVertical: U[2],
          borderBottomWidth: 3,
          borderBottomColor: COLORS.line,
          backgroundColor: COLORS.card,
        }}
      >
        <PixelButton
          label="‹ 나가기"
          tone="plain"
          onPress={onExit}
          style={{ minHeight: 40, paddingHorizontal: U[2], borderWidth: 0 }}
        />
        <T size="uiBold" style={{ flex: 1 }}>
          {ep.title}
        </T>
        <Chip>
          D+{day}
          {spent ? ` · -${spent}만` : ''}
        </Chip>
        <Chip tone={risk >= 5 ? P.r1 : risk >= 2 ? P.y1 : undefined}>위험 {risk}</Chip>
      </View>

      {/* 무대 */}
      <View style={{ height: STAGE_H, backgroundColor: COLORS.sky, overflow: 'hidden' }}>
        <StageBack ground={Math.round(STAGE_H * 0.5)} />
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            paddingBottom: U[3],
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Avatar state={s} pose="idle" scale={2} />
            <Shadow width={52} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <NpcSprite name={ep.npc} scale={2} flip />
            <Shadow width={52} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: U[3], gap: U[3], paddingBottom: U[6] }}>
        <MessageBox text={beat.t} speaker={beat.who ?? ep.npc} minHeight={84} />

        {picked === null ? (
          <ChoiceBox
            options={beat.opts.map((x) => x.a + costLabel(x))}
            onPick={pick}
            revealed={false}
            correct={-1}
            picked={null}
          />
        ) : (
          <>
            <View
              style={{
                backgroundColor: P.w,
                borderWidth: 3,
                borderColor: COLORS.line,
                borderLeftWidth: 8,
                borderLeftColor: o!.risk ? P.r1 : P.g2,
                padding: U[3],
                gap: U[2],
              }}
            >
              <T size="uiBold" color={o!.risk ? P.r3 : P.g3}>
                {o!.risk ? '대가가 남는다' : '좋은 판단'}
              </T>
              <T size="body">{o!.note}</T>
            </View>
            <PixelButton
              label={i + 1 >= ep.beats.length ? '결말 보기' : '다음'}
              tone="primary"
              onPress={next}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function costLabel(o: EpOption): string {
  const bits: string[] = [];
  if (o.days) bits.push(`+${o.days}일`);
  if (o.cost) bits.push(`-${o.cost}만원`);
  return bits.length ? `\n${bits.join(' · ')}` : '';
}

function Ending({
  ep,
  out,
  risk,
  day,
  spent,
  onExit,
}: {
  ep: Ep;
  out: EpisodeResult;
  risk: number;
  day: number;
  spent: number;
  onExit: () => void;
}) {
  const { s } = useGame();
  const end = ep.ends[out.tier];
  return (
    <ScrollView
      contentContainerStyle={{
        padding: U[4],
        gap: U[3],
        alignItems: 'center',
        backgroundColor: COLORS.bg,
        flexGrow: 1,
      }}
    >
      <Avatar state={s} pose={out.tier === 0 ? 'cheer' : 'idle'} scale={3} />
      <T size="display" color={out.tier === 0 ? P.g3 : out.tier === 1 ? P.y2 : P.r2}>
        {end.big}
      </T>
      <Card style={{ width: '100%' }}>
        <T size="body">{end.t}</T>
        <T size="micro" color={COLORS.inkSoft}>
          위험 {risk}
          {day ? ` · 걸린 날 ${day}일` : ''}
          {spent ? ` · 쓴 돈 ${spent}만원` : ''}
        </T>
      </Card>
      <Card style={{ width: '100%' }}>
        {out.better ? (
          <>
            <T size="uiBold">
              +{out.xp} XP · ￦{out.coin} · {THEMES[ep.stat].k} +{out.stat}
            </T>
            <T size="micro" color={COLORS.inkSoft}>
              이 사건의 최고 기록을 새로 세웠습니다.
            </T>
          </>
        ) : (
          <>
            <T size="uiBold">이번 판은 보상이 없습니다</T>
            <T size="micro" color={COLORS.inkSoft}>
              더 나은 결말을 내면 그 차액만 들어옵니다.
            </T>
          </>
        )}
      </Card>
      <T size="micro" color={COLORS.inkSoft}>
        확인처{' '}
        <T
          size="micro"
          color={P.k4}
          style={{ textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL(ep.src[1])}
        >
          {ep.src[0]}
        </T>
        {'\n'}제도는 바뀝니다. 실제 결정 전에 원문을 확인하세요.
      </T>
      <PixelButton label="돌아가기" onPress={onExit} style={{ width: '100%' }} />
    </ScrollView>
  );
}
