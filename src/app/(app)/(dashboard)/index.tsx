import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { ExpenseRow } from '@/components/ExpenseRow';
import { Fab } from '@/components/Fab';
import { MonthStepper } from '@/components/MonthStepper';
import { PillButton } from '@/components/PillButton';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { SpendingChart } from '@/components/SpendingChart';
import { ErrorState, Skeleton, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useIncomeSummary } from '@/hooks/incomes';
import { useOpenFromMenu } from '@/hooks/useOpenFromMenu';
import { useDashboard, useReport } from '@/hooks/overview';
import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { useSessionStore } from '@/store/session';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { Dashboard, Expense, Granularity } from '@/types/api';
import { categoryColor, statusColor } from '@/utils/categoryStyle';
import { currentYm, monthLabel } from '@/utils/dates';
import { amountNumber, formatMoney, isNegative } from '@/utils/money';

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
];

/** The salutation for the hour of the day on the device's clock. */
function greeting(hour: number) {
  if (hour < 12) return 'Good morning!';
  if (hour < 18) return 'Good afternoon!';
  return 'Good evening!';
}

/** The payoff screen: how the month is going, in one scroll. */
export default function DashboardScreen() {
  const t = useT();
  const router = useRouter();
  const openFromMenu = useOpenFromMenu();
  const user = useSessionStore((state) => state.user);
  const [month, setMonth] = useState(currentYm());
  const [granularity, setGranularity] = useState<Granularity>('month');
  const dashboard = useDashboard(month, month);
  const at = granularity === 'month' ? month : granularity === 'year' ? month.slice(0, 4) : undefined;
  const report = useReport({ period: granularity, at });
  const openExpense = (expense: Expense | null) => router.push(expense ? { pathname: '/expense-form', params: { uuid: expense.uuid } } : '/expense-form');

  return (
    <>
      <Screen
        scroll
        refreshing={dashboard.isRefetching && !dashboard.isPending}
        onRefresh={() => {
          void dashboard.refetch();
          void report.refetch();
        }}
        bottomInset={layout.fabClearance}
        contentContainerStyle={styles.content}
        header={
          <View style={styles.greeting}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('Settings')} onPress={() => openFromMenu('(profile)', 'settings')}>
              <Avatar name={user?.name ?? ''} url={user?.avatar_url} size={44} />
            </Pressable>
            <View style={styles.greetingText}>
              <Txt variant="label" faint={0.55} numberOfLines={1}>
                {t(greeting(new Date().getHours()))}
              </Txt>
              <Txt variant="title" numberOfLines={1}>
                {user?.name ?? ''}
              </Txt>
            </View>
          </View>
        }>
        <MonthStepper month={month} onChange={setMonth} />
        {dashboard.isPending ? (
          <>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={4} />
          </>
        ) : dashboard.isError ? (
          <Card>
            <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} compact />
          </Card>
        ) : dashboard.data ? (
          <DashboardBody data={dashboard.data} month={month} onOpenExpense={openExpense} />
        ) : null}

        <Card style={styles.section}>
          <Txt variant="heading">{t('Spending')}</Txt>
          <Segmented options={GRANULARITIES.map((option) => ({ value: option.value, label: t(option.label) }))} value={granularity} onChange={setGranularity} />
          {report.data ? (
            <SpendingChart buckets={report.data.series.buckets} label={report.data.series.label} total={report.data.series.total} />
          ) : report.isError ? (
            <ErrorState error={report.error} onRetry={() => void report.refetch()} compact />
          ) : (
            <Skeleton height={190} rounded={16} />
          )}
        </Card>
        <View style={{ height: 8 }} />
      </Screen>
      <Fab onPress={() => openExpense(null)} accessibilityLabel={t('Add expense')} />
    </>
  );
}

