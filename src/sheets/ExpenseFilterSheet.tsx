import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CategoryBadge } from '@/components/CategoryBadge';
import { DateField } from '@/components/DateField';
import { OptionPicker } from '@/components/OptionPicker';
import { PillButton } from '@/components/PillButton';
import { Segmented } from '@/components/Segmented';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { useCategories } from '@/hooks/categories';
import { useT } from '@/i18n';

export interface ExpenseListFilters {
  category: string | null;
  from: string | null;
  to: string | null;
  sort: string;
  everyone: boolean;
}

export const DEFAULT_EXPENSE_FILTERS: ExpenseListFilters = { category: null, from: null, to: null, sort: '-spent_on', everyone: false };

export function hasExpenseFilters(filters: ExpenseListFilters): boolean {
  return filters.category !== null || filters.from !== null || filters.to !== null || filters.sort !== DEFAULT_EXPENSE_FILTERS.sort || filters.everyone;
}

const SORTS = [
  { value: '-spent_on', label: 'Newest' },
  { value: 'spent_on', label: 'Oldest' },
  { value: '-price', label: 'Highest price' },
  { value: 'price', label: 'Lowest price' },
  { value: 'item', label: 'Item, A to Z' },
];

interface ExpenseFilterSheetProps {
  sheetRef: SheetRef;
  filters: ExpenseListFilters;
  onChange: (filters: ExpenseListFilters) => void;
  isAdmin: boolean;
}

/** Narrow the expenses list: category, dates, order, and for admins whose rows. */
export function ExpenseFilterSheet({ sheetRef, filters, onChange, isAdmin }: ExpenseFilterSheetProps) {
  const t = useT();
  return (
    <Sheet sheetRef={sheetRef} title={t('Filters')}>
      <FilterForm filters={filters} isAdmin={isAdmin} onApply={(next) => {
        onChange(next);
        sheetRef.current?.dismiss();
      }} />
    </Sheet>
  );
}

function FilterForm({ filters, isAdmin, onApply }: { filters: ExpenseListFilters; isAdmin: boolean; onApply: (filters: ExpenseListFilters) => void }) {
  const t = useT();
  const [draft, setDraft] = useState(filters);
  const { data: categories = [] } = useCategories();
  const ALL = '__all__';

  return (
    <View style={styles.form}>
      {isAdmin ? (
        <Segmented
          options={[
            { value: 'mine', label: t('Mine') },
            { value: 'all', label: t('Everyone') },
          ]}
          value={draft.everyone ? 'all' : 'mine'}
          onChange={(value) => setDraft({ ...draft, everyone: value === 'all' })}
        />
      ) : null}
      <OptionPicker
        label={t('Category')}
        value={draft.category ?? ALL}
        onChange={(value) => setDraft({ ...draft, category: value === ALL ? null : value })}
        options={[
          { value: ALL, label: t('All categories') },
          ...categories.map((category) => ({ value: category.uuid, label: category.name, leading: <CategoryBadge color={category.color} icon={category.icon} size={34} /> })),
        ]}
      />
      <DateField label={t('From')} value={draft.from} onChange={(value) => setDraft({ ...draft, from: value })} placeholder={t('Any date')} clearable maximumDate={new Date()} />
      <DateField label={t('To')} value={draft.to} onChange={(value) => setDraft({ ...draft, to: value })} placeholder={t('Any date')} clearable maximumDate={new Date()} />
      <OptionPicker label={t('Sort')} value={draft.sort} onChange={(value) => setDraft({ ...draft, sort: value })} options={SORTS.map((sort) => ({ value: sort.value, label: t(sort.label) }))} />
      <View style={styles.actions}>
        <PillButton label={t('Clear')} variant="outline" onPress={() => onApply(DEFAULT_EXPENSE_FILTERS)} style={styles.action} />
        <PillButton label={t('Apply')} onPress={() => onApply(draft)} style={styles.action} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  action: { flex: 1 },
});
