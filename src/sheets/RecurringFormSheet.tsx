import { Banknote } from 'lucide-react-native';
import { StyleSheet, Switch, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { CategoryBadge } from '@/components/CategoryBadge';
import { DateField } from '@/components/DateField';
import { Input } from '@/components/Input';
import { MoneyInput } from '@/components/MoneyInput';
import { OptionPicker } from '@/components/OptionPicker';
import { PillButton } from '@/components/PillButton';
import { Segmented } from '@/components/Segmented';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useCategories } from '@/hooks/categories';
import { useDeleteRecurring, useSaveRecurring } from '@/hooks/recurring';
import { useForm } from '@/hooks/useForm';
import { useMoneySettings } from '@/hooks/useMoneySettings';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme/useTheme';
import type { Currency, RecurringFrequency, RecurringKind, RecurringRule } from '@/types/api';
import { confirm } from '@/utils/confirm';
import { todayYmd } from '@/utils/dates';
import { amountNumber } from '@/utils/money';

export const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

interface RecurringFormSheetProps {
  sheetRef: SheetRef;
  rule: RecurringRule | null;
  /** What a new rule starts as; the screen's filter, so the form matches what is on screen. */
  defaultKind?: RecurringKind;
}

/** A template that writes expense or income rows on a schedule. */
export function RecurringFormSheet({ sheetRef, rule, defaultKind = 'expense' }: RecurringFormSheetProps) {
  const t = useT();
  return (
    <Sheet sheetRef={sheetRef} title={rule ? t('Edit recurring') : t('Add recurring')}>
      <RecurringForm key={rule?.uuid ?? `new-${defaultKind}`} rule={rule} defaultKind={defaultKind} close={() => sheetRef.current?.dismiss()} />
    </Sheet>
  );
}

function RecurringForm({ rule, defaultKind, close }: { rule: RecurringRule | null; defaultKind: RecurringKind; close: () => void }) {
  const t = useT();
  const theme = useTheme();
  const money = useMoneySettings();
  const { data: categories = [] } = useCategories();
  const save = useSaveRecurring();
  const remove = useDeleteRecurring();
  const form = useForm({
    kind: rule?.kind ?? defaultKind,
    title: rule?.title ?? '',
    amount: rule?.amount ?? '',
    currency: (rule ? 'USD' : money.default_currency) as Currency,
    category_uuid: rule?.category?.uuid ?? null,
    frequency: rule?.frequency ?? ('monthly' as RecurringFrequency),
    starts_on: rule?.starts_on ?? todayYmd(),
    ends_on: rule?.ends_on ?? null,
    active: rule?.active ?? true,
    note: rule?.note ?? '',
  });
  const isExpense = form.values.kind === 'expense';
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const submit = () =>
    form.submit(
      async () => {
        const { kind, title, amount, currency, category_uuid, frequency, starts_on, ends_on, active, note } = form.values;
        await save.mutateAsync({
          uuid: rule?.uuid,
          payload: {
            kind,
            title: title.trim(),
            amount,
            currency,
            category_uuid: kind === 'expense' ? (category_uuid ?? undefined) : undefined,
            frequency,
            starts_on,
            ends_on: ends_on ?? null,
            active,
            note: note.trim() || null,
          },
        });
        toast(t(rule ? 'Recurring rule updated.' : 'Recurring rule added.'), 'success');
        close();
      },
      () => ({
        title: form.values.title.trim() ? undefined : t(isExpense ? 'Name the item.' : 'Name the source.'),
        amount: amountNumber(form.values.amount) > 0 ? undefined : t('Enter an amount.'),
        category_uuid: isExpense && !form.values.category_uuid ? t('Pick a category.') : undefined,
        starts_on: form.values.starts_on ? undefined : t('Pick a date.'),
        ends_on: form.values.ends_on && form.values.ends_on <= form.values.starts_on ? t('The end must come after the start.') : undefined,
      }),
    );

  const destroy = async () => {
    if (!rule) return;
    const ok = await confirm({ title: t('Delete this rule?'), message: t('The rows it already wrote stay.'), confirmLabel: t('Delete'), destructive: true });
    if (!ok) return;
    try {
      await remove.mutateAsync(rule.uuid);
      toast(t('Recurring rule deleted.'), 'success');
      close();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <View style={styles.form}>
      {rule ? null : (
        <Segmented
          options={[
            { value: 'expense', label: t('Expense') },
            { value: 'income', label: t('Income') },
          ]}
          value={form.values.kind}
          onChange={(kind) => form.set('kind', kind)}
        />
      )}
      <Input sheet label={isExpense ? t('Item') : t('Source')} value={form.values.title} onChangeText={(text) => form.set('title', text)} error={form.errors.title} autoFocus={!rule} />
      <MoneyInput
        sheet
        label={t('Amount')}
        value={form.values.amount}
        onChangeText={(text) => form.set('amount', text)}
        currency={form.values.currency}
        onCurrencyChange={(currency) => form.set('currency', currency)}
        error={form.errors.amount}
      />
      {isExpense ? (
        <OptionPicker
          label={t('Category')}
          placeholder={t('Pick a category')}
          value={form.values.category_uuid}
          onChange={(value) => form.set('category_uuid', value)}
          error={form.errors.category_uuid}
          options={categories.map((category) => ({ value: category.uuid, label: category.name, leading: <CategoryBadge color={category.color} icon={category.icon} size={34} /> }))}
        />
      ) : null}
      <OptionPicker label={t('Frequency')} value={form.values.frequency} onChange={(value) => form.set('frequency', value)} options={FREQUENCIES.map((option) => ({ value: option.value, label: t(option.label) }))} />
      <DateField label={t('Starts on')} value={form.values.starts_on} onChange={(value) => form.set('starts_on', value ?? '')} minimumDate={yearAgo} error={form.errors.starts_on} />
      <DateField label={t('Ends on')} value={form.values.ends_on} onChange={(value) => form.set('ends_on', value)} placeholder={t('Never')} clearable error={form.errors.ends_on} />
      {rule ? (
        <View style={styles.switchRow}>
          <View style={styles.grow}>
            <Txt weight="medium">{t('Active')}</Txt>
            <Txt variant="label" faint={0.55}>
              {t('A paused rule writes nothing until it is switched back on.')}
            </Txt>
          </View>
          <Switch value={form.values.active} onValueChange={(value) => form.set('active', value)} trackColor={{ true: theme.accent }} thumbColor="#FFFFFF" />
        </View>
      ) : null}
      <Input sheet label={t('Note')} value={form.values.note} onChangeText={(text) => form.set('note', text)} multiline maxLength={500} />
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
      {rule ? <PillButton label={t('Delete')} onPress={destroy} loading={remove.isPending} variant="danger" block /> : null}
      {isExpense ? null : (
        <View style={styles.hint}>
          <Banknote size={16} color={theme.faint(0.4)} />
          <Txt variant="label" faint={0.5} style={styles.grow}>
            {t('Income rules write income rows with this source and note.')}
          </Txt>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  grow: { flex: 1 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
});
