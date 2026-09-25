import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Constants from 'expo-constants';
import { DISCLAIMER } from '@/data/pack';
import { THEMES, THEME_ORDER } from '@/data/themes';
import { TIERS } from '@/data/tiers';
import { dayGap, dayKey } from '@/core/day';
import { funnel } from '@/core/events';
import { reviewDue } from '@/core/review';
import { scheduleDaily, sendTest } from '@/notify';
import { useGame } from '@/store';
import { COLORS, U } from '@/theme/tokens';
import { Card, PixelButton, SectionLabel, T } from '@/ui/Pixel';

export function Codex() {
  const { s, set, pack, packOrigin, reset } = useGame();
  const [note, setNote] = useState('');
  const f = funnel(s, s.first ? dayGap(s.first, dayKey()) : 0);
  const qCount = pack.quests.reduce((a, q) => a + q.qs.length, 0);

  return (
    <ScrollView contentContainerStyle={{ backgroundColor: COLORS.bg, padding: U[4], gap: U[4], paddingBottom: U[6] }}>
      <View style={{ gap: U[2] }}>
        <SectionLabel>거처 · 해금된 곳은 골라서 살 수 있습니다</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: U[2] }}>
          {TIERS.map((t, i) => {
            const unlocked = i <= s.peak;
            return (
              <PixelButton
                key={t.name}
                tone={i === s.tier ? 'primary' : 'plain'}
                disabled={!unlocked}
                sound="pick"
                onPress={() => set((st) => void (st.tier = i))}
                style={{ width: '47%' }}
              >
                <View style={{ alignItems: 'center' }}>
                  <T size="uiBold">{t.name}</T>
                  <T size="micro" color={COLORS.inkSoft}>
                    방어 {t.def}
                  </T>
                </View>
              </PixelButton>
            );
          })}
        </View>
      </View>

      <View style={{ gap: U[2] }}>
        <SectionLabel>테마 다섯</SectionLabel>
        {THEME_ORDER.map((k) => (
          <Card key={k}>
            <T size="uiBold" style={{ color: THEMES[k].color }}>
              {THEMES[k].k} · {THEMES[k].full} · {THEMES[k].role}
            </T>
            <T size="micro" color={COLORS.inkSoft}>
              {THEMES[k].desc}
            </T>
          </Card>
        ))}
      </View>

      <View style={{ gap: U[2] }}>
        <SectionLabel>설정</SectionLabel>
        <Toggle
          label="효과음"
          on={s.snd}
          onChange={(v) => set((st) => void (st.snd = v))}
        />
        <Toggle label="진동" on={s.vib} onChange={(v) => set((st) => void (st.vib = v))} />
        <Toggle
          label="출석 알림"
          note="정한 시각에 아직 출석하지 않았으면 하루 한 번 알립니다"
          on={s.notif.on}
          onChange={(v) => {
            set((st) => void (st.notif.on = v));
            scheduleDaily({ ...s, notif: { ...s.notif, on: v } }).catch(() => {});
          }}
        />
        {s.notif.on ? (
          <>
            <View style={{ flexDirection: 'row', gap: U[2] }}>
              {[
                [8, '아침 8시'],
                [12, '점심 12시'],
                [20, '저녁 8시'],
              ].map(([h, label]) => (
                <PixelButton
                  key={String(h)}
                  tone={s.notif.hour === h ? 'primary' : 'plain'}
                  label={String(label)}
                  sound="pick"
                  style={{ flex: 1, paddingHorizontal: 2 }}
                  onPress={() => {
                    set((st) => void (st.notif.hour = h as number));
                    scheduleDaily({ ...s, notif: { ...s.notif, hour: h as number } }).catch(() => {});
                  }}
                />
              ))}
            </View>
            <PixelButton
              tone="plain"
              label="알림 테스트"
              onPress={() => {
                sendTest(s)
                  .then((ok) => setNote(ok ? '2초 뒤에 옵니다' : '알림 권한이 꺼져 있습니다'))
                  .catch(() => setNote('알림을 보내지 못했습니다'));
              }}
            />
            {note ? (
              <T size="micro" color={COLORS.inkSoft}>
                {note}
              </T>
            ) : null}
          </>
        ) : null}
      </View>

      <View style={{ gap: U[2] }}>
        <SectionLabel>문항 묶음</SectionLabel>
        <Card>
          <Kv k="버전" v={pack.ver} />
          <Kv k="기준일" v={pack.asOf} />
          <Kv k="출처" v={packOrigin} />
          <Kv k="문항" v={`${qCount}개 · 퀘스트 ${pack.quests.length}개`} />
          <Kv k="복습 대기" v={`${s.review.length}문항 · 오늘 ${reviewDue(s).length}문항`} />
          <T size="micro" color={COLORS.inkSoft}>
            {DISCLAIMER}
          </T>
        </Card>
      </View>

      <View style={{ gap: U[2] }}>
        <SectionLabel>계측 · 개발용</SectionLabel>
        <Card>
          <Kv k="설치 후" v={`${f.dayN}일차 · 방문 ${f.visitedDays}일`} />
          <Kv k="연속" v={`${s.streak}일 · 최고 ${s.best}일`} />
          <Kv k="온보딩 완료" v={String(f.counts.onboard_done ?? 0)} />
          <Kv
            k="퀘스트 시작 → 완료"
            v={`${f.counts.quest_start ?? 0} → ${f.counts.quest_finish ?? 0}`}
          />
          <Kv k="문항 응답" v={String(f.counts.quest_answer ?? 0)} />
          <Kv k="출석 수령" v={String(f.counts.daily_claim ?? 0)} />
          <Kv k="오늘 완주" v={String(f.counts.daily_complete ?? 0)} />
          <Kv k="이벤트 총계" v={`${s.log.length}건`} />
          <Kv k="앱 버전" v={Constants.expoConfig?.version ?? '-'} />
        </Card>
      </View>

      <PixelButton tone="danger" label="처음부터 다시" onPress={reset} />
      <T size="micro" color={COLORS.inkSoft} style={{ textAlign: 'center' }}>
        서체 Galmuri © quiple · SIL OFL 1.1{'\n'}프로토타입 · 문항은 검수 전 초안입니다
      </T>
    </ScrollView>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: U[2] }}>
      <T size="ui" color={COLORS.inkSoft}>
        {k}
      </T>
      <T size="ui" style={{ flexShrink: 1, textAlign: 'right' }}>
        {v}
      </T>
    </View>
  );
}

function Toggle({
  label,
  note,
  on,
  onChange,
}: {
  label: string;
  note?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <PixelButton tone={on ? 'primary' : 'plain'} sound="pick" onPress={() => onChange(!on)}>
      <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', gap: U[3] }}>
        <T size="uiBold">{on ? 'ON' : 'OFF'}</T>
        <View style={{ flex: 1 }}>
          <T size="uiBold">{label}</T>
          {note ? (
            <T size="micro" color={COLORS.inkSoft}>
              {note}
            </T>
          ) : null}
        </View>
      </View>
    </PixelButton>
  );
}
