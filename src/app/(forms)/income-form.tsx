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

  return (
    <FormScreen title={uuid ? t('Edit income') : t('Add income')} loading={!!uuid && query.isPending} error={uuid ? query.error : null} onRetry={() => void query.refetch()}>
      <IncomeForm key={uuid || 'new'} income={query.data ?? null} onDone={leave} />
    </FormScreen>
  );
}
