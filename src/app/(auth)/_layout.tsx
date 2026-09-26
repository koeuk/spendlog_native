import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

export const unstable_settings = {
  // Anyone signed out lands on the intro first; it hands on to login.
  initialRouteName: 'welcome',
};

export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.ground } }} initialRouteName="welcome">
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
