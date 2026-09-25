import { StyleSheet, Switch, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useDeleteIncomeSource, useSaveIncomeSource } from '@/hooks/incomes';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme/useTheme';
import type { IncomeSource } from '@/types/api';
import { confirm } from '@/utils/confirm';

interface IncomeSourceFormSheetProps {
  sheetRef: SheetRef;
  source: IncomeSource | null;
}

/** Add a name to the catalogue, or rename one. */
export function IncomeSourceFormSheet({ sheetRef, source }: IncomeSourceFormSheetProps) {
  const t = useT();
  return (
    <Sheet sheetRef={sheetRef} title={source ? t('Rename source') : t('New source')}>
      <IncomeSourceForm key={source?.uuid ?? 'new'} source={source} close={() => sheetRef.current?.dismiss()} />
    </Sheet>
  );
}

function IncomeSourceForm({ source, close }: { source: IncomeSource | null; close: () => void }) {
  const t = useT();
  const theme = useTheme();
  const save = useSaveIncomeSource();
  const remove = useDeleteIncomeSource();
  const form = useForm({ name: source?.name ?? '', rewrite: false });
  const renaming = !!source && form.values.name.trim() !== source.name;

  const submit = () =>
    form.submit(
      async () => {
        await save.mutateAsync({ uuid: source?.uuid, name: form.values.name.trim(), rewriteIncomes: form.values.rewrite });
        toast(t(source ? 'Source renamed.' : 'Source added.'), 'success');
        close();
      },
      () => ({ name: form.values.name.trim() ? undefined : t('Enter a name.') }),
    );

  const destroy = async () => {
    if (!source) return;
    const ok = await confirm({
      title: t('Remove this source?'),
      // The number beside the name is the thing anyone would worry they were
      // deleting, so say plainly that it stays.
      message: source.uses === 0 ? t('It is not used by anything.') : t('It stops being offered. The money filed under it keeps the name.'),
      confirmLabel: t('Remove'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(source.uuid);
      toast(t('Source removed.'), 'success');
      close();
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <View style={styles.form}>
      <Txt faint={0.6}>{t('Offered when you say where money came from.')}</Txt>
      <Input sheet label={t('Name')} value={form.values.name} onChangeText={(text) => form.set('name', text)} error={form.errors.name} maxLength={255} autoFocus autoCapitalize="sentences" />
      {/* Only worth asking where there is history to carry, and only once the
          name has actually changed. */}
      {renaming && source.uses > 0 ? (
        <View style={styles.rewrite}>
          <View style={styles.rewriteText}>
            <Txt>{source.uses === 1 ? t('Rename the 1 entry filed under it') : t('Rename the :count entries filed under it', { count: source.uses })}</Txt>
            <Txt variant="label" faint={0.55}>
              {t('Leave this off to keep what was entered at the time.')}
            </Txt>
          </View>
          <Switch value={form.values.rewrite} onValueChange={(value) => form.set('rewrite', value)} trackColor={{ true: theme.accent }} />
        </View>
      ) : null}
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
      {source ? <PillButton label={t('Remove')} onPress={destroy} loading={remove.isPending} variant="danger" block /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  rewrite: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rewriteText: { flex: 1, gap: 2 },
});
