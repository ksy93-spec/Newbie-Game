import React from 'react';
import { ScrollView, View } from 'react-native';
import { HAIRC, HAIRC_NAME } from '@/data/hair';
import { SLOTS, allItems, poolFor, type Slot } from '@/data/items';
import { TIERS } from '@/data/tiers';
import { totals } from '@/core/state';
import { AVATARS, type AvatarId } from '@/sprite/avatars';
import { Avatar } from '@/sprite/Avatar';
import { useGame } from '@/store';
import { P } from '@/theme/palette';
import { COLORS, U } from '@/theme/tokens';
import { Card, Chip, PixelButton, SectionLabel, T } from '@/ui/Pixel';

/** 캐릭터 · 상점 공용. mode='shop'이면 값을 치르고 산다. */
export function Character({ mode = 'char' }: { mode?: 'char' | 'shop' }) {
  const { s, set, ev } = useGame();
  const t = totals(s);

  function equip(slot: Slot, id: string) {
    set((st) => {
      st.equip[slot] = id;
    });
    ev('equip', { slot, id });
  }

  function buy(slot: Slot, id: string, cost: number) {
    set((st) => {
      st.coin -= cost;
      st.owned.push(id);
      st.equip[slot] = id;
    });
    ev('buy', { slot, id, cost });
  }

  return (
    <ScrollView contentContainerStyle={{ backgroundColor: COLORS.bg, paddingBottom: U[6] }}>
      <View style={{ backgroundColor: COLORS.sky, alignItems: 'center', padding: U[3], gap: U[2] }}>
        <Avatar state={s} pose="idle" scale={3} />
        <View style={{ flexDirection: 'row', gap: U[2] }}>
          <Chip>공격 {t.atk}</Chip>
          <Chip>방어 {t.def}</Chip>
          <Chip tone={P.y1}>￦ {s.coin}</Chip>
        </View>
        <T size="micro" color={COLORS.inkSoft}>
          거처 {TIERS[s.tier].def} + 장비 {t.gear} = 방어 {t.def}
        </T>
      </View>

      <View style={{ padding: U[4], gap: U[4] }}>
        {mode === 'char' ? (
          <>
            <View style={{ gap: U[2] }}>
              <SectionLabel>아바타</SectionLabel>
              <View style={{ flexDirection: 'row', gap: U[2] }}>
                {(Object.keys(AVATARS) as AvatarId[]).map((id) => (
                  <PixelButton
                    key={id}
                    tone={s.avatar === id ? 'primary' : 'plain'}
                    label={AVATARS[id].name}
                    sound="pick"
                    onPress={() => set((st) => void (st.avatar = id))}
                    style={{ flex: 1 }}
                  />
                ))}
              </View>
            </View>

            <View style={{ gap: U[2] }}>
              <SectionLabel>머리 색</SectionLabel>
              <View style={{ flexDirection: 'row', gap: U[2], flexWrap: 'wrap' }}>
                <PixelButton
                  tone={s.haircol < 0 ? 'primary' : 'plain'}
                  label="원본"
                  sound="pick"
                  onPress={() => set((st) => void (st.haircol = -1))}
                />
                {HAIRC.map((c, i) => (
                  <PixelButton
                    key={i}
                    tone="plain"
                    sound="pick"
                    onPress={() => set((st) => void (st.haircol = i))}
                    style={{
                      backgroundColor: c.b,
                      minWidth: 52,
                      borderBottomWidth: s.haircol === i ? 10 : 6,
                      borderBottomColor: s.haircol === i ? P.y1 : COLORS.line,
                    }}
                  >
                    <T size="micro" color={P.p0}>
                      {HAIRC_NAME[i]}
                    </T>
                  </PixelButton>
                ))}
              </View>
            </View>
          </>
        ) : (
          <Card>
            <T size="uiBold">시연 모드</T>
            <T size="micro" color={COLORS.inkSoft}>
              전 품목이 해금되어 있습니다. 눌러서 바로 장착해 보세요. 실제 앱에서는 퀘스트로 모은 코인으로
              구매합니다.
            </T>
          </Card>
        )}

        {SLOTS.map(([slot, label]) => {
          const pool = poolFor(slot);
          const ids = Object.keys(pool).filter(
            (id) => pool[id].slot === slot && (mode === 'char' || pool[id].cost > 0),
          );
          if (!ids.length) return null;
          return (
            <View key={slot} style={{ gap: U[2] }}>
              <SectionLabel>
                {label}
                {['pet', 'mount'].indexOf(slot) < 0 ? ' · 모습이 바로 바뀝니다' : ''}
              </SectionLabel>
              {ids.map((id) => {
                const it = pool[id];
                const have = s.owned.indexOf(id) >= 0;
                const on = s.equip[slot] === id;
                const affordable = s.coin >= it.cost;
                return (
                  <PixelButton
                    key={id}
                    tone={on ? 'primary' : 'plain'}
                    sound="pick"
                    disabled={mode === 'char' ? !have : !have && !affordable}
                    onPress={() => (have ? equip(slot, id) : buy(slot, id, it.cost))}
                  >
                    <View style={{ flexDirection: 'row', width: '100%', gap: U[2] }}>
                      <View style={{ flex: 1 }}>
                        <T size="uiBold">{it.name}</T>
                        <T size="micro" color={COLORS.inkSoft} numberOfLines={2}>
                          {it.desc}
                        </T>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        {it.atk ? (
                          <T size="micro" color={P.r2}>
                            공 {it.atk > 0 ? '+' : ''}
                            {it.atk}
                          </T>
                        ) : null}
                        {it.def ? (
                          <T size="micro" color={P.k4}>
                            방 {it.def > 0 ? '+' : ''}
                            {it.def}
                          </T>
                        ) : null}
                        {it.cost > 0 ? (
                          <T size="micro" color={P.y3}>
                            {have ? '보유' : `￦${it.cost}`}
                          </T>
                        ) : null}
                      </View>
                    </View>
                  </PixelButton>
                );
              })}
            </View>
          );
        })}

        <Card>
          <T size="micro" color={COLORS.inkSoft}>
            장착한 장비는 {allItems(s.equip.top)?.name} · {allItems(s.equip.bottom)?.name}입니다.
          </T>
        </Card>
      </View>
    </ScrollView>
  );
}
