import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { CategoryBadge } from '@/components/CategoryBadge';
import { Header } from '@/components/Header';
import { MonthStepper } from '@/components/MonthStepper';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { useSheet } from '@/components/Sheet';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useBudgetSummary } from '@/hooks/budgets';
import { useT } from '@/i18n';
import { BudgetSheet } from '@/sheets/BudgetSheet';
import { useTheme } from '@/theme/useTheme';
import type { BudgetLine } from '@/types/api';
import { statusColor } from '@/utils/categoryStyle';
import { currentYm } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

/** One `(category, month)` slot per row, plus the overall budget above them. */
export default function BudgetsScreen() {
  const t = useT();
  const theme = useTheme();
  const [month, setMonth] = useState(currentYm());
  const summary = useBudgetSummary(month);
  const sheet = useSheet();
  const [target, setTarget] = useState<BudgetLine | null>(null);

  const open = (line: BudgetLine | null) => {
    setTarget(line);
    sheet.present();
  };

  const overall = summary.data?.overall;

  return (
    <>
      <Screen
        scroll
        refreshing={summary.isRefetching && !summary.isPending}
        onRefresh={() => void summary.refetch()}
        contentContainerStyle={styles.content}
        header={<Header large title={t('Budgets')} />}>
        <MonthStepper month={month} onChange={setMonth} />
        {summary.isPending ? (
          <>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={5} />
          </>
        ) : summary.isError ? (
          <Card>
            <ErrorState error={summary.error} onRetry={() => void summary.refetch()} compact />
          </Card>
        ) : summary.data && overall ? (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel={t('Overall budget')} onPress={() => open(null)}>
              <Card style={styles.overall}>
                <View style={styles.rowBetween}>
                  <Txt variant="label" faint={0.6}>
                    {t('Overall budget')}
                  </Txt>
                  <ChevronRight size={18} color={theme.faint(0.3)} />
                </View>
                {overall.budget === null ? (
                  <>
                    <Txt variant="xl">{formatMoney(overall.spent)}</Txt>
                    <Txt faint={0.55}>{t('No budget set')}</Txt>
                  </>
                ) : (
                  <>
                    <Txt variant="xl">
                      {formatMoney(overall.spent)}
                      <Txt faint={0.5}>
                        {' '}
                        {t('of')} {formatMoney(overall.budget)}
                      </Txt>
                    </Txt>
                    <ProgressBar percent={overall.bar_percent} color={statusColor(overall.status)} />
                    <Txt variant="label" color={overall.status === 'over' ? theme.errorInk : theme.faint(0.6)}>
                      {overall.status === 'over'
                        ? t(':amount over budget', { amount: formatMoney(overall.remaining) })
                        : t(':amount left', { amount: formatMoney(overall.remaining) })}
                    </Txt>
                  </>
                )}
              </Card>
            </Pressable>

            <Card padded={false} style={styles.categories}>
              <Txt variant="heading" style={styles.categoriesTitle}>
                {t('By category')}
              </Txt>
              {summary.data.categories.length === 0 ? (
                <EmptyState compact title={t('No categories yet')} />
              ) : (
                summary.data.categories.map((line, index) => (
                  <BudgetRow key={line.uuid} line={line} divider={index < summary.data.categories.length - 1} onPress={() => open(line)} />
                ))
              )}
            </Card>
          </>
        ) : null}
      </Screen>
      <BudgetSheet sheetRef={sheet.ref} month={month} line={target} />
    </>
  );
}

function BudgetRow({ line, divider, onPress }: { line: BudgetLine; divider: boolean; onPress: () => void }) {
  const t = useT();
  const theme = useTheme();
  const color = statusColor(line.status);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={line.name}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.hairline }, pressed && { opacity: 0.7 }]}>
      <View style={styles.rowTop}>
        <CategoryBadge color={line.color} icon={line.icon} size={38} />
        <View style={styles.rowBody}>
          <Txt weight="medium" numberOfLines={1}>
            {line.name}
          </Txt>
          <Txt variant="label" faint={0.55} numberOfLines={1}>
            {line.budget === null ? t('No budget set') : `${formatMoney(line.spent)} ${t('of')} ${formatMoney(line.budget)}`}
          </Txt>
        </View>
        {line.budget === null ? (
          <Txt variant="label" color={theme.accent}>
            {t('Set')}
          </Txt>
        ) : (
          <Txt variant="label" weight="semibold" color={line.status === 'over' ? theme.errorInk : theme.faint(0.6)}>
            {line.percent ?? 0}%
          </Txt>
        )}
        <ChevronRight size={18} color={theme.faint(0.3)} />
      </View>
      {line.budget !== null ? <ProgressBar percent={line.bar_percent} color={color} height={6} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  overall: { gap: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categories: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  categoriesTitle: { marginBottom: 4 },
  row: { paddingVertical: 12, gap: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBody: { flex: 1, gap: 2 },
});
