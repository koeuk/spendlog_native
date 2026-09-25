import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

interface ListRowProps {
  leading?: ReactNode;
  title: string;
  subtitle?: string | null;
  trailing?: ReactNode;
  trailingText?: string;
  trailingColor?: string;
  /** A coloured title, for a destructive row such as Sign out. */
  titleColor?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  chevron?: boolean;
  /** A hairline beneath, for rows that stack inside one card. */
  divider?: boolean;
  accessibilityLabel?: string;
}

/** One line in a list: a leading mark, a title over its detail, something trailing. */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  trailingText,
  trailingColor,
  titleColor,
  onPress,
  onLongPress,
  chevron = false,
  divider = false,
  accessibilityLabel,
}: ListRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      style={({ pressed }) => [styles.row, divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.hairline }, pressed && { opacity: 0.7 }]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.body}>
        <Txt weight="medium" color={titleColor} numberOfLines={1}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="label" faint={0.55} numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {trailingText ? (
        <Txt weight="semibold" color={trailingColor} numberOfLines={1}>
          {trailingText}
        </Txt>
      ) : null}
      {trailing}
      {chevron ? <ChevronRight size={18} color={theme.faint(0.3)} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 56 },
  leading: { justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
});
