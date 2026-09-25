import { History, SlidersHorizontal, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ActivityRow } from '@/components/ActivityRow';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { useSheet } from '@/components/Sheet';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { useTabBarInset } from '@/components/TabBar';
import { Txt } from '@/components/Txt';
import { useActivity } from '@/hooks/overview';
import { useT } from '@/i18n';
import {
  ActivityFilterSheet,
  DEFAULT_ACTIVITY_FILTERS,
  hasActivityFilters,
  momentParam,
  type ActivityListFilters,
  type ActivityMoment,
} from '@/sheets/ActivityFilterSheet';
import { useLocaleStore } from '@/store/locale';
import { useSessionStore } from '@/store/session';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { longDate } from '@/utils/dates';

/** Every create, update and delete the account has made, newest first; for admins, anyone's. */
export default function ActivityScreen() {
  const t = useT();
  const theme = useTheme();
  const locale = useLocaleStore((state) => state.locale);
  const tabBarInset = useTabBarInset();
  const isAdmin = useSessionStore((state) => state.user?.is_admin ?? false);
  const filterSheet = useSheet();
  const [filters, setFilters] = useState<ActivityListFilters>(DEFAULT_ACTIVITY_FILTERS);
  const person = isAdmin ? filters.person : DEFAULT_ACTIVITY_FILTERS.person;
  const list = useActivity({
    scope: person.kind === 'all' ? 'all' : undefined,
    user: person.kind === 'user' ? person.uuid : undefined,
    from: momentParam(filters.from),
    to: momentParam(filters.to),
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = hasActivityFilters(filters);

  const moment = (value: ActivityMoment) => `${longDate(value.date, locale)}${value.time ? ` ${value.time}` : ''}`;
  const summary = [
    person.kind === 'all' ? t('Everyone') : person.kind === 'user' ? person.name : null,
    filters.from && filters.to
      ? `${moment(filters.from)} – ${moment(filters.to)}`
      : filters.from
        ? t('From :date', { date: moment(filters.from) })
        : filters.to
          ? t('Until :date', { date: moment(filters.to) })
          : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Screen
        padded={false}
        header={<Header title={t('Activity log')} back right={<IconButton icon={SlidersHorizontal} onPress={filterSheet.present} accessibilityLabel={t('Filters')} active={filtered} />} />}>
        <FlatList
          data={list.items}
          keyExtractor={(entry) => entry.uuid}
          contentContainerStyle={[styles.list, { paddingBottom: 24 + tabBarInset }]}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
          }}
          refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isPending && !list.isFetchingNextPage} onRefresh={() => void list.refetch()} tintColor={theme.accent} />}
          ListHeaderComponent={
            filtered ? (
              <Card row style={styles.summary}>
                <SlidersHorizontal size={18} color={theme.accent} />
                <Txt variant="label" weight="medium" style={styles.grow} numberOfLines={2}>
                  {summary}
                </Txt>
                <Pressable accessibilityRole="button" accessibilityLabel={t('Clear filters')} hitSlop={8} onPress={() => setFilters(DEFAULT_ACTIVITY_FILTERS)}>
                  <X size={18} color={theme.faint(0.55)} />
                </Pressable>
              </Card>
            ) : (
              <View style={styles.topSpace} />
            )
          }
          renderItem={({ item: entry, index }) => (
            <ActivityRow
              entry={entry}
              first={index === 0}
              last={index === list.items.length - 1}
              expanded={expanded === entry.uuid}
              onToggle={() => setExpanded(expanded === entry.uuid ? null : entry.uuid)}
              actor={person.kind === 'all' ? (entry.user?.name ?? null) : null}
            />
          )}
          ListEmptyComponent={
            list.isPending ? (
              <SkeletonCard lines={4} />
            ) : list.isError ? (
              <ErrorState error={list.error} onRetry={() => void list.refetch()} />
            ) : (
              <EmptyState icon={History} title={filtered ? t('Nothing matches these filters.') : t('Nothing here yet. Check back soon.')} />
            )
          }
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={theme.accent} style={styles.footer} /> : <View style={styles.footer} />}
        />
      </Screen>
      <ActivityFilterSheet sheetRef={filterSheet.ref} filters={filters} onChange={setFilters} isAdmin={isAdmin} />
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: layout.pageInset, paddingBottom: 24 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 14, paddingVertical: 12 },
  grow: { flex: 1 },
  topSpace: { height: 4 },
  footer: { paddingVertical: 16 },
});
