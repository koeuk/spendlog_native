import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  NotoSansKhmer_400Regular,
  NotoSansKhmer_500Medium,
  NotoSansKhmer_600SemiBold,
  NotoSansKhmer_700Bold,
} from '@expo-google-fonts/noto-sans-khmer';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getBranding } from '@/api/endpoints/branding';
import { queryClient } from '@/api/queryClient';
import { ToastHost } from '@/components/ToastHost';
import { brandingQueryKey } from '@/hooks/useBranding';
import { useSessionStore } from '@/store/session';
import { useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  initialRouteName: '(app)',
};

/**
 * The root: providers, fonts, and the session gate. The native splash stays
 * up until the fonts are in and the stored token has been checked, so the
 * first frame is either the app or the login screen, never a flash of one
 * before the other.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansKhmer_400Regular,
    NotoSansKhmer_500Medium,
    NotoSansKhmer_600SemiBold,
    NotoSansKhmer_700Bold,
  });
  const status = useSessionStore((state) => state.status);
  const restore = useSessionStore((state) => state.restore);

  useEffect(() => {
    void restore();
    void queryClient.prefetchQuery({ queryKey: brandingQueryKey, queryFn: getBranding, staleTime: Infinity });
  }, [restore]);

  const ready = fontsLoaded && status !== 'restoring';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <ThemedRoot />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedRoot() {
  const theme = useTheme();
  const signedIn = useSessionStore((state) => state.status === 'signed-in');

  return (
    <View style={[styles.root, { backgroundColor: theme.ground }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.ground } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <ToastHost />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
