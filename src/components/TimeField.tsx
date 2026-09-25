import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Clock, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Input } from './Input';
import { PillButton } from './PillButton';
import { Sheet, useSheet } from './Sheet';
import { Txt } from './Txt';

interface TimeFieldProps {
  label?: string;
  /** `HH:mm`, 24-hour, or null for no particular time. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

function toDate(value: string | null): Date {
  const date = new Date();
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  date.setHours(match ? Number(match[1]) : 0, match ? Number(match[2]) : 0, 0, 0);
  return date;
}

function toHm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * A time of day as `HH:mm`, the companion to DateField. Always clearable:
 * a time is only ever a refinement of a date. Android opens the system
 * clock, iOS a spinner in a sheet, and the browser types it in.
 */
export function TimeField({ label, value, onChange, placeholder }: TimeFieldProps) {
  const theme = useTheme();
  const t = useT();
  const sheet = useSheet();
  const [draft, setDraft] = useState<Date>(() => toDate(value));

  if (Platform.OS === 'web') {
    return (
      <Input
        label={label}
        value={value ?? ''}
        placeholder={placeholder ?? 'HH:MM'}
        onChangeText={(text) => onChange(text.trim() === '' ? null : text.trim())}
        autoCapitalize="none"
      />
    );
  }

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: 'time',
        is24Hour: true,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) onChange(toHm(date));
        },
      });
      return;
    }
    setDraft(toDate(value));
    sheet.present();
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Txt variant="label" faint={0.7} style={styles.label}>
          {label}
        </Txt>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ?? undefined }}
        onPress={open}
        style={({ pressed }) => [styles.field, { backgroundColor: theme.fieldFill, borderColor: theme.inputBorder, opacity: pressed ? 0.8 : 1 }]}>
        <Clock size={18} color={theme.faint(0.5)} />
        <Txt style={styles.value} color={value ? theme.text : theme.placeholder} numberOfLines={1}>
          {value ?? placeholder ?? ''}
        </Txt>
        {value ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('Clear')} hitSlop={8} onPress={() => onChange(null)}>
            <X size={18} color={theme.faint(0.5)} />
          </Pressable>
        ) : null}
      </Pressable>
      {Platform.OS === 'ios' ? (
        <Sheet sheetRef={sheet.ref} title={label}>
          <DateTimePicker
            value={draft}
            mode="time"
            display="spinner"
            is24Hour
            accentColor={theme.accent}
            themeVariant={theme.isDark ? 'dark' : 'light'}
            onChange={(_event, date) => date && setDraft(date)}
          />
          <PillButton
            label={t('Done')}
            block
            onPress={() => {
              onChange(toHm(draft));
              sheet.dismiss();
            }}
          />
        </Sheet>
      ) : null}
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: { flex: 1 },
});
