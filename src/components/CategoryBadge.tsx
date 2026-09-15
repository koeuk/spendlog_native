import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { categoryColor } from '@/utils/categoryStyle';
import { rgba } from '@/utils/color';

import { categoryIcon } from './icons';

interface CategoryBadgeProps {
  color?: string | null;
  icon?: string | null;
  size?: number;
}

/** A category's icon on a soft disc of its own colour. */
export function CategoryBadge({ color, icon, size = 40 }: CategoryBadgeProps) {
  const tint = categoryColor(color);
  return (
    <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2, backgroundColor: rgba(tint, 0.16) }]}>
      {createElement(categoryIcon(icon), { size: Math.round(size * 0.48), color: tint, strokeWidth: 2 })}
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: 'center', justifyContent: 'center' },
});
