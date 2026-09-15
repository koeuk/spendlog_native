import { Check, ChevronDown } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { ListRow } from './ListRow';
import { Sheet, useSheet } from './Sheet';
import { Txt } from './Txt';

export interface PickerOption<T extends string> {
  value: T;
  label: string;
  leading?: ReactNode;
  subtitle?: string;
}

interface OptionPickerProps<T extends string> {
  label?: string;
  title?: string;
  placeholder?: string;
  value: T | null;
  options: PickerOption<T>[];
  onChange: (value: T) => void;
  error?: string | null;
  /** Something to show under the list, like an "add new" row. */
  footer?: ReactNode;
}

/** A pill field that opens a sheet of choices; the chosen one shows a tick. */
export function OptionPicker<T extends string>({ label, title, placeholder, value, options, onChange, error, footer }: OptionPickerProps<T>) {
  const theme = useTheme();
  const sheet = useSheet();
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <View style={styles.container}>
      {label ? (
        <Txt variant="label" faint={0.7} style={styles.label}>
          {label}
        </Txt>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? title}
        accessibilityValue={{ text: selected?.label }}
        onPress={sheet.present}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: theme.surface, borderColor: error ? theme.errorInk : theme.inputBorder, opacity: pressed ? 0.8 : 1 },
        ]}>
        {selected?.leading ? <View style={styles.leading}>{selected.leading}</View> : null}
        <Txt style={styles.value} color={selected ? theme.text : theme.placeholder} numberOfLines={1}>
          {selected?.label ?? placeholder ?? ''}
        </Txt>
        <ChevronDown size={18} color={theme.faint(0.4)} />
      </Pressable>
      {error ? (
        <Txt variant="label" color={theme.errorInk} style={styles.label}>
          {error}
        </Txt>
      ) : null}
      <Sheet sheetRef={sheet.ref} title={title ?? label}>
        <View>
          {options.map((option, index) => (
            <ListRow
              key={option.value}
              leading={option.leading}
              title={option.label}
              subtitle={option.subtitle}
              divider={index < options.length - 1}
              trailing={option.value === value ? <Check size={18} color={theme.accent} /> : undefined}
              onPress={() => {
                onChange(option.value);
                sheet.dismiss();
              }}
            />
          ))}
        </View>
        {footer}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { marginLeft: 12 },
  field: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leading: { marginLeft: -4 },
  value: { flex: 1 },
});