function DashboardBody({ data, month, onOpenExpense }: { data: Dashboard; month: string; onOpenExpense: (expense: Expense | null) => void }) {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);
  const overall = data.summary.overall;
  const isCurrent = month === data.current_month;
  const negativeBalance = isNegative(data.balance);
  const plannedSavings = amountNumber(data.savings.planned) > 0;
  // The dashboard payload carries the month's income total but not where it
  // came from, so the breakdown the card leans on comes from the income
  // summary. It is the same call the income screen makes, so it is warm.
  const incomeSummary = useIncomeSummary(month);
  const topSource = incomeSummary.data?.by_source[0] ?? null;
  const incomeTotal = amountNumber(data.income.total);

  return (
    <>
      <Card style={styles.section}>
        <Txt variant="label" faint={0.6}>
          {isCurrent ? t('This month') : monthLabel(month, locale)}
        </Txt>
        <Txt variant="display">{formatMoney(overall.spent)}</Txt>
        {overall.budget === null ? (
          <View style={styles.budgetRow}>
            <Txt faint={0.55} style={styles.grow}>
              {t('No budget set')}
            </Txt>
            <PillButton label={t('Set a budget')} variant="tonal" size="sm" onPress={() => router.push('/budgets')} />
          </View>
        ) : (
          <>
            <ProgressBar percent={overall.bar_percent} color={statusColor(overall.status)} />
            <View style={styles.budgetRow}>
              <Txt variant="label" color={overall.status === 'over' ? theme.errorInk : theme.faint(0.6)} style={styles.grow}>
                {overall.status === 'over'
                  ? t(':amount over budget', { amount: formatMoney(overall.remaining) })
                  : t(':amount left', { amount: formatMoney(overall.remaining) })}
              </Txt>
              <Txt variant="label" faint={0.6}>
                {t('of')} {formatMoney(overall.budget)}
              </Txt>
            </View>
          </>
        )}
      </Card>

      <View style={styles.pair}>
        <Card style={styles.half}>
          <Txt variant="label" faint={0.6}>
            {t('Today')}
          </Txt>
          <Txt variant="xl" numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(data.today.total)}
          </Txt>
        </Card>
        <Card style={styles.half}>
          <Txt variant="label" faint={0.6}>
            {t('Balance')}
          </Txt>
          <Txt variant="xl" color={negativeBalance ? theme.errorInk : theme.text} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(data.balance, 'signed')}
          </Txt>
          <Txt variant="caption" faint={0.5}>
            {t('Income')} {formatMoney(data.income.total)}
          </Txt>
        </Card>
      </View>

      <View style={styles.pair}>
        <Pressable accessibilityRole="button" style={styles.halfPress} onPress={() => router.push('/savings')}>
          <Card style={styles.halfCard}>
            <View style={styles.rowBetween}>
              <Txt variant="label" faint={0.6}>
                {t('Savings')}
              </Txt>
              <ChevronRight size={16} color={theme.faint(0.3)} />
            </View>
            <Txt variant="xl" numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(data.savings.saved_this_month)}
            </Txt>
            <Txt variant="caption" faint={0.5} numberOfLines={1}>
              {t('Total saved')} {formatMoney(data.savings.total_saved, 'signed')}
            </Txt>
            {plannedSavings ? <ProgressBar percent={data.savings.percent} color={theme.accent} height={6} /> : null}
          </Card>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.halfPress} onPress={() => router.push('/income')}>
          <Card style={styles.halfCard}>
            <View style={styles.rowBetween}>
              <Txt variant="label" faint={0.6}>
                {t('Income')}
              </Txt>
              <ChevronRight size={16} color={theme.faint(0.3)} />
            </View>
            <Txt variant="xl" numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(data.income.total)}
            </Txt>
            {topSource ? (
              <Txt variant="caption" faint={0.5} numberOfLines={1}>
                {t('Top source')} {topSource.source}
              </Txt>
            ) : null}
            {topSource && incomeTotal > 0 ? <ProgressBar percent={(amountNumber(topSource.total) / incomeTotal) * 100} color={theme.accent} height={6} /> : null}
          </Card>
        </Pressable>
      </View>

      <Card style={styles.section}>
        <Txt variant="heading">{t('By category')}</Txt>
        {data.breakdown.length === 0 ? (
          <Txt faint={0.5}>{t('Nothing spent this month yet.')}</Txt>
        ) : (
          data.breakdown.map((slice) => (
            <View key={slice.uuid} style={styles.slice}>
              <View style={styles.rowBetween}>
                <View style={styles.sliceName}>
                  <View style={[styles.dot, { backgroundColor: categoryColor(slice.color) }]} />
                  <Txt weight="medium" numberOfLines={1} style={styles.grow}>
                    {slice.name}
                  </Txt>
                </View>
                <Txt variant="label" faint={0.6}>
                  {slice.share}%
                </Txt>
                <Txt weight="semibold" style={styles.sliceAmount}>
                  {formatMoney(slice.spent)}
                </Txt>
              </View>
              <ProgressBar percent={slice.share} color={categoryColor(slice.color)} height={6} />
            </View>
          ))
        )}
      </Card>

      <Card style={styles.section}>
        <View style={styles.rowBetween}>
          <Txt variant="heading">{t('Recent expenses')}</Txt>
          <Pressable accessibilityRole="link" onPress={() => router.push('/expenses')}>
            <Txt variant="label" color={theme.accent}>
              {t('See all')}
            </Txt>
          </Pressable>
        </View>
        {data.recent.length === 0 ? (
          <Txt faint={0.5}>{t('No expenses yet, add your first one.')}</Txt>
        ) : (
          <View>
            {data.recent.map((expense, index) => (
              <ExpenseRow key={expense.uuid} expense={expense} showDate divider={index < data.recent.length - 1} onPress={() => onOpenExpense(expense)} />
            ))}
          </View>
        )}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: layout.pageInset, paddingTop: 12, paddingBottom: 10 },
  greetingText: { flex: 1 },
  section: { gap: 12 },
  pair: { flexDirection: 'row', gap: 14 },
  half: { flex: 1, gap: 4 },
  // The pressable carries the width, the card fills it: both halves then end up
  // the same height whether or not each one has a bar to show.
  halfPress: { flex: 1 },
  halfCard: { flex: 1, gap: 4 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  slice: { gap: 6 },
  sliceName: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliceAmount: { minWidth: 72, textAlign: 'right' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
