import { useLocalSearchParams } from 'expo-router';

import { FormScreen, useLeaveForm } from '@/components/FormScreen';
import { AdminUserForm } from '@/forms/AdminUserForm';
import { useAdminUser } from '@/hooks/admin';
import { useT } from '@/i18n';

/** `/admin-user-form` adds an account; `/admin-user-form?uuid=…` edits one. */
export default function AdminUserFormScreen() {
  const t = useT();
  const leave = useLeaveForm();
  const { uuid = '' } = useLocalSearchParams<{ uuid?: string }>();
  const query = useAdminUser(uuid);
  const title = uuid ? t('Edit user') : t('Add user');

  // The form reads the account once, when it mounts, so it waits here for the
  // account to arrive rather than starting empty and filling in underneath.
  if (uuid && query.isPending) return <FormScreen title={title} loading />;
  if (uuid && query.error) return <FormScreen title={title} error={query.error} onRetry={() => void query.refetch()} />;
  if (uuid && !query.user) return <FormScreen title={title} missing />;

  return <AdminUserForm key={uuid || 'new'} title={title} user={query.user} onDone={leave} />;
}
