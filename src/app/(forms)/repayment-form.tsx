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
  const title = t('Add repayment');

  if (!uuid) return <FormScreen title={title} missing />;
  if (query.isPending) return <FormScreen title={title} loading />;
  if (query.error || !query.data) return <FormScreen title={title} error={query.error} missing={!query.error} onRetry={() => void query.refetch()} />;

  return <RepaymentForm key={`${query.data.uuid}-${query.data.repaid}`} title={title} borrowing={query.data} onDone={leave} />;
}
