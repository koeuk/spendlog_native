import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

interface ChipsProps {
  options: string[];
  selected?: string | null;
  onSelect: (value: string) => void;
}

/** A scrolling row of suggestions: the sources or lenders this account has used before. */
export function Chips({ options, selected, onSelect }: ChipsProps) {
  const theme = useTheme();
  if (options.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.row}>
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(option)}
            style={[styles.chip, { backgroundColor: active ? theme.accent : theme.faint(0.06) }]}>
            <Txt variant="label" weight="medium" color={active ? theme.onAccent : theme.text}>
              {option}
            </Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.chip },
});
