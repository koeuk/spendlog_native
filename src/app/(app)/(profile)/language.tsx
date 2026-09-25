import { Check } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { useT } from '@/i18n';
import { LOCALES, useLocaleStore } from '@/store/locale';
import { useTheme } from '@/theme/useTheme';

/** Pick the language. Each name is written in its own language, never translated. */
export default function LanguageScreen() {
  const t = useT();
  const theme = useTheme();
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return (
    <Screen scroll contentContainerStyle={styles.content} header={<Header title={t('Language')} back />}>
      <Card padded={false} style={styles.list}>
        {LOCALES.map((option, index) => (
          <ListRow
            key={option.code}
            title={option.label}
            trailing={option.code === locale ? <Check size={18} color={theme.accent} /> : undefined}
            divider={index < LOCALES.length - 1}
            onPress={() => setLocale(option.code)}
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingTop: 4 },
  list: { paddingHorizontal: 16 },
});
