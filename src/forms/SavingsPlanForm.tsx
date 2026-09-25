import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { FormActions } from '@/components/FormActions';
import { FormScreen } from '@/components/FormScreen';
import { MoneyInput } from '@/components/MoneyInput';
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

/** How much to put aside this month. Upserts the slot, so saving twice just changes it. */
export function SavingsPlanForm({ title, header, month, plan, onDone }: { title: string; header?: ReactNode; month: Ym; plan: SavingsPlan | null; onDone: () => void }) {
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
        onDone();
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
      onDone();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <FormScreen title={title} footer={<FormActions saveLabel={t('Save')} onSave={submit} saving={form.submitting} deleteLabel={plan ? t('Remove plan') : undefined} onDelete={plan ? destroy : undefined} deleting={remove.isPending} />}>
      <View style={styles.form}>
        {header}
        <Txt faint={0.6}>{t('How much to put aside in :month.', { month: monthLabel(month, locale) })}</Txt>
        <MoneyInput
          label={t('Amount')}
          value={form.values.amount}
          onChangeText={(text) => form.set('amount', text)}
          currency={form.values.currency}
          onCurrencyChange={(currency) => form.set('currency', currency)}
          error={form.errors.amount}
          autoFocus
        />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
