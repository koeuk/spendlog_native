import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { useSheet } from '@/components/Sheet';
import { MenuSheet } from '@/sheets/MenuSheet';
import { useTheme } from '@/theme/useTheme';

export const unstable_settings = {
  initialRouteName: '(dashboard)',
};

/** The signed-in frame: one bottom bar, five branches, each keeping its own stack. */
export default function AppLayout() {
  const theme = useTheme();
  const menu = useSheet();

  return (
    <>
      <Tabs
        initialRouteName="(dashboard)"
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.ground }, lazy: true }}
        tabBar={(props) => <TabBar {...props} onMenu={menu.present} />}>
        <Tabs.Screen name="(dashboard)" />
        <Tabs.Screen name="expenses" />
        <Tabs.Screen name="budgets" />
        <Tabs.Screen name="reports" />
        <Tabs.Screen name="(profile)" />
      </Tabs>
      <MenuSheet sheetRef={menu.ref} />
    </>
  );
}
