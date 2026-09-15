import { useLocalSearchParams } from 'expo-router';

import { FormScreen, useLeaveForm } from '@/components/FormScreen';
import { BorrowingForm } from '@/forms/BorrowingForm';
import { useBorrowing } from '@/hooks/borrowings';
import { useT } from '@/i18n';

/** `/borrowing-form` records a new borrowing; `/borrowing-form?uuid=…` edits one. */
export default function BorrowingFormScreen() {
  const t = useT();
  const leave = useLeaveForm();
  const { uuid = '' } = useLocalSearchParams<{ uuid?: string }>();
  const query = useBorrowing(uuid);

  return (
    <FormScreen title={uuid ? t('Edit borrowing') : t('Add borrowing')} loading={!!uuid && query.isPending} error={uuid ? query.error : null} onRetry={() => void query.refetch()}>
      <BorrowingForm key={uuid || 'new'} borrowing={query.data ?? null} onDone={leave} />
    </FormScreen>
  );
}
