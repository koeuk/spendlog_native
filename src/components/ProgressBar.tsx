import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

interface ProgressBarProps {
  /** 0–100; the API already caps `bar_percent` so it cannot overflow. */
  percent: number;
  color: string;
  height?: number;
}

export function ProgressBar({ percent, color, height = 8 }: ProgressBarProps) {
  const theme = useTheme();
  const width = Math.max(0, Math.min(100, percent));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: theme.faint(0.08) }]}>
      <View style={[styles.fill, { width: `${width}%`, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
});
