import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import type { Quest } from '@/data/pack';
import { THEMES } from '@/data/themes';
import { WIKI, type WikiTopic } from '@/data/wiki';
import { useGame } from '@/store';
import { P } from '@/theme/palette';
import { COLORS, U } from '@/theme/tokens';
import { Card, PixelButton, SectionLabel, T } from '@/ui/Pixel';
import { cue } from '@/ui/feedback';

/* ══════════ 백과 ══════════
   문항은 하나씩 흩어져 있어 "지금 나는 어디쯤인가"가 안 보인다. 절차가 있는 주제를
   순서대로 세워 두면 다음에 뭘 해야 하는지가 한눈에 들어온다. */

type Hit =
  | { kind: 'topic'; w: WikiTopic; label: string; sub: string }
  | { kind: 'step'; w: WikiTopic; i: number; label: string; sub: string }
  | { kind: 'quest'; q: Quest; label: string; sub: string }
  | { kind: 'qa'; q: Quest; label: string; sub: string };

/** 항목이 수백 개가 아니니 색인은 과하다. 한 통에 넣고 훑는다. */
function search(qs: string, quests: Quest[]): Hit[] {
  const s = qs.trim().toLowerCase();
  if (!s) return [];
  const out: Hit[] = [];
  WIKI.forEach((w) => {
    if ((w.title + w.one).toLowerCase().indexOf(s) >= 0) {
      out.push({ kind: 'topic', w, label: w.title, sub: w.one });
    }
    w.steps.forEach((st, i) => {
      if ((st.t + st.d + (st.miss ?? '')).toLowerCase().indexOf(s) >= 0) {
        out.push({ kind: 'step', w, i, label: st.t, sub: `${w.title} · ${st.when}` });
      }
    });
  });
  quests.forEach((q) => {
    if (q.title.toLowerCase().indexOf(s) >= 0) {
      out.push({ kind: 'quest', q, label: q.title, sub: `퀘스트 · ${q.npc}` });
    }
    q.qs.forEach((x) => {
      if ((x.q + x.why).toLowerCase().indexOf(s) >= 0) {
        out.push({ kind: 'qa', q, label: x.q, sub: `문항 · ${q.title}` });
      }
    });
  });
  return out;
}

export function Wiki({ onStartQuest }: { onStartQuest: (q: Quest) => void }) {
  const { quests, pack, ev } = useGame();
  const [qs, setQs] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const all = quests();
  const hits = useMemo(() => search(qs, all), [qs, all]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          padding: U[3],
          backgroundColor: P.p2,
          borderBottomWidth: 3,
          borderBottomColor: COLORS.line,
        }}
      >
        <TextInput
          value={qs}
          onChangeText={setQs}
          placeholder="전세, 주휴수당, 연차…"
          placeholderTextColor={P.s1}
          accessibilityLabel="백과 검색"
          style={{
            fontFamily: 'Galmuri14',
            fontSize: 15,
            paddingVertical: 10,
            paddingHorizontal: U[3],
            backgroundColor: P.w,
            borderWidth: 3,
            borderColor: COLORS.line,
            color: COLORS.ink,
          }}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: U[4], gap: U[3], paddingBottom: U[6] }}>
        {qs.trim() ? (
          <>
            <SectionLabel>{hits.length ? `검색 결과 ${hits.length}건` : '찾는 말이 없습니다'}</SectionLabel>
            {hits.slice(0, 40).map((h, n) => (
              <PixelButton
                key={n}
                tone="plain"
                sound="pick"
                onPress={() => {
                  if (h.kind === 'quest' || h.kind === 'qa') {
                    onStartQuest(h.q);
                    return;
                  }
                  setQs('');
                  setOpen(h.w.id);
                }}
              >
                <View style={{ width: '100%', gap: 2 }}>
                  <T size="uiBold">{h.label}</T>
                  <T size="micro" color={COLORS.inkSoft}>
                    {h.sub}
                  </T>
                </View>
              </PixelButton>
            ))}
          </>
        ) : (
          WIKI.map((w) => (
            <Card key={w.id} style={{ gap: U[2] }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  cue('pick');
                  const next = open === w.id ? null : w.id;
                  setOpen(next);
                  if (next) ev('wiki_open', { id: w.id });
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: U[2] }}
              >
                <View style={{ backgroundColor: THEMES[w.theme].color, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <T size="uiBold">{w.k}</T>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T size="uiBold">{w.title}</T>
                  <T size="micro" color={COLORS.inkSoft}>
                    {w.one} · {w.steps.length}단계
                  </T>
                </View>
                <T size="micro" color={COLORS.inkSoft}>
                  {open === w.id ? '▲' : '▼'}
                </T>
              </Pressable>

              {open === w.id ? (
                <View style={{ gap: U[3], marginTop: U[2] }}>
                  {w.steps.map((st, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: U[3] }}>
                      {/* 왼쪽 세로줄에 점을 꿴다 */}
                      <View style={{ alignItems: 'center', width: 15 }}>
                        <View
                          style={{
                            width: 15,
                            height: 15,
                            backgroundColor: P.w,
                            borderWidth: 3,
                            borderColor: COLORS.line,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <View style={{ width: 5, height: 5, backgroundColor: P.g2 }} />
                        </View>
                        {i < w.steps.length - 1 ? (
                          <View style={{ flex: 1, width: 3, backgroundColor: P.p3, marginTop: 2 }} />
                        ) : null}
                      </View>
                      <View style={{ flex: 1, gap: 3, paddingBottom: U[2] }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: U[2], flexWrap: 'wrap' }}>
                          <T size="uiBold">{st.t}</T>
                          <View style={{ backgroundColor: P.k1, borderWidth: 2, borderColor: P.k3, paddingHorizontal: 5 }}>
                            <T size="micro" color={P.k4}>
                              {st.when}
                            </T>
                          </View>
                        </View>
                        <T size="body">{st.d}</T>
                        {st.miss ? (
                          <View
                            style={{
                              backgroundColor: P.p2,
                              borderLeftWidth: 4,
                              borderLeftColor: P.r1,
                              paddingVertical: 5,
                              paddingHorizontal: 7,
                            }}
                          >
                            <T size="micro" color={P.r3}>
                              놓치면 · {st.miss}
                            </T>
                          </View>
                        ) : null}
                        {st.q ? <StepQuest id={st.q} quests={all} onStart={onStartQuest} /> : null}
                      </View>
                    </View>
                  ))}
                  <T size="micro" color={COLORS.inkSoft}>
                    기준일 {pack.asOf} · 확인처{' '}
                    <T
                      size="micro"
                      color={P.k4}
                      style={{ textDecorationLine: 'underline' }}
                      onPress={() => Linking.openURL(w.src[1])}
                    >
                      {w.src[0]}
                    </T>
                    {'\n'}제도는 바뀝니다. 실제 결정 전에 원문을 확인하세요.
                  </T>
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function StepQuest({
  id,
  quests,
  onStart,
}: {
  id: string;
  quests: Quest[];
  onStart: (q: Quest) => void;
}) {
  const q = quests.find((x) => x.id === id);
  if (!q) return null;
  return (
    <PixelButton
      label={`관련 퀘스트 · ${q.title}`}
      sound="pick"
      onPress={() => onStart(q)}
      style={{ alignSelf: 'flex-start', minHeight: 36, paddingHorizontal: U[3] }}
    />
  );
}
