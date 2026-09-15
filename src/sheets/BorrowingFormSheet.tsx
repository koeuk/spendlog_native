import { StyleSheet, View } from 'react-native';

import { Chips } from '@/components/Chips';
import { DateField } from '@/components/DateField';
import { Input } from '@/components/Input';
import { MoneyInput } from '@/components/MoneyInput';
import { OptionPicker } from '@/components/OptionPicker';
import { PillButton } from '@/components/PillButton';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { useLenderOptions, useSaveBorrowing } from '@/hooks/borrowings';
import { useForm } from '@/hooks/useForm';
import { useMoneySettings } from '@/hooks/useMoneySettings';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import type { Borrowing, Currency, LenderType } from '@/types/api';
import { isFutureYmd, parseYmd, todayYmd } from '@/utils/dates';
import { amountNumber } from '@/utils/money';

interface BorrowingFormSheetProps {
  sheetRef: SheetRef;
  borrowing: Borrowing | null;
  onSaved?: (borrowing: Borrowing) => void;
}

/** Money borrowed from someone: who, how much, when, and when it is due. */
export function BorrowingFormSheet({ sheetRef, borrowing, onSaved }: BorrowingFormSheetProps) {
  const t = useT();
  return (
    <Sheet sheetRef={sheetRef} title={borrowing ? t('Edit borrowing') : t('Add borrowing')}>
      <BorrowingForm key={borrowing?.uuid ?? 'new'} borrowing={borrowing} onSaved={onSaved} close={() => sheetRef.current?.dismiss()} />
    </Sheet>
  );
}

function BorrowingForm({ borrowing, onSaved, close }: { borrowing: Borrowing | null; onSaved?: (borrowing: Borrowing) => void; close: () => void }) {
  const t = useT();
  const money = useMoneySettings();
  const { data: options } = useLenderOptions();
  const save = useSaveBorrowing();
  const form = useForm({
    lender: borrowing?.lender ?? '',
    lender_type: borrowing?.lender_type ?? ('friend' as LenderType),
    amount: borrowing?.amount ?? '',
    currency: (borrowing ? 'USD' : money.default_currency) as Currency,
    borrowed_on: borrowing?.borrowed_on ?? todayYmd(),
    due_on: borrowing?.due_on ?? null,
    note: borrowing?.note ?? '',
  });

  const submit = () =>
    form.submit(
      async () => {
        const { lender, lender_type, amount, currency, borrowed_on, due_on, note } = form.values;
        const saved = await save.mutateAsync({
          uuid: borrowing?.uuid,
          payload: { lender: lender.trim(), lender_type, amount, currency, borrowed_on, due_on: due_on ?? null, note: note.trim() || null },
        });
        toast(t(borrowing ? 'Borrowing updated.' : 'Borrowing added.'), 'success');
        close();
        onSaved?.(saved);
      },
      () => ({
        lender: form.values.lender.trim() ? undefined : t('Name the lender.'),
        amount: amountNumber(form.values.amount) > 0 ? undefined : t('Enter an amount.'),
        borrowed_on: !form.values.borrowed_on ? t('Pick a date.') : isFutureYmd(form.values.borrowed_on) ? t('The date cannot be in the future.') : undefined,
        due_on: form.values.due_on && form.values.due_on < form.values.borrowed_on ? t('The due date cannot come before the borrowing.') : undefined,
      }),
    );

  return (
    <View style={styles.form}>
      <Input sheet label={t('Lender')} value={form.values.lender} onChangeText={(text) => form.set('lender', text)} error={form.errors.lender} placeholder={t('Mom, Sokha, ABA…')} autoFocus={!borrowing} maxLength={255} />
      <Chips options={(options?.lenders ?? []).slice(0, 8)} selected={form.values.lender} onSelect={(value) => form.set('lender', value)} />
      <OptionPicker
        label={t('Type')}
        value={form.values.lender_type}
        onChange={(value) => form.set('lender_type', value)}
        options={(options?.types ?? []).map((type) => ({ value: type.value, label: type.label }))}
      />
      <MoneyInput
        sheet
        label={t('Amount')}
        value={form.values.amount}
        onChangeText={(text) => form.set('amount', text)}
        currency={form.values.currency}
        onCurrencyChange={(currency) => form.set('currency', currency)}
        error={form.errors.amount}
      />
      <DateField label={t('Borrowed on')} value={form.values.borrowed_on} onChange={(value) => form.set('borrowed_on', value ?? '')} maximumDate={new Date()} error={form.errors.borrowed_on} />
      <DateField label={t('Due on')} value={form.values.due_on} onChange={(value) => form.set('due_on', value)} placeholder={t('No due date')} clearable minimumDate={parseYmd(form.values.borrowed_on) ?? undefined} error={form.errors.due_on} />
      <Input sheet label={t('Note')} value={form.values.note} onChangeText={(text) => form.set('note', text)} multiline maxLength={500} />
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
