import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { Boss as BossDef, Quest } from '@/data/pack';
import { curated } from '@/core/curate';
import type { ReviewQuest } from '@/core/review';
import { bossCleared, bossPlan, bossReady } from '@/core/combat';
import { ensureChannel, scheduleDaily } from '@/notify';
import { useGame } from '@/store';
import { Character } from '@/screens/Character';
import { Codex } from '@/screens/Codex';
import { Wiki } from '@/screens/Wiki';
import { Home, QuestRow } from '@/screens/Home';
import { Boss } from '@/screens/Boss';
import { Onboarding } from '@/screens/Onboarding';
import { QuestRun } from '@/screens/QuestRun';
import { THEMES } from '@/data/themes';
import { COLORS, U } from '@/theme/tokens';
import { Card, PixelButton, SectionLabel, T } from '@/ui/Pixel';
import { primeAudio, releaseAudio, setFeedbackPrefs } from '@/ui/feedback';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Tab = 'home' | 'quests' | 'wiki' | 'char' | 'shop' | 'codex';
const TABS: [Tab, string][] = [
  ['home', '홈'],
  ['quests', '퀘스트'],
  ['wiki', '백과'],
  ['char', '캐릭터'],
  ['shop', '상점'],
  ['codex', '도감'],
];

export default function App() {
  const { s, ready, boot, ev, quests, pack } = useGame();
  const [tab, setTab] = useState<Tab>('home');
  const [run, setRun] = useState<Quest | ReviewQuest | null>(null);
  const [fight, setFight] = useState<BossDef | null>(null);

  const [fontsLoaded] = useFonts({
    Galmuri14: require('./assets/fonts/Galmuri14.ttf'),
    Galmuri11: require('./assets/fonts/Galmuri11.ttf'),
    'Galmuri11-Bold': require('./assets/fonts/Galmuri11-Bold.ttf'),
    Galmuri9: require('./assets/fonts/Galmuri9.ttf'),
  });

  useEffect(() => {
    boot();
    ensureChannel().catch(() => {});
    primeAudio();          // 무음 스위치를 켠 아이폰에서도 효과음이 나게 한다
    return releaseAudio;
  }, [boot]);

  useEffect(() => {
    setFeedbackPrefs({ snd: s.snd, vib: s.vib });
  }, [s.snd, s.vib]);

  useEffect(() => {
    if (ready && s.notif.on) scheduleDaily(s).catch(() => {});
    // 알림 예약은 설정이 바뀔 때만 다시 건다
  }, [ready, s.notif.on, s.notif.hour]);

  useEffect(() => {
    if (ready && fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [ready, fontsLoaded]);

  if (!ready || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!s.onboarded) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <StatusBar style="dark" />
          <Onboarding />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (fight) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <StatusBar style="dark" />
          <Boss boss={fight} onExit={() => setFight(null)} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (run) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <StatusBar style="dark" />
          <QuestRun quest={run} onExit={() => setRun(null)} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  function start(q: Quest | ReviewQuest) {
    ev('quest_start', { id: q.id, theme: q.theme, n: q.qs.length });
    setRun(q);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }}>
          {tab === 'home' ? <Home onStartQuest={start} /> : null}
          {tab === 'quests' ? <AllQuests onStart={start} onFight={setFight} /> : null}
          {tab === 'wiki' ? <Wiki onStartQuest={start} /> : null}
          {tab === 'char' ? <Character mode="char" /> : null}
          {tab === 'shop' ? <Character mode="shop" /> : null}
          {tab === 'codex' ? <Codex /> : null}
        </View>
        <View style={{ flexDirection: 'row', borderTopWidth: 3, borderTopColor: COLORS.line }}>
          {TABS.map(([id, label]) => (
            <PixelButton
              key={id}
              tone={tab === id ? 'primary' : 'plain'}
              label={label}
              style={{ flex: 1, borderWidth: 0, borderBottomWidth: 0, minHeight: 56, paddingHorizontal: 0 }}
              onPress={() => {
                setTab(id);
                ev('tab_view', { id });
              }}
            />
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function AllQuests({ onStart, onFight }: { onStart: (q: Quest) => void; onFight: (b: BossDef) => void }) {
  const { s, pack, quests } = useGame();
  const list = curated(quests(), s);
  return (
    <ScrollView contentContainerStyle={{ padding: U[4], gap: U[3], backgroundColor: COLORS.bg }}>
      <SectionLabel>보스</SectionLabel>
      {pack.bosses.map((b) => {
        const plan = bossPlan(s, b);
        const ready = bossReady(s, b);
        const done = bossCleared(s, b);
        return (
          <Card key={b.id}>
            <T size="uiBold">
              {b.name}
              {done ? ' · 격파' : ''}
            </T>
            <T size="micro" color={COLORS.inkSoft}>
              HP {b.hp} · 공격 {b.atk} · 문항 {b.qs.length}개{'\n'}
              내 공격 {plan.atk} → 한 방 {plan.dmg} · {plan.need}개 맞추면 승리{'\n'}
              내 방어 {plan.def} → 오답 {plan.take} 피해 · {plan.survive}번까지 버팀{'\n'}
              {done
                ? '이미 물리쳤습니다. 다시 붙을 수 있습니다.'
                : s.stats[b.stat] >= b.need
                  ? '패배하면 거처 해금이 한 단계 내려갑니다.'
                  : `시연이라 바로 붙을 수 있습니다. 실제 앱은 ${THEMES[b.stat].k} 스탯 ${b.need}부터 (지금 ${s.stats[b.stat]})`}
            </T>
            <PixelButton
              label={ready ? '맞선다' : '아직 이르다'}
              tone={ready ? 'danger' : 'plain'}
              disabled={!ready}
              onPress={() => onFight(b)}
            />
          </Card>
        );
      })}
      <SectionLabel>전체 퀘스트</SectionLabel>
      {list.map((q) => (
        <QuestRow key={q.id} quest={q} done={s.done.indexOf(q.id) >= 0} onPress={() => onStart(q)} />
      ))}
    </ScrollView>
  );
}
