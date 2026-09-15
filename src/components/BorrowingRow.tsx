import { Building2, Briefcase, CircleCheck, Handshake, Users, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { useTheme } from '@/theme/useTheme';
import type { Borrowing, LenderType } from '@/types/api';
import { dayLabel } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

import { IconDisc } from './IconDisc';
import { ProgressBar } from './ProgressBar';
import { Txt } from './Txt';

export const LENDER_ICONS: Record<LenderType, LucideIcon> = {
  friend: Handshake,
  family: Users,
  bank: Building2,
  employer: Briefcase,
  other: Handshake,
};

interface BorrowingRowProps {
  borrowing: Borrowing;
  onPress: () => void;
  divider?: boolean;
}

/** One debt: who, what is still owed, and how far along the repayments are. */
export function BorrowingRow({ borrowing, onPress, divider = false }: BorrowingRowProps) {
  const t = useT();
  const theme = useTheme();
  const locale = useLocaleStore((state) => state.locale);
  const tint = borrowing.settled ? theme.faint(0.4) : borrowing.overdue ? theme.errorInk : theme.accent;
  const detail = borrowing.settled
    ? t('Settled')
    : borrowing.due_on
      ? borrowing.overdue
        ? t('Overdue since :date', { date: dayLabel(borrowing.due_on, locale) })
        : t('Due :date', { date: dayLabel(borrowing.due_on, locale) })
      : t('Borrowed :date', { date: dayLabel(borrowing.borrowed_on, locale) });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={borrowing.lender}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.hairline }, pressed && { opacity: 0.7 }]}>
      <View style={styles.top}>
        <IconDisc icon={borrowing.settled ? CircleCheck : LENDER_ICONS[borrowing.lender_type]} color={tint} />
        <View style={styles.body}>
          <Txt weight="medium" numberOfLines={1}>
            {borrowing.lender}
          </Txt>
          <Txt variant="label" color={borrowing.overdue && !borrowing.settled ? theme.errorInk : theme.faint(0.55)} numberOfLines={1}>
            {detail}
          </Txt>
        </View>
        <View style={styles.figures}>
          <Txt weight="semibold" color={borrowing.settled ? theme.faint(0.4) : theme.text}>
            {formatMoney(borrowing.remaining)}
          </Txt>
          <Txt variant="caption" faint={0.45}>
            {t('of')} {formatMoney(borrowing.amount)}
          </Txt>
        </View>
      </View>
      <ProgressBar percent={borrowing.percent_repaid} color={tint} height={6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, gap: 2 },
  figures: { alignItems: 'flex-end' },
});
