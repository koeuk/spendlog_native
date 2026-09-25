import { StyleSheet } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { usePreferences, useUpdatePreferences } from '@/hooks/preferences';
import { useMoneySettings } from '@/hooks/useMoneySettings';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import type { Currency } from '@/types/api';

type Choice = 'app' | Currency;

/** Which currency this account's amount fields start on. Saves the moment it is picked. */
export default function CurrencyScreen() {
  const t = useT();
  const preferences = usePreferences();
  const update = useUpdatePreferences();
  const money = useMoneySettings();

  const choose = async (choice: Choice) => {
    try {
      await update.mutateAsync({ currency: choice === 'app' ? null : choice });
      toast(t('Settings saved.'), 'success');
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('Currency')} back />}>
      {preferences.isPending ? (
        <SkeletonCard lines={2} />
      ) : preferences.isError ? (
        <Card>
          <ErrorState error={preferences.error} onRetry={() => void preferences.refetch()} compact />
        </Card>
      ) : (
        <Card style={styles.section}>
          <Segmented<Choice>
            options={[
              { value: 'app', label: t('App default') },
              { value: 'USD', label: 'USD' },
              { value: 'KHR', label: 'KHR' },
            ]}
            value={preferences.data.currency ?? 'app'}
            onChange={(choice) => void choose(choice)}
          />
          <Txt variant="label" faint={0.55}>
            {t('Amount fields start on this currency. Riel still converts at :rate per dollar.', { rate: money.khr_per_usd.toLocaleString() })}
          </Txt>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  section: { gap: 12 },
});
