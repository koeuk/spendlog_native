import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Download, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { Card } from '@/components/Card';
import { CategoryBadge } from '@/components/CategoryBadge';
import { ExpenseRow } from '@/components/ExpenseRow';
import { Header } from '@/components/Header';
import { IconButton } from '@/components/IconButton';
import { OptionPicker } from '@/components/OptionPicker';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { Sheet, useSheet } from '@/components/Sheet';
import { SpendingChart } from '@/components/SpendingChart';
import { ErrorState, SkeletonCard } from '@/components/States';
import { Txt } from '@/components/Txt';
import { useReport } from '@/hooks/overview';
import { useExportReport } from '@/hooks/useExportReport';
import { useT } from '@/i18n';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme/useTheme';
import type { Expense, ExportFormat, Granularity, Report } from '@/types/api';
import { formatMoney } from '@/utils/money';

const PERIODS: { value: Granularity; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
];

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
];

/** Where the money went over a period, compared against the period before. */
export default function ReportsScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const [period, setPeriod] = useState<Granularity>('month');
  const [at, setAt] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const report = useReport({ period, at, page, per_page: 20 });
  const exporter = useExportReport();
  const exportSheet = useSheet();
  const data = report.data;
  const hasRange = period !== 'all' && (data?.options.length ?? 0) > 0;

  const choosePeriod = (next: Granularity) => {
    setPeriod(next);
    setAt(undefined);
    setPage(1);
  };

  const runExport = async (format: ExportFormat) => {
    exportSheet.dismiss();
    try {
      await exporter.mutateAsync({ format, params: { period, at: data?.anchor || undefined }, anchor: data?.anchor ?? '' });
    } catch (error) {
      toast(t(apiErrorMessage(error)), 'error');
    }
  };

  return (
    <>
      <Screen
        scroll
        refreshing={report.isRefetching && !report.isPending}
        onRefresh={() => void report.refetch()}
        contentContainerStyle={styles.content}
        header={<Header large title={t('Reports')} right={<IconButton icon={Download} onPress={exportSheet.present} accessibilityLabel={t('Export')} />} />}>
        <View style={styles.filters}>
          <View style={hasRange ? styles.periodPicker : styles.grow}>
            <OptionPicker
              title={t('Show by')}
              value={period}
              options={PERIODS.map((option) => ({ value: option.value, label: t(option.label) }))}
              onChange={choosePeriod}
            />
          </View>
          {data && hasRange ? (
            <View style={styles.grow}>
              <OptionPicker
                title={t('Period')}
                value={data.anchor}
                options={data.options}
                onChange={(value) => {
                  setAt(value);
                  setPage(1);
                }}
              />
            </View>
          ) : null}
        </View>

        {report.isPending ? (
          <>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={4} />
          </>
        ) : report.isError ? (
          <Card>
            <ErrorState error={report.error} onRetry={() => void report.refetch()} compact />
          </Card>
        ) : data ? (
          <ReportBody data={data} page={page} onPage={setPage} onOpenExpense={(expense) => router.push({ pathname: '/expense-form', params: { uuid: expense.uuid } })} />
        ) : null}
      </Screen>
      <Sheet sheetRef={exportSheet.ref} title={t('Export')}>
        <Txt faint={0.6}>{t('The period as shown, as a file you can save, send or print.')}</Txt>
        <View style={styles.formats}>
          {FORMATS.map((format) => (
            <PillButton key={format.value} label={format.label} variant="tonal" onPress={() => void runExport(format.value)} loading={exporter.isPending} block />
          ))}
        </View>
      </Sheet>
      {exporter.isPending ? <View style={[styles.exporting, { backgroundColor: theme.faint(0.04) }]} /> : null}
    </>
  );
}

