import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { useTheme } from '@/theme/useTheme';
import type { Ym } from '@/types/api';
import { currentYm, monthLabel, shiftMonth } from '@/utils/dates';

import { Glass } from './Glass';
import { Txt } from './Txt';

interface MonthStepperProps {
  month: Ym;
  onChange: (month: Ym) => void;
  /** Stop at the current month; the past is where the spending is. */
  clampToNow?: boolean;
}

export function MonthStepper({ month, onChange, clampToNow = false }: MonthStepperProps) {
  const theme = useTheme();
  const t = useT();
  const locale = useLocaleStore((state) => state.locale);
  const atNow = clampToNow && month >= currentYm();
  const isCurrent = month === currentYm();

  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('Previous month')} hitSlop={8} onPress={() => onChange(shiftMonth(month, -1))} style={styles.arrow}>
        <Glass interactive fill style={styles.round} />
        <ChevronLeft size={20} color={theme.text} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('This month')} onPress={() => onChange(currentYm())} style={styles.label}>
        <Txt variant="heading" align="center">
          {monthLabel(month, locale)}
        </Txt>
        {!isCurrent && (
          <Txt variant="caption" color={theme.accent} align="center">
            {t('Back to this month')}
          </Txt>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Next month')}
        accessibilityState={{ disabled: atNow }}
        disabled={atNow}
        hitSlop={8}
        onPress={() => onChange(shiftMonth(month, 1))}
        style={[styles.arrow, { opacity: atNow ? 0.35 : 1 }]}>
        <Glass interactive fill style={styles.round} />
        <ChevronRight size={20} color={theme.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  arrow: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  round: { borderRadius: 20 },
  label: { flex: 1, alignItems: 'center' },
});
