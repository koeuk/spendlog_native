import { useLocalSearchParams } from 'expo-router';

import { FormScreen, useLeaveForm } from '@/components/FormScreen';
import { RepaymentForm } from '@/forms/RepaymentForm';
import { useBorrowing } from '@/hooks/borrowings';
import { useT } from '@/i18n';

/** `/repayment-form?uuid=<borrowing>`: pay some of that borrowing back. */
export default function RepaymentFormScreen() {
  const t = useT();
  const leave = useLeaveForm();
  const { uuid = '' } = useLocalSearchParams<{ uuid?: string }>();
  const query = useBorrowing(uuid);

  return (
    <FormScreen title={t('Add repayment')} loading={!!uuid && query.isPending} error={query.error} onRetry={() => void query.refetch()} missing={!uuid}>
      {query.data ? <RepaymentForm key={`${query.data.uuid}-${query.data.repaid}`} borrowing={query.data} onDone={leave} /> : null}
    </FormScreen>
  );
}
