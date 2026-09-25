import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Card } from '@/components/Card';
import { ColourSwatches } from '@/components/ColourSwatches';
import { Header } from '@/components/Header';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useColorSettings, useUpdateColorSettings } from '@/hooks/admin';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import type { ColorSettings } from '@/types/api';

/** The two colours the whole app is built from. */
export default function ColoursSettingsScreen() {
  const t = useT();
  const colors = useColorSettings();

  return (
    <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('App colours')} back />}>
      {colors.isPending ? (
        <SkeletonCard lines={4} />
      ) : colors.isError ? (
        <Card>
          <ErrorState error={colors.error} onRetry={() => void colors.refetch()} compact />
        </Card>
      ) : colors.data ? (
        <ColoursForm key={`${colors.data.button_color}-${colors.data.body_color}`} settings={colors.data} />
      ) : null}
    </Screen>
  );
}

function ColoursForm({ settings }: { settings: ColorSettings }) {
  const t = useT();
  const update = useUpdateColorSettings();
  const [buttonColor, setButtonColor] = useState(settings.button_color);
  const [bodyColor, setBodyColor] = useState(settings.body_color);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await update.mutateAsync({ button_color: buttonColor, body_color: bodyColor });
      toast(t('Settings saved.'), 'success');
    } catch (error) {
      toast(t(String((error as Error).message ?? 'Something went wrong.')), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.section}>
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Buttons')}
      </Txt>
      <ColourSwatches presets={settings.button_presets} value={buttonColor} onChange={setButtonColor} />
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Background')}
      </Txt>
      <ColourSwatches presets={settings.body_presets} value={bodyColor} onChange={setBodyColor} />
      <PillButton label={t('Save')} onPress={() => void submit()} loading={saving} block />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  section: { gap: 12 },
  label: { marginLeft: 12 },
});
