import { Banknote, Handshake, History, Languages, Moon, PiggyBank, Repeat, Settings, Sun, Tag, Tags, Users, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, Switch, View } from 'react-native';

import { ListRow } from '@/components/ListRow';
import { Segmented } from '@/components/Segmented';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useOpenFromMenu, type MenuBranch } from '@/hooks/useOpenFromMenu';
import { useT } from '@/i18n';
import { LOCALES, useLocaleStore } from '@/store/locale';
import { useSessionStore } from '@/store/session';
import { useThemeStore } from '@/store/theme';
import { useTheme } from '@/theme/useTheme';

interface Entry {
  icon: LucideIcon;
  label: string;
  branch: MenuBranch;
  screen: string;
  admin?: boolean;
}

const ENTRIES: Entry[] = [
  { icon: PiggyBank, label: 'Savings', branch: '(dashboard)', screen: 'savings' },
  { icon: Banknote, label: 'Income', branch: '(dashboard)', screen: 'income' },
  { icon: Repeat, label: 'Recurring', branch: '(dashboard)', screen: 'recurring' },
  { icon: Handshake, label: 'Borrowing', branch: '(dashboard)', screen: 'borrowings/index' },
  { icon: Tags, label: 'Categories', branch: '(profile)', screen: 'categories' },
  { icon: Tag, label: 'Sources', branch: '(profile)', screen: 'income-sources' },
  { icon: History, label: 'Activity log', branch: '(profile)', screen: 'activity' },
  { icon: Settings, label: 'Settings', branch: '(profile)', screen: 'settings' },
  { icon: Users, label: 'Users', branch: '(profile)', screen: 'admin-users', admin: true },
];

/**
 * The Menu tab's sheet: everything that is not one of the four main tabs, as
 * one scannable list. Admin rows only appear for admins; the server gates
 * them too, so hiding them is a courtesy, not the security.
 */
export function MenuSheet({ sheetRef }: { sheetRef: SheetRef }) {
  const t = useT();
  const theme = useTheme();
  const open = useOpenFromMenu();
  const isAdmin = useSessionStore((state) => state.user?.is_admin ?? false);
  const setMode = useThemeStore((state) => state.setMode);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const rows = ENTRIES.filter((entry) => isAdmin || !entry.admin);

  return (
    <Sheet sheetRef={sheetRef} title={t('Menu')}>
      <View>
        {rows.map((entry) => {
          const Icon = entry.icon;
          return (
            <ListRow
              key={entry.screen}
              leading={<Icon size={22} color={theme.faint(0.75)} />}
              title={t(entry.label)}
              chevron
              divider
              onPress={() => {
                // Close first, then go: the sheet lives above the navigator,
                // so leaving it open would strand it over the new screen.
                sheetRef.current?.dismiss();
                open(entry.branch, entry.screen);
              }}
            />
          );
        })}
        <View style={[styles.themeRow, styles.divided, { borderBottomColor: theme.hairline }]}>
          <Languages size={22} color={theme.faint(0.75)} />
          <Txt weight="medium" style={styles.themeLabel}>
            {t('Language')}
          </Txt>
          <View style={styles.languages}>
            <Segmented options={LOCALES.map((option) => ({ value: option.code, label: option.label }))} value={locale} onChange={setLocale} />
          </View>
        </View>
        <View style={styles.themeRow}>
          {theme.isDark ? <Moon size={22} color={theme.faint(0.75)} /> : <Sun size={22} color={theme.faint(0.75)} />}
          <Txt weight="medium" style={styles.themeLabel}>
            {t('Dark mode')}
          </Txt>
          <Switch value={theme.isDark} onValueChange={(on) => setMode(on ? 'dark' : 'light')} trackColor={{ true: theme.accent }} thumbColor="#FFFFFF" />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: 56 },
  themeLabel: { flex: 1 },
  divided: { borderBottomWidth: StyleSheet.hairlineWidth },
  languages: { width: 176 },
});
