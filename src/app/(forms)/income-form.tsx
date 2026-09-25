import { useLocalSearchParams } from 'expo-router';

import { FormScreen, useLeaveForm } from '@/components/FormScreen';
import { IncomeForm } from '@/forms/IncomeForm';
import { useIncome } from '@/hooks/incomes';
import { useT } from '@/i18n';

/** `/income-form` adds income; `/income-form?uuid=…` edits one row. */
export default function IncomeFormScreen() {
  const t = useT();
  const leave = useLeaveForm();
  const { uuid = '' } = useLocalSearchParams<{ uuid?: string }>();
  const query = useIncome(uuid);
  const title = uuid ? t('Edit income') : t('Add income');

  // The form reads the row once, when it mounts, so it waits here for the row.
  if (uuid && query.isPending) return <FormScreen title={title} loading />;
  if (uuid && query.error) return <FormScreen title={title} error={query.error} onRetry={() => void query.refetch()} />;

  return <IncomeForm key={uuid || 'new'} title={title} income={query.data ?? null} onDone={leave} />;
}
