import { useLocalSearchParams } from 'expo-router';

import { FormScreen, useLeaveForm } from '@/components/FormScreen';
import { SavingsPlanForm } from '@/forms/SavingsPlanForm';
import { useSavingsPlan } from '@/hooks/savings';
import { useT } from '@/i18n';
import { currentYm } from '@/utils/dates';

/** `/savings-plan-form?month=2026-09`: set or change how much to put aside that month. */
export default function SavingsPlanFormScreen() {
  const t = useT();
  const leave = useLeaveForm();
  const params = useLocalSearchParams<{ month?: string }>();
  const month = params.month || currentYm();
  const plan = useSavingsPlan(month);

  return (
    <FormScreen title={plan.data ? t('Change plan') : t('Set a plan')} loading={plan.isPending} error={plan.error} onRetry={() => void plan.refetch()}>
      <SavingsPlanForm key={`${month}-${plan.data?.uuid ?? 'none'}`} month={month} plan={plan.data ?? null} onDone={leave} />
    </FormScreen>
  );
}
