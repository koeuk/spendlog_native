import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { CategoryBadge } from '@/components/CategoryBadge';
import { MoneyInput } from '@/components/MoneyInput';
import { PillButton } from '@/components/PillButton';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useDeleteBudget, useSetBudget } from '@/hooks/budgets';
import { useForm } from '@/hooks/useForm';
import { useMoneySettings } from '@/hooks/useMoneySettings';
import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { toast } from '@/store/toast';
import type { BudgetLine, Currency, Ym } from '@/types/api';
import { confirm } from '@/utils/confirm';
import { monthLabel } from '@/utils/dates';
import { amountNumber } from '@/utils/money';

interface BudgetSheetProps {
  sheetRef: SheetRef;
  month: Ym;
  /** The line being set; `null` is the overall budget covering every category. */
  line: BudgetLine | null;
}

/** Set, change or clear one `(category, month)` budget slot. */
export function BudgetSheet({ sheetRef, month, line }: BudgetSheetProps) {
  const t = useT();
  const locale = useLocaleStore((state) => state.locale);
  const title = line?.name ?? t('Overall budget');
  return (
    <Sheet sheetRef={sheetRef} title={title} onDismiss={undefined}>
      <BudgetForm key={`${line?.uuid ?? 'overall'}-${month}-${line?.budget_uuid ?? 'none'}`} month={month} line={line} monthTitle={monthLabel(month, locale)} close={() => sheetRef.current?.dismiss()} />
    </Sheet>
  );
}

function BudgetForm({ month, line, monthTitle, close }: { month: Ym; line: BudgetLine | null; monthTitle: string; close: () => void }) {
  const t = useT();
  const money = useMoneySettings();
  const save = useSetBudget();
  const remove = useDeleteBudget();
  const existing = line?.budget ?? null;
  const form = useForm({
    amount: existing ?? '',
    currency: (existing ? 'USD' : money.default_currency) as Currency,
  });

  const submit = () =>
    form.submit(
      async () => {
        await save.mutateAsync({ category_uuid: line?.uuid, month, amount: form.values.amount, currency: form.values.currency });
        toast(t('Budget saved successfully.'), 'success');
        close();
      },
      () => ({ amount: amountNumber(form.values.amount) > 0 ? undefined : t('Enter an amount.') }),
    );

  const destroy = async () => {
    const uuid = line?.budget_uuid ?? null;
    if (!uuid) return;
    const ok = await confirm({ title: t('Remove this budget?'), confirmLabel: t('Remove'), destructive: true });
    if (!ok) return;
    try {
      await remove.mutateAsync(uuid);
      toast(t('Budget removed successfully.'), 'success');
      close();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.subject}>
        {line ? <CategoryBadge color={line.color} icon={line.icon} size={36} /> : null}
        <Txt faint={0.6}>{monthTitle}</Txt>
      </View>
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
      {line?.budget_uuid ? <PillButton label={t('Remove budget')} onPress={destroy} loading={remove.isPending} variant="danger" block /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  subject: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
