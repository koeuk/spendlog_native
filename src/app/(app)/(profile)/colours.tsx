import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useColorSettings, useUpdateColorSettings } from '@/hooks/admin';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme/useTheme';
import type { ColorSettings } from '@/types/api';
import { luminance } from '@/utils/color';

/** The two colours the whole app is built from. */
export default function ColoursSettingsScreen() {
  const t = useT();
  const colors = useColorSettings();

  return (
    <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('Colours')} back />}>
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
  const theme = useTheme();
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
      <View style={styles.swatches}>
        {settings.button_presets.map((preset) => {
          const active = preset.value.toLowerCase() === buttonColor.toLowerCase();
          return (
            <Pressable
              key={preset.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={preset.label}
              onPress={() => setButtonColor(preset.value)}
              style={[styles.swatch, { backgroundColor: preset.value, borderColor: active ? theme.text : 'transparent' }]}>
              {active ? <Check size={16} color={luminance(preset.value) > 0.45 ? '#171717' : '#FFFFFF'} strokeWidth={3} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Txt variant="label" faint={0.7} style={styles.label}>
        {t('Background')}
      </Txt>
      <View style={styles.swatches}>
        {settings.body_presets.map((preset) => {
          const active = preset.value.toLowerCase() === bodyColor.toLowerCase();
          return (
            <Pressable
              key={preset.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={preset.label}
              onPress={() => setBodyColor(preset.value)}
              style={[styles.swatch, { backgroundColor: preset.value, borderColor: active ? theme.text : theme.hairline }]}>
              {active ? <Check size={16} color="#171717" strokeWidth={3} /> : null}
            </Pressable>
          );
        })}
      </View>
      <PillButton label={t('Save')} onPress={() => void submit()} loading={saving} block />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 4 },
  section: { gap: 12 },
  label: { marginLeft: 12 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
