import { ArrowDownToLine, ArrowUpFromLine, PiggyBank } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Fab } from '@/components/Fab';
import { Header } from '@/components/Header';
import { IconDisc } from '@/components/IconDisc';
import { ListRow } from '@/components/ListRow';
import { MonthStepper } from '@/components/MonthStepper';
import { PillButton } from '@/components/PillButton';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { useSheet } from '@/components/Sheet';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useSavingsEntries, useSavingsPlan, useSavingsSummary } from '@/hooks/savings';
import { useT } from '@/i18n';
import { SavingsEntrySheet } from '@/sheets/SavingsEntrySheet';
import { SavingsPlanSheet } from '@/sheets/SavingsPlanSheet';
import { useLocaleStore } from '@/store/locale';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { SavingsEntry, SavingsStatus } from '@/types/api';
import { currentYm, dayLabel } from '@/utils/dates';
import { amountNumber, formatMoney } from '@/utils/money';

/** A monthly plan and the ledger behind it; the balance carries over between months. */
export default function SavingsScreen() {
  const t = useT();
  const theme = useTheme();
  const locale = useLocaleStore((state) => state.locale);
  const [month, setMonth] = useState(currentYm());
  const summary = useSavingsSummary(month);
  const entries = useSavingsEntries(month);
  const plan = useSavingsPlan(month);
  const planSheet = useSheet();
  const entrySheet = useSheet();
  const [editing, setEditing] = useState<SavingsEntry | null>(null);

  const openEntry = (entry: SavingsEntry | null) => {
    setEditing(entry);
    entrySheet.present();
  };

  const refresh = () => {
    void summary.refetch();
    void entries.refetch();
    void plan.refetch();
  };

  const statusLine = (status: SavingsStatus, remaining: string) => {
    if (status === 'met') return t('Plan met');
    if (status === 'close') return t(':amount to go', { amount: formatMoney(remaining) });
    return t(':amount to go', { amount: formatMoney(remaining) });
  };

  const data = summary.data;
  const planned = amountNumber(data?.planned);

  return (
    <>
      <Screen scroll refreshing={summary.isRefetching && !summary.isPending} onRefresh={refresh} bottomInset={layout.fabClearance} contentContainerStyle={styles.content} header={<Header title={t('Savings')} back />}>
        <MonthStepper month={month} onChange={setMonth} />
        {summary.isPending ? (
          <>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={2} />
          </>
        ) : summary.isError ? (
          <Card>
            <ErrorState error={summary.error} onRetry={refresh} compact />
          </Card>
        ) : data ? (
          <>
            <Card style={styles.section}>
              <View style={styles.rowBetween}>
                <Txt variant="label" faint={0.6}>
                  {t('Saved this month')}
                </Txt>
                <PillButton label={planned > 0 ? t('Change plan') : t('Set a plan')} variant="tonal" size="sm" onPress={planSheet.present} />
              </View>
              <Txt variant="display" color={amountNumber(data.saved_this_month) < 0 ? theme.errorInk : theme.text}>
                {formatMoney(data.saved_this_month, 'signed')}
                {planned > 0 ? (
                  <Txt variant="heading" faint={0.5}>
                    {' '}
                    {t('of')} {formatMoney(data.planned)}
                  </Txt>
                ) : null}
              </Txt>
              {planned > 0 ? (
                <>
                  <ProgressBar percent={data.percent} color={data.status === 'met' ? theme.accent : data.status === 'close' ? '#F59E0B' : theme.accent} />
                  <Txt variant="label" faint={0.6}>
                    {statusLine(data.status, data.remaining)} · {data.percent_raw}%
                  </Txt>
                </>
              ) : (
                <Txt variant="label" faint={0.55}>
                  {t('No plan for this month yet.')}
                </Txt>
              )}
            </Card>
            <Card style={styles.section}>
              <Txt variant="label" faint={0.6}>
                {t('Total saved')}
              </Txt>
              <Txt variant="xl">{formatMoney(data.total_saved, 'signed')}</Txt>
              <Txt variant="label" faint={0.5}>
                {data.entries_count === 1 ? t('1 entry this month') : t(':count entries this month', { count: data.entries_count })}
              </Txt>
            </Card>
          </>
        ) : null}

        {entries.isPending ? (
          <SkeletonCard lines={3} />
        ) : entries.isError ? (
          <Card>
            <ErrorState error={entries.error} onRetry={refresh} compact />
          </Card>
        ) : entries.data && entries.data.length === 0 ? (
          <EmptyState icon={PiggyBank} title={t('Nothing saved this month yet.')} actionLabel={t('Add to savings')} onAction={() => openEntry(null)} compact />
        ) : entries.data ? (
          <Card padded={false} style={styles.card}>
            {entries.data.map((entry, index) => {
              const deposit = entry.type === 'deposit';
              return (
                <ListRow
                  key={entry.uuid}
                  leading={<IconDisc icon={deposit ? ArrowDownToLine : ArrowUpFromLine} color={deposit ? theme.accent : theme.errorInk} />}
                  title={deposit ? (entry.source ?? t('Deposit')) : t('Withdrawal')}
                  subtitle={[dayLabel(entry.saved_on, locale), entry.note].filter(Boolean).join(' · ')}
                  trailingText={`${deposit ? '+' : '−'}${formatMoney(entry.amount)}`}
                  trailingColor={deposit ? theme.accent : theme.errorInk}
                  divider={index < entries.data.length - 1}
                  onPress={() => openEntry(entry)}
                />
              );
            })}
          </Card>
        ) : null}
      </Screen>
      <Fab onPress={() => openEntry(null)} accessibilityLabel={t('Add to savings')} />
      <SavingsPlanSheet sheetRef={planSheet.ref} month={month} plan={plan.data ?? null} />
      <SavingsEntrySheet sheetRef={entrySheet.ref} entry={editing} totalSaved={data?.total_saved ?? '0.00'} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  section: { gap: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { paddingHorizontal: 14 },
});
