import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Card } from '@/components/Card';
import { ColourSwatches } from '@/components/ColourSwatches';
import { Header } from '@/components/Header';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { usePreferences, useUpdatePreferences } from '@/hooks/preferences';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import type { Preferences } from '@/types/api';

/** This account's own button and background colours, over the app's. */
export default function MyColoursScreen() {
  const t = useT();
  const preferences = usePreferences();

  return (
    <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('Colours')} back />}>
      {preferences.isPending ? (
        <SkeletonCard lines={4} />
      ) : preferences.isError ? (
        <Card>
          <ErrorState error={preferences.error} onRetry={() => void preferences.refetch()} compact />
        </Card>
      ) : (
        <ColoursForm key={`${preferences.data.button_color}-${preferences.data.body_color}`} preferences={preferences.data} />
      )}
    </Screen>
  );
}

function ColoursForm({ preferences }: { preferences: Preferences }) {
  const t = useT();
  const update = useUpdatePreferences();
  // Null is "follow the app": no swatch is ticked until one is picked.
  const [buttonColor, setButtonColor] = useState(preferences.button_color);
  const [bodyColor, setBodyColor] = useState(preferences.body_color);
  const following = !preferences.button_color && !preferences.body_color;

  const save = async (payload: { button_color: string | null; body_color: string | null }, message: string) => {
    try {
      await update.mutateAsync(payload);
      toast(t(message), 'success');
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <Card style={styles.section}>
      <Txt faint={0.6}>{t('Your own colours, for you only. Everyone else keeps the app’s.')}</Txt>
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Buttons')}
      </Txt>
      <ColourSwatches presets={preferences.button_presets} value={buttonColor} onChange={setButtonColor} />
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Background')}
      </Txt>
      <ColourSwatches presets={preferences.body_presets} value={bodyColor} onChange={setBodyColor} />
      <PillButton
        label={t('Save')}
        onPress={() => void save({ button_color: buttonColor, body_color: bodyColor }, 'Settings saved.')}
        loading={update.isPending}
        disabled={!buttonColor && !bodyColor}
        block
      />
      {following ? null : (
        <PillButton label={t('Use the app’s colours')} variant="ghost" onPress={() => void save({ button_color: null, body_color: null }, 'Settings saved.')} disabled={update.isPending} block />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  section: { gap: 12 },
  label: { marginLeft: 12 },
});
