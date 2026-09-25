import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Fab } from '@/components/Fab';
import { Header } from '@/components/Header';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useTabBarInset } from '@/components/TabBar';
import { STATUSES } from '@/forms/AdminUserForm';
import { useAdminUsers } from '@/hooks/admin';
import { useT } from '@/i18n';
import { layout, radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { AdminUser } from '@/types/api';

/** Every account, for admins: create, edit, suspend, delete. */
export default function AdminUsersScreen() {
  const t = useT();
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  const list = useAdminUsers();
  const router = useRouter();
  const open = (user: AdminUser | null) => router.push(user ? { pathname: '/admin-user-form', params: { uuid: user.uuid } } : '/admin-user-form');

  const statusLabel = (user: AdminUser) => t(STATUSES.find((status) => status.value === user.status)?.label ?? user.status);
  const roleLabel = (user: AdminUser) => t(user.role === 'super_admin' ? 'Owner' : user.role === 'admin' ? 'Admin' : 'User');

  return (
    <>
      <Screen padded={false} header={<Header title={t('Users')} back />}>
        <FlatList
          data={list.items}
          keyExtractor={(user) => user.uuid}
          contentContainerStyle={[styles.list, { paddingBottom: layout.fabClearance + tabBarInset }]}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
          }}
          refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isPending && !list.isFetchingNextPage} onRefresh={() => void list.refetch()} tintColor={theme.accent} />}
          ListHeaderComponent={<View style={styles.topSpace} />}
          renderItem={({ item: user, index }) => (
            <Card padded={false} style={[styles.rowCard, index === 0 && styles.firstRow, index === list.items.length - 1 && styles.lastRow]}>
              <ListRow
                leading={<Avatar name={user.name} url={user.avatar_url} size={40} />}
                title={user.name}
                subtitle={`${user.email} · ${roleLabel(user)}`}
                trailing={
                  <View style={[styles.status, { backgroundColor: user.status === 'active' ? theme.accentSoft : theme.faint(0.08) }]}>
                    <Txt variant="caption" weight="semibold" color={user.status === 'active' ? theme.accent : theme.faint(0.6)}>
                      {statusLabel(user)}
                    </Txt>
                  </View>
                }
                chevron
                divider={index < list.items.length - 1}
                onPress={() => open(user)}
              />
            </Card>
          )}
          ListEmptyComponent={list.isPending ? <SkeletonCard lines={4} /> : list.isError ? <ErrorState error={list.error} onRetry={() => void list.refetch()} /> : <EmptyState icon={Users} title={t('Nothing found.')} />}
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={theme.accent} style={styles.footer} /> : <View style={styles.footer} />}
        />
      </Screen>
      <Fab onPress={() => open(null)} accessibilityLabel={t('Add user')} />
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: layout.pageInset, paddingBottom: layout.fabClearance },
  topSpace: { height: 4 },
  rowCard: { paddingHorizontal: 14, borderRadius: 0 },
  firstRow: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  lastRow: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.chip },
  footer: { paddingVertical: 16 },
});
