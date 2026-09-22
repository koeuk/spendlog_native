import { useLocalSearchParams } from 'expo-router';
import { History } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ActivityRow } from '@/components/ActivityRow';
import { FormScreen, useLeaveForm } from '@/components/FormScreen';
import { PillButton } from '@/components/PillButton';
import { Segmented } from '@/components/Segmented';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { SavingsPlanForm } from '@/forms/SavingsPlanForm';
import { useActivity } from '@/hooks/overview';
import { useSavingsPlan } from '@/hooks/savings';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';
import { currentYm } from '@/utils/dates';

/** The two kinds the Savings screen writes: the plan, and the money. */
const SAVINGS_SUBJECTS = ['savings_plan', 'savings_entry'];

/**
 * `/savings-plan-form?month=2026-09`: set or change how much to put aside that
 * month, or look back at what has been done to the savings figures.
 *
 * Two tabs rather than two routes — the card that opens this is one target,
 * and "what is the plan" and "who changed it" are the two questions it raises.
 */
export default function SavingsPlanFormScreen() {
  const t = useT();
  const leave = useLeaveForm();
  const params = useLocalSearchParams<{ month?: string }>();
  const month = params.month || currentYm();
  const plan = useSavingsPlan(month);
  const [tab, setTab] = useState<'plan' | 'history'>('plan');
  const planning = tab === 'plan';

  return (
    <FormScreen
      title={planning ? (plan.data ? t('Change plan') : t('Set a plan')) : t('Savings history')}
      // Only the plan tab waits on the row; the history stands on its own and
      // must not be held behind a plan that is still loading or has failed.
      loading={planning && plan.isPending}
      error={planning ? plan.error : undefined}
      onRetry={() => void plan.refetch()}
    >
      <View style={styles.stack}>
        <Segmented
          options={[
            { value: 'plan', label: t('Plan') },
            { value: 'history', label: t('History') },
          ]}
          value={tab}
          onChange={setTab}
        />
        {planning ? <SavingsPlanForm key={`${month}-${plan.data?.uuid ?? 'none'}`} month={month} plan={plan.data ?? null} onDone={leave} /> : <SavingsHistory />}
      </View>
    </FormScreen>
  );
}

/** The savings lines of the activity log, newest first. */
function SavingsHistory() {
  const t = useT();
  const theme = useTheme();
  const list = useActivity({ subject: SAVINGS_SUBJECTS });
  const [expanded, setExpanded] = useState<string | null>(null);

  if (list.isPending) return <SkeletonCard lines={4} />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => void list.refetch()} compact />;
  if (!list.items.length) return <EmptyState icon={History} title={t('Nothing has changed yet.')} compact />;

  return (
    <View style={styles.stack}>
      {/* Said plainly, because the list is not filtered by the month the plan
          is for: the log records when a change was made, not which month it
          was about. */}
      <Txt variant="label" faint={0.55}>
        {t('Every change to your savings, newest first.')}
      </Txt>
      <View>
        {list.items.map((entry, index) => (
          <ActivityRow
            key={entry.uuid}
            entry={entry}
            first={index === 0}
            last={index === list.items.length - 1}
            expanded={expanded === entry.uuid}
            onToggle={() => setExpanded(expanded === entry.uuid ? null : entry.uuid)}
          />
        ))}
      </View>
      {/* A button rather than an endless scroll: this list sits inside the
          form page's own scroll, and nesting a second one fights it. */}
      {list.hasNextPage ? (
        list.isFetchingNextPage ? (
          <ActivityIndicator color={theme.accent} />
        ) : (
          <PillButton label={t('Load more')} variant="tonal" onPress={() => void list.fetchNextPage()} block />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
});
