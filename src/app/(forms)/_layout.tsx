import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

/** The create / edit pages: full screens pushed over the tabs, each with its own back button. */
export default function FormsLayout() {
  const theme = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.ground } }} />;
}
