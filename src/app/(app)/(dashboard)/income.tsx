import { useRouter } from 'expo-router';
import { Banknote, Repeat } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Card } from '@/components/Card';
import { Fab } from '@/components/Fab';
import { Header } from '@/components/Header';
import { IconDisc } from '@/components/IconDisc';
import { ListRow } from '@/components/ListRow';
import { MonthStepper } from '@/components/MonthStepper';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useTabBarInset } from '@/components/TabBar';
import { useDeleteIncome, useIncomeSummary, useIncomes } from '@/hooks/incomes';
import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { toast } from '@/store/toast';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { Income } from '@/types/api';
import { confirm } from '@/utils/confirm';
import { currentYm, longDate, monthBounds, todayYmd } from '@/utils/dates';
import { groupConsecutive } from '@/utils/group';
import { amountNumber, formatMoney } from '@/utils/money';

/** Money coming in, a month at a time: the total, where it came from, and every row. */
export default function IncomeScreen() {
  const t = useT();
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);
  const [month, setMonth] = useState(currentYm());
  const bounds = monthBounds(month);
  const summary = useIncomeSummary(month);
  const list = useIncomes({ from: bounds.from, to: bounds.to });
  const remove = useDeleteIncome();
  const groups = useMemo(() => groupConsecutive(list.items, (income) => income.received_on), [list.items]);

  const open = (income: Income | null) => router.push(income ? { pathname: '/income-form', params: { uuid: income.uuid } } : '/income-form');

  const destroy = async (income: Income) => {
    const ok = await confirm({ title: t('Delete this income?'), message: `${income.source} · ${formatMoney(income.amount)}`, confirmLabel: t('Delete'), destructive: true });
    if (!ok) return;
    try {
      await remove.mutateAsync(income.uuid);
      toast(t('Income deleted successfully.'), 'success');
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  const total = amountNumber(summary.data?.total);

  return (
    <>
      <Screen padded={false} header={<Header title={t('Income')} back />}>
        <FlatList
          data={groups}
          keyExtractor={(group) => group.key}
          contentContainerStyle={[styles.list, { paddingBottom: layout.fabClearance + tabBarInset }]}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isPending && !list.isFetchingNextPage}
              onRefresh={() => {
                void list.refetch();
                void summary.refetch();
              }}
              tintColor={theme.accent}
            />
          }
          ListHeaderComponent={
            <View style={styles.top}>
              <MonthStepper month={month} onChange={setMonth} clampToNow />
              {summary.isPending ? (
                <SkeletonCard lines={3} />
              ) : summary.isError ? (
                <Card>
                  <ErrorState error={summary.error} onRetry={() => void summary.refetch()} compact />
                </Card>
              ) : summary.data ? (
                <Card style={styles.summary}>
                  <Txt variant="label" faint={0.6}>
                    {t('Total income')}
                  </Txt>
                  <Txt variant="display">{formatMoney(summary.data.total)}</Txt>
                  <Txt variant="label" faint={0.5}>
                    {summary.data.count === 1 ? t('1 entry') : t(':count entries', { count: summary.data.count })}
                  </Txt>
                  {summary.data.by_source.map((row) => (
                    <View key={row.source} style={styles.source}>
                      <View style={styles.sourceRow}>
                        <Txt weight="medium" numberOfLines={1} style={styles.grow}>
                          {row.source}
                        </Txt>
                        <Txt weight="semibold">{formatMoney(row.total)}</Txt>
                      </View>
                      <ProgressBar percent={total > 0 ? (amountNumber(row.total) / total) * 100 : 0} color={theme.accent} height={6} />
                    </View>
                  ))}
                </Card>
              ) : null}
            </View>
          }
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Txt variant="label" faint={0.55} style={styles.dayTitle}>
                {group.key === todayYmd() ? t('Today') : longDate(group.key, locale)}
              </Txt>
              <Card padded={false} style={styles.groupCard}>
                {group.items.map((income, index) => (
                  <ListRow
                    key={income.uuid}
                    leading={<IconDisc icon={Banknote} color={theme.accent} />}
                    title={income.source}
                    subtitle={income.note}
                    trailing={
                      <View style={styles.trailing}>
                        {income.recurring ? <Repeat size={14} color={theme.faint(0.4)} /> : null}
                        <Txt weight="semibold">{formatMoney(income.amount)}</Txt>
                      </View>
                    }
                    divider={index < group.items.length - 1}
                    onPress={() => open(income)}
                    onLongPress={() => void destroy(income)}
                  />
                ))}
              </Card>
            </View>
          )}
          ListEmptyComponent={
            list.isPending ? (
              <SkeletonCard lines={3} />
            ) : list.isError ? (
              <ErrorState error={list.error} onRetry={() => void list.refetch()} />
            ) : (
              <EmptyState icon={Banknote} title={t('No income yet, add your first one.')} actionLabel={t('Add income')} onAction={() => open(null)} />
            )
          }
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={theme.accent} style={styles.footer} /> : <View style={styles.footer} />}
        />
      </Screen>
      <Fab onPress={() => open(null)} accessibilityLabel={t('Add income')} />
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: layout.pageInset, paddingBottom: layout.fabClearance, gap: 14 },
  top: { gap: 14, paddingTop: 4 },
  summary: { gap: 6 },
  source: { gap: 6, marginTop: 8 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
  group: { gap: 6 },
  dayTitle: { marginLeft: 6 },
  groupCard: { paddingHorizontal: 14 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { paddingVertical: 16 },
});
