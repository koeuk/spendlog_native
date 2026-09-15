import { Banknote, Repeat } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { CategoryBadge } from '@/components/CategoryBadge';
import { Fab } from '@/components/Fab';
import { Header } from '@/components/Header';
import { IconDisc } from '@/components/IconDisc';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { useSheet } from '@/components/Sheet';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useRecurringRules } from '@/hooks/recurring';
import { useT } from '@/i18n';
import { FREQUENCIES, RecurringFormSheet } from '@/sheets/RecurringFormSheet';
import { useLocaleStore } from '@/store/locale';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { RecurringKind, RecurringRule } from '@/types/api';
import { dayLabel } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

type KindFilter = 'all' | RecurringKind;

/** Rent, a salary, a subscription: the rules that write rows on a schedule. */
export default function RecurringScreen() {
  const t = useT();
  const theme = useTheme();
  const locale = useLocaleStore((state) => state.locale);
  const [kind, setKind] = useState<KindFilter>('all');
  const rules = useRecurringRules(kind === 'all' ? undefined : kind);
  const sheet = useSheet();
  const [editing, setEditing] = useState<RecurringRule | null>(null);

  const open = (rule: RecurringRule | null) => {
    setEditing(rule);
    sheet.present();
  };

  const frequencyLabel = (rule: RecurringRule) => t(FREQUENCIES.find((option) => option.value === rule.frequency)?.label ?? rule.frequency);

  const subtitle = (rule: RecurringRule) => {
    if (!rule.active) return `${frequencyLabel(rule)} · ${t('Paused')}`;
    if (rule.next_run_on) return `${frequencyLabel(rule)} · ${t('Next :date', { date: dayLabel(rule.next_run_on, locale) })}`;
    return frequencyLabel(rule);
  };

  return (
    <>
      <Screen scroll refreshing={rules.isRefetching && !rules.isPending} onRefresh={() => void rules.refetch()} bottomInset={layout.fabClearance} contentContainerStyle={styles.content} header={<Header title={t('Recurring')} back />}>
        <Segmented
          options={[
            { value: 'all', label: t('All') },
            { value: 'expense', label: t('Expenses') },
            { value: 'income', label: t('Income') },
          ]}
          value={kind}
          onChange={setKind}
        />
        {rules.isPending ? (
          <SkeletonCard lines={4} />
        ) : rules.isError ? (
          <Card>
            <ErrorState error={rules.error} onRetry={() => void rules.refetch()} compact />
          </Card>
        ) : rules.data && rules.data.length === 0 ? (
          <EmptyState icon={Repeat} title={t('Nothing repeats yet.')} subtitle={t('Schedule rent, a salary or a subscription and it is logged for you.')} actionLabel={t('Add recurring')} onAction={() => open(null)} />
        ) : rules.data ? (
          <Card padded={false} style={styles.card}>
            {rules.data.map((rule, index) => (
              <ListRow
                key={rule.uuid}
                leading={rule.kind === 'expense' ? <CategoryBadge color={rule.category?.color} icon={rule.category?.icon} /> : <IconDisc icon={Banknote} color={theme.accent} />}
                title={rule.title}
                subtitle={subtitle(rule)}
                trailing={
                  <View style={styles.trailing}>
                    <Txt weight="semibold" color={rule.active ? theme.text : theme.faint(0.4)}>
                      {formatMoney(rule.amount)}
                    </Txt>
                    <Txt variant="caption" faint={0.45}>
                      {rule.kind === 'expense' ? (rule.category?.name ?? t('Expense')) : t('Income')}
                    </Txt>
                  </View>
                }
                divider={index < rules.data.length - 1}
                onPress={() => open(rule)}
              />
            ))}
          </Card>
        ) : null}
      </Screen>
      <Fab onPress={() => open(null)} accessibilityLabel={t('Add recurring')} />
      <RecurringFormSheet sheetRef={sheet.ref} rule={editing} defaultKind={kind === 'income' ? 'income' : 'expense'} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  card: { paddingHorizontal: 14 },
  trailing: { alignItems: 'flex-end' },
});
