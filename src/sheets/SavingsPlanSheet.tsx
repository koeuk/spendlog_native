import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { MoneyInput } from '@/components/MoneyInput';
import { PillButton } from '@/components/PillButton';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useDeleteSavingsPlan, useSetSavingsPlan } from '@/hooks/savings';
import { useForm } from '@/hooks/useForm';
import { useMoneySettings } from '@/hooks/useMoneySettings';
import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { toast } from '@/store/toast';
import type { Currency, SavingsPlan, Ym } from '@/types/api';
import { confirm } from '@/utils/confirm';
import { monthLabel } from '@/utils/dates';
import { amountNumber } from '@/utils/money';

interface SavingsPlanSheetProps {
  sheetRef: SheetRef;
  month: Ym;
  plan: SavingsPlan | null;
}

/** How much to put aside this month. Upserts the slot, so saving twice just changes it. */
export function SavingsPlanSheet({ sheetRef, month, plan }: SavingsPlanSheetProps) {
  const t = useT();
  return (
    <Sheet sheetRef={sheetRef} title={plan ? t('Change plan') : t('Set a plan')}>
      <PlanForm key={`${month}-${plan?.uuid ?? 'none'}`} month={month} plan={plan} close={() => sheetRef.current?.dismiss()} />
    </Sheet>
  );
}

function PlanForm({ month, plan, close }: { month: Ym; plan: SavingsPlan | null; close: () => void }) {
  const t = useT();
  const locale = useLocaleStore((state) => state.locale);
  const money = useMoneySettings();
  const save = useSetSavingsPlan();
  const remove = useDeleteSavingsPlan();
  const form = useForm({ amount: plan?.amount ?? '', currency: (plan ? 'USD' : money.default_currency) as Currency });

  const submit = () =>
    form.submit(
      async () => {
        await save.mutateAsync({ month, amount: form.values.amount, currency: form.values.currency });
        toast(t('Plan saved.'), 'success');
        close();
      },
      () => ({ amount: amountNumber(form.values.amount) >= 0 && form.values.amount !== '' ? undefined : t('Enter an amount.') }),
    );

  const destroy = async () => {
    if (!plan) return;
    const ok = await confirm({ title: t('Remove this plan?'), message: t('The money stays; only the intention goes.'), confirmLabel: t('Remove'), destructive: true });
    if (!ok) return;
    try {
      await remove.mutateAsync(plan.uuid);
      toast(t('Plan removed.'), 'success');
      close();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <View style={styles.form}>
      <Txt faint={0.6}>{t('How much to put aside in :month.', { month: monthLabel(month, locale) })}</Txt>
      <MoneyInput
        sheet
        label={t('Amount')}
        value={form.values.amount}
        onChangeText={(text) => form.set('amount', text)}
        currency={form.values.currency}
        onCurrencyChange={(currency) => form.set('currency', currency)}
        error={form.errors.amount}
        autoFocus
      />
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
      {plan ? <PillButton label={t('Remove plan')} onPress={destroy} loading={remove.isPending} variant="danger" block /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
