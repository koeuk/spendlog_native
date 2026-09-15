import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck, Pencil, Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { IconButton } from '@/components/IconButton';
import { ListRow } from '@/components/ListRow';
import { PillButton } from '@/components/PillButton';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useBorrowing, useDeleteBorrowing, useDeleteRepayment, useLenderOptions } from '@/hooks/borrowings';
import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme/useTheme';
import type { Repayment } from '@/types/api';
import { confirm } from '@/utils/confirm';
import { longDate } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

/** One borrowing with its ledger of repayments. */
export default function BorrowingDetailScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const query = useBorrowing(uuid);
  const { data: options } = useLenderOptions();
  const removeBorrowing = useDeleteBorrowing();
  const removeRepayment = useDeleteRepayment();
  const borrowing = query.data;
  const typeLabel = options?.types.find((type) => type.value === borrowing?.lender_type)?.label ?? borrowing?.lender_type ?? '';

  const destroy = async () => {
    if (!borrowing) return;
    const ok = await confirm({ title: t('Delete this borrowing?'), message: t('Its repayments go with it. This cannot be undone.'), confirmLabel: t('Delete'), destructive: true });
    if (!ok) return;
    try {
      await removeBorrowing.mutateAsync(borrowing.uuid);
      toast(t('Borrowing deleted.'), 'success');
      router.back();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  const destroyRepayment = async (repayment: Repayment) => {
    if (!borrowing) return;
    const ok = await confirm({ title: t('Delete this repayment?'), message: formatMoney(repayment.amount), confirmLabel: t('Delete'), destructive: true });
    if (!ok) return;
    try {
      await removeRepayment.mutateAsync({ borrowingUuid: borrowing.uuid, repaymentUuid: repayment.uuid });
      toast(t('Repayment deleted.'), 'success');
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <>
      <Screen
        scroll
        refreshing={query.isRefetching && !query.isPending}
        onRefresh={() => void query.refetch()}
        contentContainerStyle={styles.content}
        header={<Header title={borrowing?.lender ?? t('Borrowing')} back right={borrowing ? <IconButton icon={Pencil} onPress={() => router.push({ pathname: '/borrowing-form', params: { uuid } })} accessibilityLabel={t('Edit')} /> : undefined} />}>
        {query.isPending ? (
          <SkeletonCard lines={4} />
        ) : query.isError ? (
          <Card>
            <ErrorState error={query.error} onRetry={() => void query.refetch()} compact />
          </Card>
        ) : borrowing ? (
          <>
            <Card style={styles.section}>
              <Txt variant="label" faint={0.6}>
                {borrowing.settled ? t('Settled') : t('Still owed')}
              </Txt>
              <Txt variant="display" color={borrowing.overdue && !borrowing.settled ? theme.errorInk : theme.text}>
                {formatMoney(borrowing.remaining)}
              </Txt>
              <ProgressBar percent={borrowing.percent_repaid} color={borrowing.settled ? theme.faint(0.3) : borrowing.overdue ? theme.errorInk : theme.accent} />
              <Txt variant="label" faint={0.6}>
                {t(':repaid of :amount repaid', { repaid: formatMoney(borrowing.repaid), amount: formatMoney(borrowing.amount) })} · {borrowing.percent_repaid}%
              </Txt>
              <View style={styles.facts}>
                <Fact label={t('Lender')} value={`${borrowing.lender} · ${typeLabel}`} />
                <Fact label={t('Borrowed on')} value={longDate(borrowing.borrowed_on, locale)} />
                <Fact label={t('Due on')} value={borrowing.due_on ? longDate(borrowing.due_on, locale) : t('No due date')} tint={borrowing.overdue && !borrowing.settled ? theme.errorInk : undefined} />
                {borrowing.note ? <Fact label={t('Note')} value={borrowing.note} /> : null}
              </View>
              {borrowing.settled ? (
                <View style={styles.settled}>
                  <CircleCheck size={18} color={theme.accent} />
                  <Txt variant="label" color={theme.accent}>
                    {t('Paid back in full.')}
                  </Txt>
                </View>
              ) : (
                <PillButton label={t('Add repayment')} icon={Plus} onPress={() => router.push({ pathname: '/repayment-form', params: { uuid } })} block />
              )}
            </Card>

            <Card padded={false} style={styles.ledger}>
              <Txt variant="heading" style={styles.ledgerTitle}>
                {t('Repayments')}
              </Txt>
              {(borrowing.repayments ?? []).length === 0 ? (
                <Txt faint={0.5} style={styles.ledgerEmpty}>
                  {t('Nothing paid back yet.')}
                </Txt>
              ) : (
                (borrowing.repayments ?? []).map((repayment, index, all) => (
                  <ListRow
                    key={repayment.uuid}
                    title={formatMoney(repayment.amount)}
                    subtitle={[longDate(repayment.paid_on, locale), repayment.note].filter(Boolean).join(' · ')}
                    divider={index < all.length - 1}
                    onLongPress={() => void destroyRepayment(repayment)}
                    accessibilityLabel={t('Repayment of :amount', { amount: formatMoney(repayment.amount) })}
                  />
                ))
              )}
            </Card>
            <PillButton label={t('Delete borrowing')} variant="danger" onPress={destroy} loading={removeBorrowing.isPending} block />
          </>
        ) : null}
      </Screen>
    </>
  );
}

function Fact({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <View style={styles.fact}>
      <Txt variant="label" faint={0.55} style={styles.factLabel}>
        {label}
      </Txt>
      <Txt color={tint} style={styles.factValue}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  section: { gap: 10 },
  facts: { gap: 8, marginTop: 4 },
  fact: { flexDirection: 'row', gap: 12 },
  factLabel: { width: 96 },
  factValue: { flex: 1 },
  settled: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  ledger: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  ledgerTitle: { marginBottom: 4 },
  ledgerEmpty: { paddingVertical: 12 },
});
