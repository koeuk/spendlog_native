import { StyleSheet, Switch, View } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useSpendingSettings, useUpdateSpendingSettings } from '@/hooks/admin';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme/useTheme';
import type { SpendingSettings } from '@/types/api';

/** The line of advice the web dashboard shows, and what it says. */
export default function GuidanceSettingsScreen() {
  const t = useT();
  const spending = useSpendingSettings();

  return (
    <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('Guidance')} back />}>
      {spending.isPending ? (
        <SkeletonCard lines={4} />
      ) : spending.isError ? (
        <Card>
          <ErrorState error={spending.error} onRetry={() => void spending.refetch()} compact />
        </Card>
      ) : spending.data ? (
        <GuidanceForm key={spending.data.spending_warning + spending.data.spending_advice} settings={spending.data} />
      ) : null}
    </Screen>
  );
}

function GuidanceForm({ settings }: { settings: SpendingSettings }) {
  const t = useT();
  const theme = useTheme();
  const update = useUpdateSpendingSettings();
  const form = useForm({
    enabled: settings.spending_guidance_enabled,
    warning: settings.spending_warning,
    advice: settings.spending_advice,
  });

  const submit = () =>
    form.submit(async () => {
      await update.mutateAsync({ enabled: form.values.enabled, warning: form.values.warning, advice: form.values.advice });
      toast(t('Settings saved.'), 'success');
    });

  return (
    <Card style={styles.section}>
      <View style={styles.switchRow}>
        <View style={styles.grow}>
          <Txt weight="medium">{t('Spending guidance')}</Txt>
          <Txt variant="label" faint={0.55}>
            {t('A line of advice on the web dashboard.')}
          </Txt>
        </View>
        <Switch value={form.values.enabled} onValueChange={(value) => form.set('enabled', value)} trackColor={{ true: theme.accent }} thumbColor="#FFFFFF" />
      </View>
      {form.values.enabled ? (
        <>
          <Input label={t('When over budget')} value={form.values.warning} onChangeText={(text) => form.set('warning', text)} multiline />
          <Input label={t('Otherwise')} value={form.values.advice} onChangeText={(text) => form.set('advice', text)} multiline />
        </>
      ) : null}
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  section: { gap: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  grow: { flex: 1 },
});
