import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

export type ButtonVariant = 'filled' | 'tonal' | 'outline' | 'ghost' | 'danger';

interface PillButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  /** Stretch across the row (the default for form buttons). */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** The one shape for anything you can act on. */
export function PillButton({
  label,
  onPress,
  variant = 'filled',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  block = false,
  style,
  accessibilityLabel,
}: PillButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;

  const colors = {
    filled: { background: theme.accent, text: theme.onAccent, border: 'transparent' },
    tonal: { background: theme.accentSoft, text: theme.accent, border: 'transparent' },
    outline: { background: theme.surface, text: theme.text, border: theme.inputBorder },
    ghost: { background: 'transparent', text: theme.accent, border: 'transparent' },
    danger: { background: theme.errorFill, text: theme.errorInk, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.small : styles.medium,
        block && styles.block,
        { backgroundColor: colors.background, borderColor: colors.border, opacity: inactive ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <View style={styles.content}>
          {Icon && <Icon size={size === 'sm' ? 16 : 18} color={colors.text} strokeWidth={2.2} />}
          <Txt variant={size === 'sm' ? 'label' : 'body'} weight="semibold" color={colors.text} numberOfLines={1}>
            {label}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  medium: { minHeight: 52, paddingHorizontal: 22 },
  small: { minHeight: 38, paddingHorizontal: 16 },
  block: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
