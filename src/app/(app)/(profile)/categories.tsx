import { Tags } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Card } from '@/components/Card';
import { CategoryBadge } from '@/components/CategoryBadge';
import { Fab } from '@/components/Fab';
import { Header } from '@/components/Header';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { useSheet } from '@/components/Sheet';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { useCategories } from '@/hooks/categories';
import { useT } from '@/i18n';
import { CategoryFormSheet } from '@/sheets/CategoryFormSheet';
import { useSessionStore } from '@/store/session';
import { layout } from '@/theme/tokens';
import type { Category } from '@/types/api';

/** The shared set of categories. Everyone reads them; admins shape them. */
export default function CategoriesScreen() {
  const t = useT();
  const isAdmin = useSessionStore((state) => state.user?.is_admin ?? false);
  const categories = useCategories({ sort: 'name' });
  const sheet = useSheet();
  const [editing, setEditing] = useState<Category | null>(null);

  const open = (category: Category | null) => {
    setEditing(category);
    sheet.present();
  };

  const count = (category: Category) => {
    const n = category.expenses_count ?? 0;
    return n === 1 ? t('1 expense') : t(':count expenses', { count: n });
  };

  return (
    <>
      <Screen scroll refreshing={categories.isRefetching && !categories.isPending} onRefresh={() => void categories.refetch()} bottomInset={isAdmin ? layout.fabClearance : 0} contentContainerStyle={styles.content} header={<Header title={t('Categories')} back />}>
        {categories.isPending ? (
          <SkeletonCard lines={5} />
        ) : categories.isError ? (
          <Card>
            <ErrorState error={categories.error} onRetry={() => void categories.refetch()} compact />
          </Card>
        ) : categories.data && categories.data.length === 0 ? (
          <EmptyState icon={Tags} title={t('No categories yet')} actionLabel={isAdmin ? t('Add category') : undefined} onAction={() => open(null)} />
        ) : categories.data ? (
          <Card padded={false} style={styles.card}>
            {categories.data.map((category, index) => (
              <ListRow
                key={category.uuid}
                leading={<CategoryBadge color={category.color} icon={category.icon} />}
                title={category.name}
                subtitle={count(category)}
                chevron={isAdmin}
                divider={index < categories.data.length - 1}
                onPress={isAdmin ? () => open(category) : undefined}
              />
            ))}
          </Card>
        ) : null}
      </Screen>
      {isAdmin ? (
        <>
          <Fab onPress={() => open(null)} accessibilityLabel={t('Add category')} />
          <CategoryFormSheet sheetRef={sheet.ref} category={editing} />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  card: { paddingHorizontal: 14 },
});
