import { Pressable, StyleSheet, View } from 'react-native';

import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of pills; the chosen one is filled with the accent. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const theme = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: theme.faint(0.06) }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.option, active && { backgroundColor: theme.accent }]}>
            <Txt variant="label" weight="semibold" color={active ? theme.onAccent : theme.faint(0.65)} numberOfLines={1}>
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.chip, padding: 4, gap: 2 },
  option: { flex: 1, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: radius.chip },
});
