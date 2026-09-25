import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { luminance } from '@/utils/color';

interface ColourSwatchesProps {
  presets: { value: string; label: string }[];
  /** The chosen hex, or null when none of these is chosen. */
  value: string | null;
  onChange: (value: string) => void;
}

/** A row of round colour chips; the chosen one carries a tick in whichever ink reads on it. */
export function ColourSwatches({ presets, value, onChange }: ColourSwatchesProps) {
  const theme = useTheme();
  return (
    <View style={styles.swatches}>
      {presets.map((preset) => {
        const active = !!value && preset.value.toLowerCase() === value.toLowerCase();
        return (
          <Pressable
            key={preset.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={preset.label}
            onPress={() => onChange(preset.value)}
            style={[styles.swatch, { backgroundColor: preset.value, borderColor: active ? theme.text : theme.hairline }]}>
            {active ? <Check size={16} color={luminance(preset.value) > 0.45 ? '#171717' : '#FFFFFF'} strokeWidth={3} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
