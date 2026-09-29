import { Check } from 'lucide-react-native';
import { StyleSheet, Switch, View } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { useThemeStore, type ThemeMode } from '@/store/theme';
import { useTheme } from '@/theme/useTheme';

export const APPEARANCE_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/** Pick the theme. Chosen on the spot: there is nothing to save. */
export default function AppearanceScreen() {
  const t = useT();
  const theme = useTheme();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const plain = useThemeStore((state) => state.plain);
  const setPlain = useThemeStore((state) => state.setPlain);

  return (
    <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('Appearance')} back />}>
      <Card padded={false} style={styles.list}>
        {APPEARANCE_OPTIONS.map((option, index) => (
          <ListRow
            key={option.value}
            title={t(option.label)}
            trailing={option.value === mode ? <Check size={18} color={theme.accent} /> : undefined}
            divider={index < APPEARANCE_OPTIONS.length - 1}
            onPress={() => setMode(option.value)}
          />
        ))}
      </Card>
      <Txt variant="label" faint={0.5} style={styles.hint}>
        {t('System follows your phone’s own light or dark setting.')}
      </Txt>

      <Card style={styles.switchCard}>
        <View style={styles.switchRow}>
          <View style={styles.grow}>
            <Txt weight="medium">{t('Plain background')}</Txt>
            <Txt variant="label" faint={0.55}>
              {t('A flat white page, with none of the colour behind the glass.')}
            </Txt>
          </View>
          <Switch value={plain} onValueChange={setPlain} trackColor={{ true: theme.accent }} thumbColor="#FFFFFF" />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingTop: 4 },
  list: { paddingHorizontal: 16 },
  hint: { marginHorizontal: 16 },
  switchCard: { marginTop: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
});
