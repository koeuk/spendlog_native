import { useLocalSearchParams } from 'expo-router';

import { FormScreen, useLeaveForm } from '@/components/FormScreen';
import { SavingsEntryForm } from '@/forms/SavingsEntryForm';
import { useSavingsEntries, useSavingsSummary } from '@/hooks/savings';
import { useT } from '@/i18n';
import { currentYm } from '@/utils/dates';

/**
 * `/savings-entry-form?month=2026-09` adds a deposit or withdrawal; add
 * `&uuid=…` to edit one of that month's entries. There is no single-entry
 * endpoint, so the row comes from the month's list the Savings screen loaded.
 */
export default function SavingsEntryFormScreen() {
  const t = useT();
  const leave = useLeaveForm();
  const params = useLocalSearchParams<{ month?: string; uuid?: string }>();
  const month = params.month || currentYm();
  const uuid = params.uuid || '';
  const entries = useSavingsEntries(month);
  const summary = useSavingsSummary(month);
  const entry = uuid ? (entries.data?.find((row) => row.uuid === uuid) ?? null) : null;
  const loading = (!!uuid && entries.isPending) || summary.isPending;

  return (
    <FormScreen
      title={uuid ? t('Edit entry') : t('Add to savings')}
      loading={loading}
      error={(uuid ? entries.error : null) ?? summary.error}
      onRetry={() => {
        void entries.refetch();
        void summary.refetch();
      }}
      missing={!!uuid && !!entries.data && !entry}>
      <SavingsEntryForm key={uuid || 'new'} entry={entry} totalSaved={summary.data?.total_saved ?? '0.00'} onDone={leave} />
    </FormScreen>
  );
}
