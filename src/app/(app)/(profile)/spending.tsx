import { StyleSheet } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useSpendingSettings, useUpdateSpendingSettings } from '@/hooks/admin';
import { useForm } from '@/hooks/useForm';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import type { Currency, SpendingSettings } from '@/types/api';

/** The rate riel converts at, and which currency an amount field starts on. */
export default function SpendingSettingsScreen() {
  const t = useT();
  const spending = useSpendingSettings();

  return (
    <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('Spending')} back />}>
      {spending.isPending ? (
        <SkeletonCard lines={4} />
      ) : spending.isError ? (
        <Card>
          <ErrorState error={spending.error} onRetry={() => void spending.refetch()} compact />
        </Card>
      ) : spending.data ? (
        <SpendingForm key={`${spending.data.khr_per_usd}-${spending.data.default_currency}`} settings={spending.data} />
      ) : null}
    </Screen>
  );
}

function SpendingForm({ settings }: { settings: SpendingSettings }) {
  const t = useT();
  const update = useUpdateSpendingSettings();
  const form = useForm({
    khr_per_usd: String(settings.khr_per_usd),
    default_currency: settings.default_currency as Currency,
  });

  const submit = () =>
    form.submit(
      async () => {
        const rate = Number.parseFloat(form.values.khr_per_usd);
        await update.mutateAsync({
          // `enabled` is the only required field on the endpoint, and guidance
          // now lives on its own page: pass the stored value through so saving
          // a rate here never switches the guidance off.
          enabled: settings.spending_guidance_enabled,
          khr_per_usd: Number.isFinite(rate) && rate > 0 ? rate : undefined,
          default_currency: form.values.default_currency,
        });
        toast(t('Settings saved.'), 'success');
      },
      () => ({ khr_per_usd: Number.parseFloat(form.values.khr_per_usd) > 0 ? undefined : t('Enter the rate.') }),
    );

  return (
    <Card style={styles.section}>
      <Input
        label={t('Riel per dollar')}
        value={form.values.khr_per_usd}
        onChangeText={(text) => form.set('khr_per_usd', text.replace(/[^\d.]/g, ''))}
        error={form.errors.khr_per_usd}
        keyboardType="decimal-pad"
        hint={t('Every ៛ entry converts at this rate.')}
      />
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Default currency')}
      </Txt>
      <Segmented<Currency>
        options={[
          { value: 'USD', label: 'USD' },
          { value: 'KHR', label: 'KHR' },
        ]}
        value={form.values.default_currency}
        onChange={(value) => form.set('default_currency', value)}
      />
      <Txt variant="label" faint={0.55} style={styles.label}>
        {t('Which currency a new amount starts on.')}
      </Txt>
      <PillButton label={t('Save')} onPress={submit} loading={form.submitting} block />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  section: { gap: 12 },
  label: { marginLeft: 12 },
});
