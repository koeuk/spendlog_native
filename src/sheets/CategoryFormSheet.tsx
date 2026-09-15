import { Check } from 'lucide-react-native';
import { createElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { categoryIcon } from '@/components/icons';
import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useDeleteCategory, useSaveCategory } from '@/hooks/categories';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme/useTheme';
import type { Category, CategoryColor } from '@/types/api';
import { CATEGORY_COLORS, CATEGORY_ICONS, categoryColor, type CategoryIconName } from '@/utils/categoryStyle';
import { rgba } from '@/utils/color';
import { confirm } from '@/utils/confirm';

interface CategoryFormSheetProps {
  sheetRef: SheetRef;
  category: Category | null;
}

/** A shared category: its name, one of ten colours and one of the server's icons. Admins only. */
export function CategoryFormSheet({ sheetRef, category }: CategoryFormSheetProps) {
  const t = useT();
  return (
    <Sheet sheetRef={sheetRef} title={category ? t('Edit category') : t('Add category')}>
      <CategoryForm key={category?.uuid ?? 'new'} category={category} close={() => sheetRef.current?.dismiss()} />
    </Sheet>
  );
}

function CategoryForm({ category, close }: { category: Category | null; close: () => void }) {
  const t = useT();
  const theme = useTheme();
  const save = useSaveCategory();
  const remove = useDeleteCategory();
  const form = useForm({
    name: category?.name ?? '',
    color: (category?.color ?? 'slate') as CategoryColor,
    icon: ((category?.icon as CategoryIconName | null) ?? 'circle-dashed') as CategoryIconName,
  });
  const tint = categoryColor(form.values.color);

  const submit = () =>
    form.submit(
      async () => {
        await save.mutateAsync({ uuid: category?.uuid, payload: { name: form.values.name.trim(), color: form.values.color, icon: form.values.icon } });
        toast(t(category ? 'Category updated successfully.' : 'Category added successfully.'), 'success');
        close();
      },
      () => ({ name: form.values.name.trim() ? undefined : t('Name the category.') }),
    );

  const destroy = async () => {
    if (!category) return;
    const ok = await confirm({ title: t('Delete this category?'), message: t('A category still used by expenses or budgets cannot be deleted.'), confirmLabel: t('Delete'), destructive: true });
    if (!ok) return;
    try {
      await remove.mutateAsync(category.uuid);
      toast(t('Category deleted successfully.'), 'success');
      close();
    } catch (error) {
      // A 409 carries the server's own sentence: "Food" is still in use.
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <View style={styles.form}>
      <Input sheet label={t('Name')} value={form.values.name} onChangeText={(text) => form.set('name', text)} error={form.errors.name} autoFocus={!category} maxLength={255} />
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Colour')}
      </Txt>
      <View style={styles.swatches}>
        {CATEGORY_COLORS.map((color) => {
          const active = color === form.values.color;
          const hex = categoryColor(color);
          return (
            <Pressable key={color} accessibilityRole="radio" accessibilityState={{ selected: active }} accessibilityLabel={t(color)} onPress={() => form.set('color', color)} style={[styles.swatch, { backgroundColor: hex }, active && { borderColor: theme.text }]}>
              {active ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Icon')}
      </Txt>
      <View style={styles.icons}>
        {CATEGORY_ICONS.map((icon) => {
          const active = icon === form.values.icon;
          return (
            <Pressable key={icon} accessibilityRole="radio" accessibilityState={{ selected: active }} accessibilityLabel={icon} onPress={() => form.set('icon', icon)} style={[styles.iconCell, { backgroundColor: active ? rgba(tint, 0.18) : theme.faint(0.05), borderColor: active ? tint : 'transparent' }]}>
              {createElement(categoryIcon(icon), { size: 20, color: active ? tint : theme.faint(0.6), strokeWidth: 2 })}
            </Pressable>
          );
        })}
      </View>
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
      {category ? <PillButton label={t('Delete')} onPress={destroy} loading={remove.isPending} variant="danger" block /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  label: { marginLeft: 12 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconCell: { width: 44, height: 44, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
