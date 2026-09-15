import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

/** A strip under the status bar while the device has no connection; cached reads still show. */
export function OfflineBanner() {
  const t = useT();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return unsubscribe;
  }, []);

  if (!offline) return null;

  return (
    <View style={[styles.banner, { backgroundColor: theme.errorFill, paddingTop: insets.top + 6 }]}>
      <WifiOff size={16} color={theme.errorInk} />
      <Txt variant="label" color={theme.errorInk}>
        {t('You are offline. Showing what was loaded last.')}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 8, paddingHorizontal: 16 },
});
