import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { CategoryBadge } from '@/components/CategoryBadge';
import { DateField } from '@/components/DateField';
import { Input } from '@/components/Input';
import { MoneyInput } from '@/components/MoneyInput';
import { OptionPicker } from '@/components/OptionPicker';
import { PillButton } from '@/components/PillButton';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { useCategories } from '@/hooks/categories';
import { useDeleteExpense, useSaveExpense } from '@/hooks/expenses';
import { useForm } from '@/hooks/useForm';
import { useMoneySettings } from '@/hooks/useMoneySettings';
import { useT } from '@/i18n';
import { useSessionStore } from '@/store/session';
import { toast } from '@/store/toast';
import type { Currency, Expense } from '@/types/api';
import { confirm } from '@/utils/confirm';
import { isFutureYmd, todayYmd } from '@/utils/dates';
import { amountNumber } from '@/utils/money';

interface ExpenseFormSheetProps {
  sheetRef: SheetRef;
  /** The row being edited, or null for a new one. */
  expense: Expense | null;
  onDismiss?: () => void;
}

/** Add or edit one expense. The form mounts fresh each time the sheet opens. */
export function ExpenseFormSheet({ sheetRef, expense, onDismiss }: ExpenseFormSheetProps) {
  const t = useT();
  return (
    <Sheet sheetRef={sheetRef} title={expense ? t('Edit expense') : t('Add expense')} onDismiss={onDismiss}>
      <ExpenseForm key={expense?.uuid ?? 'new'} expense={expense} close={() => sheetRef.current?.dismiss()} />
    </Sheet>
  );
}

function ExpenseForm({ expense, close }: { expense: Expense | null; close: () => void }) {
  const t = useT();
  const money = useMoneySettings();
  const isAdmin = useSessionStore((state) => state.user?.is_admin ?? false);
  const { data: categories = [] } = useCategories();
  const save = useSaveExpense();
  const remove = useDeleteExpense();
  const [creatingCategory, setCreatingCategory] = useState(false);
  const form = useForm({
    item: expense?.item ?? '',
    price: expense?.price ?? '',
    // A stored amount is dollars; a fresh one starts on the admin's default.
    currency: (expense ? 'USD' : money.default_currency) as Currency,
    category_uuid: expense?.category?.uuid ?? null,
    new_category: '',
    spent_on: expense?.spent_on ?? todayYmd(),
  });

  const submit = () =>
    form.submit(
      async () => {
        const { item, price, currency, category_uuid, new_category, spent_on } = form.values;
        await save.mutateAsync({
          uuid: expense?.uuid,
          payload: {
            item: item.trim(),
            price,
            currency,
            spent_on,
            ...(creatingCategory ? { new_category: new_category.trim() } : { category_uuid: category_uuid ?? undefined }),
          },
        });
        toast(t(expense ? 'Expense updated successfully.' : 'Expense added successfully.'), 'success');
        close();
      },
      () => ({
        item: form.values.item.trim() ? undefined : t('Name the item.'),
        price: amountNumber(form.values.price) > 0 ? undefined : t('Enter an amount.'),
        category_uuid: creatingCategory || form.values.category_uuid ? undefined : t('Pick a category.'),
        new_category: creatingCategory && !form.values.new_category.trim() ? t('Name the category.') : undefined,
        spent_on: !form.values.spent_on ? t('Pick a date.') : isFutureYmd(form.values.spent_on) ? t('The date cannot be in the future.') : undefined,
      }),
    );

  const destroy = async () => {
    if (!expense) return;
    const ok = await confirm({ title: t('Delete this expense?'), message: t('This cannot be undone.'), confirmLabel: t('Delete'), destructive: true });
    if (!ok) return;
    try {
      await remove.mutateAsync(expense.uuid);
      toast(t('Expense deleted successfully.'), 'success');
      close();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <View style={styles.form}>
      <Input sheet label={t('Item')} value={form.values.item} onChangeText={(text) => form.set('item', text)} error={form.errors.item} autoFocus={!expense} returnKeyType="next" />
      <MoneyInput
        sheet
        label={t('Price')}
        value={form.values.price}
        onChangeText={(text) => form.set('price', text)}
        currency={form.values.currency}
        onCurrencyChange={(currency) => form.set('currency', currency)}
        error={form.errors.price}
      />
      {creatingCategory ? (
        <Input
          sheet
          label={t('New category')}
          value={form.values.new_category}
          onChangeText={(text) => form.set('new_category', text)}
          error={form.errors.new_category}
          autoFocus
          right={<PillButton label={t('Cancel')} variant="ghost" size="sm" onPress={() => setCreatingCategory(false)} />}
        />
      ) : (
        <OptionPicker
          label={t('Category')}
          placeholder={t('Pick a category')}
          value={form.values.category_uuid}
          onChange={(value) => form.set('category_uuid', value)}
          error={form.errors.category_uuid}
          options={categories.map((category) => ({
            value: category.uuid,
            label: category.name,
            leading: <CategoryBadge color={category.color} icon={category.icon} size={34} />,
          }))}
          footer={isAdmin ? <PillButton label={t('New category')} icon={Plus} variant="tonal" size="sm" onPress={() => setCreatingCategory(true)} style={styles.footerButton} /> : undefined}
        />
      )}
      <DateField label={t('Date')} value={form.values.spent_on} onChange={(value) => form.set('spent_on', value ?? '')} maximumDate={new Date()} error={form.errors.spent_on} />
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block style={styles.save} />
      {expense ? <PillButton label={t('Delete')} onPress={destroy} loading={remove.isPending} variant="danger" block /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  footerButton: { marginTop: 8 },
  save: { marginTop: 4 },
});
