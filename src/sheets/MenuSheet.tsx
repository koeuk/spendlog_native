import { useRouter } from 'expo-router';
import { Banknote, Handshake, History, Moon, PiggyBank, Repeat, Settings, Sun, Tags, Users, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, Switch, View } from 'react-native';

import { ListRow } from '@/components/ListRow';
import { Sheet, type SheetRef } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { useSessionStore } from '@/store/session';
import { useThemeStore } from '@/store/theme';
import { useTheme } from '@/theme/useTheme';

interface Entry {
  icon: LucideIcon;
  label: string;
  path: string;
  admin?: boolean;
}

const ENTRIES: Entry[] = [
  { icon: PiggyBank, label: 'Savings', path: '/savings' },
  { icon: Banknote, label: 'Income', path: '/income' },
  { icon: Repeat, label: 'Recurring', path: '/recurring' },
  { icon: Handshake, label: 'Borrowing', path: '/borrowings' },
  { icon: Tags, label: 'Categories', path: '/categories' },
  { icon: History, label: 'Activity log', path: '/activity' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: Users, label: 'Users', path: '/admin-users', admin: true },
];

/**
 * The Menu tab's sheet: everything that is not one of the four main tabs, as
 * one scannable list. Admin rows only appear for admins; the server gates
 * them too, so hiding them is a courtesy, not the security.
 */
export function MenuSheet({ sheetRef }: { sheetRef: SheetRef }) {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const isAdmin = useSessionStore((state) => state.user?.is_admin ?? false);
  const setMode = useThemeStore((state) => state.setMode);
  const rows = ENTRIES.filter((entry) => isAdmin || !entry.admin);

  return (
    <Sheet sheetRef={sheetRef} title={t('Menu')}>
      <View>
        {rows.map((entry) => {
          const Icon = entry.icon;
          return (
            <ListRow
              key={entry.path}
              leading={<Icon size={22} color={theme.faint(0.75)} />}
              title={t(entry.label)}
              chevron
              divider
              onPress={() => {
                // Close first, then go: the sheet lives above the navigator,
                // so leaving it open would strand it over the new screen.
                sheetRef.current?.dismiss();
                router.push(entry.path as never);
              }}
            />
          );
        })}
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
});
