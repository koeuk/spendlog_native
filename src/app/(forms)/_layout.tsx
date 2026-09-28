import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

/**
 * The create / edit pages: full screens pushed over the tabs, each with its own
 * back button. The push is spelled out rather than left to the platform, which
 * would otherwise slide up from the bottom on Android and read as a sheet.
 */
export default function FormsLayout() {
  const theme = useTheme();
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: theme.ground } }} />;
}
