import { useRouter } from 'expo-router';
import { Handshake } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import type { BorrowingStatusFilter } from '@/api/endpoints/borrowings';
import { BorrowingRow } from '@/components/BorrowingRow';
import { Card } from '@/components/Card';
import { Fab } from '@/components/Fab';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useBorrowingSummary, useBorrowings } from '@/hooks/borrowings';
import { useT } from '@/i18n';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { formatMoney } from '@/utils/money';

/** Money owed to friends, family, a bank, with what has been paid back. */
export default function BorrowingsScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const [status, setStatus] = useState<BorrowingStatusFilter>('all');
  const summary = useBorrowingSummary();
  const list = useBorrowings({ status });
  const openForm = () => router.push('/borrowing-form');

  return (
    <>
      <Screen padded={false} header={<Header title={t('Borrowing')} back />}>
        <FlatList
          data={list.items}
          keyExtractor={(borrowing) => borrowing.uuid}
          contentContainerStyle={styles.list}
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
              {summary.isPending ? (
                <SkeletonCard lines={3} />
              ) : summary.data ? (
                <Card style={styles.summary}>
                  <Txt variant="label" faint={0.6}>
                    {t('Still owed')}
                  </Txt>
                  <Txt variant="display" color={summary.data.overdue_count > 0 ? theme.errorInk : theme.text}>
                    {formatMoney(summary.data.outstanding)}
                  </Txt>
                  <View style={styles.stats}>
                    <Stat label={t('Borrowed')} value={formatMoney(summary.data.borrowed)} />
                    <Stat label={t('Repaid')} value={formatMoney(summary.data.repaid)} />
                    <Stat label={t('Open')} value={String(summary.data.open_count)} />
                    <Stat label={t('Overdue')} value={String(summary.data.overdue_count)} tint={summary.data.overdue_count > 0 ? theme.errorInk : undefined} />
                  </View>
                  {summary.data.by_lender_type.map((row) => (
                    <View key={row.lender_type} style={styles.typeRow}>
                      <Txt variant="label" faint={0.6} style={styles.grow}>
                        {row.label} · {row.count}
                      </Txt>
                      <Txt variant="label" weight="semibold">
                        {formatMoney(row.outstanding)}
                      </Txt>
                    </View>
                  ))}
                </Card>
              ) : null}
              <Segmented
                options={[
                  { value: 'all', label: t('All') },
                  { value: 'open', label: t('Open') },
                  { value: 'settled', label: t('Settled') },
                ]}
                value={status}
                onChange={setStatus}
              />
            </View>
          }
          renderItem={({ item: borrowing, index }) => (
            <Card padded={false} style={[styles.rowCard, index === 0 && styles.firstRow, index === list.items.length - 1 && styles.lastRow]}>
              <BorrowingRow borrowing={borrowing} onPress={() => router.push(`/borrowings/${borrowing.uuid}`)} />
            </Card>
          )}
          ListEmptyComponent={
            list.isPending ? (
              <SkeletonCard lines={3} />
            ) : list.isError ? (
              <ErrorState error={list.error} onRetry={() => void list.refetch()} />
            ) : (
              <EmptyState icon={Handshake} title={status === 'all' ? t('No borrowing yet, add your first one.') : t('Nothing found.')} actionLabel={status === 'all' ? t('Add borrowing') : undefined} onAction={openForm} />
            )
          }
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={theme.accent} style={styles.footer} /> : <View style={styles.footer} />}
        />
      </Screen>
      <Fab onPress={openForm} accessibilityLabel={t('Add borrowing')} />
    </>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <View style={styles.stat}>
      <Txt variant="caption" faint={0.55} numberOfLines={1}>
        {label}
      </Txt>
      <Txt weight="semibold" color={tint} numberOfLines={1}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: layout.pageInset, paddingBottom: layout.fabClearance },
  top: { gap: 14, paddingTop: 4, paddingBottom: 14 },
  summary: { gap: 6 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 4 },
  stat: { flex: 1, gap: 2 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  grow: { flex: 1 },
  rowCard: { paddingHorizontal: 14, borderRadius: 0 },
  firstRow: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  lastRow: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  footer: { paddingVertical: 16 },
});
