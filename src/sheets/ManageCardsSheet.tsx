import { Banknote, CalendarDays, ChevronDown, ChevronUp, PiggyBank, RotateCcw, Wallet, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { IconDisc } from '@/components/IconDisc';
import { PillButton } from '@/components/PillButton';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { useDashboardCardsStore, type SummaryCardId } from '@/store/dashboardCards';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface CardMeta {
  icon: LucideIcon;
  titleKey: string;
  subtitleKey: string;
}

const CARD_META: Record<SummaryCardId, CardMeta> = {
  today: {
    icon: CalendarDays,
    titleKey: 'Today',
    subtitleKey: "Today's spending total",
  },
  balance: {
    icon: Wallet,
    titleKey: 'Balance',
    subtitleKey: 'Monthly balance & income',
  },
  savings: {
    icon: PiggyBank,
    titleKey: 'Savings',
    subtitleKey: 'Current month savings progress',
  },
  income: {
    icon: Banknote,
    titleKey: 'Income',
    subtitleKey: 'Monthly income total & sources',
  },
};

export function ManageCardsSheet({ sheetRef }: { sheetRef: SheetRef }) {
  const t = useT();
  const theme = useTheme();
  const cards = useDashboardCardsStore((state) => state.cards);
  const toggleCard = useDashboardCardsStore((state) => state.toggleCard);
  const moveCard = useDashboardCardsStore((state) => state.moveCard);
  const resetCards = useDashboardCardsStore((state) => state.resetCards);

  const visibleCount = cards.filter((c) => c.visible).length;

  return (
    <Sheet sheetRef={sheetRef} title={t('Manage cards')}>
      <View style={styles.container}>
        <Txt variant="label" faint={0.6} style={styles.hint}>
          {t('Choose which cards appear and change their order.')}
        </Txt>

        <View style={[styles.cardList, { borderColor: theme.hairline, backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }]}>
          {cards.map((item, index) => {
            const meta = CARD_META[item.id];
            const isFirst = index === 0;
            const isLast = index === cards.length - 1;
            const isDivider = index < cards.length - 1;
            const isOnlyVisible = item.visible && visibleCount <= 1;

            return (
              <View
                key={item.id}
                style={[
                  styles.cardRow,
                  isDivider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.hairline },
                  !item.visible && { opacity: 0.5 },
                ]}>
                <IconDisc icon={meta.icon} color={theme.accent} size={36} />

                <View style={styles.cardInfo}>
                  <Txt weight="medium" numberOfLines={1}>
                    {t(meta.titleKey)}
                  </Txt>
                  <Txt variant="caption" faint={0.55} numberOfLines={1}>
                    {t(meta.subtitleKey)}
                  </Txt>
                </View>

                <View style={styles.actions}>
                  <View style={styles.orderButtons}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('Move up')}
                      disabled={isFirst}
                      onPress={() => moveCard(index, index - 1)}
                      hitSlop={4}
                      style={({ pressed }) => [styles.arrowButton, (isFirst || pressed) && { opacity: isFirst ? 0.25 : 0.7 }]}>
                      <ChevronUp size={18} color={theme.faint(0.7)} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('Move down')}
                      disabled={isLast}
                      onPress={() => moveCard(index, index + 1)}
                      hitSlop={4}
                      style={({ pressed }) => [styles.arrowButton, (isLast || pressed) && { opacity: isLast ? 0.25 : 0.7 }]}>
                      <ChevronDown size={18} color={theme.faint(0.7)} />
                    </Pressable>
                  </View>

                  <Switch
                    value={item.visible}
                    disabled={isOnlyVisible}
                    onValueChange={() => toggleCard(item.id)}
                    trackColor={{ true: theme.accent }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <PillButton
            label={t('Reset to default')}
            icon={RotateCcw}
            variant="ghost"
            size="sm"
            onPress={resetCards}
          />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: layout.pageInset,
    gap: 12,
  },
  hint: {
    paddingHorizontal: 4,
  },
  cardList: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingRight: 4,
  },
  arrowButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 4,
  },
});
