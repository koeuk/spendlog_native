import { Repeat } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { useLocaleStore } from '@/store/locale';
import { useTheme } from '@/theme/useTheme';
import type { Expense } from '@/types/api';
import { dayLabel } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

import { CategoryBadge } from './CategoryBadge';
import { ListRow } from './ListRow';
import { Txt } from './Txt';

interface ExpenseRowProps {
  expense: Expense;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Show the day beside the category, for lists that are not grouped by day. */
  showDate?: boolean;
  divider?: boolean;
}

export function ExpenseRow({ expense, onPress, onLongPress, showDate = false, divider = false }: ExpenseRowProps) {
  const theme = useTheme();
  const t = useT();
  const locale = useLocaleStore((state) => state.locale);
  const detail = [expense.category?.name, showDate ? dayLabel(expense.spent_on, locale) : null, expense.owner?.name].filter(Boolean).join(' · ');

  return (
    <ListRow
      leading={<CategoryBadge color={expense.category?.color} icon={expense.category?.icon} />}
      title={expense.item}
      subtitle={detail}
      trailing={
        <View style={styles.trailing}>
          {expense.recurring ? <Repeat size={14} color={theme.faint(0.4)} accessibilityLabel={t('Recurring')} /> : null}
          <Txt weight="semibold" numberOfLines={1}>
            {formatMoney(expense.price)}
          </Txt>
        </View>
      }
      onPress={onPress}
      onLongPress={onLongPress}
      divider={divider}
      accessibilityLabel={`${expense.item}, ${formatMoney(expense.price)}`}
    />
  );
}

const styles = StyleSheet.create({
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
