import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  /** Rows in a list are short and stack tightly, so they round a step less. */
  row?: boolean;
  padded?: boolean;
}

/** A solid pane over the ground: white by day, the dark surface at night. */
export function Card({ children, style, row = false, padded = true }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderRadius: row ? radius.row : radius.card },
        padded && { padding: row ? space.md : space.lg },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
});
