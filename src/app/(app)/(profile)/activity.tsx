import { History, Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { IconDisc } from '@/components/IconDisc';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useActivity } from '@/hooks/overview';
import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { useSessionStore } from '@/store/session';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { ActivityAction, ActivityEntry } from '@/types/api';
import { dateTime } from '@/utils/dates';

const ICONS: Record<ActivityAction, LucideIcon> = { created: Plus, updated: Pencil, deleted: Trash2 };

function render(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Every create, update and delete the account has made, newest first. */
export default function ActivityScreen() {
  const t = useT();
  const theme = useTheme();
  const locale = useLocaleStore((state) => state.locale);
  const isAdmin = useSessionStore((state) => state.user?.is_admin ?? false);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const list = useActivity({ scope: isAdmin && scope === 'all' ? 'all' : undefined });
  const [expanded, setExpanded] = useState<string | null>(null);

  const actionLabel = (action: ActivityAction) => t(action === 'created' ? 'Created' : action === 'updated' ? 'Updated' : 'Deleted');
  const subjectLabel = (subject: string) => t(subject.replace(/_/g, ' '));

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
            action={actionLabel(entry.action)}
            subject={subjectLabel(entry.subject)}
            when={dateTime(entry.created_at, locale)}
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

function ActivityRow({ entry, first, last, expanded, onToggle, action, subject, when, actor }: { entry: ActivityEntry; first: boolean; last: boolean; expanded: boolean; onToggle: () => void; action: string; subject: string; when: string; actor: string | null }) {
  const theme = useTheme();
  const t = useT();
  const tint = entry.action === 'deleted' ? theme.errorInk : entry.action === 'created' ? theme.accent : theme.faint(0.6);
  const changes = entry.changes ? Object.entries(entry.changes) : [];

  return (
    <Card padded={false} style={[styles.rowCard, first && styles.firstRow, last && styles.lastRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.hairline }]}>
      <Pressable accessibilityRole={changes.length ? 'button' : undefined} onPress={changes.length ? onToggle : undefined} style={styles.row}>
        <IconDisc icon={ICONS[entry.action] ?? Pencil} color={tint} size={36} />
        <View style={styles.body}>
          <Txt weight="medium" numberOfLines={2}>
            {entry.label}
          </Txt>
          <Txt variant="label" faint={0.55} numberOfLines={1}>
            {[`${action} · ${subject}`, actor, when].filter(Boolean).join(' · ')}
          </Txt>
          {expanded && changes.length ? (
            <View style={styles.changes}>
              {changes.map(([field, change]) => (
                <Txt key={field} variant="label" faint={0.7}>
                  {t(field.replace(/_/g, ' '))}: {render(change.from)} → {render(change.to)}
                </Txt>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: layout.pageInset, paddingBottom: 24 },
  top: { paddingTop: 4, paddingBottom: 14 },
  topSpace: { height: 4 },
  rowCard: { paddingHorizontal: 14, borderRadius: 0 },
  firstRow: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  lastRow: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'flex-start' },
  body: { flex: 1, gap: 3 },
  changes: { marginTop: 6, gap: 2 },
  footer: { paddingVertical: 16 },
});
