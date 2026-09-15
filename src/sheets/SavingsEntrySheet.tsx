import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Chips } from '@/components/Chips';
import { DateField } from '@/components/DateField';
import { Input } from '@/components/Input';
import { MoneyInput } from '@/components/MoneyInput';
import { PillButton } from '@/components/PillButton';
import { Segmented } from '@/components/Segmented';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useIncomeSources } from '@/hooks/incomes';
import { useDeleteSavingsEntry, useSaveSavingsEntry } from '@/hooks/savings';
import { useForm } from '@/hooks/useForm';
import { useMoneySettings } from '@/hooks/useMoneySettings';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import type { Currency, SavingsEntry, SavingsEntryType } from '@/types/api';
import { confirm } from '@/utils/confirm';
import { isFutureYmd, todayYmd } from '@/utils/dates';
import { amountNumber, formatMoney } from '@/utils/money';

interface SavingsEntrySheetProps {
  sheetRef: SheetRef;
  entry: SavingsEntry | null;
  /** The all-time balance, so a withdrawal can be checked before the server does. */
  totalSaved: string;
}

/** A deposit into savings, or a withdrawal out of it. */
export function SavingsEntrySheet({ sheetRef, entry, totalSaved }: SavingsEntrySheetProps) {
  const t = useT();
  return (
    <Sheet sheetRef={sheetRef} title={entry ? t('Edit entry') : t('Add to savings')}>
      <EntryForm key={entry?.uuid ?? 'new'} entry={entry} totalSaved={totalSaved} close={() => sheetRef.current?.dismiss()} />
    </Sheet>
  );
}

function EntryForm({ entry, totalSaved, close }: { entry: SavingsEntry | null; totalSaved: string; close: () => void }) {
  const t = useT();
  const money = useMoneySettings();
  const { data: sources = [] } = useIncomeSources();
  const save = useSaveSavingsEntry();
  const remove = useDeleteSavingsEntry();
  const form = useForm({
    type: entry?.type ?? ('deposit' as SavingsEntryType),
    amount: entry?.amount ?? '',
    currency: (entry ? 'USD' : money.default_currency) as Currency,
    source: entry?.source ?? '',
    saved_on: entry?.saved_on ?? todayYmd(),
    note: entry?.note ?? '',
  });
  const withdrawing = form.values.type === 'withdraw';

  const submit = () =>
    form.submit(
      async () => {
        const { type, amount, currency, source, saved_on, note } = form.values;
        await save.mutateAsync({
          uuid: entry?.uuid,
          payload: { type, amount, currency, source: type === 'deposit' ? source.trim() || null : null, saved_on, note: note.trim() || null },
        });
        toast(t(entry ? 'Entry updated.' : type === 'deposit' ? 'Deposit added.' : 'Withdrawal added.'), 'success');
        close();
      },
      () => ({
        amount: amountNumber(form.values.amount) > 0 ? undefined : t('Enter an amount.'),
        saved_on: !form.values.saved_on ? t('Pick a date.') : isFutureYmd(form.values.saved_on) ? t('The date cannot be in the future.') : undefined,
      }),
    );

  const destroy = async () => {
    if (!entry) return;
    const ok = await confirm({ title: t('Delete this entry?'), message: t('This cannot be undone.'), confirmLabel: t('Delete'), destructive: true });
    if (!ok) return;
    try {
      await remove.mutateAsync(entry.uuid);
      toast(t('Entry deleted.'), 'success');
      close();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <View style={styles.form}>
      <Segmented
        options={[
          { value: 'deposit', label: t('Deposit') },
          { value: 'withdraw', label: t('Withdraw') },
        ]}
        value={form.values.type}
        onChange={(type) => form.set('type', type)}
      />
      <MoneyInput
        sheet
        label={t('Amount')}
        value={form.values.amount}
        onChangeText={(text) => form.set('amount', text)}
        currency={form.values.currency}
        onCurrencyChange={(currency) => form.set('currency', currency)}
        error={form.errors.amount}
        hint={withdrawing ? t('Saved so far: :amount', { amount: formatMoney(totalSaved) }) : undefined}
        autoFocus={!entry}
      />
      {withdrawing ? null : (
        <>
          <Input sheet label={t('From')} value={form.values.source} onChangeText={(text) => form.set('source', text)} placeholder={t('Where this came from (optional)')} maxLength={255} />
          <Chips options={sources.slice(0, 8)} selected={form.values.source} onSelect={(value) => form.set('source', value)} />
        </>
      )}
      <DateField label={t('Date')} value={form.values.saved_on} onChange={(value) => form.set('saved_on', value ?? '')} maximumDate={new Date()} error={form.errors.saved_on} />
      <Input sheet label={t('Note')} value={form.values.note} onChangeText={(text) => form.set('note', text)} multiline maxLength={500} />
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
      {entry ? <PillButton label={t('Delete')} onPress={destroy} loading={remove.isPending} variant="danger" block /> : null}
      {withdrawing ? (
        <Txt variant="label" faint={0.5}>
          {t('Money saved in one month can come out in another; the ceiling is everything saved so far.')}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
