import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  /** Tinted with the accent, for a filter that is in effect. */
  active?: boolean;
  size?: number;
}

/** A round, icon-only button for a header or a row. */
export function IconButton({ icon: Icon, onPress, accessibilityLabel, active = false, size = 40 }: IconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { width: size, height: size, borderRadius: size / 2, backgroundColor: active ? theme.accentSoft : theme.surface, opacity: pressed ? 0.7 : 1 }]}>
      <View>
        <Icon size={Math.round(size * 0.5)} color={active ? theme.accent : theme.text} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
});
