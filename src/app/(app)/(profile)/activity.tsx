import { History } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ActivityRow } from '@/components/ActivityRow';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { useActivity } from '@/hooks/overview';
import { useT } from '@/i18n';
import { useSessionStore } from '@/store/session';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Every create, update and delete the account has made, newest first. */
export default function ActivityScreen() {
  const t = useT();
  const theme = useTheme();
  const isAdmin = useSessionStore((state) => state.user?.is_admin ?? false);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const list = useActivity({ scope: isAdmin && scope === 'all' ? 'all' : undefined });
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Screen padded={false} header={<Header title={t('Activity log')} back />}>
      <FlatList
        data={list.items}
        keyExtractor={(entry) => entry.uuid}
        contentContainerStyle={styles.list}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
        }}
        refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isPending && !list.isFetchingNextPage} onRefresh={() => void list.refetch()} tintColor={theme.accent} />}
        ListHeaderComponent={
          isAdmin ? (
            <View style={styles.top}>
              <Segmented
                options={[
                  { value: 'mine', label: t('Mine') },
                  { value: 'all', label: t('Everyone') },
                ]}
                value={scope}
                onChange={setScope}
              />
            </View>
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
            actor={scope === 'all' ? (entry.user?.name ?? null) : null}
          />
        )}
        ListEmptyComponent={
          list.isPending ? <SkeletonCard lines={4} /> : list.isError ? <ErrorState error={list.error} onRetry={() => void list.refetch()} /> : <EmptyState icon={History} title={t('Nothing here yet. Check back soon.')} />
        }
        ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={theme.accent} style={styles.footer} /> : <View style={styles.footer} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: layout.pageInset, paddingBottom: 24 },
  top: { paddingTop: 4, paddingBottom: 14 },
  topSpace: { height: 4 },
  footer: { paddingVertical: 16 },
});
