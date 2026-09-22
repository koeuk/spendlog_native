import { Tag } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Card } from '@/components/Card';
import { Fab } from '@/components/Fab';
import { Header } from '@/components/Header';
import { IconDisc } from '@/components/IconDisc';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { useSheet } from '@/components/Sheet';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { useIncomeSourceCatalog } from '@/hooks/incomes';
import { useT } from '@/i18n';
import { IncomeSourceFormSheet } from '@/sheets/IncomeSourceFormSheet';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { IncomeSource } from '@/types/api';
import { formatMoney } from '@/utils/money';

/**
 * The names income is filed under, and what the income and savings forms
 * offer.
 *
 * A catalogue of suggestions: an income carries its source as text, so a name
 * renamed or removed here leaves the money alone unless the rename is asked
 * to carry it across. That is why a row can say "not used yet", and why
 * removing one is not destructive.
 */
export default function IncomeSourcesScreen() {
  const t = useT();
  const theme = useTheme();
  const sources = useIncomeSourceCatalog();
  const sheet = useSheet();
  const [editing, setEditing] = useState<IncomeSource | null>(null);

  const open = (source: IncomeSource | null) => {
    setEditing(source);
    sheet.present();
  };

  const used = (source: IncomeSource) => {
    if (source.uses === 0) return t('Not used yet');
    const count = source.uses === 1 ? t('1 entry') : t(':count entries', { count: source.uses });
    return `${count} · ${formatMoney(source.total)}`;
  };

  return (
    <>
      <Screen
        scroll
        refreshing={sources.isRefetching && !sources.isPending}
        onRefresh={() => void sources.refetch()}
        bottomInset={layout.fabClearance}
        contentContainerStyle={styles.content}
        header={<Header title={t('Sources')} back />}>
        {sources.isPending ? (
          <SkeletonCard lines={5} />
        ) : sources.isError ? (
          <Card>
            <ErrorState error={sources.error} onRetry={() => void sources.refetch()} compact />
          </Card>
        ) : sources.data && sources.data.length === 0 ? (
          <EmptyState icon={Tag} title={t('No sources yet.')} subtitle={t('One is added for you whenever you name where money came from.')} actionLabel={t('Add source')} onAction={() => open(null)} />
        ) : sources.data ? (
          <Card padded={false} style={styles.card}>
            {sources.data.map((source, index) => (
              <ListRow
                key={source.uuid}
                leading={<IconDisc icon={Tag} color={source.uses > 0 ? theme.accent : theme.faint(0.4)} />}
                title={source.name}
                subtitle={used(source)}
                chevron
                divider={index < sources.data.length - 1}
                onPress={() => open(source)}
              />
            ))}
          </Card>
        ) : null}
      </Screen>
      <Fab onPress={() => open(null)} accessibilityLabel={t('Add source')} />
      <IncomeSourceFormSheet sheetRef={sheet.ref} source={editing} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  card: { paddingHorizontal: 14 },
});
