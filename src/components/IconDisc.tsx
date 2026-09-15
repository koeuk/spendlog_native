import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { rgba } from '@/utils/color';

interface IconDiscProps {
  icon: LucideIcon;
  color: string;
  size?: number;
}

/** An icon on a soft disc of its colour, the way a category badge draws, for rows that are not categories. */
export function IconDisc({ icon: Icon, color, size = 40 }: IconDiscProps) {
  return (
    <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2, backgroundColor: rgba(color, 0.14) }]}>
      <Icon size={Math.round(size * 0.48)} color={color} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: 'center', justifyContent: 'center' },
});
