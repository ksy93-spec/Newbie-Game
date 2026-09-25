import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Quest } from '@/data/pack';
import { THEMES, THEME_ORDER } from '@/data/themes';
import { TIERS } from '@/data/tiers';
import { allItems } from '@/data/items';
import { OB, deferredKey } from '@/data/onboarding';
import { canClaim, dailyCoin, dailyMult, pickDaily, todayLeft, todayList } from '@/core/daily';
import { whyLine } from '@/core/curate';
import { reviewQuest, type ReviewQuest } from '@/core/review';
import { needXp, totals } from '@/core/state';
import { afterClaim } from '@/notify';
import { Avatar, AvatarHead } from '@/sprite/Avatar';
import { PET_FACES_RIGHT, PetSprite } from '@/sprite/Cast';
import { PETS } from '@/data/items';
import { useGame } from '@/store';
import { P } from '@/theme/palette';
import { COLORS, U } from '@/theme/tokens';
import { STAGE_H, STAND, StageBack } from '@/ui/BattleFx';
import { Bar, Card, Chip, PixelButton, SectionLabel, StreakPips, T } from '@/ui/Pixel';

export function Home({ onStartQuest }: { onStartQuest: (q: Quest | ReviewQuest) => void }) {
  const { s, set, ev, pack, quests } = useGame();
  const [frame, setFrame] = useState(0);
  const t = totals(s);
  const need = needXp(s.lv);
  const list = todayList(quests(), s);
  const rq = reviewQuest(s, quests(), pack.asOf);
  const left = todayLeft(quests(), s);
  const deferred = deferredKey(s);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % 4), 190);
    return () => clearInterval(id);
  }, []);

  return (
    <ScrollView contentContainerStyle={{ backgroundColor: COLORS.bg, paddingBottom: U[6] }}>
      {/* HUD */}
      <View style={{ padding: U[3], gap: U[2], backgroundColor: COLORS.card }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: U[2] }}>
          <AvatarHead state={s} scale={1} />
          <View style={{ flex: 1 }}>
            <T size="uiBold">
              {s.status} Lv.{s.lv}
            </T>
            <T size="micro" color={COLORS.inkSoft}>
              {whyLine(s)}
            </T>
          </View>
          <Chip>공 {t.atk}</Chip>
          <Chip>방 {t.def}</Chip>
          <Chip tone={P.y1}>￦ {s.coin}</Chip>
        </View>
        <Bar value={s.xp} max={need} color={P.g2} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T size="micro" color={COLORS.inkSoft}>
            NEXT Lv.{s.lv + 1}
          </T>
          <T size="micro" color={COLORS.inkSoft}>
            {s.xp} / {need} XP
          </T>
        </View>
      </View>

      {/* 대기실 */}
      <View style={{ height: STAGE_H, backgroundColor: COLORS.sky, justifyContent: 'flex-end', overflow: 'hidden' }}>
        <StageBack />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: U[2],
            marginBottom: STAND,
          }}
        >
          {/* 아바타 캔버스는 64칸 정사각이라 좌우로 빈 칸이 남는다. 펫을 그만큼 당겨 붙인다.
              펫 손그림은 왼쪽을 보고 아바타는 오른쪽을 본다. 뒤집지 않으면 둘이 등지고 선다. */}
          <View style={{ marginRight: -30 }}>
            <PetSprite kind={PETS[s.equip.pet]?.kind} scale={2} flip={!PET_FACES_RIGHT} />
          </View>
          <Avatar state={s} pose="walk" frame={frame} scale={3} flip />
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: U[2],
          paddingVertical: U[2],
          backgroundColor: COLORS.card,
          borderBottomWidth: 3,
          borderBottomColor: COLORS.line,
        }}
      >
        <T size="body">{TIERS[s.tier].name}</T>
        <Chip>방어 {t.def}</Chip>
      </View>

      <View style={{ padding: U[4], gap: U[4] }}>
        {/* 출석 · 연속 */}
        <View style={{ gap: U[2] }}>
          <SectionLabel>
            연속 {s.streak}일{s.best > s.streak ? ` · 최고 ${s.best}일` : ''}
            {dailyMult(s) > 1 ? ` · 보너스 ${dailyMult(s)}배` : ' · 3일이면 2배'}
          </SectionLabel>
          <StreakPips streak={s.streak} />
          {canClaim(s) ? (
            <PixelButton
              label={`오늘 출석 받기 · ￦${dailyCoin(s)}`}
              sound="coin"
              onPress={() => {
                const amount = dailyCoin(s);
                set((st) => {
                  st.coin += amount;
                  st.claimed = st.day;
                });
                ev('daily_claim', { streak: s.streak, coin: amount });
                afterClaim(s).catch(() => {});
              }}
            />
          ) : (
            <Card>
              <T size="uiBold">오늘 출석 완료</T>
              <T size="micro" color={COLORS.inkSoft}>
                내일 오면 연속 {s.streak + 1}일
                {s.streak + 1 === 3 ? ' · 보너스 2배 시작' : s.streak + 1 === 7 ? ' · 보너스 3배 시작' : ''}
              </T>
            </Card>
          )}
        </View>

        {/* 테마 다섯 */}
        <View style={{ flexDirection: 'row', gap: U[1] }}>
          {THEME_ORDER.map((k) => (
            <View key={k} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
              <T size="uiBold">{THEMES[k].k}</T>
              <View style={{ width: '100%' }}>
                <Bar value={s.stats[k]} color={THEMES[k].color} />
              </View>
              <T size="micro" color={COLORS.inkSoft}>
                {s.stats[k]}
              </T>
            </View>
          ))}
        </View>

        {/* 오늘의 퀘스트 */}
        <View style={{ gap: U[2] }}>
          <SectionLabel>
            오늘의 퀘스트 {list.length - left} / {list.length} · {whyLine(s)}
          </SectionLabel>
          {rq ? <QuestRow quest={rq} onPress={() => onStartQuest(rq)} /> : null}
          {list.map((q) => (
            <QuestRow
              key={q.id}
              quest={q}
              done={s.todayDone.indexOf(q.id) >= 0}
              onPress={() => onStartQuest(q)}
            />
          ))}
          {!list.length && !rq ? (
            <Card>
              <T size="uiBold">오늘 몫을 다 했습니다</T>
              <T size="micro" color={COLORS.inkSoft}>
                내일 새 퀘스트가 열립니다. 퀘스트 탭에서 미리 풀 수도 있습니다.
              </T>
            </Card>
          ) : null}
        </View>

        {/* 미룬 프로필 질문 */}
        {deferred && s.done.length ? (
          <Card>
            <T size="uiBold">{OB[deferred].q}</T>
            <T size="micro" color={COLORS.inkSoft}>
              {OB[deferred].hint}
            </T>
            <View style={{ gap: U[2], marginTop: U[2] }}>
              {OB[deferred].o.map(([val, label, note]) => (
                <PixelButton
                  key={String(val)}
                  tone="plain"
                  sound="pick"
                  onPress={() => {
                    set((st) => {
                      (st as unknown as Record<string, unknown>)[deferred] = val;
                      st.todayQ = pickDaily(quests(), st);
                    });
                    ev('profile_fill', { k: deferred });
                  }}
                >
                  <View style={{ width: '100%', gap: 2 }}>
                    <T size="uiBold">{label}</T>
                    <T size="micro" color={COLORS.inkSoft}>
                      {note}
                    </T>
                  </View>
                </PixelButton>
              ))}
            </View>
          </Card>
        ) : null}
      </View>
    </ScrollView>
  );
}

export function QuestRow({
  quest,
  done,
  onPress,
}: {
  quest: Quest | ReviewQuest;
  done?: boolean;
  onPress: () => void;
}) {
  const isReview = 'keys' in quest;
  const theme = THEMES[quest.theme];
  const reward = quest.reward ? allItems(quest.reward) : null;
  return (
    <PixelButton tone="plain" disabled={done} onPress={onPress} sound="pick">
      <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', gap: U[2] }}>
        <View style={{ backgroundColor: isReview ? P.v1 : theme.color, paddingHorizontal: 6, paddingVertical: 2 }}>
          <T size="uiBold">{isReview ? '복' : theme.k}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T size="uiBold" numberOfLines={1}>
            {quest.title}
          </T>
          <T size="micro" color={COLORS.inkSoft} numberOfLines={1}>
            {done
              ? '완료'
              : isReview
                ? '맞히면 다음 복습 간격이 늘어납니다'
                : quest.npc + (reward ? ` · 보상 ${reward.name}` : '')}
          </T>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T size="micro" color={P.y3}>
            +{quest.xp} XP
          </T>
          <T size="micro" color={P.y3}>
            ￦{quest.coin}
          </T>
        </View>
      </View>
    </PixelButton>
  );
}
