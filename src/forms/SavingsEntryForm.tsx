import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Chips } from '@/components/Chips';
import { DateField } from '@/components/DateField';
import { FormActions } from '@/components/FormActions';
import { FormScreen } from '@/components/FormScreen';
import { Input } from '@/components/Input';
import { MoneyInput } from '@/components/MoneyInput';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { useIncomeSources } from '@/hooks/incomes';
import { useDeleteSavingsEntry, useSaveSavingsEntry } from '@/hooks/savings';
import { useForm } from '@/hooks/useForm';
import { useMoneySettings } from '@/hooks/useMoneySettings';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import type { Currency, SavingsEntry, SavingsEntryType } from '@/types/api';
import { choose, confirm } from '@/utils/confirm';
import { isFutureYmd, todayYmd } from '@/utils/dates';
import { amountNumber, formatMoney } from '@/utils/money';

interface SavingsEntryFormProps {
  title: string;
  entry: SavingsEntry | null;
  /** The all-time balance, so a withdrawal can be checked before the server does. */
  totalSaved: string;
  onDone: () => void;
  /**
   * Start over on a fresh entry of this kind, carrying the amount across —
   * the way out of turning a deposit into a withdrawal when what was wanted
   * was a withdrawal *as well*.
   */
  onAddInstead?: (type: SavingsEntryType, amount: string) => void;
  /** Preselect the toggle and prefill the amount on a new entry. */
  initialType?: SavingsEntryType;
  initialAmount?: string;
}

/** A deposit into savings, or a withdrawal out of it. */
export function SavingsEntryForm({ title, entry, totalSaved, onDone, onAddInstead, initialType, initialAmount }: SavingsEntryFormProps) {
  const t = useT();
  const money = useMoneySettings();
  const { data: sources = [] } = useIncomeSources();
  const save = useSaveSavingsEntry();
  const remove = useDeleteSavingsEntry();
  const form = useForm({
    type: entry?.type ?? initialType ?? ('deposit' as SavingsEntryType),
    amount: entry?.amount ?? initialAmount ?? '',
    currency: (entry ? 'USD' : money.default_currency) as Currency,
    source: entry?.source ?? '',
    saved_on: entry?.saved_on ?? todayYmd(),
    note: entry?.note ?? '',
  });
  const withdrawing = form.values.type === 'withdraw';

  /**
   * Flipping a saved entry's direction rewrites that row; it does not add the
   * opposite movement. That is a correction — "I logged this the wrong way
   * round" — and rarely what someone reaching for Withdraw on a deposit they
   * just made meant, so it asks, and offers the other reading.
   */
  const confirmFlip = async (): Promise<boolean> => {
    if (!entry || form.values.type === entry.type) return true;

    const toWithdrawal = form.values.type === 'withdraw';
    const answer = await choose({
      title: toWithdrawal ? t('Turn this deposit into a withdrawal?') : t('Turn this withdrawal into a deposit?'),
      message: `${formatMoney(entry.amount)}\n\n${t('This replaces that entry. It does not add the opposite one.')}`,
      confirmLabel: t('Replace it'),
      altLabel: toWithdrawal ? t('Add a withdrawal instead') : t('Add a deposit instead'),
    });

    if (answer === 'alt') onAddInstead?.(form.values.type, form.values.amount);

    return answer === 'confirm';
  };

  const submit = () =>
    form.submit(
      async () => {
        if (!(await confirmFlip())) return;

        const { type, amount, currency, source, saved_on, note } = form.values;
        await save.mutateAsync({
          uuid: entry?.uuid,
          payload: { type, amount, currency, source: type === 'deposit' ? source.trim() || null : null, saved_on, note: note.trim() || null },
        });
        toast(t(entry ? 'Entry updated.' : type === 'deposit' ? 'Deposit added.' : 'Withdrawal added.'), 'success');
        onDone();
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
      onDone();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <FormScreen title={title} footer={<FormActions saveLabel={t('Save')} onSave={submit} saving={form.submitting} deleteLabel={entry ? t('Delete') : undefined} onDelete={entry ? destroy : undefined} deleting={remove.isPending} />}>
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
            <Input label={t('From')} value={form.values.source} onChangeText={(text) => form.set('source', text)} placeholder={t('Where this came from (optional)')} maxLength={255} />
            <Chips options={sources.slice(0, 8)} selected={form.values.source} onSelect={(value) => form.set('source', value)} />
          </>
        )}
        <DateField label={t('Date')} value={form.values.saved_on} onChange={(value) => form.set('saved_on', value ?? '')} maximumDate={new Date()} error={form.errors.saved_on} />
        <Input label={t('Note')} value={form.values.note} onChangeText={(text) => form.set('note', text)} multiline maxLength={500} />
        {withdrawing ? (
          <Txt variant="label" faint={0.5}>
            {t('Money saved in one month can come out in another; the ceiling is everything saved so far.')}
          </Txt>
        ) : null}
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
