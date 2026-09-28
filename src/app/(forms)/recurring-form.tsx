import { useLocalSearchParams } from 'expo-router';

import { FormScreen, useLeaveForm } from '@/components/FormScreen';
import { RecurringForm } from '@/forms/RecurringForm';
import { useRecurringRule } from '@/hooks/recurring';
import { useT } from '@/i18n';
import type { RecurringKind } from '@/types/api';

/** `/recurring-form` adds a rule; `/recurring-form?uuid=…` edits one. */
export default function RecurringFormScreen() {
  const t = useT();
  const leave = useLeaveForm();
  const { uuid = '', kind = 'expense' } = useLocalSearchParams<{ uuid?: string; kind?: RecurringKind }>();
  const query = useRecurringRule(uuid);
  const title = uuid ? t('Edit recurring') : t('Add recurring');

  // The form reads the rule once, when it mounts, so it waits here for the rule.
  if (uuid && query.isPending) return <FormScreen title={title} loading />;
  if (uuid && query.error) return <FormScreen title={title} error={query.error} onRetry={() => void query.refetch()} />;
  if (uuid && !query.rule) return <FormScreen title={title} missing />;

  return <RecurringForm key={uuid || `new-${kind}`} title={title} rule={query.rule} defaultKind={kind} onDone={leave} />;
}
