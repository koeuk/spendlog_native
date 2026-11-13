import { Stack } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { act, fireEvent, renderRouter, screen, testRouter, waitFor } from 'expo-router/testing-library';
import { Button, Text } from 'react-native';

import { useOpenFromMenu } from '../useOpenFromMenu';

function AppLayout() {
  const open = useOpenFromMenu();
  return (
    <>
      <Tabs backBehavior="history" screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="(dashboard)" />
        <Tabs.Screen name="expenses" />
        <Tabs.Screen name="(profile)" />
      </Tabs>
      {/* The real menu is also a sibling of Tabs, outside its navigation context. */}
      <Button title="Open users" onPress={() => open('(profile)', 'admin-users')} />
      <Button title="Open settings" onPress={() => open('(profile)', 'settings')} />
      <Button title="Open income" onPress={() => open('(dashboard)', 'income')} />
      <Button title="Open savings" onPress={() => open('(dashboard)', 'savings')} />
    </>
  );
}

const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  '(app)/_layout': AppLayout,
  '(app)/(dashboard)/_layout': {
    default: () => <Stack screenOptions={{ headerShown: false }} />,
    unstable_settings: { anchor: 'index' },
  },
  '(app)/(dashboard)/index': () => <Text>Dashboard</Text>,
  '(app)/(dashboard)/income': () => <Text>Income</Text>,
  '(app)/(dashboard)/savings': () => <Text>Savings</Text>,
  '(app)/expenses': () => <Text>Expenses</Text>,
  '(app)/(profile)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(app)/(profile)/admin-users': () => <Text>Users</Text>,
  '(app)/(profile)/settings': () => <Text>Settings</Text>,
};

async function openMenuDestination(title: string, pathname: string) {
  await act(async () => {
    fireEvent.press(screen.getByText(title));
  });
  await waitFor(() => expect(screen).toHavePathname(pathname));
}

describe('menu navigation', () => {
  it('returns to the previous tab instead of an earlier profile destination', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await testRouter.navigate('/expenses');
    await openMenuDestination('Open users', '/admin-users');
    await openMenuDestination('Open settings', '/settings');
    await testRouter.back('/expenses');
  });

  it('keeps only the dashboard below the latest Home menu destination', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await openMenuDestination('Open income', '/income');
    await openMenuDestination('Open savings', '/savings');
    await testRouter.back('/');
    expect(screen.getByText('Dashboard')).toBeVisible();
  });
});
