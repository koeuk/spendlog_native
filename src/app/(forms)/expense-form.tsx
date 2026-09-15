import { useLocalSearchParams } from 'expo-router';

import { FormScreen, useLeaveForm } from '@/components/FormScreen';
import { ExpenseForm } from '@/forms/ExpenseForm';
import { useExpense } from '@/hooks/expenses';
import { useT } from '@/i18n';

/** `/expense-form` adds an expense; `/expense-form?uuid=…` edits one. */
export default function ExpenseFormScreen() {
  const t = useT();
  const leave = useLeaveForm();
  const { uuid = '' } = useLocalSearchParams<{ uuid?: string }>();
  const query = useExpense(uuid);

  return (
    <FormScreen title={uuid ? t('Edit expense') : t('Add expense')} loading={!!uuid && query.isPending} error={uuid ? query.error : null} onRetry={() => void query.refetch()}>
      <ExpenseForm key={uuid || 'new'} expense={query.data ?? null} onDone={leave} />
    </FormScreen>
  );
}
