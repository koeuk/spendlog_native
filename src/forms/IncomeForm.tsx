import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Chips } from '@/components/Chips';
import { DateField } from '@/components/DateField';
import { FormActions } from '@/components/FormActions';
import { FormScreen } from '@/components/FormScreen';
import { Input } from '@/components/Input';
import { MoneyInput } from '@/components/MoneyInput';
import { useDeleteIncome, useIncomeSources, useSaveIncome } from '@/hooks/incomes';
import { useForm } from '@/hooks/useForm';
import { useMoneySettings } from '@/hooks/useMoneySettings';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import type { Currency, Income } from '@/types/api';
import { confirm } from '@/utils/confirm';
import { isFutureYmd, todayYmd } from '@/utils/dates';
import { amountNumber } from '@/utils/money';

/** Add or edit money coming in. `source` is free text; the chips are what this account used before. */
export function IncomeForm({ title, income, onDone }: { title: string; income: Income | null; onDone: () => void }) {
  const t = useT();
  const money = useMoneySettings();
  const { data: sources = [] } = useIncomeSources();
  const save = useSaveIncome();
  const remove = useDeleteIncome();
  const form = useForm({
    source: income?.source ?? '',
    amount: income?.amount ?? '',
    currency: (income ? 'USD' : money.default_currency) as Currency,
    received_on: income?.received_on ?? todayYmd(),
    note: income?.note ?? '',
  });

  const submit = () =>
    form.submit(
      async () => {
        const { source, amount, currency, received_on, note } = form.values;
        await save.mutateAsync({ uuid: income?.uuid, payload: { source: source.trim(), amount, currency, received_on, note: note.trim() || null } });
        toast(t(income ? 'Income updated successfully.' : 'Income added successfully.'), 'success');
        onDone();
      },
      () => ({
        source: form.values.source.trim() ? undefined : t('Name the source.'),
        amount: amountNumber(form.values.amount) > 0 ? undefined : t('Enter an amount.'),
        received_on: !form.values.received_on ? t('Pick a date.') : isFutureYmd(form.values.received_on) ? t('The date cannot be in the future.') : undefined,
      }),
    );

  const destroy = async () => {
    if (!income) return;
    const ok = await confirm({ title: t('Delete this income?'), message: t('This cannot be undone.'), confirmLabel: t('Delete'), destructive: true });
    if (!ok) return;
    try {
      await remove.mutateAsync(income.uuid);
      toast(t('Income deleted successfully.'), 'success');
      onDone();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <FormScreen title={title} footer={<FormActions saveLabel={t('Save')} onSave={submit} saving={form.submitting} deleteLabel={income ? t('Delete') : undefined} onDelete={income ? destroy : undefined} deleting={remove.isPending} />}>
      <View style={styles.form}>
        <Input label={t('Source')} value={form.values.source} onChangeText={(text) => form.set('source', text)} error={form.errors.source} placeholder={t('Salary, freelance, a gift…')} autoFocus={!income} />
        <Chips options={sources.slice(0, 8)} selected={form.values.source} onSelect={(value) => form.set('source', value)} />
        <MoneyInput
          label={t('Amount')}
          value={form.values.amount}
          onChangeText={(text) => form.set('amount', text)}
          currency={form.values.currency}
          onCurrencyChange={(currency) => form.set('currency', currency)}
          error={form.errors.amount}
        />
        <DateField label={t('Received on')} value={form.values.received_on} onChange={(value) => form.set('received_on', value ?? '')} maximumDate={new Date()} error={form.errors.received_on} />
        <Input label={t('Note')} value={form.values.note} onChangeText={(text) => form.set('note', text)} error={form.errors.note} multiline maxLength={500} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
