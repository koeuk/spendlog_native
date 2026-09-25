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
  const title = uuid ? t('Edit borrowing') : t('Add borrowing');

  // The form reads the row once, when it mounts, so it waits here for the row.
  if (uuid && query.isPending) return <FormScreen title={title} loading />;
  if (uuid && query.error) return <FormScreen title={title} error={query.error} onRetry={() => void query.refetch()} />;

  return <BorrowingForm key={uuid || 'new'} title={title} borrowing={query.data ?? null} onDone={leave} />;
}
