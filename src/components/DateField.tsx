import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { Ymd } from '@/types/api';
import { dateParam, longDate, parseYmd } from '@/utils/dates';

import { Input } from './Input';
import { PillButton } from './PillButton';
import { Sheet, useSheet } from './Sheet';
import { Txt } from './Txt';

interface DateFieldProps {
  label?: string;
  value: Ymd | null;
  onChange: (value: Ymd | null) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  error?: string | null;
  /** Show an × that clears the date, for optional dates like a due date. */
  clearable?: boolean;
}

/**
 * A calendar day as the API's `YYYY-MM-DD`. Android opens the system dialog,
 * iOS an inline calendar in a sheet, and the browser types it in.
 */
export function DateField({ label, value, onChange, placeholder, maximumDate, minimumDate, error, clearable = false }: DateFieldProps) {
  const theme = useTheme();
  const t = useT();
  const locale = useLocaleStore((state) => state.locale);
  const sheet = useSheet();
  const [draft, setDraft] = useState<Date>(() => parseYmd(value) ?? new Date());

  if (Platform.OS === 'web') {
    return (
      <Input
        label={label}
        value={value ?? ''}
        placeholder={placeholder ?? 'YYYY-MM-DD'}
        onChangeText={(text) => onChange(text.trim() === '' ? null : text.trim())}
        error={error}
        autoCapitalize="none"
      />
    );
  }

  const open = () => {
    const current = parseYmd(value) ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        maximumDate,
        minimumDate,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) onChange(dateParam(date));
        },
      });
      return;
    }
    setDraft(current);
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
        style={({ pressed }) => [styles.field, { backgroundColor: theme.fieldFill, borderColor: error ? theme.errorInk : theme.inputBorder, opacity: pressed ? 0.8 : 1 }]}>
        <CalendarDays size={18} color={theme.faint(0.5)} />
        <Txt style={styles.value} color={value ? theme.text : theme.placeholder}>
          {value ? longDate(value, locale) : (placeholder ?? '')}
        </Txt>
        {clearable && value ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('Clear')} hitSlop={8} onPress={() => onChange(null)}>
            <X size={18} color={theme.faint(0.5)} />
          </Pressable>
        ) : null}
      </Pressable>
      {error ? (
        <Txt variant="label" color={theme.errorInk} style={styles.label}>
          {error}
        </Txt>
      ) : null}
      {Platform.OS === 'ios' ? (
        <Sheet sheetRef={sheet.ref} title={label}>
          <DateTimePicker
            value={draft}
            mode="date"
            display="inline"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            accentColor={theme.accent}
            themeVariant={theme.isDark ? 'dark' : 'light'}
            onChange={(_event, date) => date && setDraft(date)}
          />
          <PillButton
            label={t('Done')}
            block
            onPress={() => {
              onChange(dateParam(draft));
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
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  value: { flex: 1 },
});
