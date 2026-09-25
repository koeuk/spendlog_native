import { Tabs } from 'expo-router';

import { TabBar, TabBarInsetContext, useTabBarClearance } from '@/components/TabBar';
import { useSheet } from '@/components/Sheet';
import { useMoneySettings } from '@/hooks/useMoneySettings';
import { MenuSheet } from '@/sheets/MenuSheet';
import { useTheme } from '@/theme/useTheme';

export const unstable_settings = {
  initialRouteName: '(dashboard)',
};

/** The signed-in frame: one bottom bar, five branches, each keeping its own stack. */
export default function AppLayout() {
  const theme = useTheme();
  const menu = useSheet();
  const clearance = useTabBarClearance();
  // Fetched as soon as the shell mounts, so the first amount field already
  // starts on the admin's default currency rather than the fallback.
  useMoneySettings();

  return (
    <TabBarInsetContext.Provider value={clearance}>
      <Tabs
        initialRouteName="(dashboard)"
        // Back from a screen the menu opened returns to the tab it was opened from.
        backBehavior="history"
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.ground }, lazy: true }}
        tabBar={(props) => <TabBar {...props} onMenu={menu.present} />}>
        <Tabs.Screen name="(dashboard)" />
        <Tabs.Screen name="expenses" />
        <Tabs.Screen name="budgets" />
        <Tabs.Screen name="reports" />
        <Tabs.Screen name="(profile)" />
      </Tabs>
      <MenuSheet sheetRef={menu.ref} />
    </TabBarInsetContext.Provider>
  );
}
