import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.ground } }} initialRouteName="login">
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
