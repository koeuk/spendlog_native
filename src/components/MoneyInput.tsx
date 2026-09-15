import { Pressable, StyleSheet, View } from 'react-native';

import { useMoneySettings } from '@/hooks/useMoneySettings';
import { useT } from '@/i18n';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { Currency } from '@/types/api';
import { convertAmount, formatKhr, formatMoney, sanitizeAmount } from '@/utils/money';

import { Input, type InputProps } from './Input';
import { Txt } from './Txt';

interface MoneyInputProps extends Omit<InputProps, 'value' | 'onChangeText' | 'left' | 'right' | 'keyboardType'> {
  value: string;
  onChangeText: (value: string) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

const CURRENCIES: Currency[] = ['USD', 'KHR'];

/**
 * An amount with a USD / KHR toggle. Moving the toggle converts what is typed
 * at the admin's rate instead of discarding it, so the prefix and the number
 * always mean the same amount of money. The server does the real conversion.
 */
export function MoneyInput({ value, onChangeText, currency, onCurrencyChange, hint, ...rest }: MoneyInputProps) {
  const theme = useTheme();
  const t = useT();
  const { khr_per_usd } = useMoneySettings();

  const switchTo = (next: Currency) => {
    if (next === currency) return;
    const converted = convertAmount(value, currency, next, khr_per_usd);
    if (converted !== null) onChangeText(converted);
    onCurrencyChange(next);
  };

  const numeric = Number.parseFloat(value);
  const preview =
    Number.isFinite(numeric) && numeric > 0
      ? currency === 'USD'
        ? `≈ ${formatKhr(numeric * khr_per_usd)}`
        : `≈ ${formatMoney((numeric / khr_per_usd).toFixed(2))}`
      : undefined;

  return (
    <Input
      {...rest}
      value={value}
      onChangeText={(text) => onChangeText(sanitizeAmount(text, currency))}
      keyboardType={currency === 'KHR' ? 'number-pad' : 'decimal-pad'}
      inputMode="decimal"
      hint={hint ?? preview}
      left={
        <Txt variant="heading" faint={0.6} style={styles.symbol}>
          {currency === 'USD' ? '$' : '៛'}
        </Txt>
      }
      right={
        <View style={[styles.toggle, { backgroundColor: theme.faint(0.06) }]}>
          {CURRENCIES.map((code) => {
            const active = code === currency;
            return (
              <Pressable
                key={code}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t(code)}
                onPress={() => switchTo(code)}
                style={[styles.option, active && { backgroundColor: theme.accent }]}>
                <Txt variant="caption" weight="bold" color={active ? theme.onAccent : theme.faint(0.6)}>
                  {code}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  symbol: { marginRight: 6 },
  toggle: { flexDirection: 'row', borderRadius: radius.chip, padding: 3, gap: 2 },
  option: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.chip },
});
