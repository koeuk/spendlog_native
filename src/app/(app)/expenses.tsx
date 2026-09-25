import { useRouter } from 'expo-router';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Card } from '@/components/Card';
import { ExpenseRow } from '@/components/ExpenseRow';
import { Fab } from '@/components/Fab';
import { Header } from '@/components/Header';
import { IconButton } from '@/components/IconButton';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useSheet } from '@/components/Sheet';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useTabBarInset } from '@/components/TabBar';
import { useDeleteExpense, useExpenses } from '@/hooks/expenses';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useT } from '@/i18n';
import { DEFAULT_EXPENSE_FILTERS, ExpenseFilterSheet, hasExpenseFilters, type ExpenseListFilters } from '@/sheets/ExpenseFilterSheet';
import { useLocaleStore } from '@/store/locale';
import { useSessionStore } from '@/store/session';
import { toast } from '@/store/toast';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { Expense } from '@/types/api';
import { confirm } from '@/utils/confirm';
import { longDate, todayYmd } from '@/utils/dates';

interface DayGroup {
  day: string;
  expenses: Expense[];
}

function groupByDay(expenses: Expense[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const expense of expenses) {
    const last = groups[groups.length - 1];
    if (last && last.day === expense.spent_on) last.expenses.push(expense);
    else groups.push({ day: expense.spent_on, expenses: [expense] });
  }
  return groups;
}

/** Every expense, newest first, grouped by day, searchable and filterable. */
export default function ExpensesScreen() {
  const t = useT();
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);
  const isAdmin = useSessionStore((state) => state.user?.is_admin ?? false);
  const [search, setSearch] = useState('');
  const item = useDebouncedValue(search.trim());
  const [filters, setFilters] = useState<ExpenseListFilters>(DEFAULT_EXPENSE_FILTERS);
  const query = useExpenses({
    item: item || undefined,
    category: filters.category ?? undefined,
    from: filters.from ?? undefined,
    to: filters.to ?? undefined,
    sort: filters.sort,
    scope: isAdmin && filters.everyone ? 'all' : undefined,
  });
  const remove = useDeleteExpense();
  const filterSheet = useSheet();

  // Grouping by day only reads right when the list is in date order.
  const byDate = filters.sort.endsWith('spent_on');
  const groups = useMemo(() => (byDate ? groupByDay(query.items) : [{ day: '', expenses: query.items }]), [byDate, query.items]);

  const openExpense = (expense: Expense | null) => router.push(expense ? { pathname: '/expense-form', params: { uuid: expense.uuid } } : '/expense-form');

  const destroy = async (expense: Expense) => {
    const ok = await confirm({ title: t('Delete this expense?'), message: `${expense.item} · ${expense.price}`, confirmLabel: t('Delete'), destructive: true });
    if (!ok) return;
    try {
      await remove.mutateAsync(expense.uuid);
      toast(t('Expense deleted successfully.'), 'success');
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  const dayTitle = (day: string) => {
    if (!day) return '';
    if (day === todayYmd()) return t('Today');
    return longDate(day, locale);
  };

  return (
    <>
      <Screen
        padded={false}
        header={<Header large title={t('Expenses')} right={<IconButton icon={SlidersHorizontal} active={hasExpenseFilters(filters)} onPress={filterSheet.present} accessibilityLabel={t('Filters')} />} />}>
        <View style={styles.search}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder={t('Search')}
            autoCorrect={false}
            returnKeyType="search"
            left={<Search size={18} color={theme.faint(0.4)} />}
            right={
              search ? (
                <Pressable accessibilityRole="button" accessibilityLabel={t('Clear')} hitSlop={8} onPress={() => setSearch('')}>
                  <X size={18} color={theme.faint(0.4)} />
                </Pressable>
              ) : undefined
            }
          />
        </View>
        <FlatList
          data={groups}
          keyExtractor={(group) => group.day || 'flat'}
          contentContainerStyle={[styles.list, { paddingBottom: layout.fabClearance + tabBarInset }]}
          keyboardShouldPersistTaps="handled"
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isPending && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={theme.accent} />}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              {group.day ? (
                <Txt variant="label" faint={0.55} style={styles.dayTitle}>
                  {dayTitle(group.day)}
                </Txt>
              ) : null}
              <Card padded={false} style={styles.groupCard}>
                {group.expenses.map((expense, index) => (
                  <ExpenseRow
                    key={expense.uuid}
                    expense={expense}
                    showDate={!byDate}
                    divider={index < group.expenses.length - 1}
                    onPress={() => openExpense(expense)}
                    onLongPress={() => void destroy(expense)}
                  />
                ))}
              </Card>
            </View>
          )}
          ListEmptyComponent={
            query.isPending ? (
              <View style={styles.skeletons}>
                <SkeletonCard lines={3} />
                <SkeletonCard lines={3} />
              </View>
            ) : query.isError ? (
              <ErrorState error={query.error} onRetry={() => void query.refetch()} />
            ) : (
              <EmptyState
                title={item || hasExpenseFilters(filters) ? t('Nothing found.') : t('No expenses yet, add your first one.')}
                actionLabel={item || hasExpenseFilters(filters) ? undefined : t('Add expense')}
                onAction={() => openExpense(null)}
              />
            )
          }
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={theme.accent} style={styles.footer} /> : <View style={styles.footer} />}
        />
      </Screen>
      <Fab onPress={() => openExpense(null)} accessibilityLabel={t('Add expense')} />
      <ExpenseFilterSheet sheetRef={filterSheet.ref} filters={filters} onChange={setFilters} isAdmin={isAdmin} />
    </>
  );
}

const styles = StyleSheet.create({
  search: { paddingHorizontal: layout.pageInset, paddingBottom: 10 },
  list: { paddingHorizontal: layout.pageInset, paddingBottom: layout.fabClearance, gap: 14 },
  group: { gap: 6 },
  dayTitle: { marginLeft: 6 },
  groupCard: { paddingHorizontal: 14 },
  skeletons: { gap: 14 },
  footer: { paddingVertical: 16 },
});
