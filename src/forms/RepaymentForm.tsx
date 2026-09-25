import { StyleSheet, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { FormActions } from '@/components/FormActions';
import { FormScreen } from '@/components/FormScreen';
import { Input } from '@/components/Input';
import { MoneyInput } from '@/components/MoneyInput';
import { PillButton } from '@/components/PillButton';
import { useAddRepayment } from '@/hooks/borrowings';
import { useForm } from '@/hooks/useForm';
import { useMoneySettings } from '@/hooks/useMoneySettings';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import type { Borrowing, Currency } from '@/types/api';
import { isFutureYmd, parseYmd, todayYmd } from '@/utils/dates';
import { amountNumber, formatMoney } from '@/utils/money';

/** Paying some of a borrowing back. Capped at what is still owed; the server checks under a lock. */
export function RepaymentForm({ title, borrowing, onDone }: { title: string; borrowing: Borrowing; onDone: () => void }) {
  const t = useT();
  const money = useMoneySettings();
  const add = useAddRepayment();
  const form = useForm({ amount: '', currency: money.default_currency as Currency, paid_on: todayYmd(), note: '' });

  const submit = () =>
    form.submit(
      async () => {
        const { amount, currency, paid_on, note } = form.values;
        await add.mutateAsync({ borrowingUuid: borrowing.uuid, payload: { amount, currency, paid_on, note: note.trim() || null } });
        toast(t('Repayment added.'), 'success');
        onDone();
      },
      () => ({
        amount: amountNumber(form.values.amount) > 0 ? undefined : t('Enter an amount.'),
        paid_on: !form.values.paid_on
          ? t('Pick a date.')
          : isFutureYmd(form.values.paid_on)
            ? t('The date cannot be in the future.')
            : form.values.paid_on < borrowing.borrowed_on
              ? t('A repayment cannot come before the borrowing.')
              : undefined,
      }),
    );

  return (
    <FormScreen title={title} footer={<FormActions saveLabel={t('Save')} onSave={submit} saving={form.submitting} />}>
      <View style={styles.form}>
        <MoneyInput
          label={t('Amount')}
          value={form.values.amount}
          onChangeText={(text) => form.set('amount', text)}
          currency={form.values.currency}
          onCurrencyChange={(currency) => form.set('currency', currency)}
          error={form.errors.amount}
          hint={t('Still owed: :amount', { amount: formatMoney(borrowing.remaining) })}
          autoFocus
        />
        <PillButton
          label={t('Pay it all')}
          variant="tonal"
          size="sm"
          onPress={() => {
            form.set('currency', 'USD');
            form.set('amount', borrowing.remaining);
          }}
        />
        <DateField label={t('Paid on')} value={form.values.paid_on} onChange={(value) => form.set('paid_on', value ?? '')} maximumDate={new Date()} minimumDate={parseYmd(borrowing.borrowed_on) ?? undefined} error={form.errors.paid_on} />
        <Input label={t('Note')} value={form.values.note} onChangeText={(text) => form.set('note', text)} multiline maxLength={500} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