function ReportBody({ data, page, onPage, onOpenExpense }: { data: Report; page: number; onPage: (page: number) => void; onOpenExpense: (expense: Expense) => void }) {
  const t = useT();
  const theme = useTheme();
  const { stats } = data;
  const change = stats.change_percent;
  const lastPage = data.expenses.meta.last_page ?? 1;

  return (
    <>
      <Card style={styles.section}>
        <Txt variant="label" faint={0.6}>
          {data.period_label}
        </Txt>
        <Txt variant="display">{formatMoney(stats.total)}</Txt>
        <View style={styles.stats}>
          <Stat label={t('Expenses')} value={String(stats.count)} />
          <Stat label={t('Daily average')} value={formatMoney(stats.daily_average)} />
          <View style={styles.stat}>
            <Txt variant="caption" faint={0.55} numberOfLines={1}>
              {stats.previous_label ? t('vs :period', { period: stats.previous_label }) : t('Previous')}
            </Txt>
            {change === null ? (
              <Txt variant="heading" faint={0.4}>
                —
              </Txt>
            ) : (
              <View style={styles.change}>
                {change > 0 ? <TrendingUp size={16} color={theme.errorInk} /> : <TrendingDown size={16} color={theme.accent} />}
                <Txt variant="heading" color={change > 0 ? theme.errorInk : theme.accent}>
                  {change > 0 ? '+' : ''}
                  {change}%
                </Txt>
              </View>
            )}
          </View>
        </View>
        {change !== null && stats.previous_is_partial ? (
          <Txt variant="caption" faint={0.5}>
            {t('Over elapsed days only.')} {t('Previous')}: {formatMoney(stats.previous)}
          </Txt>
        ) : null}
      </Card>

      <Card style={styles.section}>
        <SpendingChart buckets={data.series.buckets} label={data.series.label} total={data.series.total} />
      </Card>

      <Card style={styles.section}>
        <Txt variant="heading">{t('By category')}</Txt>
        {data.breakdown.length === 0 ? (
          <Txt faint={0.5}>{t('Nothing logged in this period.')}</Txt>
        ) : (
          data.breakdown.map((slice, index) => (
            <View key={slice.uuid} style={[styles.slice, index < data.breakdown.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.hairline }]}>
              <CategoryBadge color={slice.color} icon={slice.icon} size={38} />
              <View style={styles.sliceBody}>
                <Txt weight="medium" numberOfLines={1}>
                  {slice.name}
                </Txt>
                <Txt variant="label" faint={0.55} numberOfLines={1}>
                  {slice.count === 1 ? t('1 expense') : t(':count expenses', { count: slice.count })} · {t('avg')} {formatMoney(slice.average)}
                </Txt>
              </View>
              <View style={styles.sliceFigures}>
                <Txt weight="semibold">{formatMoney(slice.total)}</Txt>
                <Txt variant="caption" faint={0.5}>
                  {slice.share}%
                </Txt>
              </View>
            </View>
          ))
        )}
      </Card>

      <Card style={styles.section}>
        <View style={styles.rowBetween}>
          <Txt variant="heading">{t('Expenses')}</Txt>
          <Txt variant="label" faint={0.5}>
            {data.expenses.meta.total}
          </Txt>
        </View>
        {data.expenses.data.length === 0 ? (
          <Txt faint={0.5}>{t('Nothing logged in this period.')}</Txt>
        ) : (
          <View>
            {data.expenses.data.map((expense, index) => (
              <ExpenseRow key={expense.uuid} expense={expense} showDate divider={index < data.expenses.data.length - 1} onPress={() => onOpenExpense(expense)} />
            ))}
          </View>
        )}
        {lastPage > 1 ? (
          <View style={styles.pager}>
            <IconButton icon={ChevronLeft} onPress={() => onPage(Math.max(1, page - 1))} accessibilityLabel={t('Previous page')} size={36} />
            <Txt variant="label" faint={0.6}>
              {t('Page :page of :total', { page, total: lastPage })}
            </Txt>
            <IconButton icon={ChevronRight} onPress={() => onPage(Math.min(lastPage, page + 1))} accessibilityLabel={t('Next page')} size={36} />
          </View>
        ) : null}
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Txt variant="caption" faint={0.55} numberOfLines={1}>
        {label}
      </Txt>
      <Txt variant="heading" numberOfLines={1}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: 10 },
  periodPicker: { width: 124 },
  grow: { flex: 1 },
  content: { gap: 14, paddingTop: 4 },
  section: { gap: 12 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, gap: 2 },
  change: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slice: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  sliceBody: { flex: 1, gap: 2 },
  sliceFigures: { alignItems: 'flex-end' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  formats: { gap: 10 },
  exporting: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
});
