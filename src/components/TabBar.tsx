import type { Tabs } from 'expo-router';
import { ChartNoAxesColumn, House, Menu, PiggyBank, ReceiptText, type LucideIcon } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

interface Destination {
  name: string;
  label: string;
  icon: LucideIcon;
}

const DESTINATIONS: Destination[] = [
  { name: '(dashboard)', label: 'Home', icon: House },
  { name: 'expenses', label: 'Expenses', icon: ReceiptText },
  { name: 'budgets', label: 'Budgets', icon: PiggyBank },
  { name: 'reports', label: 'Reports', icon: ChartNoAxesColumn },
];

/** The route whose branch the Menu tab lights up for; it is only entered from the menu sheet. */
const MENU_ROUTE = '(profile)';

interface Props extends TabBarProps {
  onMenu: () => void;
}

/**
 * A flat bar holding four tabs and a Menu, each an icon over its label. The
 * active one is drawn in ink while the rest fall back to grey, so the bar
 * stays calm and reads at a glance.
 */
export function TabBar({ state, navigation, onMenu }: Props) {
  const theme = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderTopColor: theme.hairline, paddingBottom: insets.bottom + 6 }]}>
      {DESTINATIONS.map((destination) => {
        const route = state.routes.find((candidate) => candidate.name === destination.name);
        const active = activeName === destination.name;
        return (
          <TabItem
            key={destination.name}
            destination={destination}
            label={t(destination.label)}
            active={active}
            onPress={() => {
              if (!route) return;
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
          />
        );
      })}
      <TabItem destination={{ name: MENU_ROUTE, label: 'Menu', icon: Menu }} label={t('Menu')} active={activeName === MENU_ROUTE} onPress={onMenu} />
    </View>
  );
}

function TabItem({ destination, label, active, onPress }: { destination: Destination; label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  const color = active ? theme.text : theme.faint(0.5);
  const Icon = destination.icon;
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={label} onPress={onPress} style={styles.item}>
      <Icon size={24} color={color} strokeWidth={active ? 2.4 : 2} />
      <Txt variant="caption" weight={active ? 'semibold' : 'medium'} color={color} numberOfLines={1}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 6,
    minHeight: layout.tabBarHeight,
  },
  item: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
});
