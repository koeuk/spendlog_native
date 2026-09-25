import { CircleAlert, CircleCheck, Info } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore, type ToastKind } from '@/store/toast';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

const ICONS: Record<ToastKind, typeof Info> = { info: Info, success: CircleCheck, error: CircleAlert };

/** Renders the toast queue above everything else; tap one to dismiss it. */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.host, { bottom: insets.bottom + 88, pointerEvents: 'box-none' }]}>
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind];
        const tint = toast.kind === 'error' ? theme.errorInk : toast.kind === 'success' ? theme.accent : theme.text;
        return (
          <Pressable
            key={toast.id}
            accessibilityRole="alert"
            onPress={() => dismiss(toast.id)}
            style={[styles.toast, { backgroundColor: theme.isDark ? '#2A2A2A' : theme.text }]}>
            <Icon size={18} color={toast.kind === 'info' ? theme.ground : tint} />
            <Txt color={theme.ground} style={styles.text} numberOfLines={3}>
              {toast.message}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, gap: 8, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.row,
    maxWidth: 480,
    width: '100%',
  },
  text: { flex: 1 },
});
