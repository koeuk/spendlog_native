import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';
import type { ReportBucket } from '@/types/api';
import { rgba } from '@/utils/color';
import { amountNumber, formatMoney } from '@/utils/money';

import { Txt } from './Txt';

interface SpendingChartProps {
  buckets: ReportBucket[];
  /** What the headline says while no bar is selected. */
  label: string;
  total: string;
  height?: number;
}

/**
 * Bars for a period: a tap on one names its day and figure. Future buckets
 * draw as faint stubs, not zeros, and the current one is filled in full.
 */
export function SpendingChart({ buckets, label, total, height = 150 }: SpendingChartProps) {
  const theme = useTheme();
  const t = useT();
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(1, ...buckets.map((bucket) => amountNumber(bucket.value)));
  const empty = buckets.every((bucket) => amountNumber(bucket.value) === 0);
  const picked = selected !== null ? buckets[selected] : undefined;
  const dense = buckets.length > 16;

  return (
    <View style={styles.container}>
      <View>
        <Txt variant="label" faint={0.55} numberOfLines={1}>
          {picked ? picked.caption : label}
        </Txt>
        <Txt variant="xl" weight="bold" numberOfLines={1} style={styles.figure}>
          {formatMoney(picked ? picked.value : total)}
        </Txt>
      </View>
      <View style={[styles.bars, { height }]}>
        {empty ? (
          <View style={[styles.emptyOverlay, { pointerEvents: 'none' }]}>
            <Txt variant="label" faint={0.5}>
              {t('Nothing logged in this period.')}
            </Txt>
          </View>
        ) : null}
        {buckets.map((bucket, index) => {
          const value = amountNumber(bucket.value);
          const barHeight = bucket.is_future ? 3 : Math.max(3, Math.round((value / max) * (height - 4)));
          const active = selected === index;
          const color = bucket.is_future ? theme.faint(0.1) : active || bucket.is_current ? theme.accent : rgba(theme.accent, 0.45);
          return (
            <Pressable
              key={bucket.key}
              accessibilityRole="button"
              accessibilityLabel={`${bucket.caption}: ${formatMoney(bucket.value)}`}
              onPress={() => setSelected(active ? null : index)}
              style={styles.column}>
              <View style={[styles.bar, { height: barHeight, backgroundColor: color, width: dense ? '55%' : '60%' }]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.labels}>
        {buckets.map((bucket, index) =>
          bucket.label ? (
            // Centred under its column and free to spill over its neighbours,
            // so a two-digit day still reads when there are thirty-one columns.
            <Txt key={bucket.key} variant="caption" faint={0.5} align="center" style={[styles.labelText, { left: `${((index + 0.5) / buckets.length) * 100}%` }]}>
              {bucket.label}
            </Txt>
          ) : null,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  figure: { marginTop: 2 },
  bars: { flexDirection: 'row', alignItems: 'flex-end' },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { borderRadius: 4, minWidth: 3 },
  labels: { height: 16 },
  labelText: { position: 'absolute', top: 0, width: 36, marginLeft: -18, fontSize: 10, lineHeight: 14 },
  emptyOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
