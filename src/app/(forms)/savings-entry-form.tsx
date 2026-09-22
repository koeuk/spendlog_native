import { useLocalSearchParams, useRouter } from 'expo-router';

import { FormScreen, useLeaveForm } from '@/components/FormScreen';
import { SavingsEntryForm } from '@/forms/SavingsEntryForm';
import { useSavingsEntries, useSavingsSummary } from '@/hooks/savings';
import { useT } from '@/i18n';
import type { SavingsEntryType } from '@/types/api';
import { currentYm } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

/**
 * `/savings-entry-form?month=2026-09` adds a deposit or withdrawal; add
 * `&uuid=…` to edit one of that month's entries. There is no single-entry
 * endpoint, so the row comes from the month's list the Savings screen loaded.
 */
export default function SavingsEntryFormScreen() {
  const t = useT();
  const router = useRouter();
  const leave = useLeaveForm();
  const params = useLocalSearchParams<{ month?: string; uuid?: string; type?: string; amount?: string }>();
  const month = params.month || currentYm();
  const uuid = params.uuid || '';
  const entries = useSavingsEntries(month);
  const summary = useSavingsSummary(month);
  const entry = uuid ? (entries.data?.find((row) => row.uuid === uuid) ?? null) : null;
  const loading = (!!uuid && entries.isPending) || summary.isPending;

  // Named, because the toggle inside rewrites *this* row, and a page that says
  // only "Edit entry" looks like the one that adds.
  const title = !uuid
    ? t('Add to savings')
    : entry
      ? `${entry.type === 'deposit' ? t('Edit deposit') : t('Edit withdrawal')} · ${formatMoney(entry.amount)}`
      : t('Edit entry');

  // Swap this page for a fresh one rather than stacking: the entry being
  // edited is staying as it is, so there is nothing to come back to.
  const addInstead = (type: SavingsEntryType, amount: string) => router.replace({ pathname: '/savings-entry-form', params: { month, type, amount } });

  return (
    <FormScreen
      title={title}
      loading={loading}
      error={(uuid ? entries.error : null) ?? summary.error}
      onRetry={() => {
        void entries.refetch();
        void summary.refetch();
      }}
      missing={!!uuid && !!entries.data && !entry}>
      <SavingsEntryForm
        key={uuid || `new-${params.type ?? 'deposit'}-${params.amount ?? ''}`}
        entry={entry}
        totalSaved={summary.data?.total_saved ?? '0.00'}
        onDone={leave}
        onAddInstead={addInstead}
        initialType={params.type === 'withdraw' ? 'withdraw' : 'deposit'}
        initialAmount={params.amount}
      />
    </FormScreen>
  );
}
