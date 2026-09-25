import type { PropsWithChildren } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space } from '@/theme/tokens';

import { Glass } from './Glass';

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  /** Rows in a list are short and stack tightly, so they round a step less. */
  row?: boolean;
  padded?: boolean;
}

/** A pane of liquid glass over the ground. */
export function Card({ children, style, row = false, padded = true }: CardProps) {
  return (
    <Glass style={[styles.card, { borderRadius: row ? radius.row : radius.card }, padded && { padding: space.lg }, style]}>
      {children}
    </Glass>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
});
